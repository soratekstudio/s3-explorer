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
