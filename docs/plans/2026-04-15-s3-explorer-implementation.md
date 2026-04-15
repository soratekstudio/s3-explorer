# S3 Explorer Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build s3-explorer, a React Router 7 full-stack S3 file manager with stateless auth, file preview, search/filter, multi-select, and Railway deployment.

**Architecture:** React Router 7 framework mode with nested routes. Server-side loaders/actions for S3 operations. Stateless signed-cookie auth. shadcn/ui + Tailwind v4. Docker + Railway template.

**Tech Stack:** React Router 7, TypeScript, Tailwind CSS v4, shadcn/ui, AWS SDK v3, Lucide React, Sonner, Vite

**Reference repo:** `/tmp/s3-viewfy-ref` (cloned s3-viewfy for UI/logic reference)

---

## Task 1: Project Scaffolding

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vite.config.ts`
- Create: `app/routes.ts`
- Create: `app/root.tsx`
- Create: `app/app.css`
- Create: `.gitignore`
- Create: `.env.example`

**Step 1: Initialize the project**

```bash
cd /Volumes/Personal/Clients/soratekstudio/s3explorer
npm init -y
```

**Step 2: Install dependencies**

```bash
npm install react@latest react-dom@latest react-router@latest
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
npm install lucide-react sonner clsx class-variance-authority tailwind-merge tw-animate-css
npm install -D @react-router/dev @types/react @types/react-dom typescript tailwindcss @tailwindcss/vite vite
```

**Step 3: Create vite.config.ts**

```typescript
// vite.config.ts
import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [tailwindcss(), reactRouter()],
});
```

**Step 4: Create tsconfig.json**

```json
{
  "include": ["**/*.ts", "**/*.tsx", ".react-router/types/**/*"],
  "compilerOptions": {
    "lib": ["DOM", "DOM.Iterable", "ES2022"],
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "paths": {
      "~/*": ["./app/*"]
    },
    "rootDirs": [".", "./.react-router/types"]
  }
}
```

**Step 5: Create react-router.config.ts**

```typescript
// react-router.config.ts
import type { Config } from "@react-router/dev/config";

export default {
  ssr: true,
} satisfies Config;
```

**Step 6: Create app/root.tsx**

The root layout includes a inline script for theme detection (reads a cookie to set dark/light class before hydration, preventing FOUC). This uses a hardcoded string literal — no user input, safe from XSS.

```tsx
// app/root.tsx
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  isRouteErrorResponse,
} from "react-router";
import type { Route } from "./+types/root";
import { Toaster } from "sonner";
import "./app.css";

const themeScript = `(function(){var t=document.cookie.match(/theme=(light|dark)/);document.documentElement.classList.toggle("dark",(t?t[1]:"dark")==="dark")})()`;

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-screen bg-background text-foreground antialiased">
        {children}
        <Toaster position="bottom-right" richColors />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  if (isRouteErrorResponse(error)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold">{error.status}</h1>
          <p className="text-muted-foreground">{error.statusText}</p>
        </div>
      </div>
    );
  }
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold">Error</h1>
        <p className="text-muted-foreground">Something went wrong</p>
      </div>
    </div>
  );
}
```

**Step 7: Create app/routes.ts**

```typescript
// app/routes.ts
import { type RouteConfig, route, index, layout } from "@react-router/dev/routes";

export default [
  route("login", "routes/login.tsx"),
  layout("routes/_auth.tsx", [
    layout("routes/_auth._dashboard.tsx", [
      index("routes/_auth._dashboard._index.tsx"),
      route(":bucket", "routes/_auth._dashboard.$bucket.tsx"),
      route(":bucket/*", "routes/_auth._dashboard.$bucket.$.tsx"),
    ]),
  ]),
  route("api/s3", "routes/api.s3.ts"),
  route("api/health", "routes/api.health.ts"),
] satisfies RouteConfig;
```

**Step 8: Create app/app.css**

```css
/* app/app.css */
@import "tailwindcss";
@import "tw-animate-css";

@custom-variant dark (&:is(.dark *));

@theme inline {
  --color-background: oklch(1 0 0);
  --color-foreground: oklch(0.145 0 0);
  --color-card: oklch(1 0 0);
  --color-card-foreground: oklch(0.145 0 0);
  --color-popover: oklch(1 0 0);
  --color-popover-foreground: oklch(0.145 0 0);
  --color-primary: oklch(0.205 0 0);
  --color-primary-foreground: oklch(0.985 0 0);
  --color-secondary: oklch(0.97 0 0);
  --color-secondary-foreground: oklch(0.205 0 0);
  --color-muted: oklch(0.97 0 0);
  --color-muted-foreground: oklch(0.556 0 0);
  --color-accent: oklch(0.97 0 0);
  --color-accent-foreground: oklch(0.205 0 0);
  --color-destructive: oklch(0.577 0.245 27.325);
  --color-border: oklch(0.922 0 0);
  --color-input: oklch(0.922 0 0);
  --color-ring: oklch(0.708 0 0);
  --color-sidebar: oklch(0.985 0 0);
  --color-sidebar-foreground: oklch(0.145 0 0);
  --color-sidebar-primary: oklch(0.205 0 0);
  --color-sidebar-primary-foreground: oklch(0.985 0 0);
  --color-sidebar-accent: oklch(0.97 0 0);
  --color-sidebar-accent-foreground: oklch(0.205 0 0);
  --color-sidebar-border: oklch(0.922 0 0);
  --color-sidebar-ring: oklch(0.708 0 0);
  --radius: 0.625rem;
}

.dark {
  --color-background: oklch(0.145 0 0);
  --color-foreground: oklch(0.985 0 0);
  --color-card: oklch(0.205 0 0);
  --color-card-foreground: oklch(0.985 0 0);
  --color-popover: oklch(0.205 0 0);
  --color-popover-foreground: oklch(0.985 0 0);
  --color-primary: oklch(0.985 0 0);
  --color-primary-foreground: oklch(0.205 0 0);
  --color-secondary: oklch(0.269 0 0);
  --color-secondary-foreground: oklch(0.985 0 0);
  --color-muted: oklch(0.269 0 0);
  --color-muted-foreground: oklch(0.708 0 0);
  --color-accent: oklch(0.269 0 0);
  --color-accent-foreground: oklch(0.985 0 0);
  --color-destructive: oklch(0.577 0.245 27.325);
  --color-border: oklch(0.269 0 0);
  --color-input: oklch(0.269 0 0);
  --color-ring: oklch(0.439 0 0);
  --color-sidebar: oklch(0.205 0 0);
  --color-sidebar-foreground: oklch(0.985 0 0);
  --color-sidebar-primary: oklch(0.488 0.243 264.376);
  --color-sidebar-primary-foreground: oklch(0.985 0 0);
  --color-sidebar-accent: oklch(0.269 0 0);
  --color-sidebar-accent-foreground: oklch(0.985 0 0);
  --color-sidebar-border: oklch(0.269 0 0);
  --color-sidebar-ring: oklch(0.439 0 0);
}
```

**Step 9: Create .env.example**

```bash
# Required — S3 Connection
S3_ENDPOINT=https://s3.amazonaws.com
S3_ACCESS_KEY_ID=your-access-key
S3_SECRET_ACCESS_KEY=your-secret-key
S3_REGION=us-east-1

# Optional — S3
S3_BUCKET=                    # Default bucket (skip bucket list)
S3_FORCE_PATH_STYLE=true      # Required for MinIO, R2, etc.

# Optional — Authentication
AUTH_USERNAME=admin
AUTH_PASSWORD=your-secure-password
SESSION_SECRET=               # Auto-generated if not set

# Optional — App
PORT=3000
```

**Step 10: Create .gitignore**

```
node_modules/
.react-router/
build/
.env
*.local
```

**Step 11: Update package.json scripts**

Add to package.json:
```json
{
  "type": "module",
  "scripts": {
    "dev": "react-router dev",
    "build": "react-router build",
    "start": "react-router-serve ./build/server/index.js"
  }
}
```

**Step 12: Initialize git and commit**

```bash
git init
git add -A
git commit -m "chore: scaffold react router 7 project with tailwind v4"
```

---

## Task 2: Utility Library — `lib/utils.ts`

**Files:**
- Create: `app/lib/utils.ts`

**Step 1: Create utils**

```typescript
// app/lib/utils.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "—";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return "—";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getFileName(key: string): string {
  const parts = key.replace(/\/$/, "").split("/");
  return parts[parts.length - 1] || key;
}

export function getFileExtension(key: string): string {
  return key.split(".").pop()?.toLowerCase() || "";
}

export function isPreviewable(key: string): false | "image" | "video" | "audio" | "pdf" | "text" {
  const ext = getFileExtension(key);
  const imageExts = ["jpg", "jpeg", "png", "gif", "svg", "webp", "ico", "bmp"];
  const videoExts = ["mp4", "webm", "ogg"];
  const audioExts = ["mp3", "wav", "ogg", "flac", "aac"];
  const textExts = ["txt", "md", "json", "xml", "yaml", "yml", "toml", "csv", "log",
    "js", "ts", "tsx", "jsx", "py", "go", "rs", "java", "cpp", "c", "h",
    "css", "html", "sql", "sh", "bash", "env", "conf", "ini", "cfg"];

  if (imageExts.includes(ext)) return "image";
  if (videoExts.includes(ext)) return "video";
  if (audioExts.includes(ext)) return "audio";
  if (ext === "pdf") return "pdf";
  if (textExts.includes(ext)) return "text";
  return false;
}
```

**Step 2: Commit**

```bash
git add app/lib/utils.ts
git commit -m "feat: add utility functions (cn, formatBytes, formatDate, file helpers)"
```

---

## Task 3: S3 Server Module

**Files:**
- Create: `app/lib/s3.server.ts`

**Step 1: Create S3 server module**

```typescript
// app/lib/s3.server.ts
import {
  S3Client,
  ListBucketsCommand,
  ListObjectsV2Command,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export interface S3ObjectItem {
  key: string;
  size: number;
  lastModified: string;
  isFolder: boolean;
  etag?: string;
}

export interface S3BucketItem {
  name: string;
  creationDate?: string;
}

function getEnvConfig() {
  const endpoint = process.env.S3_ENDPOINT;
  const accessKeyId = process.env.S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
  const region = process.env.S3_REGION || "us-east-1";
  const forcePathStyle = process.env.S3_FORCE_PATH_STYLE !== "false";
  const defaultBucket = process.env.S3_BUCKET || undefined;

  if (!endpoint || !accessKeyId || !secretAccessKey) {
    throw new Error("S3 environment variables not configured. Set S3_ENDPOINT, S3_ACCESS_KEY_ID, and S3_SECRET_ACCESS_KEY.");
  }

  return { endpoint, accessKeyId, secretAccessKey, region, forcePathStyle, defaultBucket };
}

let _client: S3Client | null = null;

export function getS3Client(): S3Client {
  if (_client) return _client;
  const config = getEnvConfig();
  _client = new S3Client({
    endpoint: config.endpoint,
    region: config.region,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
    forcePathStyle: config.forcePathStyle,
  });
  return _client;
}

export function getDefaultBucket(): string | undefined {
  return process.env.S3_BUCKET || undefined;
}

export async function listBuckets(): Promise<S3BucketItem[]> {
  const client = getS3Client();
  const response = await client.send(new ListBucketsCommand({}));
  return (
    response.Buckets?.map((bucket) => ({
      name: bucket.Name || "",
      creationDate: bucket.CreationDate?.toISOString(),
    })) || []
  );
}

export async function listObjects(
  bucket: string,
  prefix: string = "",
  continuationToken?: string
): Promise<{
  objects: S3ObjectItem[];
  prefixes: string[];
  isTruncated: boolean;
  nextContinuationToken?: string;
}> {
  const client = getS3Client();
  const response = await client.send(
    new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: prefix,
      Delimiter: "/",
      MaxKeys: 100,
      ContinuationToken: continuationToken,
    })
  );

  const objects: S3ObjectItem[] =
    response.Contents?.filter((obj) => obj.Key !== prefix).map((obj) => ({
      key: obj.Key || "",
      size: obj.Size || 0,
      lastModified: obj.LastModified?.toISOString() || "",
      isFolder: false,
      etag: obj.ETag,
    })) || [];

  const prefixes =
    response.CommonPrefixes?.map((p) => p.Prefix || "").filter(Boolean) || [];

  const folderItems: S3ObjectItem[] = prefixes.map((p) => ({
    key: p,
    size: 0,
    lastModified: "",
    isFolder: true,
  }));

  return {
    objects: [...folderItems, ...objects],
    prefixes,
    isTruncated: response.IsTruncated || false,
    nextContinuationToken: response.NextContinuationToken,
  };
}

export async function deleteObject(bucket: string, key: string): Promise<void> {
  const client = getS3Client();
  await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}

export async function deleteObjects(bucket: string, keys: string[]): Promise<void> {
  const client = getS3Client();
  await client.send(
    new DeleteObjectsCommand({
      Bucket: bucket,
      Delete: { Objects: keys.map((Key) => ({ Key })) },
    })
  );
}

export async function uploadObject(
  bucket: string,
  key: string,
  body: Buffer | Uint8Array,
  contentType?: string
): Promise<void> {
  const client = getS3Client();
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );
}

export async function getPresignedUrl(
  bucket: string,
  key: string,
  disposition: "attachment" | "inline" = "attachment"
): Promise<string> {
  const client = getS3Client();
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
    ResponseContentDisposition: disposition === "attachment"
      ? `attachment; filename="${key.split("/").pop()}"`
      : "inline",
  });
  return getSignedUrl(client, command, { expiresIn: 3600 });
}
```

**Step 2: Commit**

```bash
git add app/lib/s3.server.ts
git commit -m "feat: add S3 server module with all operations"
```

---

## Task 4: Auth Server Module

**Files:**
- Create: `app/lib/auth.server.ts`

**Step 1: Create auth module**

```typescript
// app/lib/auth.server.ts
import { createCookieSessionStorage, redirect } from "react-router";

const SESSION_SECRET = process.env.SESSION_SECRET || crypto.randomUUID();

const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: "s3explorer_session",
    httpOnly: true,
    maxAge: 60 * 60 * 24, // 24 hours
    path: "/",
    sameSite: "lax",
    secrets: [SESSION_SECRET],
    secure: process.env.NODE_ENV === "production",
  },
});

export function isAuthEnabled(): boolean {
  return !!(process.env.AUTH_USERNAME && process.env.AUTH_PASSWORD);
}

export async function getSession(request: Request) {
  return sessionStorage.getSession(request.headers.get("Cookie"));
}

export async function requireAuth(request: Request) {
  if (!isAuthEnabled()) return;

  const session = await getSession(request);
  if (!session.get("authenticated")) {
    throw redirect("/login");
  }
}

export async function login(username: string, password: string) {
  if (
    username === process.env.AUTH_USERNAME &&
    password === process.env.AUTH_PASSWORD
  ) {
    const session = await sessionStorage.getSession();
    session.set("authenticated", true);
    return sessionStorage.commitSession(session);
  }
  return null;
}

export async function logout(request: Request) {
  const session = await getSession(request);
  return sessionStorage.destroySession(session);
}

// Simple in-memory rate limiter
const attempts = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(ip: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const record = attempts.get(ip);

  if (!record || now > record.resetAt) {
    attempts.set(ip, { count: 1, resetAt: now + 60_000 });
    return { allowed: true };
  }

  if (record.count >= 5) {
    return { allowed: false, retryAfter: Math.ceil((record.resetAt - now) / 1000) };
  }

  record.count++;
  return { allowed: true };
}

export function getClientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}
```

**Step 2: Commit**

```bash
git add app/lib/auth.server.ts
git commit -m "feat: add stateless cookie auth with rate limiting"
```

---

## Task 5: shadcn/ui Components

**Files:**
- Create: `app/components/ui/button.tsx`
- Create: `app/components/ui/input.tsx`
- Create: `app/components/ui/label.tsx`
- Create: `app/components/ui/table.tsx`
- Create: `app/components/ui/skeleton.tsx`
- Create: `app/components/ui/badge.tsx`
- Create: `app/components/ui/dialog.tsx`
- Create: `app/components/ui/alert-dialog.tsx`
- Create: `app/components/ui/dropdown-menu.tsx`
- Create: `app/components/ui/breadcrumb.tsx`
- Create: `app/components/ui/scroll-area.tsx`
- Create: `app/components/ui/separator.tsx`
- Create: `app/components/ui/checkbox.tsx`
- Create: `app/components/ui/sheet.tsx`

**Step 1: Install shadcn/ui**

Initialize shadcn for the project and add all required components. Use the shadcn CLI:

```bash
npx shadcn@latest init
```

Select: New York style, zinc base color, CSS variables.

**Step 2: Add components**

```bash
npx shadcn@latest add button input label table skeleton badge dialog alert-dialog dropdown-menu breadcrumb scroll-area separator checkbox sheet
```

> **Note:** shadcn may need path adjustments for React Router (uses `~/components/ui` instead of `@/components/ui`). Update the generated `components.json` to use `~/` prefix for aliases. If shadcn doesn't work well with RR7, copy the components from `/tmp/s3-viewfy-ref/src/components/ui/` and update imports from `@/` to `~/`.

**Step 3: Commit**

```bash
git add app/components/ui/
git commit -m "feat: add shadcn/ui components"
```

---

## Task 6: Login Route

**Files:**
- Create: `app/routes/login.tsx`

**Step 1: Create login route**

```tsx
// app/routes/login.tsx
import { Form, redirect, useActionData, useNavigation, data } from "react-router";
import type { Route } from "./+types/login";
import { isAuthEnabled, login, logout, getSession, checkRateLimit, getClientIp } from "~/lib/auth.server";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Database, Loader2, Lock } from "lucide-react";

export async function loader({ request }: Route.LoaderArgs) {
  if (!isAuthEnabled()) throw redirect("/");
  const session = await getSession(request);
  if (session.get("authenticated")) throw redirect("/");
  return null;
}

export async function action({ request }: Route.ActionArgs) {
  // Handle logout
  const url = new URL(request.url);
  if (url.searchParams.has("logout")) {
    const cookie = await logout(request);
    return redirect("/login", { headers: { "Set-Cookie": cookie } });
  }

  // Handle login
  const ip = getClientIp(request);
  const rateCheck = checkRateLimit(ip);
  if (!rateCheck.allowed) {
    return data(
      { error: `Too many attempts. Try again in ${rateCheck.retryAfter}s.` },
      { status: 429 }
    );
  }

  const formData = await request.formData();
  const username = String(formData.get("username") || "");
  const password = String(formData.get("password") || "");

  if (!username || !password) {
    return data({ error: "Username and password are required." }, { status: 400 });
  }

  const cookie = await login(username, password);
  if (!cookie) {
    return data({ error: "Invalid username or password." }, { status: 401 });
  }

  return redirect("/", { headers: { "Set-Cookie": cookie } });
}

export default function LoginPage() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <div className="flex min-h-screen items-center justify-center relative overflow-hidden bg-gradient-to-br from-slate-100 via-gray-50 to-slate-100 dark:from-transparent dark:via-transparent dark:to-transparent">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-[radial-gradient(circle,rgba(6,182,212,0.1),transparent)] rounded-full blur-3xl" />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-[radial-gradient(circle,rgba(20,184,166,0.1),transparent)] rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-sm px-6">
        {/* Header */}
        <div className="text-center mb-8 space-y-4">
          <div className="relative mx-auto w-20 h-20">
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-cyan-500 to-teal-500 opacity-20 blur-xl animate-pulse" />
            <div className="relative h-20 w-20 rounded-3xl bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center shadow-2xl shadow-cyan-500/30">
              <Database className="h-9 w-9 text-white" />
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">S3 Explorer</h1>
            <p className="text-sm text-muted-foreground mt-1">Sign in to access your storage</p>
          </div>
        </div>

        {/* Login Form */}
        <Form
          method="post"
          className="space-y-4 bg-white/90 dark:bg-card/80 backdrop-blur-xl border border-border/50 rounded-2xl p-6 shadow-2xl shadow-black/5 dark:shadow-black/30"
        >
          <div className="space-y-1.5">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              name="username"
              placeholder="Enter username"
              className="h-11 bg-background/50 border-border/60 focus:border-cyan-500/50"
              autoComplete="username"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Enter password"
              className="h-11 bg-background/50 border-border/60 focus:border-cyan-500/50"
              autoComplete="current-password"
              required
            />
          </div>

          {actionData?.error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-sm text-destructive">
              {actionData.error}
            </div>
          )}

          <Button
            type="submit"
            className="w-full h-11 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white shadow-lg shadow-cyan-500/20"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                <Lock className="mr-2 h-4 w-4" />
                Sign In
              </>
            )}
          </Button>
        </Form>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add app/routes/login.tsx
git commit -m "feat: add login route with rate limiting and logout support"
```

---

## Task 7: Auth Layout Route

**Files:**
- Create: `app/routes/_auth.tsx`

**Step 1: Create auth layout**

```tsx
// app/routes/_auth.tsx
import { Outlet } from "react-router";
import type { Route } from "./+types/_auth";
import { requireAuth } from "~/lib/auth.server";

export async function loader({ request }: Route.LoaderArgs) {
  await requireAuth(request);
  return null;
}

export default function AuthLayout() {
  return <Outlet />;
}
```

**Step 2: Commit**

```bash
git add app/routes/_auth.tsx
git commit -m "feat: add auth guard layout route"
```

---

## Task 8: Dashboard Layout Route (Header + Sidebar)

**Files:**
- Create: `app/routes/_auth._dashboard.tsx`
- Create: `app/components/header.tsx`
- Create: `app/components/sidebar.tsx`
- Create: `app/components/theme-toggle.tsx`

**Step 1: Create theme-toggle component**

```tsx
// app/components/theme-toggle.tsx
import { Moon, Sun } from "lucide-react";
import { Button } from "~/components/ui/button";
import { useCallback, useEffect, useState } from "react";

export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  useEffect(() => {
    const match = document.cookie.match(/theme=(light|dark)/);
    setTheme(match ? (match[1] as "light" | "dark") : "dark");
  }, []);

  const toggle = useCallback(() => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.cookie = `theme=${next};path=/;max-age=31536000`;
    document.documentElement.classList.toggle("dark", next === "dark");
  }, [theme]);

  return (
    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggle}>
      {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}
```

**Step 2: Create header component**

```tsx
// app/components/header.tsx
import { Form } from "react-router";
import { Database, LogOut } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { ThemeToggle } from "~/components/theme-toggle";

interface HeaderProps {
  authEnabled: boolean;
  endpoint: string;
}

export function Header({ authEnabled, endpoint }: HeaderProps) {
  return (
    <header className="h-14 border-b border-border/40 bg-background/80 backdrop-blur-sm flex items-center justify-between px-6">
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center">
          <Database className="h-4 w-4 text-white" />
        </div>
        <span className="font-semibold text-lg">S3 Explorer</span>
        <Badge variant="secondary" className="text-xs font-normal">
          {endpoint}
        </Badge>
      </div>
      <div className="flex items-center gap-2">
        <ThemeToggle />
        {authEnabled && (
          <Form method="post" action="/login?logout">
            <Button variant="ghost" size="icon" className="h-8 w-8" type="submit">
              <LogOut className="h-4 w-4" />
            </Button>
          </Form>
        )}
      </div>
    </header>
  );
}
```

**Step 3: Create sidebar component**

```tsx
// app/components/sidebar.tsx
import { NavLink } from "react-router";
import { Folder } from "lucide-react";
import { ScrollArea } from "~/components/ui/scroll-area";
import { cn } from "~/lib/utils";
import type { S3BucketItem } from "~/lib/s3.server";

interface SidebarProps {
  buckets: S3BucketItem[];
}

export function Sidebar({ buckets }: SidebarProps) {
  return (
    <aside className="w-64 border-r border-border/40 bg-sidebar flex flex-col">
      <div className="px-4 py-3 border-b border-border/40 flex items-center justify-between">
        <span className="text-sm font-medium text-sidebar-foreground">Buckets</span>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-0.5">
          {buckets.map((bucket) => (
            <NavLink
              key={bucket.name}
              to={`/${bucket.name}`}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                )
              }
            >
              <Folder className="h-4 w-4 shrink-0 text-cyan-400" />
              <span className="truncate">{bucket.name}</span>
            </NavLink>
          ))}
        </div>
      </ScrollArea>
      <div className="px-4 py-2 border-t border-border/40">
        <p className="text-[11px] text-muted-foreground">{buckets.length} buckets</p>
      </div>
    </aside>
  );
}
```

**Step 4: Create dashboard layout route**

```tsx
// app/routes/_auth._dashboard.tsx
import { Outlet, useLoaderData } from "react-router";
import type { Route } from "./+types/_auth._dashboard";
import { listBuckets, getDefaultBucket } from "~/lib/s3.server";
import { isAuthEnabled } from "~/lib/auth.server";
import { Header } from "~/components/header";
import { Sidebar } from "~/components/sidebar";

export async function loader() {
  const defaultBucket = getDefaultBucket();
  const buckets = defaultBucket ? [] : await listBuckets();
  return {
    buckets,
    defaultBucket,
    authEnabled: isAuthEnabled(),
    endpoint: process.env.S3_ENDPOINT || "",
  };
}

export default function DashboardLayout() {
  const { buckets, defaultBucket, authEnabled, endpoint } = useLoaderData<typeof loader>();

  return (
    <div className="flex flex-col h-screen">
      <Header authEnabled={authEnabled} endpoint={endpoint} />
      <div className="flex flex-1 overflow-hidden">
        {!defaultBucket && <Sidebar buckets={buckets} />}
        <main className="flex-1 flex flex-col overflow-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
```

**Step 5: Commit**

```bash
git add app/routes/_auth._dashboard.tsx app/components/header.tsx app/components/sidebar.tsx app/components/theme-toggle.tsx
git commit -m "feat: add dashboard layout with header and sidebar"
```

---

## Task 9: Bucket List Index Route

**Files:**
- Create: `app/routes/_auth._dashboard._index.tsx`

**Step 1: Create index route**

```tsx
// app/routes/_auth._dashboard._index.tsx
import { redirect } from "react-router";
import { getDefaultBucket } from "~/lib/s3.server";
import { FolderOpen } from "lucide-react";

export async function loader() {
  const defaultBucket = getDefaultBucket();
  if (defaultBucket) {
    throw redirect(`/${defaultBucket}`);
  }
  return null;
}

export default function BucketIndex() {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="h-20 w-20 mx-auto rounded-2xl bg-gradient-to-br from-cyan-500/20 to-teal-500/20 flex items-center justify-center">
          <FolderOpen className="h-10 w-10 text-cyan-400/60" />
        </div>
        <div>
          <h3 className="text-lg font-medium text-foreground">Select a Bucket</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Choose a bucket from the sidebar to browse its contents
          </p>
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add app/routes/_auth._dashboard._index.tsx
git commit -m "feat: add bucket list index route"
```

---

## Task 10: File Icon Component

**Files:**
- Create: `app/components/file-icon.tsx`

**Step 1: Create file icon component**

```tsx
// app/components/file-icon.tsx
import {
  FileImage, FileVideo, FileAudio, FileArchive, FileCode,
  FileText, File, Folder,
} from "lucide-react";
import { getFileExtension } from "~/lib/utils";

const imageExts = ["jpg", "jpeg", "png", "gif", "svg", "webp", "ico", "bmp"];
const videoExts = ["mp4", "avi", "mov", "wmv", "mkv", "webm"];
const audioExts = ["mp3", "wav", "ogg", "flac", "aac"];
const archiveExts = ["zip", "tar", "gz", "rar", "7z", "bz2"];
const codeExts = ["js", "ts", "tsx", "jsx", "py", "go", "rs", "java", "cpp", "c", "h", "css", "html", "json", "xml", "yaml", "yml", "toml", "md"];

export function FileIcon({ name, isFolder }: { name: string; isFolder: boolean }) {
  if (isFolder) return <Folder className="h-4 w-4 text-cyan-400 shrink-0" />;

  const ext = getFileExtension(name);
  if (imageExts.includes(ext)) return <FileImage className="h-4 w-4 text-purple-400" />;
  if (videoExts.includes(ext)) return <FileVideo className="h-4 w-4 text-pink-400" />;
  if (audioExts.includes(ext)) return <FileAudio className="h-4 w-4 text-orange-400" />;
  if (archiveExts.includes(ext)) return <FileArchive className="h-4 w-4 text-yellow-400" />;
  if (codeExts.includes(ext)) return <FileCode className="h-4 w-4 text-emerald-400" />;
  if (ext === "pdf") return <FileText className="h-4 w-4 text-red-400" />;
  return <File className="h-4 w-4 text-muted-foreground" />;
}
```

**Step 2: Commit**

```bash
git add app/components/file-icon.tsx
git commit -m "feat: add file icon component"
```

---

## Task 11: File Browser Routes + Components

**Files:**
- Create: `app/routes/_auth._dashboard.$bucket.tsx`
- Create: `app/routes/_auth._dashboard.$bucket.$.tsx`
- Create: `app/components/file-browser.tsx`
- Create: `app/components/breadcrumb-nav.tsx`
- Create: `app/components/search-filter.tsx`

**Step 1: Create breadcrumb-nav component**

```tsx
// app/components/breadcrumb-nav.tsx
import { Link } from "react-router";
import { ChevronRight, Home } from "lucide-react";
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink,
  BreadcrumbList, BreadcrumbSeparator,
} from "~/components/ui/breadcrumb";
import React from "react";

interface BreadcrumbNavProps {
  bucket: string;
  prefix: string;
}

export function BreadcrumbNav({ bucket, prefix }: BreadcrumbNavProps) {
  const parts = prefix.split("/").filter(Boolean);

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link to={`/${bucket}`} className="flex items-center gap-1.5 hover:text-cyan-400 transition-colors">
              <Home className="h-3.5 w-3.5" />
              {bucket}
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        {parts.map((part, index) => {
          const pathPrefix = parts.slice(0, index + 1).join("/") + "/";
          return (
            <React.Fragment key={pathPrefix}>
              <BreadcrumbSeparator>
                <ChevronRight className="h-3.5 w-3.5" />
              </BreadcrumbSeparator>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to={`/${bucket}/${pathPrefix}`} className="hover:text-cyan-400 transition-colors">
                    {part}
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
            </React.Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
```

**Step 2: Create search-filter component**

```tsx
// app/components/search-filter.tsx
import { Search, X } from "lucide-react";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";

interface SearchFilterProps {
  value: string;
  onChange: (value: string) => void;
}

export function SearchFilter({ value, onChange }: SearchFilterProps) {
  return (
    <div className="relative">
      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
      <Input
        placeholder="Filter files..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 w-48 pl-8 pr-8 text-sm"
      />
      {value && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-0.5 top-1/2 -translate-y-1/2 h-7 w-7"
          onClick={() => onChange("")}
        >
          <X className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}
```

**Step 3: Create file-browser component**

This is the main component. It receives data from loaders and handles:
- File table with checkboxes for multi-select
- Search/filter (client-side)
- Upload (via fetcher to api.s3)
- Download/delete actions (via fetcher to api.s3)
- Pagination
- Drag & drop upload
- Selection toolbar for bulk actions

```tsx
// app/components/file-browser.tsx
import { useState, useRef, useMemo } from "react";
import { Link, useFetcher, useRevalidator } from "react-router";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "~/components/ui/table";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "~/components/ui/alert-dialog";
import {
  Download, Trash2, Upload, MoreVertical, RefreshCw,
  ChevronRight, ChevronLeft, FolderOpen, Loader2, Eye,
} from "lucide-react";
import { cn, formatBytes, formatDate, getFileName, isPreviewable } from "~/lib/utils";
import { FileIcon } from "~/components/file-icon";
import { BreadcrumbNav } from "~/components/breadcrumb-nav";
import { SearchFilter } from "~/components/search-filter";
import type { S3ObjectItem } from "~/lib/s3.server";
import { toast } from "sonner";

interface FileBrowserProps {
  bucket: string;
  prefix: string;
  objects: S3ObjectItem[];
  isTruncated: boolean;
  nextContinuationToken?: string;
  onPreview?: (key: string) => void;
}

const ITEMS_PER_PAGE = 50;

export function FileBrowser({
  bucket, prefix, objects, isTruncated, nextContinuationToken, onPreview,
}: FileBrowserProps) {
  const [filter, setFilter] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleteTarget, setDeleteTarget] = useState<string | string[] | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadFetcher = useFetcher();
  const deleteFetcher = useFetcher();
  const revalidator = useRevalidator();

  const uploading = uploadFetcher.state !== "idle";
  const deleting = deleteFetcher.state !== "idle";

  const filteredObjects = useMemo(() => {
    if (!filter) return objects;
    const lower = filter.toLowerCase();
    return objects.filter((obj) => getFileName(obj.key).toLowerCase().includes(lower));
  }, [objects, filter]);

  const paginatedObjects = useMemo(() => {
    return filteredObjects.slice(
      (currentPage - 1) * ITEMS_PER_PAGE,
      currentPage * ITEMS_PER_PAGE
    );
  }, [filteredObjects, currentPage]);

  const totalPages = Math.ceil(filteredObjects.length / ITEMS_PER_PAGE);
  const fileObjects = filteredObjects.filter((o) => !o.isFolder);
  const allFilesSelected = fileObjects.length > 0 && fileObjects.every((o) => selected.has(o.key));

  const toggleSelect = (key: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (allFilesSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(fileObjects.map((o) => o.key)));
    }
  };

  const handleUpload = async (files: FileList | null) => {
    if (!files) return;
    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.set("intent", "upload");
      formData.set("file", file);
      formData.set("bucket", bucket);
      formData.set("prefix", prefix);
      uploadFetcher.submit(formData, { method: "post", action: "/api/s3", encType: "multipart/form-data" });
    }
  };

  const handleDownload = async (key: string) => {
    try {
      const res = await fetch(`/api/s3?intent=download&bucket=${encodeURIComponent(bucket)}&key=${encodeURIComponent(key)}`);
      const data = await res.json();
      if (data.url) window.open(data.url, "_blank");
    } catch {
      toast.error("Download failed");
    }
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    const keys = Array.isArray(deleteTarget) ? deleteTarget : [deleteTarget];
    const formData = new FormData();
    formData.set("intent", "delete");
    formData.set("bucket", bucket);
    formData.set("keys", JSON.stringify(keys));
    deleteFetcher.submit(formData, { method: "post", action: "/api/s3" });
    setDeleteTarget(null);
    setSelected(new Set());
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleUpload(e.dataTransfer.files);
  };

  return (
    <div
      className="flex-1 flex flex-col min-w-0 relative"
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
    >
      {/* Toolbar */}
      <div className="px-6 py-3 border-b border-border/40 bg-background/50 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <BreadcrumbNav bucket={bucket} prefix={prefix} />
          <div className="flex items-center gap-2">
            <SearchFilter value={filter} onChange={setFilter} />
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => revalidator.revalidate()}>
              <RefreshCw className={cn("h-4 w-4", revalidator.state === "loading" && "animate-spin")} />
            </Button>
            <input ref={fileInputRef} type="file" className="hidden" multiple onChange={(e) => handleUpload(e.target.files)} />
            <Button
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="gap-1.5 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white shadow-lg shadow-cyan-500/20"
            >
              {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
              Upload
            </Button>
          </div>
        </div>

        {/* Selection toolbar */}
        {selected.size > 0 && (
          <div className="mt-2 flex items-center gap-3 bg-muted/50 rounded-lg px-3 py-2">
            <span className="text-sm text-muted-foreground">{selected.size} selected</span>
            <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-destructive" onClick={() => setDeleteTarget(Array.from(selected))}>
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </Button>
            <Button variant="ghost" size="sm" className="h-7 ml-auto" onClick={() => setSelected(new Set())}>
              Clear
            </Button>
          </div>
        )}
      </div>

      {/* Drag overlay */}
      {dragOver && (
        <div className="absolute inset-0 z-50 bg-cyan-500/10 backdrop-blur-sm border-2 border-dashed border-cyan-500/50 rounded-lg flex items-center justify-center">
          <div className="text-center space-y-2">
            <Upload className="h-12 w-12 mx-auto text-cyan-400" />
            <p className="text-lg font-medium text-cyan-400">Drop files to upload</p>
          </div>
        </div>
      )}

      {/* File Table */}
      <div className="flex-1 overflow-auto">
        {filteredObjects.length === 0 ? (
          <div className="flex-1 flex items-center justify-center p-12">
            <div className="text-center space-y-3">
              <div className="h-16 w-16 mx-auto rounded-2xl bg-muted/50 flex items-center justify-center">
                <FolderOpen className="h-8 w-8 text-muted-foreground/50" />
              </div>
              <p className="text-sm font-medium text-foreground">
                {filter ? "No matching files" : "This folder is empty"}
              </p>
              <p className="text-xs text-muted-foreground">
                {filter ? "Try a different search term" : "Upload files or drag and drop them here"}
              </p>
            </div>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-border/40 hover:bg-transparent">
                <TableHead className="w-10">
                  <Checkbox checked={allFilesSelected} onCheckedChange={toggleSelectAll} />
                </TableHead>
                <TableHead className="w-[45%] text-xs font-medium text-muted-foreground">Name</TableHead>
                <TableHead className="w-[15%] text-xs font-medium text-muted-foreground">Size</TableHead>
                <TableHead className="w-[25%] text-xs font-medium text-muted-foreground">Last Modified</TableHead>
                <TableHead className="w-[15%] text-xs font-medium text-muted-foreground text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedObjects.map((obj) => (
                <TableRow key={obj.key} className="border-border/20 hover:bg-muted/30 group transition-colors">
                  <TableCell>
                    {!obj.isFolder && (
                      <Checkbox
                        checked={selected.has(obj.key)}
                        onCheckedChange={() => toggleSelect(obj.key)}
                      />
                    )}
                  </TableCell>
                  <TableCell className="font-medium">
                    {obj.isFolder ? (
                      <Link
                        to={`/${bucket}/${obj.key}`}
                        className="flex items-center gap-3 hover:text-cyan-400 transition-colors"
                      >
                        <FileIcon name={obj.key} isFolder />
                        <span className="truncate">{getFileName(obj.key)}</span>
                      </Link>
                    ) : (
                      <div className="flex items-center gap-3">
                        <FileIcon name={obj.key} isFolder={false} />
                        <span className="truncate">{getFileName(obj.key)}</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {obj.isFolder ? "—" : formatBytes(obj.size)}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatDate(obj.lastModified)}
                  </TableCell>
                  <TableCell className="text-right">
                    {!obj.isFolder && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {isPreviewable(obj.key) && (
                            <DropdownMenuItem onClick={() => onPreview?.(obj.key)} className="gap-2">
                              <Eye className="h-4 w-4" />
                              Preview
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => handleDownload(obj.key)} className="gap-2">
                            <Download className="h-4 w-4" />
                            Download
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setDeleteTarget(obj.key)} className="gap-2 text-destructive focus:text-destructive">
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Footer */}
      {filteredObjects.length > 0 && (
        <div className="px-6 py-2 border-t border-border/40 bg-background/50 flex items-center justify-between">
          <p className="text-[11px] text-muted-foreground">
            {filteredObjects.filter((o) => o.isFolder).length} folders,{" "}
            {filteredObjects.filter((o) => !o.isFolder).length} files
          </p>
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" className="h-7 w-7" disabled={currentPage === 1} onClick={() => setCurrentPage((p) => p - 1)}>
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <span className="text-xs text-muted-foreground min-w-[80px] text-center">
                Page {currentPage} of {totalPages}
              </span>
              <Button variant="outline" size="icon" className="h-7 w-7" disabled={currentPage >= totalPages} onClick={() => setCurrentPage((p) => p + 1)}>
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {Array.isArray(deleteTarget) ? `Delete ${deleteTarget.length} objects` : "Delete Object"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {Array.isArray(deleteTarget)
                ? `Are you sure you want to delete ${deleteTarget.length} selected objects? This cannot be undone.`
                : <>Are you sure you want to delete <span className="font-semibold text-foreground">{deleteTarget ? getFileName(deleteTarget) : ""}</span>? This cannot be undone.</>
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-destructive text-white hover:bg-destructive/90">
              {deleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
```

**Step 4: Create bucket root route**

```tsx
// app/routes/_auth._dashboard.$bucket.tsx
import { useLoaderData } from "react-router";
import type { Route } from "./+types/_auth._dashboard.$bucket";
import { listObjects } from "~/lib/s3.server";
import { FileBrowser } from "~/components/file-browser";
import { useState } from "react";
import { FilePreview } from "~/components/file-preview";

export async function loader({ params }: Route.LoaderArgs) {
  const bucket = params.bucket!;
  const data = await listObjects(bucket);
  return { ...data, bucket };
}

export default function BucketRoot() {
  const { objects, isTruncated, nextContinuationToken, bucket } = useLoaderData<typeof loader>();
  const [previewKey, setPreviewKey] = useState<string | null>(null);

  return (
    <>
      <FileBrowser
        bucket={bucket}
        prefix=""
        objects={objects}
        isTruncated={isTruncated}
        nextContinuationToken={nextContinuationToken}
        onPreview={setPreviewKey}
      />
      {previewKey && (
        <FilePreview bucket={bucket} fileKey={previewKey} onClose={() => setPreviewKey(null)} />
      )}
    </>
  );
}
```

**Step 5: Create bucket splat route (nested folders)**

```tsx
// app/routes/_auth._dashboard.$bucket.$.tsx
import { useLoaderData } from "react-router";
import type { Route } from "./+types/_auth._dashboard.$bucket.$";
import { listObjects } from "~/lib/s3.server";
import { FileBrowser } from "~/components/file-browser";
import { useState } from "react";
import { FilePreview } from "~/components/file-preview";

export async function loader({ params }: Route.LoaderArgs) {
  const bucket = params.bucket!;
  const splat = params["*"] || "";
  const prefix = splat.endsWith("/") ? splat : splat + "/";
  const data = await listObjects(bucket, prefix);
  return { ...data, bucket, prefix };
}

export default function BucketSplat() {
  const { objects, isTruncated, nextContinuationToken, bucket, prefix } = useLoaderData<typeof loader>();
  const [previewKey, setPreviewKey] = useState<string | null>(null);

  return (
    <>
      <FileBrowser
        bucket={bucket}
        prefix={prefix}
        objects={objects}
        isTruncated={isTruncated}
        nextContinuationToken={nextContinuationToken}
        onPreview={setPreviewKey}
      />
      {previewKey && (
        <FilePreview bucket={bucket} fileKey={previewKey} onClose={() => setPreviewKey(null)} />
      )}
    </>
  );
}
```

**Step 6: Commit**

```bash
git add app/routes/_auth._dashboard.$bucket.tsx app/routes/_auth._dashboard.$bucket.$.tsx app/components/file-browser.tsx app/components/breadcrumb-nav.tsx app/components/search-filter.tsx
git commit -m "feat: add file browser with multi-select, search, and pagination"
```

---

## Task 12: File Preview Component

**Files:**
- Create: `app/components/file-preview.tsx`

**Step 1: Create file preview component**

```tsx
// app/components/file-preview.tsx
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { getFileName, isPreviewable } from "~/lib/utils";

interface FilePreviewProps {
  bucket: string;
  fileKey: string;
  onClose: () => void;
}

export function FilePreview({ bucket, fileKey, onClose }: FilePreviewProps) {
  const [url, setUrl] = useState<string | null>(null);
  const [textContent, setTextContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const type = isPreviewable(fileKey);
  const fileName = getFileName(fileKey);

  useEffect(() => {
    const fetchUrl = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/s3?intent=preview&bucket=${encodeURIComponent(bucket)}&key=${encodeURIComponent(fileKey)}`
        );
        const data = await res.json();
        if (data.url) {
          setUrl(data.url);
          if (type === "text") {
            const textRes = await fetch(data.url);
            const text = await textRes.text();
            setTextContent(text);
          }
        }
      } catch {
        // Preview failed silently
      } finally {
        setLoading(false);
      }
    };
    fetchUrl();
  }, [bucket, fileKey, type]);

  const handleDownload = () => {
    if (url) window.open(url, "_blank");
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-row items-center justify-between space-y-0">
          <DialogTitle className="truncate pr-4">{fileName}</DialogTitle>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleDownload}>
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        <div className="flex-1 overflow-auto min-h-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {type === "image" && url && (
                <img src={url} alt={fileName} className="max-w-full h-auto mx-auto rounded-lg" />
              )}
              {type === "video" && url && (
                <video src={url} controls className="max-w-full mx-auto rounded-lg" />
              )}
              {type === "audio" && url && (
                <div className="flex items-center justify-center py-12">
                  <audio src={url} controls className="w-full max-w-md" />
                </div>
              )}
              {type === "pdf" && url && (
                <iframe src={url} className="w-full h-[70vh] rounded-lg border" title={fileName} />
              )}
              {type === "text" && textContent !== null && (
                <pre className="bg-muted/50 rounded-lg p-4 text-sm overflow-auto max-h-[70vh] whitespace-pre-wrap break-words font-mono">
                  {textContent}
                </pre>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

**Step 2: Commit**

```bash
git add app/components/file-preview.tsx
git commit -m "feat: add file preview for images, video, audio, PDF, and text"
```

---

## Task 13: API Resource Route

**Files:**
- Create: `app/routes/api.s3.ts`
- Create: `app/routes/api.health.ts`

**Step 1: Create S3 API resource route**

```typescript
// app/routes/api.s3.ts
import type { Route } from "./+types/api.s3";
import { data } from "react-router";
import {
  getPresignedUrl, deleteObject, deleteObjects, uploadObject,
} from "~/lib/s3.server";
import { requireAuth } from "~/lib/auth.server";

export async function loader({ request }: Route.LoaderArgs) {
  await requireAuth(request);

  const url = new URL(request.url);
  const intent = url.searchParams.get("intent");
  const bucket = url.searchParams.get("bucket");
  const key = url.searchParams.get("key");

  if (!bucket || !key) {
    return data({ error: "Missing bucket or key" }, { status: 400 });
  }

  if (intent === "download") {
    const presignedUrl = await getPresignedUrl(bucket, key, "attachment");
    return { url: presignedUrl };
  }

  if (intent === "preview") {
    const presignedUrl = await getPresignedUrl(bucket, key, "inline");
    return { url: presignedUrl };
  }

  return data({ error: "Invalid intent" }, { status: 400 });
}

export async function action({ request }: Route.ActionArgs) {
  await requireAuth(request);

  const formData = await request.formData();
  const intent = formData.get("intent") as string;
  const bucket = formData.get("bucket") as string;

  if (!bucket) {
    return data({ error: "Missing bucket" }, { status: 400 });
  }

  if (intent === "upload") {
    const file = formData.get("file") as File;
    const prefix = (formData.get("prefix") as string) || "";
    if (!file) {
      return data({ error: "Missing file" }, { status: 400 });
    }
    const key = prefix + file.name;
    const buffer = Buffer.from(await file.arrayBuffer());
    await uploadObject(bucket, key, buffer, file.type);
    return { success: true, key };
  }

  if (intent === "delete") {
    const keysJson = formData.get("keys") as string;
    if (!keysJson) {
      return data({ error: "Missing keys" }, { status: 400 });
    }
    const keys: string[] = JSON.parse(keysJson);
    if (keys.length === 1) {
      await deleteObject(bucket, keys[0]);
    } else {
      await deleteObjects(bucket, keys);
    }
    return { success: true };
  }

  return data({ error: "Invalid intent" }, { status: 400 });
}
```

**Step 2: Create health check route**

```typescript
// app/routes/api.health.ts
export function loader() {
  return { status: "ok", timestamp: new Date().toISOString() };
}
```

**Step 3: Commit**

```bash
git add app/routes/api.s3.ts app/routes/api.health.ts
git commit -m "feat: add S3 API resource route and health check"
```

---

## Task 14: Docker + Railway Deployment

**Files:**
- Create: `Dockerfile`
- Create: `railway.toml`
- Create: `.dockerignore`

**Step 1: Create Dockerfile**

```dockerfile
# Stage 1: Install dependencies
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

# Stage 2: Build the application
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Stage 3: Production runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 appuser

COPY --from=builder --chown=appuser:nodejs /app/build ./build
COPY --from=builder --chown=appuser:nodejs /app/package.json ./
COPY --from=builder --chown=appuser:nodejs /app/node_modules ./node_modules

USER appuser

EXPOSE 3000

CMD ["npm", "run", "start"]
```

**Step 2: Create .dockerignore**

```
node_modules
.react-router
build
.env
.env.local
.git
docs
```

**Step 3: Create railway.toml**

```toml
[build]
builder = "dockerfile"

[deploy]
healthcheckPath = "/api/health"
healthcheckTimeout = 30
restartPolicyType = "on_failure"
restartPolicyMaxRetries = 5
```

**Step 4: Commit**

```bash
git add Dockerfile .dockerignore railway.toml
git commit -m "feat: add Docker and Railway deployment config"
```

---

## Task 15: Verify Build & Run

**Step 1: Run dev server and verify**

```bash
npm run dev
```

Expected: App starts on http://localhost:5173, shows login or bucket list depending on env vars.

**Step 2: Test build**

```bash
npm run build
```

Expected: Builds without errors to `build/` directory.

**Step 3: Fix any type errors or import issues**

React Router 7 generates types in `.react-router/types/`. Run `npx react-router typegen` if type files are missing.

**Step 4: Commit any fixes**

```bash
git add -A
git commit -m "fix: resolve build issues"
```

---

## Task 16: Final Polish — README

**Step 1: Create README.md**

Include:
- What the app does (1-2 sentences)
- Screenshot placeholder
- Environment variables table
- Local development instructions
- Railway deploy button (placeholder until template is published)
- Docker instructions

**Step 2: Final commit and push**

```bash
git add README.md
git commit -m "docs: add README with deployment instructions"
```

> **Note:** Confirm with user whether the remote should be `s3-explorer` (new repo) or the existing `s3-viewfy` repo before pushing.

---

## Dependency Graph

```
Task 1 (scaffold)
├── Task 2 (utils)
├── Task 3 (s3.server)
├── Task 4 (auth.server)
├── Task 5 (shadcn/ui)
│   ├── Task 6 (login route) ← Task 4
│   ├── Task 7 (auth layout) ← Task 4
│   ├── Task 8 (dashboard layout) ← Task 3
│   │   └── Task 9 (bucket index)
│   ├── Task 10 (file-icon) ← Task 2
│   ├── Task 11 (file browser routes) ← Tasks 3, 10
│   ├── Task 12 (file preview)
│   └── Task 13 (API route) ← Tasks 3, 4
└── Task 14 (Docker + Railway)

Task 15 (verify build) ← All above
Task 16 (README) ← Task 15
```

**Parallelizable groups:**
- Tasks 2, 3, 4, 5 can run in parallel (all depend only on Task 1)
- Tasks 6, 7, 8, 10 can run in parallel
- Tasks 9, 11, 12, 13 can run in parallel
- Task 14 can run anytime after Task 1
