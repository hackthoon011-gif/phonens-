import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { videosApi } from "@/lib/api/videos";
import type { UploadState, Video } from "@/lib/types";
import { validateVideoFile } from "@/lib/validation";

export const videoKeys = {
  all: ["videos"] as const,
  detail: (id: string) => ["videos", id] as const,
  playback: (path: string) => ["videos", "playback", path] as const,
};

export const videosQueryOptions = queryOptions({
  queryKey: videoKeys.all,
  queryFn: () => videosApi.list(),
});

export const playbackUrlQueryOptions = (storagePath: string | undefined) =>
  queryOptions({
    queryKey: videoKeys.playback(storagePath ?? "none"),
    queryFn: () => {
      if (!storagePath) throw new Error("Video playback path is unavailable");
      return videosApi.getPlaybackUrl(storagePath);
    },
    enabled: Boolean(storagePath),
    staleTime: 1000 * 60 * 60,
  });

const IDLE: UploadState = { phase: "idle", progress: 0 };

export function useVideoUpload(onUploaded: (video: Video) => void) {
  const queryClient = useQueryClient();
  const [state, setState] = useState<UploadState>(IDLE);

  const mutation = useMutation({
    mutationFn: async (file: File) => {
      setState({ phase: "validating", progress: 0, fileName: file.name, fileSize: file.size });
      const validationError = validateVideoFile(file);
      if (validationError) throw new Error(validationError);

      setState({ phase: "uploading", progress: 0, fileName: file.name, fileSize: file.size });
      const video = await videosApi.upload(file, (progress) => {
        setState((previous) => ({
          ...previous,
          phase: progress >= 100 ? "processing" : "uploading",
          progress,
        }));
      });
      return video;
    },
    onSuccess: (video) => {
      setState((previous) => ({ ...previous, phase: "success", progress: 100 }));
      queryClient.invalidateQueries({ queryKey: videoKeys.all });
      onUploaded(video);
    },
    onError: (error: Error) => {
      setState((previous) => ({ ...previous, phase: "error", message: error.message }));
    },
  });

  return {
    state,
    isUploading: mutation.isPending,
    upload: mutation.mutate,
    reset: () => {
      setState(IDLE);
      mutation.reset();
    },
  };
}

export function useDeleteVideo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (video: Video) => videosApi.remove(video),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: videoKeys.all }),
  });
}

export function usePersistDuration() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ videoId, duration }: { videoId: string; duration: number }) =>
      videosApi.setDuration(videoId, duration),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: videoKeys.all }),
  });
}
