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
