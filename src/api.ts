import { getPreferenceValues } from "@raycast/api";

// --- Preferences ---

export interface Preferences {
  dagsterUrl: string;
  extraHeaders?: string;
  username?: string;
  password?: string;
}

// --- GraphQL Client ---

async function graphqlFetch<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const prefs = getPreferenceValues<Preferences>();
  const url = `${prefs.dagsterUrl.replace(/\/+$/, "")}/graphql`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  if (prefs.extraHeaders) {
    try {
      const extra = JSON.parse(prefs.extraHeaders) as Record<string, string>;
      Object.assign(headers, extra);
    } catch {
      throw new Error("Invalid JSON in Extra Headers preference");
    }
  }

  if (prefs.username && prefs.password) {
    headers["Authorization"] = `Basic ${Buffer.from(`${prefs.username}:${prefs.password}`).toString("base64")}`;
  }

  const resp = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({ query, variables }),
  });

  const contentType = resp.headers.get("content-type") ?? "";

  if (!resp.ok || !contentType.includes("application/json")) {
    const hint =
      resp.status === 403 || resp.status === 401
        ? "Check your credentials or Extra Headers in the extension preferences."
        : contentType.includes("text/html")
          ? "The server returned an HTML page instead of JSON. This usually means authentication is required — check your Extra Headers or username/password in the extension preferences."
          : `Unexpected response (${resp.status} ${resp.statusText}).`;
    throw new Error(`Could not connect to Dagster at ${url}. ${hint}`);
  }

  const json = (await resp.json()) as { data?: T; errors?: { message: string }[] };

  if (json.errors?.length) {
    throw new Error(`GraphQL error: ${json.errors.map((e) => e.message).join(", ")}`);
  }
  if (!json.data) {
    throw new Error("No data returned from Dagster API");
  }

  return json.data;
}

// --- URL Helper ---

export function dagsterRunUrl(runId: string): string {
  const prefs = getPreferenceValues<Preferences>();
  return `${prefs.dagsterUrl.replace(/\/+$/, "")}/runs/${runId}`;
}

// --- Types ---

export interface AssetNode {
  key: { path: string[] };
  assetMaterializations: { timestamp: string }[];
}

export interface StepStats {
  status: string;
  startTime: number;
  endTime: number;
}

export interface MetadataEntry {
  label: string;
  __typename: string;
  floatValue?: number;
  intValue?: number;
}

export interface Materialization {
  runId: string;
  partition: string | null;
  stepKey: string;
  timestamp: string;
  stepStats: StepStats;
  metadataEntries: MetadataEntry[];
}

export interface Run {
  id: string;
  status: string;
  jobName: string;
  startTime: number | null;
  endTime: number | null;
}

// --- Queries ---

const ASSETS_QUERY = `
query lastMaterialization {
  assetsOrError {
    ...on AssetConnection {
      nodes {
        key {
          path
        }
        assetMaterializations(limit:1) {
          timestamp
        }
      }
    }
  }
}`;

const ASSET_MATERIALIZATIONS_QUERY = `
query myquery($assetKey: AssetKeyInput!) {
  assetOrError(assetKey: $assetKey) {
    __typename
    ... on Asset {
      id
      assetMaterializations(limit: 100) {
        runId
        partition
        stepKey
        timestamp
        stepStats {
          status
          startTime
          endTime
        }
        metadataEntries {
          label
          __typename
          ... on FloatMetadataEntry {
            floatValue
          }
          ... on IntMetadataEntry {
            intValue
          }
        }
      }
    }
  }
}`;

const RUNS_QUERY = `
query runsOrError {
  runsOrError(limit: 200) {
    __typename
    ... on Runs {
      results {
        id
        status
        jobName
        startTime
        endTime
      }
    }
  }
}`;

const RUN_ASSETS_QUERY = `
query runAssets($runId: ID!) {
  runOrError(runId: $runId) {
    __typename
    ... on Run {
      id
      assetMaterializations {
        assetKey {
          path
        }
        stepKey
        timestamp
      }
    }
  }
}`;

// --- Query Functions ---

interface AssetsResponse {
  assetsOrError: {
    nodes: AssetNode[];
  };
}

export async function fetchAssets(): Promise<AssetNode[]> {
  const data = await graphqlFetch<AssetsResponse>(ASSETS_QUERY);
  return data.assetsOrError.nodes;
}

interface AssetMaterializationsResponse {
  assetOrError: {
    __typename: string;
    assetMaterializations?: Materialization[];
  };
}

export async function fetchAssetMaterializations(assetPath: string[]): Promise<Materialization[]> {
  const data = await graphqlFetch<AssetMaterializationsResponse>(ASSET_MATERIALIZATIONS_QUERY, {
    assetKey: { path: assetPath },
  });

  if (data.assetOrError.__typename !== "Asset" || !data.assetOrError.assetMaterializations) {
    return [];
  }
  return data.assetOrError.assetMaterializations;
}

interface RunsResponse {
  runsOrError: {
    __typename: string;
    results?: Run[];
  };
}

export async function fetchRuns(): Promise<Run[]> {
  const data = await graphqlFetch<RunsResponse>(RUNS_QUERY);
  if (data.runsOrError.__typename !== "Runs" || !data.runsOrError.results) {
    return [];
  }
  return data.runsOrError.results;
}

export interface RunAsset {
  assetKey: string[];
  stepKey: string;
  timestamp: string;
}

interface RunAssetsResponse {
  runOrError: {
    __typename: string;
    assetMaterializations?: {
      assetKey: { path: string[] };
      stepKey: string;
      timestamp: string;
    }[];
  };
}

export async function fetchRunAssets(runId: string): Promise<RunAsset[]> {
  const data = await graphqlFetch<RunAssetsResponse>(RUN_ASSETS_QUERY, { runId });
  if (data.runOrError.__typename !== "Run" || !data.runOrError.assetMaterializations) {
    return [];
  }
  return data.runOrError.assetMaterializations.map((m) => ({
    assetKey: m.assetKey.path,
    stepKey: m.stepKey,
    timestamp: m.timestamp,
  }));
}
