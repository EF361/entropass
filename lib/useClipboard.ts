"use client";

import { useState, useEffect, useCallback, useRef } from "react";

export const CLIPBOARD_CLEAR_SECONDS = 30;

async function writeToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for browsers without the async Clipboard API
    try {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(textarea);
      return ok;
    } catch {
      return false;
    }
  }
}

/**
 * Copies text and, when autoClear is on, overwrites the clipboard with an empty
 * string after CLIPBOARD_CLEAR_SECONDS. The clear only runs while the page is
 * focused, because browsers block clipboard writes from background tabs.
 */
export function useClipboard(autoClear: boolean) {
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setSecondsLeft(null);
  }, []);

  useEffect(() => stopTimer, [stopTimer]);

  useEffect(() => {
    if (!autoClear) stopTimer();
  }, [autoClear, stopTimer]);

  const copy = useCallback(
    async (text: string): Promise<boolean> => {
      if (!text) return false;
      const ok = await writeToClipboard(text);
      if (!ok || !autoClear) return ok;

      stopTimer();
      const deadline = Date.now() + CLIPBOARD_CLEAR_SECONDS * 1000;
      setSecondsLeft(CLIPBOARD_CLEAR_SECONDS);
      timerRef.current = setInterval(() => {
        const remaining = Math.ceil((deadline - Date.now()) / 1000);
        if (remaining > 0) {
          setSecondsLeft(remaining);
          return;
        }
        stopTimer();
        if (document.hasFocus()) {
          navigator.clipboard?.writeText("").catch(() => {
            /* clipboard write refused; nothing else to do */
          });
        }
      }, 250);
      return true;
    },
    [autoClear, stopTimer]
  );

  return { copy, secondsLeft };
}
