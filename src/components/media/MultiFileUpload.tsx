"use client";

import { useRef, useState } from "react";

export interface ExistingFile {
  id: string;
  url: string;
  type: "IMAGE" | "VIDEO" | "AUDIO" | "DOCUMENT";
}

export function MultiFileUpload({
  name,
  label,
  existing = [],
  accept = "image/*,video/*",
  hint,
}: {
  name: string;
  label: string;
  existing?: ExistingFile[];
  accept?: string;
  hint?: string;
}) {
  const [files, setFiles] = useState<ExistingFile[]>(existing);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFiles(fileList: FileList) {
    setUploading(true);
    setError(null);
    for (const file of Array.from(fileList)) {
      try {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/media/upload", { method: "POST", body: formData });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Upload failed");
        setFiles((prev) => [...prev, { id: data.id, url: data.url, type: data.type }]);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Upload failed");
      }
    }
    setUploading(false);
  }

  return (
    <div className="image-upload">
      {files.map((f) => (
        <input key={f.id} type="hidden" name={name} value={f.id} />
      ))}
      <p className="page-header-eyebrow" style={{ marginBottom: 8 }}>
        {label}
      </p>
      {hint && (
        <p style={{ fontSize: 12, color: "var(--color-ink-faint)", marginTop: -4, marginBottom: 10 }}>
          {hint}
        </p>
      )}
      <div className="multi-file-grid">
        {files.map((f) => (
          <div key={f.id} className="multi-file-item">
            {f.type === "IMAGE" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={f.url} alt="" />
            ) : f.type === "VIDEO" ? (
              <video src={f.url} muted />
            ) : (
              <span className="multi-file-doc">{f.type}</span>
            )}
            <button
              type="button"
              className="multi-file-remove"
              aria-label="Remove file"
              onClick={() => setFiles((prev) => prev.filter((x) => x.id !== f.id))}
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple
        style={{ display: "none" }}
        onChange={(e) => {
          if (e.target.files?.length) handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
      <button
        type="button"
        className="btn"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
      >
        {uploading ? "Uploading…" : "+ Add files"}
      </button>
      {error && <p className="setup-error">{error}</p>}
    </div>
  );
}
