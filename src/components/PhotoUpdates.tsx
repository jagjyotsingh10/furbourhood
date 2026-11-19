import { useRef, useState, type FormEvent } from "react";
import { Camera, ImageOff } from "lucide-react";

import { FormError, TextAreaField } from "@/components/Field";
import { EmptyState } from "@/components/States";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { BookingUpdate } from "@/data/api";
import { cn } from "@/lib/utils";

const MAX_NOTE = 280;
const postedAt = new Intl.DateTimeFormat("en-CA", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

/** Provider's form: take or pick a photo, add a short note, send. */
export function PhotoUpdateForm({ petName, onSend }: { petName: string; onSend: (photo: File, note: string) => Promise<void> }) {
  const input = useRef<HTMLInputElement>(null);
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const choose = (file: File | undefined) => {
    setError(null);
    if (!file) return;
    if (!file.type.startsWith("image/")) return setError("Choose a photo (JPEG, PNG or WebP).");
    if (preview) URL.revokeObjectURL(preview);
    setPhoto(file);
    setPreview(URL.createObjectURL(file));
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!photo) return setError(`Add a photo of ${petName} first.`);
    setBusy(true);
    setError(null);
    try {
      await onSend(photo, note.trim());
      if (preview) URL.revokeObjectURL(preview);
      setPhoto(null);
      setPreview(null);
      setNote("");
      if (input.current) input.current.value = "";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't send the update. Try again.");
    }
    setBusy(false);
  };

  return (
    <Card className="p-4">
      <form onSubmit={submit} className="flex flex-col gap-3" noValidate>
        <p className="font-heading text-base font-bold">Send {petName}'s owner an update</p>
        <label
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-control border-2 border-dashed border-input bg-cloud text-sm font-semibold has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ring",
            preview ? "p-0" : "min-h-32 p-4",
          )}
        >
          {/* capture opens the camera on phones; on a computer it opens the file picker */}
          <input
            ref={input}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            capture="environment"
            className="sr-only"
            onChange={(e) => choose(e.target.files?.[0])}
          />
          {preview ? (
            <img src={preview} alt={`Photo of ${petName} to send`} className="max-h-72 w-full object-cover" />
          ) : (
            <>
              <Camera className="size-6" aria-hidden />
              Take or choose a photo
            </>
          )}
        </label>
        {preview && <p className="text-xs text-muted-foreground">Tap the photo to choose a different one.</p>}
        <TextAreaField
          id="update-note"
          label="Note (optional)"
          hint={`e.g. "Back from a 30-minute walk, ate all her dinner." ${note.length}/${MAX_NOTE}`}
          value={note}
          maxLength={MAX_NOTE}
          onChange={(e) => setNote(e.target.value)}
          className="[&_textarea]:min-h-20"
        />
        <FormError message={error} />
        <Button type="submit" disabled={busy}>
          <Camera aria-hidden />
          {busy ? "Sending…" : "Send update"}
        </Button>
      </form>
    </Card>
  );
}

/** Newest first. Photos are private links that last an hour. */
export function PhotoFeed({ updates, petName }: { updates: BookingUpdate[]; petName: string }) {
  if (updates.length === 0) {
    return <EmptyState title="No photo updates yet">Updates about {petName} appear here during the booking.</EmptyState>;
  }
  return (
    <ul className="flex flex-col gap-3">
      {updates.map((u) => (
        <li key={u.id}>
          <Card className="overflow-hidden">
            {u.photoUrl ? (
              <img src={u.photoUrl} alt={u.note ? `${petName}: ${u.note}` : `Photo update of ${petName}`} className="max-h-96 w-full object-cover" />
            ) : (
              <div className="flex h-32 items-center justify-center gap-2 bg-muted text-sm text-muted-foreground">
                <ImageOff className="size-4" aria-hidden />
                Photo unavailable
              </div>
            )}
            <div className="p-4">
              {u.note && <p className="text-sm">{u.note}</p>}
              <p className={cn("text-xs text-muted-foreground", u.note && "mt-1")}>{postedAt.format(new Date(u.createdAt))}</p>
            </div>
          </Card>
        </li>
      ))}
    </ul>
  );
}
