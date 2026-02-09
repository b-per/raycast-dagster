/// <reference types="@raycast/api">

/* 🚧 🚧 🚧
 * This file is auto-generated from the extension's manifest.
 * Do not modify manually. Instead, update the `package.json` file.
 * 🚧 🚧 🚧 */

/* eslint-disable @typescript-eslint/ban-types */

type ExtensionPreferences = {
  /** Dagster URL - Base URL of your Dagster instance (e.g. https://dagster.example.com) */
  "dagsterUrl": string,
  /** Extra Headers - JSON object of extra HTTP headers (e.g. {"CF-Access-Client-Id": "..."}) */
  "extraHeaders"?: string,
  /** Username - Basic auth username (optional) */
  "username"?: string,
  /** Password - Basic auth password (optional) */
  "password"?: string
}

/** Preferences accessible in all the extension's commands */
declare type Preferences = ExtensionPreferences

declare namespace Preferences {
  /** Preferences accessible in the `search-assets` command */
  export type SearchAssets = ExtensionPreferences & {}
  /** Preferences accessible in the `list-runs` command */
  export type ListRuns = ExtensionPreferences & {}
}

declare namespace Arguments {
  /** Arguments passed to the `search-assets` command */
  export type SearchAssets = {}
  /** Arguments passed to the `list-runs` command */
  export type ListRuns = {}
}

