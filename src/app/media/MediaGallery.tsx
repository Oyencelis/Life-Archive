"use client";

import Link from "next/link";
import { useMemo, useRef, useState, useTransition } from "react";
import { ModalShell } from "@/components/shell/ModalShell";
import { EmptyState } from "@/components/shell/EmptyState";
import { deleteMedia, updateMediaCaption } from "@/app/actions/media";

export type MediaKind = "IMAGE" | "VIDEO" | "AUDIO" | "DOCUMENT";

export interface GalleryLink {
  role: string;
  label: string;
  href: string;
}

export interface GalleryItem {
  id: string;
  type: MediaKind;
  url: string;
  altText: string | null;
  createdAt: string;
  links: GalleryLink[];
}

const FILTERS: { key: MediaKind | "ALL"; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "IMAGE", label: "Images" },
  { key: "VIDEO", label: "Video" },
  { key: "AUDIO", label: "Audio" },
  { key: "DOCUMENT", label: "Documents" },
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function MediaGallery({ initialItems }: { initialItems: GalleryItem[] }) {
  const [items, setItems] = useState(initialItems);
  const [filter, setFilter] = useState<MediaKind | "ALL">("ALL");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(
    () => (filter === "ALL" ? items : items.filter((item) => item.type === filter)),
    [items, filter]
  );
  const selected = items.find((item) => item.id === selectedId) ?? null;

  async function handleFiles(fileList: FileList) {
    setUploading(true);
    setUploadError(null);
    for (const file of Array.from(fileList)) {
      try {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/media/upload", { method: "POST", body: formData });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Upload failed");
        setItems((prev) => [
          {
            id: data.id,
            type: data.type,
            url: data.url,
            altText: file.name,
            createdAt: new Date().toISOString(),
            links: [],
          },
          ...prev,
        ]);
      } catch (e) {
        setUploadError(e instanceof Error ? e.message : "Upload failed");
      }
    }
    setUploading(false);
  }

  return (
    <>
      <div className="ed-index-head">
        <div>
          <p className="ed-eyebrow-small">Library</p>
          <h1 className="ed-index-heading">Media</h1>
          <p className="ed-hero-desc">
            Photos, video, audio, and documents — each file reusable across every record it
            belongs to.
          </p>
        </div>
        <button
          type="button"
          className="ed-cta-primary"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? "Uploading…" : "+ Upload"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
          multiple
          style={{ display: "none" }}
          onChange={(e) => {
            if (e.target.files?.length) handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {uploadError && <p className="setup-error">{uploadError}</p>}

      {items.length === 0 ? (
        <EmptyState
          eyebrow="Nothing uploaded yet"
          title="Your media library is empty."
          body="Upload something above, or add a photo from any person, memory, place, or event form — everything you upload becomes reusable here."
        />
      ) : (
        <>
          <div className="media-filters" role="tablist" aria-label="Filter by type">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                role="tab"
                aria-selected={filter === f.key}
                className="media-filter-btn"
                onClick={() => setFilter(f.key)}
              >
                {f.label}
              </button>
            ))}
          </div>

          <ul className="media-grid">
            {filtered.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  className="media-grid-item"
                  onClick={() => setSelectedId(item.id)}
                  aria-label={item.altText || `Open ${item.type.toLowerCase()}`}
                >
                  {item.type === "IMAGE" ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.url} alt="" loading="lazy" />
                  ) : item.type === "VIDEO" ? (
                    <video src={item.url} muted preload="metadata" />
                  ) : (
                    <span className="media-grid-doc">{item.type === "AUDIO" ? "♪" : "DOC"}</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}

      {selected && (
        <ModalShell onClose={() => setSelectedId(null)}>
          <MediaDetail
            item={selected}
            onDeleted={() => {
              setItems((prev) => prev.filter((x) => x.id !== selected.id));
              setSelectedId(null);
            }}
            onCaptionSaved={(altText) => {
              setItems((prev) =>
                prev.map((x) => (x.id === selected.id ? { ...x, altText } : x))
              );
            }}
          />
        </ModalShell>
      )}
    </>
  );
}

function MediaDetail({
  item,
  onDeleted,
  onCaptionSaved,
}: {
  item: GalleryItem;
  onDeleted: () => void;
  onCaptionSaved: (altText: string) => void;
}) {
  const [caption, setCaption] = useState(item.altText ?? "");
  const [savePending, startSave] = useTransition();
  const [deletePending, startDelete] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function saveCaption() {
    startSave(async () => {
      const result = await updateMediaCaption(item.id, caption);
      if (result.error) {
        setError(result.error);
      } else {
        setError(null);
        onCaptionSaved(caption.trim() || "");
      }
    });
  }

  function handleDelete() {
    if (!window.confirm("Delete this file? This can't be undone.")) return;
    startDelete(async () => {
      await deleteMedia(item.id, "/media");
      onDeleted();
    });
  }

  return (
    <div className="media-detail">
      <div className="media-detail-preview">
        {item.type === "IMAGE" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.url} alt={item.altText ?? ""} />
        ) : item.type === "VIDEO" ? (
          <video src={item.url} controls />
        ) : item.type === "AUDIO" ? (
          <audio src={item.url} controls />
        ) : (
          <a href={item.url} target="_blank" rel="noreferrer" className="btn">
            Open document
          </a>
        )}
      </div>

      <p className="page-header-eyebrow" style={{ marginTop: 20 }}>
        Uploaded {formatDate(item.createdAt)}
      </p>

      <label>
        Caption
        <input
          type="text"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Describe this file"
        />
      </label>
      {error && <p className="setup-error">{error}</p>}
      <div className="entity-form-actions" style={{ marginTop: 10 }}>
        <button type="button" className="btn btn-primary" disabled={savePending} onClick={saveCaption}>
          {savePending ? "Saving…" : "Save caption"}
        </button>
      </div>

      {item.links.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <p className="page-header-eyebrow">Appears on</p>
          <ul className="record-list">
            {item.links.map((link, i) => (
              <li key={`${link.href}-${i}`} className="record-row">
                <Link href={link.href} className="record-row-title">
                  {link.label}
                </Link>
                <span className="record-row-meta">{link.role}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="entity-form-actions" style={{ marginTop: 24 }}>
        <button type="button" className="btn-ghost btn-danger" disabled={deletePending} onClick={handleDelete}>
          {deletePending ? "Deleting…" : "Delete"}
        </button>
      </div>
    </div>
  );
}
