import { useCallback, useRef, useState } from "react";
import usePolling from "./usePolling";

const MESSAGES_POLL_MS = 4000;

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1] || "");
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

// Loads a thread, keeps it fresh by polling, and sends with an optimistic bubble.
// `load` resolves to the axios response of the messages endpoint; `send(text)` posts one.
// Pass stable (memoized) functions, and remount (key) the component to switch threads.
export default function useChatMessages({ load, send, edit, remove, ownSide, enabled = true, onLoaded, sendErrorText, loadErrorText, editErrorText, deleteErrorText }) {
  const [messages, setMessages] = useState([]);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");
  const [meta, setMeta] = useState(null);
  const pending = useRef([]);

  const refresh = useCallback(async () => {
    try {
      const { data } = await load();
      setMessages([...(data.data || []), ...pending.current]);
      setMeta(data.user ?? null);
      setStatus("ready");
      onLoaded?.();
    } catch (requestError) {
      setStatus("error");
      setError(requestError.response?.data?.message || loadErrorText);
    }
  }, [load, onLoaded, loadErrorText]);

  usePolling(refresh, MESSAGES_POLL_MS, enabled);

  // payload: { text } or { audioBlob, mimeType, duration } for a voice message.
  const sendMessage = useCallback(
    async ({ text, audioBlob, mimeType, duration }) => {
      const localUrl = audioBlob ? URL.createObjectURL(audioBlob) : null;
      const temp = {
        _id: `temp-${Date.now()}`,
        sender: ownSide,
        text: text || "",
        audio: audioBlob ? { duration, localUrl } : null,
        createdAt: new Date().toISOString(),
        pending: true,
      };
      pending.current = [...pending.current, temp];
      setMessages((current) => [...current, temp]);
      setError("");
      try {
        const body = audioBlob ? { audio: await blobToBase64(audioBlob), mimeType, duration } : { text };
        const { data } = await send(body);
        // Keep playing the local copy so the recording doesn't need downloading again.
        const saved = localUrl ? { ...data.data, audio: { ...data.data.audio, localUrl } } : data.data;
        pending.current = pending.current.filter((m) => m !== temp);
        setMessages((current) => current.map((m) => (m === temp ? saved : m)));
      } catch (requestError) {
        pending.current = pending.current.filter((m) => m !== temp);
        setMessages((current) => current.filter((m) => m !== temp));
        setError(requestError.response?.data?.message || sendErrorText);
      }
    },
    [send, ownSide, sendErrorText]
  );

  // Swap in the server's copy of one message (after an edit or delete).
  const replace = (updated) =>
    setMessages((current) => current.map((m) => (m._id === updated._id ? updated : m)));

  const editMessage = useCallback(
    async (id, text) => {
      setError("");
      setMessages((current) => current.map((m) => (m._id === id ? { ...m, text, editedAt: new Date().toISOString() } : m)));
      try {
        const { data } = await edit(id, text);
        replace(data.data);
      } catch (requestError) {
        setError(requestError.response?.data?.message || editErrorText);
        refresh();
      }
    },
    [edit, editErrorText, refresh]
  );

  const deleteMessage = useCallback(
    async (id) => {
      setError("");
      setMessages((current) => current.map((m) => (m._id === id ? { ...m, text: "", deleted: true } : m)));
      try {
        const { data } = await remove(id);
        replace(data.data);
      } catch (requestError) {
        setError(requestError.response?.data?.message || deleteErrorText);
        refresh();
      }
    },
    [remove, deleteErrorText, refresh]
  );

  return { messages, status, error, meta, sendMessage, editMessage, deleteMessage };
}
