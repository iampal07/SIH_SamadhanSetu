"use client";

import { useRef, useEffect } from "react";
import { useT } from "@/components/LanguageProvider";

const MAX_IMAGES = 5;

export type PickedImage = { file: File; previewUrl: string };

export function ImageUploader({
  images,
  onChange,
}: {
  images: PickedImage[];
  onChange: (images: PickedImage[]) => void;
}) {
  const t = useT();
  const inputRef = useRef<HTMLInputElement>(null);

  // Revoke object URLs when the component using them unmounts.
  useEffect(() => {
    return () => {
      images.forEach((img) => URL.revokeObjectURL(img.previewUrl));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleFiles(fileList: FileList | null) {
    if (!fileList) return;
    const remaining = MAX_IMAGES - images.length;
    const picked = Array.from(fileList)
      .filter((f) => f.type.startsWith("image/"))
      .slice(0, remaining)
      .map((file) => ({ file, previewUrl: URL.createObjectURL(file) }));
    onChange([...images, ...picked]);
    if (inputRef.current) inputRef.current.value = "";
  }

  function removeAt(index: number) {
    const target = images[index];
    URL.revokeObjectURL(target.previewUrl);
    onChange(images.filter((_, i) => i !== index));
  }

  return (
    <div>
      <span className="mb-2 block text-base font-semibold text-slate-800">
        {t.fieldPhotos}
      </span>
      <p className="mb-3 text-sm text-slate-500">{t.fieldPhotosHint}</p>

      <div className="flex flex-wrap gap-3">
        {images.map((img, i) => (
          <div
            key={img.previewUrl}
            className="relative h-24 w-24 overflow-hidden rounded-xl border-2 border-slate-200"
          >
            {/* Local blob preview: next/image cannot optimize blob: URLs. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={img.previewUrl}
              alt=""
              className="h-full w-full object-cover"
            />
            <button
              type="button"
              onClick={() => removeAt(i)}
              aria-label="Remove photo"
              className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white"
            >
              ×
            </button>
          </div>
        ))}

        {images.length < MAX_IMAGES && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex h-24 w-24 flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-slate-300 text-slate-500 hover:border-brand hover:text-brand"
          >
            <span className="text-2xl leading-none">+</span>
            <span className="text-xs font-semibold">{t.addPhoto}</span>
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}
