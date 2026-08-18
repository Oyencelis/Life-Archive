"use client";

import { useRef, useState } from "react";

export function ImageUpload({
  name,
  label,
  existingId,
  existingUrl,
  accept = "image/*",
}: {
  name: string;
  label: string;
  existingId?: string | null;
  existingUrl?: string | null;
  accept?: string;
}) {
  const [mediaId, setMediaId] = useState<string | null>(existingId ?? null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(existingUrl ?? null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setUploading(true);
    setError(null);
    const localPreview = URL.createObjectURL(file);
    setPreviewUrl(localPreview);

    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/media/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setMediaId(data.id);
      setPreviewUrl(data.url ?? localPreview);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
      setPreviewUrl(existingUrl ?? null);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="image-upload">
      <input type="hidden" name={name} value={mediaId ?? ""} />
      <p className="page-header-eyebrow" style={{ marginBottom: 8 }}>
        {label}
      </p>
      <div className="image-upload-frame">
        {previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={previewUrl} alt="" className="image-upload-preview" />
        ) : (
          <span className="image-upload-empty">No image</span>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        style={{ display: "none" }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
      <div className="image-upload-actions">
        <button
          type="button"
          className="btn"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? "Uploading…" : previewUrl ? "Replace" : "Upload"}
        </button>
        {previewUrl && (
          <button
            type="button"
            className="btn-ghost"
            onClick={() => {
              setMediaId(null);
              setPreviewUrl(null);
              if (inputRef.current) inputRef.current.value = "";
            }}
          >
            Remove
          </button>
        )}
      </div>
      {error && <p className="setup-error">{error}</p>}
    </div>
  );
}
