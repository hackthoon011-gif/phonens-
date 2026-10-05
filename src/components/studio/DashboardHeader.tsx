import { Clapperboard, ShieldCheck, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";

interface DashboardHeaderProps {
  onUploadClick: () => void;
  videoCount: number;
}

export function DashboardHeader({ onUploadClick, videoCount }: DashboardHeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-[1600px] items-center gap-3 px-4 sm:px-6">
        <div className="flex items-center gap-2.5">
          <span className="flex size-8 items-center justify-center rounded-sm bg-primary text-primary-foreground">
            <Clapperboard className="size-4" />
          </span>
          <span className="font-display text-sm font-semibold uppercase sm:text-base">
            Annotation Studio
          </span>
          <span className="hidden font-mono text-[10px] text-muted-foreground sm:inline">/ CONTROL DECK</span>
        </div>

        <nav className="ml-auto hidden items-center gap-3 md:flex">
          <span className="inline-flex items-center gap-1.5 border border-primary/25 bg-primary/5 px-2.5 py-1 font-mono text-[10px] text-primary">
            <ShieldCheck className="size-3 text-signal" /> SECURE SESSION
          </span>
          <span className="tabular font-mono text-[10px] text-muted-foreground">
            {String(videoCount).padStart(2, "0")} ASSETS
          </span>
        </nav>

        <div className="ml-auto md:ml-0">
          <Button size="sm" onClick={onUploadClick}>
            <Upload className="mr-2 size-3.5" />
            Upload video
          </Button>
        </div>
      </div>
    </header>
  );
}
