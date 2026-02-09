import { Color, Icon } from "@raycast/api";
import { Materialization } from "./api";

// Metadata labels that represent a duration in seconds.
// Add more entries here if needed.
const DURATION_LABELS = ["Execution time (s)"];

export function formatTimestamp(ts: number | string | null, ms = false): string {
  if (ts === null || ts === undefined) return "";
  const num = typeof ts === "string" ? parseInt(ts, 10) : ts;
  if (isNaN(num)) return "";
  const date = new Date(ms ? num : num * 1000);
  return date.toISOString().replace("T", " ").slice(0, 16);
}

export function materializationDuration(mat: Materialization): number | null {
  // Look for a metadata entry whose label matches a known duration metric
  for (const entry of mat.metadataEntries) {
    if (
      DURATION_LABELS.includes(entry.label) &&
      entry.__typename === "FloatMetadataEntry" &&
      entry.floatValue != null
    ) {
      return entry.floatValue;
    }
  }
  // Fall back to stepStats delta
  if (mat.stepStats?.startTime && mat.stepStats?.endTime) {
    return mat.stepStats.endTime - mat.stepStats.startTime;
  }
  return null;
}

export function formatNumber(v: number | null): string {
  if (v === null || v === undefined) return "";
  if (Number.isInteger(v)) return String(v);
  if (Math.abs(v) >= 100) return v.toFixed(1);
  return v.toFixed(2);
}

export function formatDuration(seconds: number | null): string {
  if (seconds === null || seconds === undefined) return "";
  if (seconds < 60) return `${seconds.toFixed(1)}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs.toFixed(0)}s`;
}

export function statusIcon(status: string): Icon {
  return status === "SUCCESS" ? Icon.CheckCircle : Icon.XMarkCircle;
}

export function statusColor(status: string): Color {
  return status === "SUCCESS" ? Color.Green : Color.Red;
}

export function numericMetadataLabels(materializations: Materialization[]): string[] {
  const labels = new Set<string>();
  labels.add("Duration");
  for (const mat of materializations) {
    for (const entry of mat.metadataEntries) {
      if (
        (entry.__typename === "FloatMetadataEntry" && entry.floatValue != null) ||
        (entry.__typename === "IntMetadataEntry" && entry.intValue != null)
      ) {
        labels.add(entry.label);
      }
    }
  }
  return Array.from(labels);
}

export function metadataValue(mat: Materialization, label: string): number | null {
  if (label === "Duration") {
    return materializationDuration(mat);
  }
  for (const entry of mat.metadataEntries) {
    if (entry.label === label) {
      if (entry.__typename === "FloatMetadataEntry" && entry.floatValue != null) {
        return entry.floatValue;
      }
      if (entry.__typename === "IntMetadataEntry" && entry.intValue != null) {
        return entry.intValue;
      }
    }
  }
  return null;
}
