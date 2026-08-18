import Link from "next/link";
import type { ReactNode } from "react";
import { Reveal } from "@/components/shell/Reveal";

export interface FeatureFact {
  label: string;
  value: ReactNode;
}

export type FeatureTone = "terracotta" | "mint" | "yellow" | "paper";

// The shared "magazine feature" layout for every entity detail page
// (Person, Place, Event, Memory, Project, Journal entry) — wide hero
// image (or a flat tone-colored block when there's no cover photo, so
// every record still gets a designed moment instead of degrading to
// plain text), a fact strip, then free-form body content per entity.
export function EntityFeature({
  eyebrow,
  title,
  coverUrl,
  tone,
  facts,
  actions,
  backHref,
  backLabel,
  children,
}: {
  eyebrow: string;
  title: string;
  coverUrl?: string | null;
  tone: FeatureTone;
  facts?: FeatureFact[];
  actions: ReactNode;
  backHref: string;
  backLabel: string;
  children?: ReactNode;
}) {
  return (
    <div className="ed-shell">
      <article>
        <Link href={backHref} className="ed-feature-back">
          ← {backLabel}
        </Link>

        <div className={`ed-feature-hero ${coverUrl ? "ed-feature-hero-photo" : `ed-tone-${tone}`}`}>
          {coverUrl && (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={coverUrl} alt="" className="ed-feature-cover" />
              <div className="ed-feature-scrim" aria-hidden="true" />
            </>
          )}
          <div className="ed-feature-heading-block">
            <p className="ed-feature-eyebrow">{eyebrow}</p>
            <h1 className="ed-feature-title">{title}</h1>
          </div>
        </div>

        <div className="ed-feature-toolbar">{actions}</div>

        {facts && facts.length > 0 && (
          <Reveal>
            <dl className="ed-feature-facts">
              {facts.map((f, i) => (
                <div key={i} className="ed-feature-fact">
                  <dt>{f.label}</dt>
                  <dd>{f.value}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
        )}

        <Reveal>
          <div className="ed-feature-body">{children}</div>
        </Reveal>
      </article>
    </div>
  );
}
