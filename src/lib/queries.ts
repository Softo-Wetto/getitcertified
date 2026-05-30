import { getPocketBaseFileUrl } from "@/lib/pocketbase/config";
import {
  escapeFilterValue,
  listRecords,
  normalizeRecord,
  pbRequest,
} from "@/lib/pocketbase/shared";
import type { RawPocketBaseRecord } from "@/lib/pocketbase/types";

export type Certificate = {
  id: string;
  legacy_id?: string | null;
  slug: string;
  title: string;
  vendor: string;
  description: string | null;
  image_url: string | null;
  popularity: number;
  featured: boolean;
  created_at?: string;
  updated_at?: string;
};

export type Resource = {
  id: string;
  legacy_id?: string | null;
  certificate_id: string;
  title: string;
  file_type: "pdf" | "mp4";
  storage_path: string | null;
  resource_file?: string | null;
  created_at?: string;
  updated_at?: string;
};

export async function getFeaturedCertificates(
  search = "",
  vendor = ""
): Promise<Certificate[]> {
  const params = new URLSearchParams({
    page: "1",
    perPage: "48",
    sort: "-popularity,-created_at",
  });

  const filters: string[] = [];

  if (search) {
    const q = escapeFilterValue(search);
    filters.push(`(title ~ "${q}" || vendor ~ "${q}" || description ~ "${q}")`);
  }

  if (vendor) {
    filters.push(`vendor = "${escapeFilterValue(vendor)}"`);
  }

  if (filters.length) params.set("filter", filters.join(" && "));

  const data = await listRecords<RawPocketBaseRecord>("certificates", params);
  return data.items.map((record) => normalizeCertificate(record));
}

export async function getCertificateBySlug(slug: string): Promise<Certificate> {
  const params = new URLSearchParams({
    page: "1",
    perPage: "1",
    filter: `slug = "${escapeFilterValue(slug)}"`,
  });

  const data = await listRecords<RawPocketBaseRecord>("certificates", params);
  const record = data.items[0];

  if (!record) throw new Error("Certificate not found.");
  return normalizeCertificate(record);
}

export async function getResourcesForCertificate(
  certificateId: string
): Promise<Resource[]> {
  const params = new URLSearchParams({
    page: "1",
    perPage: "100",
    sort: "created_at",
    filter: `certificate_id = "${escapeFilterValue(certificateId)}"`,
  });

  const data = await listRecords<RawPocketBaseRecord>("resources", params);
  return data.items.map((record) => normalizeResource(record));
}

export function getResourceFileUrl(resource: Resource) {
  const pocketBaseUrl = getPocketBaseFileUrl(
    "resources",
    resource.id,
    resource.resource_file
  );

  if (pocketBaseUrl) return pocketBaseUrl;
  return resource.storage_path || "#";
}

export async function incrementPopularity(certificateId: string) {
  try {
    const record = await pbRequest<RawPocketBaseRecord>(
      `/api/collections/certificates/records/${certificateId}`
    );

    await pbRequest(`/api/collections/certificates/records/${certificateId}`, {
      method: "PATCH",
      body: JSON.stringify({
        popularity: Number(record.popularity || 0) + 1,
      }),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.warn("Could not increment popularity:", message);
  }
}

function normalizeCertificate(record: RawPocketBaseRecord): Certificate {
  const normalized = normalizeRecord(record);

  return {
    ...normalized,
    legacy_id: stringOrNull(normalized.legacy_id),
    slug: String(normalized.slug || ""),
    title: String(normalized.title || "Untitled certificate"),
    vendor: String(normalized.vendor || "Unknown"),
    description: stringOrNull(normalized.description),
    image_url: stringOrNull(normalized.image_url),
    popularity: Number(normalized.popularity || 0),
    featured: Boolean(normalized.featured),
  };
}

function normalizeResource(record: RawPocketBaseRecord): Resource {
  const normalized = normalizeRecord(record);
  const fileType = normalized.file_type === "mp4" ? "mp4" : "pdf";

  return {
    ...normalized,
    legacy_id: stringOrNull(normalized.legacy_id),
    certificate_id: String(normalized.certificate_id || ""),
    title: String(normalized.title || "Untitled resource"),
    file_type: fileType,
    storage_path: stringOrNull(normalized.storage_path),
    resource_file: stringOrNull(normalized.resource_file),
  };
}

function stringOrNull(value: unknown) {
  return typeof value === "string" && value.length > 0 ? value : null;
}
