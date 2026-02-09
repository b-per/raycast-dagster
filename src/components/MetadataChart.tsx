import { Detail, environment } from "@raycast/api";
import { useMemo } from "react";
import { Materialization } from "../api";
import { metadataValue, formatTimestamp, formatNumber } from "../helpers";
import { generateChart } from "../chart";

interface Props {
  assetKey: string;
  materializations: Materialization[];
  label: string;
}

export default function MetadataChart({ assetKey, materializations, label }: Props) {
  const { chartPath, stats } = useMemo(() => {
    const reversed = [...materializations].reverse();
    const dates: string[] = [];
    const values: number[] = [];

    for (const mat of reversed) {
      const val = metadataValue(mat, label);
      if (val !== null) {
        dates.push(formatTimestamp(mat.timestamp, true).slice(0, 10));
        values.push(val);
      }
    }

    const isDark = environment.appearance === "dark";
    const path = generateChart({
      title: `${assetKey} — ${label}`,
      yLabel: label,
      dates,
      values,
      bgColor: isDark ? "#1e1e1e" : "#ffffff",
      fgColor: isDark ? "#cccccc" : "#333333",
      lineColor: isDark ? "#4fc3f7" : "#1976d2",
      gridColor: isDark ? "#333333" : "#e0e0e0",
    });

    const min = values.length ? Math.min(...values) : 0;
    const max = values.length ? Math.max(...values) : 0;
    const avg = values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;

    return {
      chartPath: path,
      stats: { min, max, avg, count: values.length },
    };
  }, [materializations, label, assetKey]);

  const markdown = `![Chart](file://${encodeURI(chartPath)})`;

  return (
    <Detail
      markdown={markdown}
      navigationTitle={`${assetKey} — ${label}`}
      metadata={
        <Detail.Metadata>
          <Detail.Metadata.Label title="Metric" text={label} />
          <Detail.Metadata.Separator />
          <Detail.Metadata.Label title="Count" text={String(stats.count)} />
          <Detail.Metadata.Label title="Min" text={formatNumber(stats.min)} />
          <Detail.Metadata.Label title="Max" text={formatNumber(stats.max)} />
          <Detail.Metadata.Label title="Avg" text={formatNumber(stats.avg)} />
        </Detail.Metadata>
      }
    />
  );
}
