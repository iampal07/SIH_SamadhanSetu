import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { supabase } from "@/lib/supabaseServer";

// Evidence upload handler: uploads directly to the Supabase Storage bucket 'attachments'
// and returns public CDN URLs.
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

export type SavedFile = {
  url: string;
  storagePath: string;
  fileName: string;
  fileType: "image";
};

export class UploadError extends Error {}

export async function saveImageFile(
  file: File,
  options?: { challengeId?: string }
): Promise<SavedFile> {
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    throw new UploadError(
      "Unsupported file type. Please upload a JPG, PNG, or WEBP image."
    );
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new UploadError("File is too large. Maximum size is 10MB.");
  }

  const extension = file.type.split("/")[1] || "jpg";
  const fileId = randomUUID();
  const fileName = `${fileId}.${extension}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  // Use Supabase Storage by default unless explicitly disabled
  if (process.env.USE_SUPABASE_STORAGE !== "false") {
    const year = new Date().getFullYear();
    const challengePart = options?.challengeId ? `${options.challengeId}/` : "";
    const storagePath = `citizen/${year}/${challengePart}${fileName}`;

    const { error } = await supabase.storage
      .from("attachments")
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (error) {
      throw new UploadError(`Supabase storage upload failed: ${error.message}`);
    }

    const { data } = supabase.storage
      .from("attachments")
      .getPublicUrl(storagePath);

    return {
      url: data.publicUrl,
      storagePath,
      fileName: file.name || fileName,
      fileType: "image",
    };
  }

  // Local-disk fallback if explicitly configured
  await mkdir(UPLOAD_DIR, { recursive: true });
  const filePath = path.join(UPLOAD_DIR, fileName);
  await writeFile(filePath, buffer);

  return {
    url: `/uploads/${fileName}`,
    storagePath: `uploads/${fileName}`,
    fileName: file.name || fileName,
    fileType: "image",
  };
}
