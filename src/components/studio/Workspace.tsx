import { useQuery } from "@tanstack/react-query";
import { CalendarDays, Film, HardDrive, Loader2, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { annotationsQueryOptions, useCreateAnnotation, useDeleteAnnotation, useUpdateAnnotation } from "@/hooks/useAnnotations";
import { useVideoPlayer } from "@/hooks/useVideoPlayer";
import { playbackUrlQueryOptions, useDeleteVideo, usePersistDuration } from "@/hooks/useVideos";
import { formatFileSize, formatTimecode } from "@/lib/format";
import type { Annotation, Video } from "@/lib/types";
import { cn } from "@/lib/utils";
import { AnnotationForm } from "./AnnotationForm";
import { AnnotationList } from "./AnnotationList";
import { ErrorState } from "./states";
import { VideoControls } from "./VideoControls";
import { VideoTimeline } from "./VideoTimeline";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface WorkspaceProps {
  video: Video;
  videos: Video[];
  onSelectVideo: (id: string | null) => void;
}

export function Workspace({ video, videos, onSelectVideo }: WorkspaceProps) {
  const { attach, state, controls } = useVideoPlayer();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editingAnnotation, setEditingAnnotation] = useState<Annotation | null>(null);
  const [selection, setSelection] = useState<{ start: number | null; end: number | null }>({
    start: null,
    end: null,
  });

  const playback = useQuery(playbackUrlQueryOptions(video.storagePath));
  const annotationsQuery = useQuery(annotationsQueryOptions(video.id));
  const createAnnotation = useCreateAnnotation(video.id);
  const deleteAnnotation = useDeleteAnnotation(video.id);
  const updateAnnotation = useUpdateAnnotation(video.id);
  const deleteVideo = useDeleteVideo();
  const persistDuration = usePersistDuration();
  const annotations = annotationsQuery.data ?? [];

  useEffect(() => {
    controls.reset();
    setActiveId(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [video.id]);

  useEffect(() => {
    if (state.duration > 0 && video.duration === null) {
      persistDuration.mutate({ videoId: video.id, duration: state.duration });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.duration, video.id, video.duration]);

  const playAnnotation = useCallback(
    (annotation: Annotation) => {
      setActiveId(annotation.id);
      controls.playSection(annotation.startTime, annotation.endTime);
    },
    [controls],
  );

  const handleSave = async (input: { startTime: number; endTime: number; comment: string }) => {
    // Start immediately from the save click so browser playback permissions are preserved.
    // The player will pause itself at the entered end timestamp.
    controls.playSection(input.startTime, input.endTime);
    try {
      const saved = await createAnnotation.mutateAsync({ videoId: video.id, ...input });
      setActiveId(saved.id);
      toast.success("Annotation saved");
      return true;
    } catch (error) {
      controls.pause();
      toast.error(error instanceof Error ? error.message : "Couldn't save annotation");
      return false;
    }
  };

  const handleDelete = (annotation: Annotation) => {
    if (activeId === annotation.id) setActiveId(null);
    deleteAnnotation.mutate(annotation.id, {
      onSuccess: () => toast.success("Annotation deleted"),
      onError: (error) => toast.error(error.message),
    });
  };

  const handleUpdate = async (input: { startTime: number; endTime: number; comment: string }) => {
    if (!editingAnnotation) return false;
    try {
      const saved = await updateAnnotation.mutateAsync({
        annotationId: editingAnnotation.id,
        changes: input,
      });
      setActiveId(saved.id);
      setEditingAnnotation(null);
      toast.success("Annotation updated");
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't update annotation");
      return false;
    }
  };

  const handleDeleteVideo = async () => {
    const replacement = videos.find((item) => item.id !== video.id);
    try {
      await deleteVideo.mutateAsync(video);
      setDeleteOpen(false);
      onSelectVideo(replacement?.id ?? null);
      toast.success("Video deleted");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't delete video");
    }
  };

  return (
    <div className="animate-rise-in mx-auto grid min-h-[calc(100vh-3.5rem)] max-w-[1600px] border-x border-border lg:grid-cols-[240px_minmax(0,1fr)_360px]">
      <aside className="order-2 min-w-0 border-border bg-surface/40 lg:order-1 lg:border-r">
        <div className="flex h-12 items-center justify-between border-b border-border px-4">
          <h2 className="font-mono text-[10px] font-semibold uppercase text-muted-foreground">Video library</h2>
          <span className="tabular font-mono text-[10px] text-primary">{String(videos.length).padStart(2, "0")}</span>
        </div>
        <div className="flex gap-2 overflow-x-auto p-2 lg:block lg:space-y-2 lg:overflow-y-auto">
          {videos.map((item, index) => (
            <Button
              key={item.id}
              variant="ghost"
              onClick={() => onSelectVideo(item.id)}
              className={cn(
                "group relative h-auto min-w-52 justify-start overflow-hidden rounded-sm border border-transparent px-3 py-3 text-left lg:w-full lg:min-w-0",
                item.id === video.id
                  ? "border-primary/50 bg-primary/5 text-foreground"
                  : "text-muted-foreground hover:border-border-strong hover:bg-secondary/60",
              )}
            >
              <span className="mr-1 flex size-8 shrink-0 items-center justify-center border border-border bg-background font-mono text-[10px] text-muted-foreground">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-medium">{item.originalFilename}</span>
                <span className="mt-1 block font-mono text-[9px] text-muted-foreground">
                  {item.duration ? formatTimecode(item.duration) : "PROCESSING"} · {formatFileSize(item.fileSize)}
                </span>
              </span>
              {item.id === video.id && <span className="absolute inset-y-0 left-0 w-0.5 bg-primary" />}
            </Button>
          ))}
        </div>
      </aside>

      <section className="order-1 min-w-0 bg-background lg:order-2">
        <div className="stage-grid flex min-h-[300px] items-center p-3 sm:p-5 lg:min-h-[calc(100vh-16rem)] lg:p-8">
          <div className="relative mx-auto aspect-video w-full overflow-hidden rounded-sm border border-border-strong bg-background shadow-[var(--shadow-panel)]">
            {playback.data ? (
              <video
                key={playback.data}
                ref={attach}
                src={playback.data}
                className="size-full object-contain"
                playsInline
                preload="metadata"
                onClick={controls.togglePlay}
              />
            ) : playback.isError ? (
              <div className="flex size-full items-center justify-center p-6">
                <ErrorState message={playback.error.message} onRetry={() => void playback.refetch()} />
              </div>
            ) : (
              <div className="flex size-full items-center justify-center gap-2 font-mono text-xs text-muted-foreground">
                <Loader2 className="size-4 animate-spin text-primary" /> Loading video...
              </div>
            )}
            <div className="pointer-events-none absolute left-3 top-3 space-y-1 font-mono text-[9px] text-muted-foreground">
              <p>ASSET / {video.id.slice(0, 8).toUpperCase()}</p>
              <p>STATE / {state.isReady ? "READY" : "BUFFERING"}</p>
            </div>
            <div className="scanline pointer-events-none absolute inset-x-0 top-0 h-px bg-primary/40" />
          </div>
        </div>
        <div className="border-t border-border bg-surface/35 p-4">
          <div className="space-y-4">
            <VideoControls state={state} controls={controls} />
            <VideoTimeline
              currentTime={state.currentTime}
              duration={state.duration}
              annotations={annotations}
              activeId={activeId}
              selection={selection}
              onSeek={controls.seek}
              onSelectAnnotation={playAnnotation}
            />
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-border pt-3 font-mono text-[10px] text-muted-foreground">
            <span className="truncate font-medium text-foreground">{video.originalFilename}</span>
            <span>{formatFileSize(video.fileSize)}</span>
            {state.duration > 0 && <span className="tabular">{formatTimecode(state.duration)}</span>}
          </div>
        </div>
      </section>

      <aside className="order-3 min-w-0 border-l border-border bg-surface/40">
        <div className="flex h-12 items-center border-b border-border px-4">
          <h2 className="font-mono text-[10px] font-semibold uppercase text-muted-foreground">Inspector</h2>
        </div>
        <div className="border-b border-border p-4">
          <p className="mb-3 font-mono text-[9px] uppercase text-muted-foreground">File metadata</p>
          <div className="space-y-2 text-xs">
            <div className="flex items-start gap-2"><Film className="mt-0.5 size-3.5 text-primary" /><span className="min-w-0 break-all text-foreground">{video.originalFilename}</span></div>
            <div className="flex items-center gap-2 text-muted-foreground"><HardDrive className="size-3.5" />{formatFileSize(video.fileSize)}</div>
            <div className="flex items-center gap-2 text-muted-foreground"><CalendarDays className="size-3.5" />{new Date(video.createdAt).toLocaleDateString()}</div>
          </div>
        </div>
        <div className="space-y-4 border-b border-border p-4">
          <h2 className="font-display text-sm font-semibold uppercase">New annotation</h2>
          <AnnotationForm
            key={video.id}
            currentTime={state.currentTime}
            duration={state.duration}
            hasVideo={state.isReady}
            isSaving={createAnnotation.isPending}
            onRangeChange={setSelection}
            onPreviewRange={controls.playSection}
            onSave={handleSave}
          />
        </div>
        <div className="space-y-4 border-b border-border p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Annotations</h2>
            <span className="tabular rounded-md bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
              {annotations.length}
            </span>
          </div>
          <div className="max-h-[34vh] overflow-y-auto pr-1">
            <AnnotationList
              annotations={annotations}
              isLoading={annotationsQuery.isLoading}
              error={annotationsQuery.error?.message ?? null}
              activeId={activeId}
              onRetry={() => void annotationsQuery.refetch()}
              onPlay={playAnnotation}
              onEdit={setEditingAnnotation}
              onDelete={handleDelete}
            />
          </div>
        </div>
        <div className="p-4">
          <Button
            variant="outline"
            className="h-auto w-full justify-between border-destructive/40 bg-destructive/5 px-3 py-3 text-destructive hover:bg-destructive/15 hover:text-destructive"
            onClick={() => setDeleteOpen(true)}
          >
            <span className="text-left">
              <span className="block text-xs font-semibold uppercase">Delete video</span>
              <span className="mt-0.5 block text-[9px] font-normal text-muted-foreground">Permanently remove this asset</span>
            </span>
            <Trash2 className="size-4" />
          </Button>
        </div>
      </aside>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="border-border-strong bg-popover sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete this video?</DialogTitle>
            <DialogDescription>
              “{video.originalFilename}” and all of its annotations will be permanently removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setDeleteOpen(false)} disabled={deleteVideo.isPending}>Cancel</Button>
            <Button variant="destructive" onClick={() => void handleDeleteVideo()} disabled={deleteVideo.isPending}>
              {deleteVideo.isPending ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
              {deleteVideo.isPending ? "Deleting..." : "Delete video"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={editingAnnotation !== null} onOpenChange={(open) => { if (!open) setEditingAnnotation(null); }}>
        <DialogContent className="border-border-strong bg-popover sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit annotation</DialogTitle>
            <DialogDescription>Update the timestamps or comment for this video section.</DialogDescription>
          </DialogHeader>
          {editingAnnotation && (
            <AnnotationForm
              key={editingAnnotation.id}
              currentTime={state.currentTime}
              duration={state.duration}
              hasVideo={state.isReady}
              isSaving={updateAnnotation.isPending}
              initialValues={{
                startTime: editingAnnotation.startTime,
                endTime: editingAnnotation.endTime,
                comment: editingAnnotation.comment,
              }}
              submitLabel="Save changes"
              onCancel={() => setEditingAnnotation(null)}
              onRangeChange={setSelection}
              onPreviewRange={controls.playSection}
              onSave={handleUpdate}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
