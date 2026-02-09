import { ActionPanel, Action, List, Icon } from "@raycast/api";
import { useCachedPromise } from "@raycast/utils";
import { fetchRuns, dagsterRunUrl } from "./api";
import { formatTimestamp, formatDuration, statusIcon, statusColor } from "./helpers";
import RunAssets from "./components/RunAssets";

export default function ListRuns() {
  const { data: runs, isLoading, revalidate } = useCachedPromise(fetchRuns);

  return (
    <List isLoading={isLoading} searchBarPlaceholder="Filter runs...">
      {runs?.map((run) => {
        const duration = run.startTime && run.endTime ? run.endTime - run.startTime : null;
        return (
          <List.Item
            key={run.id}
            icon={{ source: statusIcon(run.status), tintColor: statusColor(run.status) }}
            title={run.jobName}
            subtitle={formatTimestamp(run.startTime)}
            accessories={[{ text: formatDuration(duration) }]}
            actions={
              <ActionPanel>
                <Action.Push
                  title="View Assets"
                  icon={Icon.Layers}
                  target={<RunAssets runId={run.id} jobName={run.jobName} />}
                />
                <Action.OpenInBrowser title="Open in Dagster" url={dagsterRunUrl(run.id)} />
                <Action.CopyToClipboard title="Copy URL" content={dagsterRunUrl(run.id)} />
                <Action title="Refresh" icon={Icon.ArrowClockwise} onAction={revalidate} />
              </ActionPanel>
            }
          />
        );
      })}
    </List>
  );
}
