import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2, Mic, Pause, Play } from "lucide-react";
import formatClock from "./formatClock";

// Voice-message bubble content: play/pause, seek bar and time. The recording is fetched
// (with the auth header) the first time it's played, unless it was just recorded here.
function AudioMessage({ message, own, loadAudio }) {
  const { t } = useTranslation();
  const audioRef = useRef(null);
  const [url, setUrl] = useState(message.audio?.localUrl || null);
  const [status, setStatus] = useState("idle"); // idle | loading | error
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const duration = message.audio?.duration || 0;
  const ownUrl = useRef(null);

  useEffect(() => () => {
    if (ownUrl.current) URL.revokeObjectURL(ownUrl.current);
  }, []);

  const toggle = async () => {
    const audio = audioRef.current;
    if (playing) {
      audio.pause();
      return;
    }
    if (!url) {
      setStatus("loading");
      try {
        const { data } = await loadAudio(message._id);
        const objectUrl = URL.createObjectURL(data);
        ownUrl.current = objectUrl;
        audio.src = objectUrl;
        setUrl(objectUrl);
      } catch {
        setStatus("error");
        return;
      }
    }
    setStatus("idle");
    audio.play().catch(() => setStatus("error"));
  };

  const seek = (event) => {
    const audio = audioRef.current;
    const value = Number(event.target.value);
    setCurrent(value);
    if (url) audio.currentTime = value;
  };

  return (
    <div className="flex w-56 max-w-full items-center gap-2.5 py-0.5">
      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? t("chat.pause") : t("chat.play")}
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition ${
          own ? "bg-white/20 text-white hover:bg-white/30" : "bg-brand-50 text-brand-700 hover:bg-brand-100"
        }`}
      >
        {status === "loading" ? (
          <Loader2 size={16} className="animate-spin" />
        ) : playing ? (
          <Pause size={16} fill="currentColor" />
        ) : (
          <Play size={16} fill="currentColor" className="rtl:-scale-x-100" />
        )}
      </button>

      <div className="min-w-0 flex-1">
        <input
          type="range"
          min={0}
          max={duration || 1}
          step={0.1}
          value={Math.min(current, duration || 1)}
          onChange={seek}
          aria-label={t("chat.voiceMessage")}
          className={`h-1 w-full cursor-pointer ${own ? "accent-white" : "accent-brand-600"}`}
        />
        <span className={`mt-1 flex items-center gap-1 text-[11px] ${own ? "text-white/80" : "text-slate-500"}`}>
          <Mic size={11} />
          {status === "error" ? t("chat.audioError") : formatClock(playing || current ? current : duration)}
        </span>
      </div>

      <audio
        ref={audioRef}
        src={url || undefined}
        preload="none"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => {
          setPlaying(false);
          setCurrent(0);
        }}
        onTimeUpdate={(event) => setCurrent(event.currentTarget.currentTime)}
        className="hidden"
      />
    </div>
  );
}

export default AudioMessage;
