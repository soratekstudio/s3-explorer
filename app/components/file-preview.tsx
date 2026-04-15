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
                <pre className="bg-muted/50 text-foreground rounded-lg p-4 text-sm overflow-auto max-h-[70vh] whitespace-pre-wrap break-words font-mono">
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
