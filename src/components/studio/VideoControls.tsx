import { Maximize, Pause, Play, Volume2, VolumeX } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import type { PlayerControls, PlayerState } from "@/hooks/useVideoPlayer";
import { formatTimecode } from "@/lib/format";

export function VideoControls({ state, controls }: { state: PlayerState; controls: PlayerControls }) {
  const long = state.duration >= 3600;
  return (
    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
      <Button size="icon" onClick={controls.togglePlay} aria-label={state.isPlaying ? "Pause" : "Play"}>
        {state.isPlaying ? <Pause className="size-4" /> : <Play className="size-4" />}
      </Button>
      <span className="tabular font-mono text-sm">
        <span className="text-primary">{formatTimecode(state.currentTime, long)}</span>
        <span className="text-muted-foreground"> / {formatTimecode(state.duration, long)}</span>
      </span>
      <div className="ml-auto flex items-center gap-2">
        <Button
          size="icon"
          variant="ghost"
          onClick={controls.toggleMute}
          aria-label={state.isMuted ? "Unmute" : "Mute"}
        >
          {state.isMuted || state.volume === 0 ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
        </Button>
        <Slider
          className="w-20 sm:w-28"
          min={0}
          max={1}
          step={0.05}
          value={[state.isMuted ? 0 : state.volume]}
          onValueChange={([value]) => controls.setVolume(value ?? 0)}
          aria-label="Volume"
        />
        <Button size="icon" variant="ghost" onClick={() => void controls.toggleFullscreen()} aria-label="Fullscreen">
          <Maximize className="size-4" />
        </Button>
      </div>
    </div>
  );
}
