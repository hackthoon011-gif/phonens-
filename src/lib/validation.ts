/** Shared validation rules used by both the upload flow and the annotation form. */

export const ACCEPTED_VIDEO_TYPES = [
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/x-m4v",
  "video/ogg",
] as const;

export const ACCEPTED_EXTENSIONS = [".mp4", ".webm", ".mov", ".m4v", ".ogv"] as const;

export const MAX_UPLOAD_BYTES = 500 * 1024 * 1024; // 500 MB

export const MAX_COMMENT_LENGTH = 1000;

export function validateVideoFile(file: File): string | null {
  const name = file.name.toLowerCase();
  const hasAllowedExtension = ACCEPTED_EXTENSIONS.some((ext) => name.endsWith(ext));
  const hasAllowedType = (ACCEPTED_VIDEO_TYPES as readonly string[]).includes(file.type);

  if (!hasAllowedType && !hasAllowedExtension) {
    return "Unsupported format. Please use MP4, WebM or MOV.";
  }
  if (file.size === 0) {
    return "That file looks empty. Try a different video.";
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return "That video is larger than 500 MB. Please upload a smaller file.";
  }
  return null;
}

export interface RangeValidationInput {
  startTime: number | null;
  endTime: number | null;
  duration: number | null;
}

/** Returns a friendly error message for an invalid timestamp range, or null when valid. */
export function validateRange({ startTime, endTime, duration }: RangeValidationInput): string | null {
  if (startTime === null || endTime === null) {
    return "Enter a valid start and end time (MM:SS.ss).";
  }
  if (startTime < 0 || endTime < 0) {
    return "Timestamps cannot be negative.";
  }
  if (endTime <= startTime) {
    return "End time must be later than start time.";
  }
  if (duration !== null && duration > 0 && endTime > duration + 0.25) {
    return "End time cannot go past the end of the video.";
  }
  return null;
}

export function validateComment(comment: string): string | null {
  if (comment.trim().length === 0) {
    return "Add a comment describing this section.";
  }
  if (comment.length > MAX_COMMENT_LENGTH) {
    return `Keep the comment under ${MAX_COMMENT_LENGTH} characters.`;
  }
  return null;
}

/** Collapses whitespace and strips control characters before persisting user text. */
export function sanitizeComment(comment: string): string {
  return comment
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "")
    .replace(/[ \t]+/g, " ")
    .trim()
    .slice(0, MAX_COMMENT_LENGTH);
}
