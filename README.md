# Dagster for Raycast

Browse and interact with your [Dagster](https://dagster.io) instance from Raycast.

## Commands

### List Assets

Browse all assets, view materialization history and metadata charts, and trigger materializations.

**Materialization actions:**

- **Materialize** — materialize the selected asset
- **Materialize + Downstream** — materialize the asset and all its downstream dependants
- **Materialize + Upstream** — materialize the asset and all its upstream dependencies
- **Materialize + Upstream + Downstream** — materialize the full lineage in both directions

Assets are grouped by job automatically. If the selected assets span multiple jobs, one run is launched per job.

### List Runs

View recent pipeline runs with status, duration, and drill-down to see which assets were materialized in each run.

### List Jobs

Browse jobs grouped by code location. Launch new runs, retry from failure, and manage schedules (start/stop).

## Configuration

| Preference | Required | Description |
|---|---|---|
| Dagster URL | Yes | Base URL of your Dagster instance |
| Extra Headers | No | JSON object of extra HTTP headers (e.g. Cloudflare Access) |
| Username | No | Basic auth username |
| Password | No | Basic auth password |

## Limitations

- **No partition support** — partitioned assets are excluded from materialization actions. Dagster uses a separate backfill API for partitioned assets which is not yet implemented.
- **No "materialize unsynced"** — there is no action to materialize only stale/missing assets. In the context of acting on a single asset at a time, this adds little value over simply materializing it.
