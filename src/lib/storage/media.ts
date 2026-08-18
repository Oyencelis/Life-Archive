import type { MediaType } from "@prisma/client";
import { storageAdmin, MEDIA_BUCKET } from "./supabase";
import { prisma } from "@/lib/prisma";

export const MAX_UPLOAD_BYTES = 20 * 1024 * 1024; // 20MB — keeps a free-tier bucket usable for a while

// Deliberately excludes image/svg+xml and text/html-adjacent types — SVG and
// HTML can carry inline <script>, and file.type is fully client-controlled,
// so an allowlist here is the only thing stopping a renamed upload from
// coming back as executable content on its signed URL.
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/avif",
  "image/heic",
  "image/heif",
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "audio/mpeg",
  "audio/wav",
  "audio/ogg",
  "audio/mp4",
  "application/pdf",
]);

function inferType(mime: string): MediaType {
  if (mime.startsWith("image/")) return "IMAGE";
  if (mime.startsWith("video/")) return "VIDEO";
  if (mime.startsWith("audio/")) return "AUDIO";
  return "DOCUMENT";
}

export async function uploadMedia(userId: string, file: File): Promise<{ id: string; type: MediaType }> {
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    throw new Error(`Unsupported file type: ${file.type || "unknown"}`);
  }

  const ext = file.name.includes(".") ? file.name.split(".").pop() : "bin";
  const key = `${userId}/${crypto.randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await storageAdmin.from(MEDIA_BUCKET).upload(key, buffer, {
    contentType: file.type,
  });
  if (error) throw new Error(error.message);

  const type = inferType(file.type);
  const media = await prisma.media.create({
    data: { userId, storageKey: key, type, altText: file.name },
  });
  return { id: media.id, type };
}

export async function getSignedMediaUrl(storageKey: string, expiresIn = 3600): Promise<string | null> {
  const { data, error } = await storageAdmin.from(MEDIA_BUCKET).createSignedUrl(storageKey, expiresIn);
  if (error) return null;
  return data.signedUrl;
}

// Batches N storage keys into one request to Supabase Storage instead of
// N round trips — list pages resolving a cover photo per row were the
// worst offender (one signed-url request per row, all in parallel, but
// still N requests). Missing/failed keys just don't get an entry in the
// returned map rather than failing the whole batch.
export async function getSignedMediaUrls(
  storageKeys: string[],
  expiresIn = 3600
): Promise<Map<string, string>> {
  if (storageKeys.length === 0) return new Map();
  const { data, error } = await storageAdmin.from(MEDIA_BUCKET).createSignedUrls(storageKeys, expiresIn);
  if (error || !data) return new Map();
  const map = new Map<string, string>();
  for (const item of data) {
    if (item.path && item.signedUrl && !item.error) map.set(item.path, item.signedUrl);
  }
  return map;
}

export async function deleteMediaObject(storageKey: string) {
  await storageAdmin.from(MEDIA_BUCKET).remove([storageKey]);
}
