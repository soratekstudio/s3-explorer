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
