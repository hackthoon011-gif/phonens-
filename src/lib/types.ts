/** Domain types shared across the studio. */

export interface Video {
  id: string;
  filename: string;
  originalFilename: string;
  /** Storage object path inside the private `videos` bucket. */
  storagePath: string;
  fileSize: number;
  mimeType: string;
  /** Duration in seconds; null until the player reports it. */
  duration: number | null;
  createdAt: string;
}

export interface Annotation {
  id: string;
  videoId: string;
  startTime: number;
  endTime: number;
  comment: string;
  createdAt: string;
}

export interface NewAnnotationInput {
  videoId: string;
  startTime: number;
  endTime: number;
  comment: string;
}

export type UploadPhase = "idle" | "validating" | "uploading" | "processing" | "success" | "error";

export interface UploadState {
  phase: UploadPhase;
  progress: number;
  fileName?: string;
  fileSize?: number;
  message?: string;
}
