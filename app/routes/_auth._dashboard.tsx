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
