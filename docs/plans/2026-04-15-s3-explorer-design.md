# S3 Explorer — Design Document

**Date:** 2026-04-15
**Status:** Approved
**Based on:** [s3-viewfy](https://github.com/soratekstudio/s3-viewfy) (Next.js) → rewrite in React Router 7

## Goals

- Rewrite s3-viewfy as s3-explorer using React Router 7 framework mode
- Fix auth issues (replace in-memory sessions with stateless signed cookies)
- Env-only S3 credentials (no manual mode — credentials never touch the browser)
- Add: file preview, search/filter, multi-select + bulk actions, improved file size display
- Publish as a Railway template

## Architecture

React Router 7 in framework mode. Server-side loaders/actions for all S3 operations. Stateless cookie-based auth. No database.

## Route Structure

```
app/
├── routes/
│   ├── login.tsx                          # Login page + action
│   ├── _auth.tsx                          # Auth guard layout (checks cookie)
│   ├── _auth._dashboard.tsx               # Dashboard layout (header + sidebar)
│   ├── _auth._dashboard._index.tsx        # Bucket list page
│   ├── _auth._dashboard.$bucket.tsx       # File browser (root of bucket)
│   ├── _auth._dashboard.$bucket.$.tsx     # File browser (nested folders via splat)
│   └── api.s3.ts                          # Resource route (upload, download, delete, preview)
```

### URL Mapping

| URL | View |
|-----|------|
| `/login` | Login form |
| `/` | Bucket list (or redirect to `/$bucket` if `S3_BUCKET` set) |
| `/my-bucket` | Root of "my-bucket" |
| `/my-bucket/images/photos/` | "images/photos/" prefix in "my-bucket" |

## Auth Flow

- **Stateless:** Signed cookie using `SESSION_SECRET` env var (auto-generated if not set)
- **Cookie contents:** `{ authenticated: true, exp: timestamp }` — signed, not encrypted (no sensitive data)
- **Auth optional:** If `AUTH_USERNAME`/`AUTH_PASSWORD` not set, `_auth.tsx` passes through
- **Rate limiting:** 5 attempts/min per IP

```
Request → _auth.tsx loader
  ├── Has valid signed cookie? → render children
  └── No cookie? → redirect("/login")

POST /login → action
  ├── Validate username/password against env vars
  ├── Rate limit: 5 attempts/min per IP
  ├── Success → set signed cookie, redirect("/")
  └── Fail → return error
```

## Data Flow

### Loaders (server-side)

- `_auth._dashboard._index.tsx` → `listBuckets()`
- `_auth._dashboard.$bucket.tsx` → `listObjects(bucket, prefix="")`
- `_auth._dashboard.$bucket.$.tsx` → `listObjects(bucket, prefix)` from splat params

### Actions (server-side)

`api.s3.ts` handles all mutations via `intent` field:
- `intent=upload` → upload file (FormData)
- `intent=delete` → delete object(s) (supports bulk)
- `intent=download` → return presigned URL
- `intent=preview` → return presigned URL for inline preview

## S3 Server Module

```typescript
// app/lib/s3.server.ts — never imported on client
getS3Client()                              // singleton from env vars
listBuckets()
listObjects(bucket, prefix, continuationToken?)
deleteObject(bucket, key)
deleteObjects(bucket, keys[])              // bulk delete
uploadObject(bucket, key, body)
getPresignedUrl(bucket, key, disposition)   // download vs inline
```

## Components

```
app/components/
├── ui/                    # shadcn/ui primitives
├── login-form.tsx         # Login form
├── header.tsx             # App header (theme toggle, logout, connection info)
├── sidebar.tsx            # Bucket list sidebar
├── file-browser.tsx       # File table with selection
├── breadcrumb-nav.tsx     # Folder breadcrumbs from URL
├── file-preview.tsx       # Inline preview modal (images, PDF, text, video, audio)
├── upload-dialog.tsx      # Upload with drag & drop
├── delete-dialog.tsx      # Delete confirmation (single + bulk)
├── search-filter.tsx      # Client-side filter within current listing
├── file-icon.tsx          # File type icon resolver
└── theme-toggle.tsx       # Dark/light mode
```

## New Features (vs s3-viewfy)

### 1. File Preview (inline)
- Images: `<img>` with presigned URL
- PDF: `<iframe>` with presigned URL
- Text/code: Fetch content, render in `<pre>`
- Video/audio: Native `<video>`/`<audio>` with presigned URL
- Opens in a modal/sheet overlay

### 2. Search/Filter
- Client-side filter on current page's object list
- Filters by filename as you type
- No server round-trip (data already loaded)

### 3. Multi-select + Bulk Actions
- Checkbox column in file table
- "Select all" toggle
- Bulk delete via `deleteObjects()` (single S3 API call)
- Bulk download: generate presigned URLs, trigger sequential downloads
- Selection toolbar appears when items selected

### 4. File Size Display
- Human-readable format (KB, MB, GB)
- Consistent formatting utility

## Environment Variables

```bash
# Required — S3
S3_ENDPOINT=
S3_ACCESS_KEY_ID=
S3_SECRET_ACCESS_KEY=
S3_REGION=

# Optional — S3
S3_BUCKET=                # default bucket (skip bucket list)
S3_FORCE_PATH_STYLE=      # for MinIO/R2 etc.

# Optional — Auth
AUTH_USERNAME=
AUTH_PASSWORD=
SESSION_SECRET=           # auto-generated if not set

# Optional — App
PORT=3000
```

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | React Router 7 (framework mode) |
| Language | TypeScript |
| UI | shadcn/ui + Tailwind CSS v4 |
| Icons | Lucide React |
| S3 SDK | AWS SDK v3 |
| Auth | Signed cookies (node:crypto) |
| Toast | Sonner |
| Theme | Cookie-based dark/light toggle |
| Deployment | Docker + Railway template |

## Deployment

- `Dockerfile` with multi-stage build (deps → build → runner)
- `railway.toml` for Railway template config
- Health check endpoint at `/api/health`
- Template defines required env vars with descriptions

## Key Design Decisions

1. **Env-only credentials** — No manual S3 connection mode. Simpler, more secure.
2. **Stateless auth** — Signed cookies, no server-side session storage. Survives restarts, scales horizontally.
3. **URL-driven navigation** — Bucket and path in URL for deep linking, bookmarks, browser history.
4. **Server-side S3 operations** — All S3 calls happen in loaders/actions. Client never sees credentials.
5. **Resource route for mutations** — Single `api.s3.ts` handles uploads, downloads, deletes via `intent` field.
