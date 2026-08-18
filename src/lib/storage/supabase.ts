import { StorageClient } from "@supabase/storage-js";

// Storage-only client (not the full supabase-js client) — the full client
// also spins up a Realtime websocket client on construction, which crashes
// on Node < 22 (no native WebSocket). We only ever need Storage here.
export const storageAdmin = new StorageClient(`${process.env.SUPABASE_URL}/storage/v1`, {
  apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
});

export const MEDIA_BUCKET = "archive-media";
