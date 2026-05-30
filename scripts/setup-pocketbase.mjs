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
  "http://127.0.0.1:8090";
const superuserEmail = process.env.POCKETBASE_SUPERUSER_EMAIL;
const superuserPassword = process.env.POCKETBASE_SUPERUSER_PASSWORD;
const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;

if (!superuserEmail || !superuserPassword) {
  console.error("Missing POCKETBASE_SUPERUSER_EMAIL or POCKETBASE_SUPERUSER_PASSWORD.");
  process.exit(1);
}

const baseUrl = pocketBaseUrl.replace(/\/$/, "");

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
      // Keep status message.
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

async function getCollection(token, name) {
  try {
    return await request(`/api/collections/${name}`, { token });
  } catch {
    return null;
  }
}

function mergeFields(existingFields = [], desiredFields = []) {
  const byName = new Map(existingFields.map((field) => [field.name, field]));
  for (const desired of desiredFields) {
    const existing = byName.get(desired.name);
    byName.set(desired.name, {
      ...(existing || {}),
      ...desired,
      id: existing?.id,
      system: existing?.system ?? false,
    });
  }
  return Array.from(byName.values());
}

async function upsertCollection(token, definition) {
  const existing = await getCollection(token, definition.name);
  if (!existing) {
    await request("/api/collections", {
      method: "POST",
      token,
      body: JSON.stringify(definition),
    });
    console.log(`Created ${definition.name}`);
    return getCollection(token, definition.name);
  }

  await request(`/api/collections/${existing.id}`, {
    method: "PATCH",
    token,
    body: JSON.stringify({
      ...definition,
      fields: mergeFields(existing.fields, definition.fields),
    }),
  });
  console.log(`Updated ${definition.name}`);
  return getCollection(token, definition.name);
}

function text(name, options = {}) {
  return { name, type: "text", required: false, ...options };
}

function number(name, options = {}) {
  return { name, type: "number", required: false, ...options };
}

function bool(name, options = {}) {
  return { name, type: "bool", required: false, ...options };
}

function date(name, options = {}) {
  return { name, type: "date", required: false, ...options };
}

function relation(name, collectionId, options = {}) {
  return {
    name,
    type: "relation",
    collectionId,
    cascadeDelete: false,
    maxSelect: 1,
    minSelect: 0,
    required: false,
    ...options,
  };
}

function file(name, options = {}) {
  return {
    name,
    type: "file",
    maxSelect: 1,
    maxSize: 524288000,
    mimeTypes: [],
    protected: false,
    thumbs: [],
    required: false,
    ...options,
  };
}

function escapeRuleValue(value) {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

const adminWriteRule = adminEmail
  ? `@request.auth.email = "${escapeRuleValue(adminEmail)}"`
  : '@request.auth.id != ""';

async function main() {
  const token = await authenticate();

  const users = await upsertCollection(token, {
    name: "users",
    type: "auth",
    listRule: "",
    viewRule: "",
    createRule: "",
    updateRule: '@request.auth.id = id',
    deleteRule: '@request.auth.id = id',
    indexes: ["CREATE UNIQUE INDEX idx_users_username ON users (username)"],
    fields: [
      text("legacy_id"),
      text("username"),
      date("created_at"),
      date("updated_at"),
    ],
    passwordAuth: {
      enabled: true,
      identityFields: ["email", "username"],
    },
  });

  const certificates = await upsertCollection(token, {
    name: "certificates",
    type: "base",
    listRule: "",
    viewRule: "",
    createRule: adminWriteRule,
    updateRule: adminWriteRule,
    deleteRule: adminWriteRule,
    indexes: [
      "CREATE UNIQUE INDEX idx_certificates_slug ON certificates (slug)",
      "CREATE INDEX idx_certificates_vendor ON certificates (vendor)",
      "CREATE INDEX idx_certificates_legacy_id ON certificates (legacy_id)",
    ],
    fields: [
      text("legacy_id"),
      text("slug", { required: true }),
      text("title", { required: true }),
      text("vendor", { required: true }),
      text("description"),
      text("image_url"),
      number("popularity"),
      bool("featured"),
      date("created_at"),
      date("updated_at"),
    ],
  });

  const resources = await upsertCollection(token, {
    name: "resources",
    type: "base",
    listRule: "",
    viewRule: "",
    createRule: adminWriteRule,
    updateRule: adminWriteRule,
    deleteRule: adminWriteRule,
    indexes: [
      "CREATE INDEX idx_resources_certificate_id ON resources (certificate_id)",
      "CREATE INDEX idx_resources_legacy_id ON resources (legacy_id)",
    ],
    fields: [
      text("legacy_id"),
      relation("certificate_id", certificates.id, { required: true, cascadeDelete: true }),
      text("title", { required: true }),
      text("file_type", { required: true }),
      text("storage_path"),
      file("resource_file", { mimeTypes: ["application/pdf", "video/mp4"] }),
      date("created_at"),
      date("updated_at"),
    ],
  });

  await upsertCollection(token, {
    name: "bookmarks",
    type: "base",
    listRule: '@request.auth.id = user_id',
    viewRule: '@request.auth.id = user_id',
    createRule: '@request.auth.id = user_id',
    updateRule: '@request.auth.id = user_id',
    deleteRule: '@request.auth.id = user_id',
    indexes: ["CREATE UNIQUE INDEX idx_bookmarks_unique ON bookmarks (user_id, certificate_id)"],
    fields: [
      text("legacy_id"),
      relation("user_id", users.id, { required: true, cascadeDelete: true }),
      relation("certificate_id", certificates.id, { required: true, cascadeDelete: true }),
      date("created_at"),
    ],
  });

  await upsertCollection(token, {
    name: "downloads",
    type: "base",
    listRule: adminWriteRule,
    viewRule: adminWriteRule,
    createRule: "",
    updateRule: adminWriteRule,
    deleteRule: adminWriteRule,
    indexes: ["CREATE INDEX idx_downloads_resource_id ON downloads (resource_id)"],
    fields: [
      text("legacy_id"),
      relation("user_id", users.id, { cascadeDelete: true }),
      relation("resource_id", resources.id, { required: true, cascadeDelete: true }),
      date("downloaded_at"),
    ],
  });

  await upsertCollection(token, {
    name: "certificate_comments",
    type: "base",
    listRule: "",
    viewRule: "",
    createRule: '@request.auth.id = user_id',
    updateRule: adminEmail
      ? `@request.auth.id = user_id || @request.auth.email = "${escapeRuleValue(adminEmail)}"`
      : '@request.auth.id = user_id',
    deleteRule: adminEmail
      ? `@request.auth.id = user_id || @request.auth.email = "${escapeRuleValue(adminEmail)}"`
      : '@request.auth.id = user_id',
    indexes: ["CREATE INDEX idx_certificate_comments_certificate_id ON certificate_comments (certificate_id)"],
    fields: [
      text("legacy_id"),
      relation("certificate_id", certificates.id, { required: true, cascadeDelete: true }),
      relation("user_id", users.id, { required: true, cascadeDelete: true }),
      text("body", { required: true }),
      date("created_at"),
      date("updated_at"),
    ],
  });

  console.log(`GetITCertified PocketBase schema is ready at ${baseUrl}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
