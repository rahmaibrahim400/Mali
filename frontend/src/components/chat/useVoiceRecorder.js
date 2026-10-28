import { useCallback, useEffect, useRef, useState } from "react";

export const MAX_RECORDING_SECONDS = 300;
const PREFERRED_TYPES = ["audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus", "audio/mp4"];

function pickMimeType() {
  if (typeof MediaRecorder === "undefined" || !MediaRecorder.isTypeSupported) return "";
  return PREFERRED_TYPES.find((type) => MediaRecorder.isTypeSupported(type)) || "";
}

// Microphone recording for voice messages. `stop()` resolves to { blob, mimeType, duration }.
export default function useVoiceRecorder({ onAutoStop } = {}) {
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const startedAtRef = useRef(0);
  const timerRef = useRef(null);
  const onAutoStopRef = useRef(onAutoStop);

  useEffect(() => {
    onAutoStopRef.current = onAutoStop;
  }, [onAutoStop]);

  const release = () => {
    clearInterval(timerRef.current);
    recorderRef.current?.stream.getTracks().forEach((track) => track.stop());
    recorderRef.current = null;
    setRecording(false);
    setElapsed(0);
  };

  // Throws "unsupported" or the browser's error (e.g. NotAllowedError when the mic is blocked).
  const start = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      throw new Error("unsupported");
    }
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mimeType = pickMimeType();
    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    chunksRef.current = [];
    recorder.ondataavailable = (event) => {
      if (event.data.size) chunksRef.current.push(event.data);
    };
    recorder.start();
    recorderRef.current = recorder;
    startedAtRef.current = Date.now();
    setElapsed(0);
    setRecording(true);
    timerRef.current = setInterval(() => {
      const seconds = (Date.now() - startedAtRef.current) / 1000;
      setElapsed(seconds);
      if (seconds >= MAX_RECORDING_SECONDS) onAutoStopRef.current?.();
    }, 250);
  }, []);

  const stop = useCallback(
    () =>
      new Promise((resolve) => {
        const recorder = recorderRef.current;
        if (!recorder) return resolve(null);
        const duration = Math.min((Date.now() - startedAtRef.current) / 1000, MAX_RECORDING_SECONDS);
        recorder.onstop = () => {
          const mimeType = (recorder.mimeType || "audio/webm").replace(/\s+/g, "");
          const blob = new Blob(chunksRef.current, { type: mimeType });
          release();
          resolve({ blob, mimeType, duration });
        };
        recorder.stop();
      }),
    []
  );

  const cancel = useCallback(() => {
    const recorder = recorderRef.current;
    if (!recorder) return;
    recorder.onstop = null;
    if (recorder.state !== "inactive") recorder.stop();
    release();
  }, []);

  // Never leave the microphone on after leaving the page.
  useEffect(() => () => {
    clearInterval(timerRef.current);
    recorderRef.current?.stream.getTracks().forEach((track) => track.stop());
  }, []);

  return { recording, elapsed, start, stop, cancel };
}
