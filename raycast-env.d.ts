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
  /** Preferences accessible in the `list-assets` command */
  export type ListAssets = ExtensionPreferences & {}
  /** Preferences accessible in the `list-runs` command */
  export type ListRuns = ExtensionPreferences & {}
  /** Preferences accessible in the `list-jobs` command */
  export type ListJobs = ExtensionPreferences & {}
  /** Preferences accessible in the `run-status` command */
  export type RunStatus = ExtensionPreferences & {}
}

declare namespace Arguments {
  /** Arguments passed to the `list-assets` command */
  export type ListAssets = {}
  /** Arguments passed to the `list-runs` command */
  export type ListRuns = {}
  /** Arguments passed to the `list-jobs` command */
  export type ListJobs = {}
  /** Arguments passed to the `run-status` command */
  export type RunStatus = {}
}

