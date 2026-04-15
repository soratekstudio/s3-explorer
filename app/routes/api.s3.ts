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
