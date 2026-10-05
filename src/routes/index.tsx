import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Upload } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { DashboardHeader } from "@/components/studio/DashboardHeader";
import { EmptyState, ErrorState, LoadingState } from "@/components/studio/states";
import { HoverTileField } from "@/components/studio/HoverTileField";
import { VideoUploader } from "@/components/studio/VideoUploader";
import { Workspace } from "@/components/studio/Workspace";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useVideoUpload, videosQueryOptions } from "@/hooks/useVideos";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Video Annotation Studio — Review every moment" },
      {
        name: "description",
        content: "Upload, review, annotate, and collaborate on every moment of your video.",
      },
      { property: "og:title", content: "Video Annotation Studio" },
      {
        property: "og:description",
        content: "Upload, review, annotate, and collaborate on every moment of your video.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: StudioPage,
});

function StudioPage() {
  const videosQuery = useQuery(videosQueryOptions);
  const videos = videosQuery.data ?? [];
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [entered, setEntered] = useState(false);

  const uploader = useVideoUpload((video) => {
    toast.success("Video uploaded");
    setSelectedId(video.id);
    setTimeout(() => {
      setUploadOpen(false);
      uploader.reset();
      setEntered(true);
    }, 700);
  });

  useEffect(() => {
    if (!selectedId && videos[0]) setSelectedId(videos[0].id);
  }, [videos, selectedId]);

  const selected = videos.find((video) => video.id === selectedId) ?? videos[0];
  const showWorkspace = Boolean(selected) && entered;

  const openUpload = () => {
    setUploadOpen(true);
  };

  const uploadDialog = (
    <Dialog
      open={uploadOpen}
      onOpenChange={(open) => {
        if (!uploader.isUploading) {
          setUploadOpen(open);
          if (!open) uploader.reset();
        }
      }}
    >
      <DialogContent className="border-border-strong bg-popover sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Upload a video</DialogTitle>
        </DialogHeader>
        <VideoUploader state={uploader.state} onFile={uploader.upload} onReset={uploader.reset} />
      </DialogContent>
    </Dialog>
  );

  if (showWorkspace && selected) {
    return (
      <div className="min-h-screen">
        <DashboardHeader
          onUploadClick={() => setUploadOpen(true)}
          videoCount={videos.length}
        />
        <Workspace video={selected} videos={videos} onSelectVideo={setSelectedId} />
        {uploadDialog}
      </div>
    );
  }

  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden bg-background">
      <HoverTileField tile={80} className="z-0" />
      <div className="grid-backdrop pointer-events-none absolute inset-0 opacity-70 [mask-image:linear-gradient(to_bottom,black_30%,transparent_85%)]" />
      <div className="relative z-10 mx-auto flex w-full max-w-[1440px] flex-1 flex-col justify-center border-x border-border px-6 py-16 sm:px-10 lg:px-16">
        <span className="animate-rise-in mb-6 flex items-center gap-3 font-mono text-[10px] font-semibold uppercase text-muted-foreground">
          <span className="size-2 animate-pulse bg-signal" /> Secure video review <span className="text-signal">workspace</span>
        </span>
        <h1 className="animate-rise-in max-w-5xl font-display text-5xl font-semibold leading-[1.15] sm:text-7xl sm:leading-[1.1] lg:text-8xl lg:leading-[1.05]">
          Every frame.
          <br />
          <span className="text-primary mt-2 inline-block sm:mt-3">Precisely reviewed.</span>
        </h1>
        <p className="animate-rise-in mt-7 max-w-xl text-base text-muted-foreground sm:text-lg">
          Upload, review, annotate, and collaborate on <span className="text-signal">every moment</span> of your video.
        </p>
        <div className="animate-rise-in mt-10 flex flex-wrap gap-3">
          <Button size="lg" onClick={openUpload} className="h-12 px-6 text-sm uppercase">
            <Upload className="mr-2 size-4" /> Upload Video
          </Button>
          {videos.length > 0 && (
            <Button
              size="lg"
              variant="secondary"
              className="h-12 border border-border-strong px-6 text-sm uppercase"
              onClick={() => setEntered(true)}
            >
              Open workspace ({videos.length})
            </Button>
          )}
        </div>

        <div className="mt-14 w-full max-w-md text-left">
          {videosQuery.isLoading ? (
            <LoadingState label="Loading videos..." rows={1} />
          ) : videosQuery.isError ? (
            <ErrorState message={videosQuery.error.message} onRetry={() => void videosQuery.refetch()} />
          ) : videos.length === 0 && !uploadOpen ? (
            <EmptyState
              title="No video uploaded yet"
              description="Upload a video to start creating annotations."
              action={
                <Button size="sm" onClick={openUpload}>
                  Upload Video
                </Button>
              }
            />
          ) : null}
        </div>
      </div>
      {uploadDialog}
    </main>
  );
}
