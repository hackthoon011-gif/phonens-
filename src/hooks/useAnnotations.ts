import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";

import { annotationsApi } from "@/lib/api/annotations";
import type { Annotation, NewAnnotationInput } from "@/lib/types";

export const annotationKeys = {
  forVideo: (videoId: string) => ["annotations", videoId] as const,
};

export const annotationsQueryOptions = (videoId: string | undefined) =>
  queryOptions({
    queryKey: annotationKeys.forVideo(videoId ?? "none"),
    queryFn: () => annotationsApi.listForVideo(videoId!),
    enabled: Boolean(videoId),
  });

const byStartTime = (a: Annotation, b: Annotation) => a.startTime - b.startTime;

export function useCreateAnnotation(videoId: string | undefined) {
  const queryClient = useQueryClient();
  const key = annotationKeys.forVideo(videoId ?? "none");

  return useMutation({
    mutationFn: (input: NewAnnotationInput) => annotationsApi.create(input),
    // Optimistic insert; the server row replaces it on settle.
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<Annotation[]>(key) ?? [];
      const optimistic: Annotation = {
        id: `optimistic-${Date.now()}`,
        videoId: input.videoId,
        startTime: input.startTime,
        endTime: input.endTime,
        comment: input.comment.trim(),
        createdAt: new Date().toISOString(),
      };
      queryClient.setQueryData<Annotation[]>(key, [...previous, optimistic].sort(byStartTime));
      return { previous };
    },
    onError: (_error, _input, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: key }),
  });
}

export function useDeleteAnnotation(videoId: string | undefined) {
  const queryClient = useQueryClient();
  const key = annotationKeys.forVideo(videoId ?? "none");

  return useMutation({
    mutationFn: (annotationId: string) => annotationsApi.remove(annotationId),
    onMutate: async (annotationId) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<Annotation[]>(key) ?? [];
      queryClient.setQueryData<Annotation[]>(
        key,
        previous.filter((annotation) => annotation.id !== annotationId),
      );
      return { previous };
    },
    onError: (_error, _id, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: key }),
  });
}

export function useUpdateAnnotation(videoId: string | undefined) {
  const queryClient = useQueryClient();
  const key = annotationKeys.forVideo(videoId ?? "none");

  return useMutation({
    mutationFn: (input: {
      annotationId: string;
      changes: Pick<Annotation, "startTime" | "endTime" | "comment">;
    }) => annotationsApi.update(input.annotationId, input.changes),
    onSettled: () => queryClient.invalidateQueries({ queryKey: key }),
  });
}
