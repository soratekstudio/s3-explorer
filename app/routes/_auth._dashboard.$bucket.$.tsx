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
