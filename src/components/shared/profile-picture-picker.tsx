"use client";

import { useRef, useState } from "react";
import { Camera, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/shared/user-avatar";
import { cn } from "@/lib/utils";

type Props = {
  email: string;
  name?: string;
  value: string | null;
  onChange: (url: string | null) => void;
  disabled?: boolean;
};

export function ProfilePicturePicker({ email, name, value, onChange, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File | null) => {
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/upload/avatar", { method: "POST", body: form });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        setError(data.error ?? "Upload failed");
        return;
      }
      onChange(data.url);
    } catch {
      setError("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        <UserAvatar
          email={email || "user@bundlehub.gh"}
          name={name}
          avatarUrl={value}
          className="h-20 w-20 text-lg"
        />
        {!disabled && (
          <button
            type="button"
            className={cn(
              "absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-mtn text-charcoal shadow-md",
              uploading && "opacity-70"
            )}
            onClick={() => inputRef.current?.click()}
            disabled={uploading || disabled}
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Camera className="h-4 w-4" />
            )}
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => void handleFile(e.target.files?.[0] ?? null)}
      />
      <p className="text-center text-xs text-muted-foreground">
        Profile photo <span className="text-foreground/60">(optional)</span>
      </p>
      {value && !disabled && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 gap-1 text-xs text-muted-foreground"
          onClick={() => onChange(null)}
        >
          <X className="h-3 w-3" /> Remove photo
        </Button>
      )}
      {error && <p className="text-xs text-telecel">{error}</p>}
    </div>
  );
}
