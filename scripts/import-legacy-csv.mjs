import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvFile(fileName) {
  const filePath = resolve(process.cwd(), fileName);
  if (!existsSync(filePath)) return;

  for (const line of readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const equalsIndex = trimmed.indexOf("=");
    if (equalsIndex === -1) continue;
    const rawKey = trimmed.slice(0, equalsIndex).trim();
    const key = rawKey.startsWith("$env:") ? rawKey.slice(5) : rawKey;
    let value = trimmed.slice(equalsIndex + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    process.env[key] ??= value;
  }
}

loadEnvFile(".env");
loadEnvFile(".env.local");

const pocketBaseUrl =
  process.env.POCKETBASE_URL ||
  process.env.NEXT_PUBLIC_POCKETBASE_URL ||
  "https://api-certs.softowetto.com";
const superuserEmail = process.env.POCKETBASE_SUPERUSER_EMAIL;
const superuserPassword = process.env.POCKETBASE_SUPERUSER_PASSWORD;
const legacyStorageBaseUrl = process.env.LEGACY_PUBLIC_STORAGE_URL?.replace(/\/$/, "");

if (!superuserEmail || !superuserPassword) {
  console.error("Missing POCKETBASE_SUPERUSER_EMAIL or POCKETBASE_SUPERUSER_PASSWORD.");
  process.exit(1);
}

const baseUrl = pocketBaseUrl.replace(/\/$/, "");
const downloads = "C:\\Users\\User\\Downloads";

async function request(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      ...options.headers,
    },
  });

  if (!response.ok) {
    let message = `${options.method || "GET"} ${path} failed (${response.status})`;
    try {
      const body = await response.json();
      message = [body.message || message, body.data ? JSON.stringify(body.data, null, 2) : ""]
        .filter(Boolean)
        .join("\n");
    } catch {
      // Keep status.
    }
    throw new Error(message);
  }

  if (response.status === 204) return null;
  return response.json();
}

async function authenticate() {
  const body = JSON.stringify({ identity: superuserEmail, password: superuserPassword });
  try {
    const auth = await request("/api/collections/_superusers/auth-with-password", { method: "POST", body });
    return auth.token;
  } catch {
    const auth = await request("/api/admins/auth-with-password", { method: "POST", body });
    return auth.token;
  }
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let value = "";
  let quoted = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"' && quoted && next === '"') {
      value += '"';
      i += 1;
      continue;
    }
    if (char === '"') {
      quoted = !quoted;
      continue;
    }
    if (char === "," && !quoted) {
      row.push(value);
      value = "";
      continue;
    }
    if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") i += 1;
      row.push(value);
      if (row.some((cell) => cell.length > 0)) rows.push(row);
      row = [];
      value = "";
      continue;
    }
    value += char;
  }

  row.push(value);
  if (row.some((cell) => cell.length > 0)) rows.push(row);
  const headers = rows.shift() || [];
  return rows.map((cells) =>
    Object.fromEntries(headers.map((header, index) => [header, cells[index] ?? ""]))
  );
}

function readCsv(fileName) {
  const path = `${downloads}\\${fileName}`;
  if (!existsSync(path)) {
    console.warn(`Missing ${path}; skipping.`);
    return [];
  }
  return parseCsv(readFileSync(path, "utf8"));
}

function dateValue(value) {
  if (!value) return "";
  return value.includes("T") ? value : value.replace(" ", "T").replace(/\+00$/, "Z");
}

function numberValue(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function boolValue(value) {
  return String(value).toLowerCase() === "true";
}

function publicStorageUrl(path) {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  return legacyStorageBaseUrl ? `${legacyStorageBaseUrl}/${encodeURIComponent(path)}` : path;
}

function escapeFilterValue(value) {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

async function findByLegacy(token, collection, legacyId) {
  if (!legacyId) return null;
  const filter = encodeURIComponent(`legacy_id = "${escapeFilterValue(legacyId)}"`);
  const result = await request(`/api/collections/${collection}/records?page=1&perPage=1&filter=${filter}`, { token });
  return result.items?.[0] ?? null;
}

async function findCertificateBySlug(token, slug) {
  if (!slug) return null;
  const filter = encodeURIComponent(`slug = "${escapeFilterValue(slug)}"`);
  const result = await request(`/api/collections/certificates/records?page=1&perPage=1&filter=${filter}`, { token });
  return result.items?.[0] ?? null;
}

async function upsertByLegacy(token, collection, legacyId, data) {
  const existing = await findByLegacy(token, collection, legacyId);
  if (existing) {
    return request(`/api/collections/${collection}/records/${existing.id}`, {
      method: "PATCH",
      token,
      body: JSON.stringify(data),
    });
  }
  return request(`/api/collections/${collection}/records`, {
    method: "POST",
    token,
    body: JSON.stringify({ ...data, legacy_id: legacyId }),
  });
}

async function main() {
  const token = await authenticate();
  const certificateRows = readCsv("certificates_rows.csv");
  const resourceRows = readCsv("resources_rows.csv");
  const certificateMap = new Map();

  for (const row of certificateRows) {
    const existingBySlug = await findCertificateBySlug(token, row.slug);
    const payload = {
      legacy_id: row.id,
      slug: row.slug,
      title: row.title || "Untitled certificate",
      vendor: row.vendor || "Unknown",
      description: row.description || "",
      image_url: row.image_url || "",
      popularity: numberValue(row.popularity, 0),
      featured: boolValue(row.featured),
      created_at: dateValue(row.created_at),
      updated_at: dateValue(row.created_at),
    };

    const certificate = existingBySlug
      ? await request(`/api/collections/certificates/records/${existingBySlug.id}`, {
          method: "PATCH",
          token,
          body: JSON.stringify(payload),
        })
      : await upsertByLegacy(token, "certificates", row.id, payload);

    certificateMap.set(row.id, certificate.id);
  }
  console.log(`Imported certificates: ${certificateMap.size}`);

  let resources = 0;
  for (const row of resourceRows) {
    const certificateId = certificateMap.get(row.certificate_id);
    if (!certificateId) continue;

    await upsertByLegacy(token, "resources", row.id, {
      certificate_id: certificateId,
      title: row.title || "Untitled resource",
      file_type: row.file_type || "pdf",
      storage_path: publicStorageUrl(row.storage_path),
      created_at: dateValue(row.created_at),
      updated_at: dateValue(row.created_at),
    });
    resources += 1;
  }
  console.log(`Imported resources: ${resources}`);

  console.log("GetITCertified CSV import complete.");
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
