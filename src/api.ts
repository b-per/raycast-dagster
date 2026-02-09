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

export function dagsterJobUrl(locationName: string, jobName: string): string {
  const prefs = getPreferenceValues<Preferences>();
  return `${prefs.dagsterUrl.replace(/\/+$/, "")}/locations/${encodeURIComponent(locationName)}/jobs/${encodeURIComponent(jobName)}`;
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

const JOBS_QUERY = `
query jobs {
  workspaceOrError {
    ... on Workspace {
      locationEntries {
        name
        locationOrLoadError {
          __typename
          ... on RepositoryLocation {
            name
            repositories {
              name
              jobs {
                name
                description
                schedules {
                  name
                  cronSchedule
                  scheduleState {
                    id
                    status
                  }
                }
                runs(limit: 1) {
                  id
                  status
                  startTime
                  endTime
                }
              }
            }
          }
        }
      }
    }
  }
}`;

const LAUNCH_RUN_MUTATION = `
mutation launchRun($executionParams: ExecutionParams!) {
  launchRun(executionParams: $executionParams) {
    __typename
    ... on LaunchRunSuccess {
      run { id }
    }
    ... on PythonError {
      message
    }
    ... on RunConfigValidationInvalid {
      errors { message }
    }
    ... on PipelineNotFoundError {
      message
    }
    ... on RunConflict {
      message
    }
    ... on UnauthorizedError {
      message
    }
  }
}`;

const REEXECUTE_RUN_MUTATION = `
mutation reexecuteRun($reexecutionParams: ReexecutionParams!) {
  launchRunReexecution(reexecutionParams: $reexecutionParams) {
    __typename
    ... on LaunchRunSuccess {
      run { id }
    }
    ... on PythonError {
      message
    }
    ... on PipelineNotFoundError {
      message
    }
    ... on RunConflict {
      message
    }
    ... on UnauthorizedError {
      message
    }
  }
}`;

const START_SCHEDULE_MUTATION = `
mutation startSchedule($scheduleSelector: ScheduleSelector!) {
  startSchedule(scheduleSelector: $scheduleSelector) {
    __typename
    ... on ScheduleStateResult {
      scheduleState { status }
    }
    ... on PythonError {
      message
    }
    ... on UnauthorizedError {
      message
    }
  }
}`;

const STOP_SCHEDULE_MUTATION = `
mutation stopSchedule($id: String!) {
  stopRunningSchedule(id: $id) {
    __typename
    ... on ScheduleStateResult {
      scheduleState { status }
    }
    ... on PythonError {
      message
    }
    ... on UnauthorizedError {
      message
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

// --- Jobs ---

export interface JobSchedule {
  name: string;
  cronSchedule: string;
  scheduleState: { id: string; status: string };
}

export interface JobLastRun {
  id: string;
  status: string;
  startTime: number | null;
  endTime: number | null;
}

export interface Job {
  name: string;
  description: string | null;
  schedules: JobSchedule[];
  runs: JobLastRun[];
  locationName: string;
  repositoryName: string;
}

interface JobsResponse {
  workspaceOrError: {
    locationEntries: {
      name: string;
      locationOrLoadError: {
        __typename: string;
        name?: string;
        repositories?: {
          name: string;
          jobs: {
            name: string;
            description: string | null;
            schedules: JobSchedule[];
            runs: JobLastRun[];
          }[];
        }[];
      };
    }[];
  };
}

export async function fetchJobs(): Promise<Job[]> {
  const data = await graphqlFetch<JobsResponse>(JOBS_QUERY);
  const jobs: Job[] = [];
  for (const entry of data.workspaceOrError.locationEntries) {
    const loc = entry.locationOrLoadError;
    if (loc.__typename !== "RepositoryLocation" || !loc.repositories) continue;
    for (const repo of loc.repositories) {
      for (const job of repo.jobs) {
        if (job.name.startsWith("__")) continue;
        jobs.push({
          ...job,
          locationName: loc.name!,
          repositoryName: repo.name,
        });
      }
    }
  }
  return jobs;
}

// --- Mutations ---

interface LaunchResult {
  launchRun: {
    __typename: string;
    run?: { id: string };
    message?: string;
    errors?: { message: string }[];
  };
}

export async function launchRun(
  jobName: string,
  repositoryName: string,
  repositoryLocationName: string,
): Promise<string> {
  const data = await graphqlFetch<LaunchResult>(LAUNCH_RUN_MUTATION, {
    executionParams: {
      selector: { jobName, repositoryName, repositoryLocationName },
    },
  });
  if (data.launchRun.__typename === "LaunchRunSuccess" && data.launchRun.run) {
    return data.launchRun.run.id;
  }
  const msg = data.launchRun.message || data.launchRun.errors?.map((e) => e.message).join(", ") || "Unknown error";
  throw new Error(`Failed to launch run: ${msg}`);
}

interface ReexecuteResult {
  launchRunReexecution: {
    __typename: string;
    run?: { id: string };
    message?: string;
  };
}

export async function reexecuteRun(parentRunId: string, strategy: "ALL_STEPS" | "FROM_FAILURE"): Promise<string> {
  const data = await graphqlFetch<ReexecuteResult>(REEXECUTE_RUN_MUTATION, {
    reexecutionParams: { parentRunId, strategy },
  });
  if (data.launchRunReexecution.__typename === "LaunchRunSuccess" && data.launchRunReexecution.run) {
    return data.launchRunReexecution.run.id;
  }
  throw new Error(`Failed to reexecute run: ${data.launchRunReexecution.message || "Unknown error"}`);
}

interface ScheduleMutationResult {
  [key: string]: {
    __typename: string;
    scheduleState?: { status: string };
    message?: string;
  };
}

export async function startSchedule(
  scheduleName: string,
  repositoryName: string,
  repositoryLocationName: string,
): Promise<void> {
  const data = await graphqlFetch<ScheduleMutationResult>(START_SCHEDULE_MUTATION, {
    scheduleSelector: { scheduleName, repositoryName, repositoryLocationName },
  });
  const result = data.startSchedule;
  if (result.__typename !== "ScheduleStateResult") {
    throw new Error(`Failed to start schedule: ${result.message || "Unknown error"}`);
  }
}

export async function stopSchedule(scheduleStateId: string): Promise<void> {
  const data = await graphqlFetch<ScheduleMutationResult>(STOP_SCHEDULE_MUTATION, {
    id: scheduleStateId,
  });
  const result = data.stopRunningSchedule;
  if (result.__typename !== "ScheduleStateResult") {
    throw new Error(`Failed to stop schedule: ${result.message || "Unknown error"}`);
  }
}
