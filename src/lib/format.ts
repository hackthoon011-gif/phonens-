/** Timestamp and file-size formatting helpers. */

/** Formats seconds as MM:SS, or HH:MM:SS for videos an hour or longer. */
export function formatTimecode(seconds: number, forceHours = false): string {
  const safe = Number.isFinite(seconds) && seconds > 0 ? seconds : 0;
  const total = Math.floor(safe);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  const pad = (value: number) => String(value).padStart(2, "0");

  if (hours > 0 || forceHours) {
    return `${pad(hours)}:${pad(minutes)}:${pad(secs)}`;
  }
  return `${pad(minutes)}:${pad(secs)}`;
}

/** Frame-friendly timecode for annotation boundaries, retaining hundredths of a second. */
export function formatAnnotationTime(seconds: number, forceHours = false): string {
  const safe = Number.isFinite(seconds) && seconds > 0 ? seconds : 0;
  const total = Math.round(safe * 100);
  const hours = Math.floor(total / 360000);
  const minutes = Math.floor((total % 360000) / 6000);
  const secs = Math.floor((total % 6000) / 100);
  const hundredths = total % 100;
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${hours > 0 || forceHours ? `${pad(hours)}:` : ""}${pad(minutes)}:${pad(secs)}.${pad(hundredths)}`;
}

/** Parses "MM:SS", "HH:MM:SS" or a raw seconds string into seconds. Returns null when invalid. */
export function parseTimecode(value: string): number | null {
  const trimmed = value.trim();
  if (trimmed === "") return null;
  if (!/^\d+(?::\d{1,2}){0,2}(?:\.\d{1,2})?$/.test(trimmed)) return null;

  const parts = trimmed.split(":");
  if (parts.length > 3) return null;
  if (parts.length > 1 && parts.slice(1).some((part) => Number(part) >= 60)) return null;

  let seconds = 0;
  for (const part of parts) {
    const numeric = Number(part);
    if (!Number.isFinite(numeric) || numeric < 0) return null;
    seconds = seconds * 60 + numeric;
  }
  return seconds;
}

export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 KB";
  const units = ["B", "KB", "MB", "GB"];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** exponent;
  return `${value.toFixed(value >= 10 || exponent === 0 ? 0 : 1)} ${units[exponent]}`;
}
