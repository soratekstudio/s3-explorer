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
