import { CheckCircle2, FileVideo, Loader2, UploadCloud, XCircle } from "lucide-react";
import { useRef, useState, type DragEvent } from "react";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { formatFileSize } from "@/lib/format";
import type { UploadState } from "@/lib/types";
import { ACCEPTED_EXTENSIONS } from "@/lib/validation";
import { cn } from "@/lib/utils";

interface VideoUploaderProps {
  state: UploadState;
  onFile: (file: File) => void;
  onReset: () => void;
}

const PHASE_LABEL: Record<UploadState["phase"], string> = {
  idle: "",
  validating: "Checking file...",
  uploading: "Uploading video...",
  processing: "Processing video...",
  success: "Upload complete",
  error: "Upload failed",
};

export function VideoUploader({ state, onFile, onReset }: VideoUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const busy = state.phase === "validating" || state.phase === "uploading" || state.phase === "processing";

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    if (busy) return;
    const file = event.dataTransfer.files[0];
    if (file) onFile(file);
  };

  return (
    <div className="space-y-4">
      <div
        role="button"
        tabIndex={0}
        aria-disabled={busy}
        onClick={() => !busy && inputRef.current?.click()}
        onKeyDown={(event) => {
          if ((event.key === "Enter" || event.key === " ") && !busy) inputRef.current?.click();
        }}
        onDragOver={(event) => {
          event.preventDefault();
          if (!busy) setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={cn(
          "group flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border-strong bg-panel-gradient px-6 py-12 text-center transition-all outline-none focus-visible:ring-2 focus-visible:ring-ring",
          isDragging && "scale-[1.01] border-primary bg-primary/5 glow-primary",
          busy && "cursor-not-allowed opacity-70",
        )}
      >
        <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary transition-transform group-hover:scale-110">
          <UploadCloud className="size-6" />
        </div>
        <div>
          <p className="font-semibold text-foreground">Drop your video here</p>
          <p className="text-sm text-muted-foreground">or click to browse</p>
        </div>
        <p className="text-xs text-muted-foreground">MP4, WebM or MOV · up to 500 MB</p>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept={`video/mp4,video/webm,video/quicktime,${ACCEPTED_EXTENSIONS.join(",")}`}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) onFile(file);
            event.target.value = "";
          }}
        />
      </div>

      {state.phase !== "idle" && (
        <div className="animate-rise-in space-y-3 rounded-xl border border-border bg-surface p-4">
          <div className="flex items-center gap-3">
            <FileVideo className="size-5 shrink-0 text-primary" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{state.fileName}</p>
              <p className="text-xs text-muted-foreground">
                {state.fileSize ? formatFileSize(state.fileSize) : ""} · {PHASE_LABEL[state.phase]}
              </p>
            </div>
            {busy && <Loader2 className="size-4 animate-spin text-primary" />}
            {state.phase === "success" && <CheckCircle2 className="size-5 text-success" />}
            {state.phase === "error" && <XCircle className="size-5 text-destructive" />}
          </div>
          {state.phase !== "error" && (
            <div className="flex items-center gap-3">
              <Progress value={state.progress} className="h-1.5 bg-secondary [&>div]:bg-primary" />
              <span className="tabular w-10 text-right text-xs text-muted-foreground">{state.progress}%</span>
            </div>
          )}
          {state.phase === "error" && (
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-destructive">{state.message}</p>
              <Button size="sm" variant="secondary" onClick={onReset}>
                Try again
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
