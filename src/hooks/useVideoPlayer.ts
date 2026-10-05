import { useCallback, useEffect, useRef, useState } from "react";

export interface PlayerState {
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  volume: number;
  isMuted: boolean;
  isReady: boolean;
}

const INITIAL: PlayerState = {
  currentTime: 0,
  duration: 0,
  isPlaying: false,
  volume: 1,
  isMuted: false,
  isReady: false,
};

/**
 * Owns all imperative <video> interaction so UI components stay presentational.
 * `stopAt` lets an annotation play only its own section.
 */
export function useVideoPlayer() {
  const [element, setElement] = useState<HTMLVideoElement | null>(null);
  const stopAtRef = useRef<number | null>(null);
  const [state, setState] = useState<PlayerState>(INITIAL);

  const patch = useCallback((changes: Partial<PlayerState>) => {
    setState((previous) => ({ ...previous, ...changes }));
  }, []);

  /** Ref callback for the <video> element. */
  const attach = useCallback((node: HTMLVideoElement | null) => {
    setElement(node);
  }, []);

  const reset = useCallback(() => {
    stopAtRef.current = null;
    setState(INITIAL);
  }, []);

  const play = useCallback(async () => {
    if (!element) return;
    try {
      await element.play();
    } catch {
      // Autoplay restrictions or an interrupted play(); the UI stays paused.
      patch({ isPlaying: false });
    }
  }, [element, patch]);

  const pause = useCallback(() => {
    element?.pause();
  }, [element]);

  const togglePlay = useCallback(() => {
    if (!element) return;
    if (element.paused) {
      stopAtRef.current = null;
      void play();
    } else {
      element.pause();
    }
  }, [element, play]);

  const seek = useCallback(
    (time: number) => {
      if (!element) return;
      stopAtRef.current = null;
      const max = Number.isFinite(element.duration) ? element.duration : time;
      const clamped = Math.min(Math.max(time, 0), max);
      element.currentTime = clamped;
      patch({ currentTime: clamped });
    },
    [element, patch],
  );

  const playSection = useCallback(
    (start: number, end: number) => {
      if (!element) return;
      const from = Math.max(start, 0);
      stopAtRef.current = end;
      element.currentTime = from;
      patch({ currentTime: from });
      void play();
    },
    [element, patch, play],
  );

  const setVolume = useCallback(
    (volume: number) => {
      if (element) {
        element.volume = volume;
        element.muted = volume === 0;
      }
      patch({ volume, isMuted: volume === 0 });
    },
    [element, patch],
  );

  const toggleMute = useCallback(() => {
    if (!element) return;
    element.muted = !element.muted;
    patch({ isMuted: element.muted });
  }, [element, patch]);

  const toggleFullscreen = useCallback(async () => {
    const target = element?.parentElement ?? element;
    if (!target) return;
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await target.requestFullscreen();
      }
    } catch {
      // Fullscreen can be blocked by the browser; ignore silently.
    }
  }, [element]);

  // Media event wiring, including the stop-at-end-of-section behaviour.
  useEffect(() => {
    if (!element) return;

    const onTimeUpdate = () => {
      const stopAt = stopAtRef.current;
      if (stopAt !== null && element.currentTime >= stopAt) {
        stopAtRef.current = null;
        element.pause();
        element.currentTime = stopAt;
      }
      patch({ currentTime: element.currentTime });
    };
    const onLoadedMetadata = () =>
      patch({
        duration: Number.isFinite(element.duration) ? element.duration : 0,
        isReady: true,
        volume: element.volume,
        isMuted: element.muted,
      });
    const onPlay = () => patch({ isPlaying: true });
    const onPause = () => patch({ isPlaying: false });
    const onEnded = () => {
      stopAtRef.current = null;
      patch({ isPlaying: false });
    };
    const onVolumeChange = () => patch({ volume: element.volume, isMuted: element.muted });

    element.addEventListener("timeupdate", onTimeUpdate);
    element.addEventListener("loadedmetadata", onLoadedMetadata);
    element.addEventListener("play", onPlay);
    element.addEventListener("pause", onPause);
    element.addEventListener("ended", onEnded);
    element.addEventListener("volumechange", onVolumeChange);

    if (element.readyState >= 1) onLoadedMetadata();

    return () => {
      element.removeEventListener("timeupdate", onTimeUpdate);
      element.removeEventListener("loadedmetadata", onLoadedMetadata);
      element.removeEventListener("play", onPlay);
      element.removeEventListener("pause", onPause);
      element.removeEventListener("ended", onEnded);
      element.removeEventListener("volumechange", onVolumeChange);
    };
  }, [element, patch]);

  return {
    attach,
    state,
    controls: {
      togglePlay,
      play,
      pause,
      seek,
      playSection,
      setVolume,
      toggleMute,
      toggleFullscreen,
      reset,
    },
  };
}

export type PlayerControls = ReturnType<typeof useVideoPlayer>["controls"];
