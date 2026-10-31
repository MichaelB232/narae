// Modul Text-To-Speech bahasa Indonesia alami (Natural Voice)
// Memilih suara neural/natural terbaik di browser (bukan suara robotik kaku).

export function getBestIndonesianVoice(): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return null;

  // 1. Prioritaskan Natural / Neural voice Indonesia (mis. Microsoft Gadis / Ardi Natural)
  const naturalId = voices.find(
    (v) =>
      (v.lang.toLowerCase().startsWith("id") || v.name.toLowerCase().includes("indonesia")) &&
      (v.name.toLowerCase().includes("natural") ||
        v.name.toLowerCase().includes("online") ||
        v.name.toLowerCase().includes("gadis") ||
        v.name.toLowerCase().includes("ardi"))
  );
  if (naturalId) return naturalId;

  // 2. Prioritaskan Google Bahasa Indonesia
  const googleId = voices.find(
    (v) =>
      v.name.toLowerCase().includes("google") &&
      (v.lang.toLowerCase().startsWith("id") || v.name.toLowerCase().includes("indonesi"))
  );
  if (googleId) return googleId;

  // 3. Fallback ke voice bahasa Indonesia manapun
  const anyId = voices.find((v) => v.lang.toLowerCase().startsWith("id"));
  if (anyId) return anyId;

  return null;
}

export function speakNaturalVoice(
  text: string,
  onStart?: () => void,
  onEnd?: () => void,
  onError?: () => void
): { stop: () => void } {
  if (typeof window === "undefined" || !window.speechSynthesis) {
    onError?.();
    return { stop: () => {} };
  }

  window.speechSynthesis.cancel();

  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = "id-ID";
  utter.rate = 0.95; // Intonasi lebih santai dan jelas
  utter.pitch = 1.0;

  const chosenVoice = getBestIndonesianVoice();
  if (chosenVoice) {
    utter.voice = chosenVoice;
  }

  utter.onstart = () => onStart?.();
  utter.onend = () => onEnd?.();
  utter.onerror = () => {
    onEnd?.();
    onError?.();
  };

  try {
    window.speechSynthesis.speak(utter);
  } catch (err) {
    console.error("speechSynthesis error:", err);
    onError?.();
  }

  return {
    stop: () => {
      try {
        window.speechSynthesis.cancel();
      } catch {}
      onEnd?.();
    },
  };
}
