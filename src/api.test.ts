import { describe, it, expect, beforeAll } from "vitest";

import {
  fetchAssets,
  fetchAssetMaterializations,
  fetchRuns,
  fetchRunAssets,
  fetchJobs,
  dagsterRunUrl,
  dagsterJobUrl,
} from "./api";

beforeAll(() => {
  if (!process.env.SB_DAGSTER_URL) {
    throw new Error("SB_DAGSTER_URL not set — source .envrc first");
  }
});

describe("fetchAssets", () => {
  it("returns a non-empty list of assets", async () => {
    const assets = await fetchAssets();
    expect(assets.length).toBeGreaterThan(0);
    expect(assets[0].key.path).toBeInstanceOf(Array);
    expect(assets[0].key.path.length).toBeGreaterThan(0);
  });

  it("each asset has a key.path of strings", async () => {
    const assets = await fetchAssets();
    for (const asset of assets.slice(0, 5)) {
      for (const p of asset.key.path) {
        expect(typeof p).toBe("string");
      }
    }
  });
});

describe("fetchAssetMaterializations", () => {
  let assetPath: string[];

  beforeAll(async () => {
    const assets = await fetchAssets();
    // pick first asset that has at least one materialization
    const withMat = assets.find((a) => a.assetMaterializations.length > 0);
    expect(withMat).toBeDefined();
    assetPath = withMat!.key.path;
  });

  it("returns materializations for a known asset", async () => {
    const mats = await fetchAssetMaterializations(assetPath);
    expect(mats.length).toBeGreaterThan(0);
  });

  it("each materialization has expected fields", async () => {
    const mats = await fetchAssetMaterializations(assetPath);
    const m = mats[0];
    expect(m.runId).toBeTruthy();
    expect(typeof m.timestamp).toBe("string");
    expect(m.stepStats).toBeDefined();
    expect(typeof m.stepStats.startTime).toBe("number");
    expect(typeof m.stepStats.endTime).toBe("number");
    expect(m.metadataEntries).toBeInstanceOf(Array);
  });

  it("returns empty array for a nonexistent asset", async () => {
    const mats = await fetchAssetMaterializations(["nonexistent_asset_xyz_12345"]);
    expect(mats).toEqual([]);
  });
});

describe("fetchRuns", () => {
  it("returns a non-empty list of runs", async () => {
    const runs = await fetchRuns();
    expect(runs.length).toBeGreaterThan(0);
  });

  it("each run has expected fields", async () => {
    const runs = await fetchRuns();
    const r = runs[0];
    expect(r.id).toBeTruthy();
    expect(r.status).toBeTruthy();
    expect(r.jobName).toBeTruthy();
    expect(typeof r.startTime === "number" || r.startTime === null).toBe(true);
  });
});

describe("fetchRunAssets", () => {
  let runId: string;

  beforeAll(async () => {
    const runs = await fetchRuns();
    // pick first completed run (most likely to have materializations)
    const completed = runs.find((r) => r.status === "SUCCESS");
    expect(completed).toBeDefined();
    runId = completed!.id;
  });

  it("returns assets for a successful run", async () => {
    const assets = await fetchRunAssets(runId);
    expect(assets).toBeInstanceOf(Array);
    // a successful run should have produced at least one asset
    expect(assets.length).toBeGreaterThan(0);
  });

  it("each run asset has expected shape", async () => {
    const assets = await fetchRunAssets(runId);
    const a = assets[0];
    expect(a.assetKey).toBeInstanceOf(Array);
    expect(a.assetKey.length).toBeGreaterThan(0);
    expect(typeof a.stepKey).toBe("string");
    expect(typeof a.timestamp).toBe("string");
  });
});

describe("fetchJobs", () => {
  it("returns a non-empty list of jobs", async () => {
    const jobs = await fetchJobs();
    expect(jobs.length).toBeGreaterThan(0);
  });

  it("filters out dunder jobs", async () => {
    const jobs = await fetchJobs();
    for (const job of jobs) {
      expect(job.name.startsWith("__")).toBe(false);
    }
  });

  it("each job has location and repository info", async () => {
    const jobs = await fetchJobs();
    const j = jobs[0];
    expect(j.name).toBeTruthy();
    expect(j.locationName).toBeTruthy();
    expect(j.repositoryName).toBeTruthy();
    expect(j.schedules).toBeInstanceOf(Array);
    expect(j.runs).toBeInstanceOf(Array);
  });
});

describe("URL helpers", () => {
  it("dagsterRunUrl builds correct URL", () => {
    const url = dagsterRunUrl("abc-123");
    expect(url).toBe(`${process.env.SB_DAGSTER_URL}/runs/abc-123`);
  });

  it("dagsterRunUrl strips trailing slash", () => {
    const url = dagsterRunUrl("abc-123");
    expect(url).not.toContain("//runs");
  });

  it("dagsterJobUrl builds correct URL with encoding", () => {
    const url = dagsterJobUrl("my-location", "my-job");
    expect(url).toBe(`${process.env.SB_DAGSTER_URL}/locations/my-location/jobs/my-job`);
  });
});
