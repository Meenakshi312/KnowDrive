import { describe, it, expect } from "vitest";
import { KnowDriveRepository } from "@/lib/db/repository";

describe("Drive File & Folder CRUD Operations", () => {
  const repo = new KnowDriveRepository("00000000-0000-0000-0000-000000000001");

  it("creates, retrieves, and deletes folders", async () => {
    const folder = await repo.createFolder("Test Folder", null, "purple");
    expect(folder.name).toBe("Test Folder");
    expect(folder.id).toBeDefined();

    const fetched = await repo.getFolderById(folder.id);
    expect(fetched).not.toBeNull();
    expect(fetched?.name).toBe("Test Folder");

    await repo.deleteFolder(folder.id);
    const afterDelete = await repo.getFolderById(folder.id);
    expect(afterDelete).toBeNull();
  });

  it("handles file starring, moving to trash, and restoring", async () => {
    const file = await repo.createFile({
      user_id: "00000000-0000-0000-0000-000000000001",
      name: "Temporary_Document.pdf",
      original_name: "Temporary_Document.pdf",
      mime_type: "application/pdf",
      file_type: "pdf",
      size_bytes: 120400,
      storage_path: "user-uploads/temp.pdf",
      processing_status: "ready",
      is_starred: false,
      is_trashed: false,
    });

    expect(file.is_starred).toBe(false);

    // Star
    const starred = await repo.toggleStar(file.id);
    expect(starred?.is_starred).toBe(true);

    // Move to Trash
    const trashed = await repo.moveToTrash(file.id);
    expect(trashed?.is_trashed).toBe(true);
    expect(trashed?.trashed_at).toBeDefined();

    // Verify it doesn't appear in active files
    const active = await repo.getFiles({ isTrashed: false });
    expect(active.some((f) => f.id === file.id)).toBe(false);

    // Restore
    const restored = await repo.restoreFromTrash(file.id);
    expect(restored?.is_trashed).toBe(false);

    // Cleanup
    await repo.permanentlyDeleteFile(file.id);
    const deleted = await repo.getFileById(file.id);
    expect(deleted).toBeNull();
  });
});
