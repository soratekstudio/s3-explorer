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
