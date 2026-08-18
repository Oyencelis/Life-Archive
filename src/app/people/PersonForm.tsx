"use client";

import { useActionState } from "react";
import { ImageUpload } from "@/components/media/ImageUpload";
import { MultiFileUpload, type ExistingFile } from "@/components/media/MultiFileUpload";
import { useFormNavigate } from "@/lib/use-form-navigate";

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "Not set" },
  { value: "CURRENT", label: "Current" },
  { value: "PAST", label: "Past" },
  { value: "LOST_CONTACT", label: "Lost contact" },
  { value: "COMPLICATED", label: "Complicated" },
  { value: "OCCASIONAL", label: "Occasional" },
  { value: "FAMILY", label: "Family" },
  { value: "OTHER", label: "Other" },
];

export interface PersonFormValues {
  name?: string;
  nickname?: string;
  category?: string;
  relationshipStatus?: string | null;
  dob?: string;
  firstMetDate?: string;
  howWeMet?: string;
  bio?: string;
  notes?: string;
  avatarMediaId?: string;
  avatarUrl?: string;
  gallery?: ExistingFile[];
  isLocked?: boolean;
}

type FormAction = (
  prevState: { error?: string; href?: string } | undefined,
  formData: FormData
) => Promise<{ error?: string; href?: string }>;

export function PersonForm({
  action,
  defaultValues,
  submitLabel,
  isSelf,
  hasPin,
}: {
  action: FormAction;
  defaultValues?: PersonFormValues;
  submitLabel: string;
  isSelf?: boolean;
  hasPin: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  useFormNavigate(state?.href);

  return (
    <form action={formAction} className="entity-form">
      <ImageUpload
        name="avatarMediaId"
        label="Main photo"
        existingId={defaultValues?.avatarMediaId}
        existingUrl={defaultValues?.avatarUrl}
      />

      <label>
        Name
        <input name="name" type="text" defaultValue={defaultValues?.name} required />
      </label>

      <div className="entity-form-row">
        <label>
          Nickname
          <input name="nickname" type="text" defaultValue={defaultValues?.nickname} />
        </label>
        <label>
          Category
          <input
            name="category"
            type="text"
            list="person-categories"
            defaultValue={defaultValues?.category}
            required
          />
          <datalist id="person-categories">
            <option value="Family" />
            <option value="Friend" />
            <option value="Classmate" />
            <option value="Colleague" />
            <option value="Romantic" />
            <option value="Acquaintance" />
            <option value="Mentor" />
          </datalist>
        </label>
      </div>

      <label>
        Relationship status
        <select name="relationshipStatus" defaultValue={defaultValues?.relationshipStatus ?? ""}>
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </label>

      <div className="entity-form-row">
        <label>
          Date of birth
          <input name="dob" type="date" defaultValue={defaultValues?.dob} />
        </label>
        {!isSelf && (
          <label>
            First met
            <input name="firstMetDate" type="date" defaultValue={defaultValues?.firstMetDate} />
          </label>
        )}
      </div>

      {!isSelf && (
        <label>
          How we met
          <input name="howWeMet" type="text" defaultValue={defaultValues?.howWeMet} />
        </label>
      )}

      <label>
        Biography
        <textarea name="bio" rows={4} defaultValue={defaultValues?.bio} />
      </label>

      <label>
        Private notes
        <textarea name="notes" rows={3} defaultValue={defaultValues?.notes} />
      </label>

      <label style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        <input
          type="checkbox"
          name="isLocked"
          defaultChecked={defaultValues?.isLocked}
          // A disabled checkbox submits nothing at all (unlike a disabled
          // <option> in a <select>, which still submits if pre-selected) —
          // disabling this when the profile is already locked would
          // silently unlock it on save, since "isLocked" would arrive as
          // null and read as false.
          disabled={!hasPin && !defaultValues?.isLocked}
          style={{ width: "auto" }}
        />
        Lock this profile {hasPin ? "(requires your PIN to view)" : "(set a PIN in Settings first)"}
      </label>

      <MultiFileUpload
        name="galleryMediaIds"
        label="More photos"
        existing={defaultValues?.gallery}
        accept="image/*"
      />

      {state?.error && <p className="setup-error">{state.error}</p>}

      <div className="entity-form-actions">
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? "Saving…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
