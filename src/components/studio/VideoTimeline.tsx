import type { MouseEvent } from "react";

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { formatAnnotationTime, formatTimecode } from "@/lib/format";
import type { Annotation } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface VideoTimelineProps {
  currentTime: number;
  duration: number;
  annotations: Annotation[];
  activeId: string | null;
  selection: { start: number | null; end: number | null };
  onSeek: (time: number) => void;
  onSelectAnnotation: (annotation: Annotation) => void;
}

const pct = (value: number, duration: number) =>
  duration > 0 ? `${Math.min(Math.max((value / duration) * 100, 0), 100)}%` : "0%";

export function VideoTimeline({
  currentTime,
  duration,
  annotations,
  activeId,
  selection,
  onSeek,
  onSelectAnnotation,
}: VideoTimelineProps) {
  const handleClick = (event: MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    if (duration <= 0 || rect.width <= 0) return;
    onSeek(((event.clientX - rect.left) / rect.width) * duration);
  };

  const hasSelection =
    selection.start !== null && selection.end !== null && selection.end > selection.start;

  return (
    <TooltipProvider delayDuration={100}>
      <div className="space-y-2">
        <div
          className="relative h-10 cursor-pointer rounded-lg border border-border bg-secondary/60"
          onClick={handleClick}
          role="slider"
          aria-label="Timeline"
          aria-valuemin={0}
          aria-valuemax={duration}
          aria-valuenow={currentTime}
           tabIndex={duration > 0 ? 0 : -1}
           onKeyDown={(event) => {
             if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
               event.preventDefault();
               onSeek(Math.min(duration, Math.max(0, currentTime + (event.key === "ArrowRight" ? 1 : -1))));
             }
             if (event.key === "Home") onSeek(0);
             if (event.key === "End") onSeek(duration);
           }}
        >
          <div
            className="absolute inset-y-0 left-0 rounded-l-lg bg-primary/10"
            style={{ width: pct(currentTime, duration) }}
          />
          {hasSelection && (
            <div
              className="absolute inset-y-1 rounded border border-dashed border-primary-glow bg-primary-glow/15"
               style={{
                 left: pct(selection.start ?? 0, duration),
                 width: pct((selection.end ?? 0) - (selection.start ?? 0), duration),
               }}
            />
          )}
          {annotations.map((annotation) => (
            <Tooltip key={annotation.id}>
              <TooltipTrigger asChild>
                 <Button
                  type="button"
                   variant="ghost"
                  onClick={(event) => {
                    event.stopPropagation();
                    onSelectAnnotation(annotation);
                  }}
                  className={cn(
                     "absolute top-1/2 h-3 min-w-1 -translate-y-1/2 rounded-full bg-primary/60 p-0 transition-all hover:h-5 hover:bg-primary",
                    activeId === annotation.id && "h-5 bg-primary glow-primary",
                  )}
                  style={{
                    left: pct(annotation.startTime, duration),
                    width: pct(annotation.endTime - annotation.startTime, duration),
                  }}
                   aria-label={`Annotation ${formatAnnotationTime(annotation.startTime)} to ${formatAnnotationTime(annotation.endTime)}`}
                />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="tabular font-mono text-xs text-primary">
                   {formatAnnotationTime(annotation.startTime)} → {formatAnnotationTime(annotation.endTime)}
                </p>
                <p className="line-clamp-3 text-xs">{annotation.comment}</p>
              </TooltipContent>
            </Tooltip>
          ))}
          <div
            className="pointer-events-none absolute inset-y-0 w-0.5 bg-primary"
            style={{ left: pct(currentTime, duration) }}
          >
            <span className="absolute -top-1 left-1/2 size-2.5 -translate-x-1/2 rounded-full bg-primary glow-primary" />
          </div>
        </div>
        <div className="tabular flex justify-between font-mono text-[11px] text-muted-foreground">
          <span>00:00</span>
          <span>{formatTimecode(duration)}</span>
        </div>
      </div>
    </TooltipProvider>
  );
}
