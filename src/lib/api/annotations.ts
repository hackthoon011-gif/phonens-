import { supabase } from "@/integrations/supabase/client";
import type { Annotation, NewAnnotationInput } from "@/lib/types";
import { sanitizeComment, validateComment, validateRange } from "@/lib/validation";
import { ApiError, toApiError } from "./errors";

interface AnnotationRow {
  id: string;
  video_id: string;
  start_time: number;
  end_time: number;
  comment: string;
  created_at: string;
}

const SELECT = "id, video_id, start_time, end_time, comment, created_at";

function mapAnnotation(row: AnnotationRow): Annotation {
  return {
    id: row.id,
    videoId: row.video_id,
    startTime: Number(row.start_time),
    endTime: Number(row.end_time),
    comment: row.comment,
    createdAt: row.created_at,
  };
}

export const annotationsApi = {
  async listForVideo(videoId: string): Promise<Annotation[]> {
    const { data, error } = await supabase
      .from("annotations")
      .select(SELECT)
      .eq("video_id", videoId)
      .order("start_time", { ascending: true });

    if (error) throw toApiError("We couldn't load the annotations for this video.", error);
    return (data as AnnotationRow[]).map(mapAnnotation);
  },

  async create(input: NewAnnotationInput): Promise<Annotation> {
    // Server-side-of-the-boundary validation: never trust the form alone.
    const rangeError = validateRange({
      startTime: input.startTime,
      endTime: input.endTime,
      duration: null,
    });
    const comment = sanitizeComment(input.comment);
    const commentError = validateComment(comment);
    if (rangeError) throw new ApiError(rangeError);
    if (commentError) throw new ApiError(commentError);

    const { data, error } = await supabase
      .from("annotations")
      .insert({
        video_id: input.videoId,
        start_time: input.startTime,
        end_time: input.endTime,
        comment,
      })
      .select(SELECT)
      .single();

    if (error || !data) throw toApiError("We couldn't save that annotation. Please try again.", error);
    return mapAnnotation(data as AnnotationRow);
  },

  async update(
    annotationId: string,
    changes: Pick<Annotation, "startTime" | "endTime" | "comment">,
  ): Promise<Annotation> {
    const rangeError = validateRange({
      startTime: changes.startTime,
      endTime: changes.endTime,
      duration: null,
    });
    const comment = sanitizeComment(changes.comment);
    const commentError = validateComment(comment);
    if (rangeError) throw new ApiError(rangeError);
    if (commentError) throw new ApiError(commentError);

    const { data, error } = await supabase
      .from("annotations")
      .update({
        start_time: changes.startTime,
        end_time: changes.endTime,
        comment,
      })
      .eq("id", annotationId)
      .select(SELECT)
      .single();

    if (error || !data) throw toApiError("We couldn't update that annotation.", error);
    return mapAnnotation(data as AnnotationRow);
  },

  async remove(annotationId: string): Promise<void> {
    const { error } = await supabase.from("annotations").delete().eq("id", annotationId);
    if (error) throw toApiError("We couldn't delete that annotation. Please try again.", error);
  },
};
