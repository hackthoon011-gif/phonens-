import { supabase } from "@/integrations/supabase/client";
import type { Video } from "@/lib/types";
import { toApiError } from "./errors";
import { FALLBACK_SUPABASE_PUBLISHABLE_KEY, FALLBACK_SUPABASE_URL } from "@/lib/supabase-config";

const BUCKET = "videos";
const SIGNED_URL_TTL_SECONDS = 60 * 60 * 6;

interface VideoRow {
  id: string;
  filename: string;
  original_filename: string;
  video_url: string;
  file_size: number;
  mime_type: string;
  duration: number | null;
  created_at: string;
}

function mapVideo(row: VideoRow): Video {
  return {
    id: row.id,
    filename: row.filename,
    originalFilename: row.original_filename,
    storagePath: row.video_url,
    fileSize: Number(row.file_size),
    mimeType: row.mime_type,
    duration: row.duration,
    createdAt: row.created_at,
  };
}

function buildStoragePath(file: File): string {
  const extensionPart = file.name.includes(".") ? file.name.split(".").pop() : undefined;
  const extension = extensionPart?.toLowerCase() ?? "mp4";
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
  return `${id}.${extension.replace(/[^a-z0-9]/g, "")}`;
}

/** Uploads the file to storage, reporting real byte progress via XHR. */
function uploadToStorage(
  file: File,
  path: string,
  onProgress: (percent: number) => void,
): Promise<void> {
  const baseUrl = import.meta.env["VITE_SUPABASE_URL"] || FALLBACK_SUPABASE_URL;
  const apiKey = import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"] || FALLBACK_SUPABASE_PUBLISHABLE_KEY;

  if (!baseUrl || !apiKey) {
    return Promise.reject(new Error("Storage is not configured"));
  }

  // The dedicated storage hostname skips an extra proxy hop and is much faster for large files.
  const directUrl = baseUrl.replace(/^https:\/\/([a-z0-9]+)\.supabase\.co/i, "https://$1.storage.supabase.co");

  const send = (host: string) =>
    new Promise<void>((resolve, reject) => {
      const request = new XMLHttpRequest();
      request.open("POST", `${host}/storage/v1/object/${BUCKET}/${path}`);
      request.setRequestHeader("apikey", apiKey);
      request.setRequestHeader("x-upsert", "true");
      request.setRequestHeader("cache-control", "max-age=3600");
      if (file.type) request.setRequestHeader("content-type", file.type);

      request.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          onProgress(Math.round((event.loaded / event.total) * 100));
        }
      };
      request.onerror = () => reject(new Error("Network error during upload"));
      request.onabort = () => reject(new Error("Upload cancelled"));
      request.onload = () => {
        if (request.status >= 200 && request.status < 300) {
          onProgress(100);
          resolve();
        } else {
          reject(new Error(`Upload failed with status ${request.status}`));
        }
      };
      request.send(file);
    });

  if (directUrl === baseUrl) return send(baseUrl);
  return send(directUrl).catch(() => {
    onProgress(0);
    return send(baseUrl);
  });
}

export const videosApi = {
  async list(): Promise<Video[]> {
    const { data, error } = await supabase
      .from("videos")
      .select("id, filename, original_filename, video_url, file_size, mime_type, duration, created_at")
      .order("created_at", { ascending: false });

    if (error) throw toApiError("We couldn't load your videos. Please try again.", error);
    return (data as VideoRow[]).map(mapVideo);
  },

  async get(videoId: string): Promise<Video | null> {
    const { data, error } = await supabase
      .from("videos")
      .select("id, filename, original_filename, video_url, file_size, mime_type, duration, created_at")
      .eq("id", videoId)
      .maybeSingle();

    if (error) throw toApiError("We couldn't load that video. Please try again.", error);
    return data ? mapVideo(data as VideoRow) : null;
  },

  /** Creates a short-lived playback URL for a private storage object. */
  async getPlaybackUrl(storagePath: string): Promise<string> {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(storagePath, SIGNED_URL_TTL_SECONDS);

    if (error || !data?.signedUrl) {
      throw toApiError("We couldn't start playback for this video.", error);
    }
    return data.signedUrl;
  },

  async upload(file: File, onProgress: (percent: number) => void): Promise<Video> {
    const path = buildStoragePath(file);

    try {
      await uploadToStorage(file, path, onProgress);
    } catch (cause) {
      throw toApiError("The upload didn't finish. Please try again.", cause);
    }

    const { data, error } = await supabase
      .from("videos")
      .insert({
        filename: path,
        original_filename: file.name,
        video_url: path,
        file_size: file.size,
        mime_type: file.type || "video/mp4",
      })
      .select("id, filename, original_filename, video_url, file_size, mime_type, duration, created_at")
      .single();

    if (error || !data) {
      await supabase.storage.from(BUCKET).remove([path]);
      throw toApiError("We saved the file but couldn't register the video. Please try again.", error);
    }
    return mapVideo(data as VideoRow);
  },

  /** Stores the duration reported by the player once metadata loads. */
  async setDuration(videoId: string, duration: number): Promise<void> {
    const { error } = await supabase
      .from("videos")
      .update({ duration })
      .eq("id", videoId);
    if (error) console.warn("[api] could not persist video duration", error);
  },

  async remove(video: Video): Promise<void> {
    const { error } = await supabase.from("videos").delete().eq("id", video.id);
    if (error) throw toApiError("We couldn't delete that video. Please try again.", error);
    await supabase.storage.from(BUCKET).remove([video.storagePath]);
  },
};
