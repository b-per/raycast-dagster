import { Detail } from "@raycast/api";
import { useMemo } from "react";
import { Materialization } from "../api";
import { metadataStringValue, formatTimestamp } from "../helpers";

interface Props {
  assetKey: string;
  materializations: Materialization[];
  label: string;
}

export default function MetadataTable({ assetKey, materializations, label }: Props) {
  const markdown = useMemo(() => {
    const lines: string[] = [`# ${label}`, ""];
    lines.push("| Timestamp | Value |");
    lines.push("|---|---|");

    for (const mat of materializations) {
      const val = metadataStringValue(mat, label);
      if (val !== null) {
        lines.push(`| ${formatTimestamp(mat.timestamp, true)} | ${val.replace(/\|/g, "\\|")} |`);
      }
    }

    return lines.join("\n");
  }, [materializations, label]);

  return <Detail markdown={markdown} navigationTitle={`${assetKey} — ${label}`} />;
}
