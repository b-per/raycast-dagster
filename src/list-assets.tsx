import { ActionPanel, Action, List, Icon, getPreferenceValues } from "@raycast/api";
import { useCachedPromise } from "@raycast/utils";
import { fetchAssets, type Preferences } from "./api";
import { formatTimestamp } from "./helpers";
import AssetMaterializations from "./components/AssetMaterializations";
import AssetMetrics from "./components/AssetMetrics";

export default function SearchAssets() {
  const { data: assets, isLoading } = useCachedPromise(fetchAssets);
  const prefs = getPreferenceValues<Preferences>();
  const baseUrl = prefs.dagsterUrl.replace(/\/+$/, "");

  return (
    <List isLoading={isLoading} searchBarPlaceholder="Filter assets...">
      {assets?.map((asset) => {
        const assetPath = asset.key.path;
        const assetKey = assetPath.join(".");
        const lastMat = asset.assetMaterializations[0];
        const assetUrl = `${baseUrl}/assets/${assetPath.map(encodeURIComponent).join("/")}`;

        return (
          <List.Item
            key={assetKey}
            icon={Icon.Layers}
            title={assetKey}
            subtitle={lastMat ? formatTimestamp(lastMat.timestamp, true) : ""}
            actions={
              <ActionPanel>
                <Action.Push
                  title="View Materializations"
                  icon={Icon.List}
                  target={<AssetMaterializations assetPath={assetPath} assetKey={assetKey} />}
                />
                <Action.Push
                  title="View Metrics"
                  icon={Icon.LineChart}
                  target={<AssetMetrics assetPath={assetPath} assetKey={assetKey} />}
                />
                <Action.OpenInBrowser title="Open in Dagster" url={assetUrl} />
              </ActionPanel>
            }
          />
        );
      })}
    </List>
  );
}
