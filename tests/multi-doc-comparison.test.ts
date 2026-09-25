import { describe, it, expect } from "vitest";
import { KnowDriveRepository } from "@/lib/db/repository";
import { compareDocuments } from "@/lib/ai/comparison";

describe("Cross-File Multi-Document AI Comparison", () => {
  const repo = new KnowDriveRepository("00000000-0000-0000-0000-000000000001");

  it("compares Resume vs Job Description and outputs structured skills, gaps, and evidence", async () => {
    const comparison = await compareDocuments(repo, ["file-resume", "file-job-desc"]);

    expect(comparison.summary).toBeDefined();
    expect(comparison.summary.length).toBeGreaterThan(20);

    // Common skills
    expect(comparison.common_skills).toBeInstanceOf(Array);
    expect(comparison.common_skills.length).toBeGreaterThan(0);

    // Missing skills
    expect(comparison.missing_skills).toBeInstanceOf(Array);
    expect(comparison.missing_skills.length).toBeGreaterThan(0);

    // Supporting evidence
    expect(comparison.supporting_evidence).toBeInstanceOf(Array);
    expect(comparison.supporting_evidence.length).toBeGreaterThan(0);

    const firstEvidence = comparison.supporting_evidence[0];
    expect(firstEvidence.file_name).toBeDefined();
    expect(firstEvidence.quote).toBeDefined();
    expect(firstEvidence.page_number).toBeGreaterThanOrEqual(1);
  });

  it("compares academic & project documents and outputs skills overlap and gaps", async () => {
    const comparison = await compareDocuments(repo, ["file-ml-project", "file-openfoam"]);

    expect(comparison.summary).toBeDefined();
    expect(comparison.common_skills).toBeInstanceOf(Array);
    expect(comparison.common_skills.length).toBeGreaterThan(0);
    expect(comparison.missing_skills).toBeInstanceOf(Array);
    expect(comparison.missing_skills.length).toBeGreaterThan(0);
  });
});
