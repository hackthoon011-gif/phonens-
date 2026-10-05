import { MessageSquareDashed, Pencil, Play, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatAnnotationTime } from "@/lib/format";
import type { Annotation } from "@/lib/types";
import { cn } from "@/lib/utils";
import { EmptyState, ErrorState, LoadingState } from "./states";

interface CardProps {
  annotation: Annotation;
  active: boolean;
  onPlay: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function AnnotationCard({ annotation, active, onPlay, onEdit, onDelete }: CardProps) {
  const pending = annotation.id.startsWith("optimistic-");
  return (
    <div
      onClick={onPlay}
      className={cn(
        "animate-rise-in group cursor-pointer rounded-sm border border-border bg-background/50 p-3 transition-all hover:border-primary/40 hover:bg-surface-raised",
        active && "border-primary/60 bg-primary/5 glow-primary",
        pending && "opacity-60",
      )}
    >
      <p className="tabular font-mono text-[11px] font-semibold text-primary">
         {formatAnnotationTime(annotation.startTime)} → {formatAnnotationTime(annotation.endTime)}
      </p>
      <p className="mt-1.5 text-xs break-words whitespace-pre-wrap text-foreground/90">{annotation.comment}</p>
      <div className="mt-2 flex flex-wrap gap-1">
        <Button size="sm" variant="secondary" className="border border-border" disabled={pending} onClick={(event) => { event.stopPropagation(); onPlay(); }}>
          <Play className="mr-1.5 size-3.5" /> Play Section
        </Button>
        <Button size="sm" variant="ghost" disabled={pending} onClick={(event) => { event.stopPropagation(); onEdit(); }}>
          <Pencil className="mr-1.5 size-3.5" /> Edit
        </Button>
        <Button
          size="sm"
          variant="ghost"
          disabled={pending}
          className="text-muted-foreground hover:text-destructive"
          onClick={(event) => {
            event.stopPropagation();
            onDelete();
          }}
        >
          <Trash2 className="mr-1.5 size-3.5" /> Delete
        </Button>
      </div>
    </div>
  );
}

interface ListProps {
  annotations: Annotation[];
  isLoading: boolean;
  error: string | null;
  activeId: string | null;
  onRetry: () => void;
  onPlay: (annotation: Annotation) => void;
  onEdit: (annotation: Annotation) => void;
  onDelete: (annotation: Annotation) => void;
}

export function AnnotationList({ annotations, isLoading, error, activeId, onRetry, onPlay, onEdit, onDelete }: ListProps) {
  if (isLoading) return <LoadingState label="Loading annotations..." />;
  if (error) return <ErrorState message={error} onRetry={onRetry} />;
  if (annotations.length === 0) {
    return (
      <EmptyState
        icon={<MessageSquareDashed className="size-5" />}
        title="No annotations yet"
        description="Select a section of the video and add your first annotation."
      />
    );
  }
  return (
    <div className="space-y-3">
      {annotations.map((annotation) => (
        <AnnotationCard
          key={annotation.id}
          annotation={annotation}
          active={annotation.id === activeId}
          onPlay={() => onPlay(annotation)}
          onEdit={() => onEdit(annotation)}
          onDelete={() => onDelete(annotation)}
        />
      ))}
    </div>
  );
}
