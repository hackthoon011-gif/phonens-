import { Clock3, Loader2, Play, Save } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { formatAnnotationTime, parseTimecode } from "@/lib/format";
import { MAX_COMMENT_LENGTH, validateComment, validateRange } from "@/lib/validation";

interface AnnotationFormProps {
  currentTime: number;
  duration: number;
  hasVideo: boolean;
  isSaving: boolean;
  initialValues?: { startTime: number; endTime: number; comment: string };
  submitLabel?: string;
  onCancel?: () => void;
  onRangeChange: (range: { start: number | null; end: number | null }) => void;
  onPreviewRange: (start: number, end: number) => void;
  onSave: (input: { startTime: number; endTime: number; comment: string }) => Promise<boolean>;
}

/** TimestampSelector + comment input. */
export function AnnotationForm({
  currentTime,
  duration,
  hasVideo,
  isSaving,
  initialValues,
  submitLabel = "Save Annotation",
  onCancel,
  onRangeChange,
  onPreviewRange,
  onSave,
}: AnnotationFormProps) {
  const long = duration >= 3600;
  const [startText, setStartText] = useState(() => formatAnnotationTime(initialValues?.startTime ?? 0, long));
  const [endText, setEndText] = useState(() => formatAnnotationTime(initialValues?.endTime ?? 0, long));
  const [comment, setComment] = useState(initialValues?.comment ?? "");
  const [touched, setTouched] = useState(false);

  const start = parseTimecode(startText);
  const end = parseTimecode(endText);
  const rangeError = validateRange({ startTime: start, endTime: end, duration: duration || null });
  const commentError = validateComment(comment);
  const canSave = hasVideo && !rangeError && !commentError && !isSaving;
  const canPreview = hasVideo && !rangeError;

  useEffect(() => onRangeChange({ start, end }), [start, end, onRangeChange]);

  const previewRange = () => {
    if (canPreview && start !== null && end !== null) onPreviewRange(start, end);
  };

  const submit = async () => {
    setTouched(true);
    if (!canSave || start === null || end === null) return;
    const ok = await onSave({ startTime: start, endTime: end, comment });
    if (ok) {
      setComment("");
      setTouched(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {(
          [
            ["Start Time", startText, setStartText, "Capture current"],
            ["End Time", endText, setEndText, "Capture current"],
          ] as const
        ).map(([label, value, setter, action]) => (
          <div key={label} className="space-y-1.5">
            <label
              htmlFor={label === "Start Time" ? "annotation-start" : "annotation-end"}
              className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
            >
              {label}
            </label>
            <Input
              id={label === "Start Time" ? "annotation-start" : "annotation-end"}
              value={value}
              onChange={(event) => setter(event.target.value)}
              className="tabular border-border-strong bg-background font-mono text-primary"
              inputMode="numeric"
              placeholder="00:00.00"
              onBlur={previewRange}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  previewRange();
                }
              }}
            />
            <Button
              variant="secondary"
              size="sm"
              className="w-full border border-border"
              disabled={!hasVideo}
              title={`Use the player position as the ${label.toLowerCase()}`}
              onClick={() => setter(formatAnnotationTime(currentTime, long))}
            >
              <Clock3 />
              {action}
            </Button>
          </div>
        ))}
      </div>

      <div className="space-y-1.5">
        <Textarea
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          placeholder="What should be noted about this section?"
          maxLength={MAX_COMMENT_LENGTH}
          rows={3}
          className="resize-none border-border-strong bg-background"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
           <span role="status" className="text-destructive">
            {hasVideo && (touched || startText !== endText) ? rangeError ?? (touched ? commentError : "") : ""}
          </span>
          <span className="tabular">
            {comment.length}/{MAX_COMMENT_LENGTH}
          </span>
        </div>
      </div>

      <Button
        variant="outline"
        className="w-full border-primary/40 text-primary hover:bg-primary/10"
        disabled={!canPreview}
        onClick={previewRange}
      >
        <Play />
        Preview selected range
      </Button>

      <Button className="w-full glow-primary" disabled={!canSave} onClick={() => void submit()}>
        {isSaving ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Save className="mr-2 size-4" />}
        {isSaving ? "Saving annotation..." : submitLabel}
      </Button>
      {onCancel && (
        <Button variant="outline" className="w-full" disabled={isSaving} onClick={onCancel}>
          Cancel
        </Button>
      )}
    </div>
  );
}
