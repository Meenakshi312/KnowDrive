import { describe, it, expect } from "vitest";
import { DriveFile } from "@/types";

describe("Dashboard File Sorting and Management", () => {
  const sampleFiles: DriveFile[] = [
    {
      id: "1",
      user_id: "u1",
      name: "ApplicationForm_(1).pdf",
      size_bytes: 623546, // ~608 KB
      mime_type: "application/pdf",
      file_type: "pdf",
      storage_path: "user/app.pdf",
      is_starred: true,
      is_trashed: false,
      folder_id: null,
      created_at: "2026-09-25T11:00:00Z",
      updated_at: "2026-09-25T11:00:00Z",
    },
    {
      id: "2",
      user_id: "u1",
      name: "Meenakshi__Copy__(1).pdf",
      size_bytes: 123944, // ~121 KB
      mime_type: "application/pdf",
      file_type: "pdf",
      storage_path: "user/copy.pdf",
      is_starred: false,
      is_trashed: false,
      folder_id: null,
      created_at: "2026-09-25T12:00:00Z",
      updated_at: "2026-09-25T12:00:00Z",
    },
    {
      id: "3",
      user_id: "u1",
      name: "photo_page-0001.jpg",
      size_bytes: 444173, // ~433 KB
      mime_type: "image/jpeg",
      file_type: "image",
      storage_path: "user/photo.jpg",
      is_starred: false,
      is_trashed: false,
      folder_id: null,
      created_at: "2026-09-25T10:00:00Z",
      updated_at: "2026-09-25T10:00:00Z",
    },
    {
      id: "4",
      user_id: "u1",
      name: "C_meenakshi.jpeg",
      size_bytes: 77524, // ~75 KB
      mime_type: "image/jpeg",
      file_type: "image",
      storage_path: "user/c.jpeg",
      is_starred: false,
      is_trashed: false,
      folder_id: null,
      created_at: "2026-09-25T13:00:00Z",
      updated_at: "2026-09-25T13:00:00Z",
    },
  ];

  it("sorts files by size: largest to smallest (size-desc)", () => {
    const sorted = [...sampleFiles].sort((a, b) => {
      const sizeA = Number(a.size_bytes) || 0;
      const sizeB = Number(b.size_bytes) || 0;
      return sizeB - sizeA;
    });

    expect(sorted.map((f) => f.name)).toEqual([
      "ApplicationForm_(1).pdf", // 623546
      "photo_page-0001.jpg",     // 444173
      "Meenakshi__Copy__(1).pdf", // 123944
      "C_meenakshi.jpeg",        // 77524
    ]);
  });

  it("sorts files by size: smallest to largest (size-asc)", () => {
    const sorted = [...sampleFiles].sort((a, b) => {
      const sizeA = Number(a.size_bytes) || 0;
      const sizeB = Number(b.size_bytes) || 0;
      return sizeA - sizeB;
    });

    expect(sorted.map((f) => f.name)).toEqual([
      "C_meenakshi.jpeg",        // 77524
      "Meenakshi__Copy__(1).pdf", // 123944
      "photo_page-0001.jpg",     // 444173
      "ApplicationForm_(1).pdf", // 623546
    ]);
  });

  it("sorts files by name: A to Z (name-asc)", () => {
    const sorted = [...sampleFiles].sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" })
    );

    expect(sorted.map((f) => f.name)).toEqual([
      "ApplicationForm_(1).pdf",
      "C_meenakshi.jpeg",
      "Meenakshi__Copy__(1).pdf",
      "photo_page-0001.jpg",
    ]);
  });

  it("sorts files by name: Z to A (name-desc)", () => {
    const sorted = [...sampleFiles].sort((a, b) =>
      b.name.localeCompare(a.name, undefined, { numeric: true, sensitivity: "base" })
    );

    expect(sorted.map((f) => f.name)).toEqual([
      "photo_page-0001.jpg",
      "Meenakshi__Copy__(1).pdf",
      "C_meenakshi.jpeg",
      "ApplicationForm_(1).pdf",
    ]);
  });

  it("sorts files by modified date: newest first (date-desc)", () => {
    const sorted = [...sampleFiles].sort((a, b) => {
      const dateA = new Date(a.created_at).getTime() || 0;
      const dateB = new Date(b.created_at).getTime() || 0;
      return dateB - dateA;
    });

    expect(sorted.map((f) => f.name)).toEqual([
      "C_meenakshi.jpeg",        // 13:00
      "Meenakshi__Copy__(1).pdf", // 12:00
      "ApplicationForm_(1).pdf", // 11:00
      "photo_page-0001.jpg",     // 10:00
    ]);
  });
});
