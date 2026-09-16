"use client";

import { useEffect, useState } from "react";

type PromptPasang = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export default function PasangPwa() {
  const [prompt, setPrompt] = useState<PromptPasang | null>(null);
  const [terpasang, setTerpasang] = useState(false);

  useEffect(() => {
    const saatTersedia = (event: Event) => {
      event.preventDefault();
      setPrompt(event as PromptPasang);
    };
    const saatTerpasang = () => {
      setTerpasang(true);
      setPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", saatTersedia);
    window.addEventListener("appinstalled", saatTerpasang);
    return () => {
      window.removeEventListener("beforeinstallprompt", saatTersedia);
      window.removeEventListener("appinstalled", saatTerpasang);
    };
  }, []);

  if (terpasang) {
    return (
      <span className="rounded-xl bg-emerald-500/15 px-3.5 py-2 text-sm font-semibold text-emerald-300 ring-1 ring-emerald-400/30">
        ✓ Terpasang
      </span>
    );
  }

  if (!prompt) return null;

  return (
    <button
      type="button"
      onClick={async () => {
        await prompt.prompt();
        await prompt.userChoice;
        setPrompt(null);
      }}
      className="rounded-xl bg-sky-500/15 px-3.5 py-2 text-sm font-semibold text-sky-200 ring-1 ring-sky-400/30 transition hover:bg-sky-500/25"
    >
      ⬇ Pasang aplikasi
    </button>
  );
}
