import { ActionPanel, Action, List, Icon } from "@raycast/api";
import { useCachedPromise } from "@raycast/utils";
import { fetchAssetMaterializations } from "../api";
import { numericMetadataLabels, metadataValue, formatDuration, formatNumber } from "../helpers";
import MetadataChart from "./MetadataChart";

interface Props {
  assetPath: string[];
  assetKey: string;
}

export default function AssetMetrics({ assetPath, assetKey }: Props) {
  const { data: materializations, isLoading } = useCachedPromise(fetchAssetMaterializations, [assetPath]);

  const labels = materializations ? numericMetadataLabels(materializations) : [];

  return (
    <List isLoading={isLoading} navigationTitle={`${assetKey} — Metrics`}>
      {labels.map((label) => {
        const lastValue = materializations
          ? (materializations.map((m) => metadataValue(m, label)).find((v) => v !== null) ?? null)
          : null;
        const formatted = label === "Duration" ? formatDuration(lastValue) : formatNumber(lastValue);

        return (
          <List.Item
            key={label}
            icon={Icon.LineChart}
            title={label}
            accessories={[{ text: formatted }]}
            actions={
              <ActionPanel>
                <Action.Push
                  title="View Chart"
                  icon={Icon.LineChart}
                  target={<MetadataChart assetKey={assetKey} materializations={materializations ?? []} label={label} />}
                />
              </ActionPanel>
            }
          />
        );
      })}
    </List>
  );
}
