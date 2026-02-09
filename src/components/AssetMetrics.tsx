import { ActionPanel, Action, List, Icon } from "@raycast/api";
import { useCachedPromise } from "@raycast/utils";
import { fetchAssetMaterializations } from "../api";
import {
  numericMetadataLabels,
  stringMetadataLabels,
  metadataValue,
  metadataStringValue,
  formatNumber,
} from "../helpers";
import MetadataChart from "./MetadataChart";
import MetadataTable from "./MetadataTable";

interface Props {
  assetPath: string[];
  assetKey: string;
}

export default function AssetMetrics({ assetPath, assetKey }: Props) {
  const { data: materializations, isLoading } = useCachedPromise(fetchAssetMaterializations, [assetPath]);

  const numericLabels = materializations ? numericMetadataLabels(materializations) : [];
  const stringLabels = materializations ? stringMetadataLabels(materializations) : [];

  return (
    <List isLoading={isLoading} navigationTitle={`${assetKey} — Metrics`}>
      {numericLabels.length === 0 && stringLabels.length === 0 && !isLoading && (
        <List.EmptyView title="No Metrics" description="No metadata entries found for this asset." />
      )}
      {numericLabels.length > 0 && (
        <List.Section title="Numeric">
          {numericLabels.map((label) => {
            const lastValue = materializations
              ? (materializations.map((m) => metadataValue(m, label)).find((v) => v !== null) ?? null)
              : null;
            const formatted = formatNumber(lastValue);

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
                      target={
                        <MetadataChart assetKey={assetKey} materializations={materializations ?? []} label={label} />
                      }
                    />
                  </ActionPanel>
                }
              />
            );
          })}
        </List.Section>
      )}
      {stringLabels.length > 0 && (
        <List.Section title="Text">
          {stringLabels.map((label) => {
            const lastValue = materializations
              ? (materializations.map((m) => metadataStringValue(m, label)).find((v) => v !== null) ?? null)
              : null;

            return (
              <List.Item
                key={label}
                icon={Icon.Text}
                title={label}
                accessories={[{ text: lastValue ?? "" }]}
                actions={
                  <ActionPanel>
                    <Action.Push
                      title="View History"
                      icon={Icon.List}
                      target={
                        <MetadataTable assetKey={assetKey} materializations={materializations ?? []} label={label} />
                      }
                    />
                    {lastValue && <Action.CopyToClipboard title="Copy Value" content={lastValue} />}
                  </ActionPanel>
                }
              />
            );
          })}
        </List.Section>
      )}
    </List>
  );
}
