# Public Data Policy

This project intentionally keeps only a small subset of tables readable with the public `anon` key. Everything else should be protected by RLS and user-scoped policies.

## Allowed public reads

### `channel_list`
- Purpose: public hot-channel recommendation API
- Used by: [src/app/api/hot-channels/route.ts](/C:/Users/duj05/Desktop/hello-ys-temp/src/app/api/hot-channels/route.ts)
- Reason to keep public: the endpoint is explicitly designed to serve homepage/dashboard recommendation data without requiring login

### `hot_channels`
- Purpose: enrich public hot-list items with channel metadata
- Used by: [src/app/api/hot-list/route.ts](/C:/Users/duj05/Desktop/hello-ys-temp/src/app/api/hot-list/route.ts), [src/app/api/hot-list/trends/route.ts](/C:/Users/duj05/Desktop/hello-ys-temp/src/app/api/hot-list/trends/route.ts)
- Reason to keep public: public hot-list responses need channel title and metadata

## Not intended to be public-write

### `video_snapshots`
- Current role: internal daily snapshot storage for hot-video calculations
- Used by: [src/lib/youtube/video-snapshot.ts](/C:/Users/duj05/Desktop/hello-ys-temp/src/lib/youtube/video-snapshot.ts)
- Allowed access policy:
  - `service_role` write only
  - public read only if a real public endpoint starts using it
- Current decision: keep public write blocked; public read should be treated as optional and removable unless a concrete read path is added

## Protected user data

The following tables must stay behind RLS with owner-based access only:

- `script_generations`
- `batch_jobs`
- `batch_job_items`
- `lectures`
- `lecture_materials`
- `lecture_progress`

## Review rule

When adding a new API route backed by Supabase:

1. Decide whether the route is truly public.
2. If public, expose data through the API route and keep the underlying table narrow.
3. If not public, add or update RLS first.
4. Do not add `TO public` / `TO anon` policies to user-content tables.
