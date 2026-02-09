import { ActionPanel, Action, Detail } from "@raycast/api";
import { Materialization, dagsterRunUrl } from "../api";
import {
  formatTimestamp,
  materializationDuration,
  formatDuration,
  formatNumber,
  statusIcon,
  statusColor,
} from "../helpers";

interface Props {
  materialization: Materialization;
}

export default function MaterializationDetail({ materialization: mat }: Props) {
  const status = mat.stepStats?.status ?? "UNKNOWN";
  const duration = materializationDuration(mat);

  return (
    <Detail
      navigationTitle={`${mat.runId.slice(0, 8)} - ${mat.stepKey}`}
      markdown={`# ${mat.stepKey}\n\nRun \`${mat.runId}\``}
      metadata={
        <Detail.Metadata>
          <Detail.Metadata.Label
            title="Status"
            text={status}
            icon={{ source: statusIcon(status), tintColor: statusColor(status) }}
          />
          <Detail.Metadata.Label title="Timestamp" text={formatTimestamp(mat.timestamp, true)} />
          <Detail.Metadata.Label title="Duration" text={formatDuration(duration)} />
          {mat.partition && <Detail.Metadata.Label title="Partition" text={mat.partition} />}
          <Detail.Metadata.Separator />
          {mat.metadataEntries.map((entry) => {
            let value = "";
            if (entry.__typename === "FloatMetadataEntry" && entry.floatValue != null) {
              value = formatNumber(entry.floatValue);
            } else if (entry.__typename === "IntMetadataEntry" && entry.intValue != null) {
              value = formatNumber(entry.intValue);
            } else {
              value = entry.__typename.replace("MetadataEntry", "");
            }
            return <Detail.Metadata.Label key={entry.label} title={entry.label} text={value} />;
          })}
        </Detail.Metadata>
      }
      actions={
        <ActionPanel>
          <Action.OpenInBrowser title="Open Run in Dagster" url={dagsterRunUrl(mat.runId)} />
          <Action.CopyToClipboard title="Copy Run URL" content={dagsterRunUrl(mat.runId)} />
        </ActionPanel>
      }
    />
  );
}
