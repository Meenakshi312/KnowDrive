import { NextRequest, NextResponse } from "next/server";
import { KnowDriveRepository } from "@/lib/db/repository";
import { getSupabaseServerClient, isSupabaseConfigured } from "@/lib/db/supabase";
import { getCurrentUser } from "@/lib/db/auth-server";
import { FileType } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in or use Demo Mode." },
        { status: 401 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const folderId = formData.get("folder_id") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Free-tier friendly 15MB limit check
    const maxSizeBytes = 15 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return NextResponse.json(
        { error: "File exceeds 15MB limit for free tier." },
        { status: 400 }
      );
    }

    const fileName = file.name;
    const ext = fileName.split(".").pop()?.toLowerCase() || "";
    let fileType: FileType = "other";
    if (ext === "pdf") fileType = "pdf";
    else if (ext === "docx") fileType = "docx";
    else if (["txt", "md", "markdown"].includes(ext)) fileType = ext === "md" ? "md" : "txt";
    else if (["png", "jpg", "jpeg", "webp", "gif"].includes(ext)) fileType = "image";

    const storagePath = `${user.id}/${Date.now()}-${fileName.replace(/\s+/g, "_")}`;
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    // If Supabase Storage is configured and not in demo mode (or even in demo mode if bucket exists)
    const supabase = getSupabaseServerClient();
    const bucketName = process.env.SUPABASE_STORAGE_BUCKET || "knowdrive-files";

    if (supabase && isSupabaseConfigured) {
      const { error: storageError } = await supabase.storage
        .from(bucketName)
        .upload(storagePath, fileBuffer, {
          contentType: file.type || "application/octet-stream",
          upsert: true,
        });

      if (storageError) {
        console.warn("Supabase Storage upload warning (proceeding):", storageError.message);
      }
    }

    const repo = new KnowDriveRepository(user.id, user.isDemo);
    const newFile = await repo.createFile({
      user_id: user.id,
      folder_id: folderId || null,
      name: fileName,
      original_name: fileName,
      mime_type: file.type || "application/octet-stream",
      file_type: fileType,
      size_bytes: file.size,
      storage_path: storagePath,
      processing_status: "pending",
      is_starred: false,
      is_trashed: false,
    });

    return NextResponse.json({ success: true, file: newFile });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to upload file";
    console.error("Upload error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
