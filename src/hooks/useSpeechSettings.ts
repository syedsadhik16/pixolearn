import { useState, useEffect, useCallback } from 'react';

export interface SpeechSettings {
  rate: number;
  voiceURI: string | null;
}

const STORAGE_KEY = 'pixo-speech-settings';

const NAMED_VOICES: Record<string, string[]> = {
  'Zoya': ['zira', 'samantha', 'karen', 'female'],
  'Shan': ['david', 'mark', 'daniel', 'james', 'male'],
  'Mac': ['alex', 'tom', 'aaron', 'boy'],
  'Lina': ['linda', 'susan', 'hazel', 'helena'],
  'Kora': ['alice', 'fiona', 'anna', 'girl'],
  'Meke': ['google', 'cortana', 'microsoft'],
};

export function useSpeechSettings() {
  const [settings, setSettings] = useState<SpeechSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : { rate: 1, voiceURI: null };
    } catch {
      return { rate: 1, voiceURI: null };
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const setRate = useCallback((rate: number) => {
    setSettings(prev => ({ ...prev, rate }));
  }, []);

  const setVoiceURI = useCallback((voiceURI: string | null) => {
    setSettings(prev => ({ ...prev, voiceURI }));
  }, []);

  const speak = useCallback((text: string, onStart?: () => void, onEnd?: () => void) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = settings.rate;
    utterance.pitch = 1;
    utterance.lang = 'en-US';

    if (settings.voiceURI) {
      const voices = window.speechSynthesis.getVoices();
      const found = voices.find(v => v.voiceURI === settings.voiceURI);
      if (found) utterance.voice = found;
    }

    if (onStart) utterance.onstart = onStart;
    if (onEnd) utterance.onend = onEnd;
    window.speechSynthesis.speak(utterance);
  }, [settings.rate, settings.voiceURI]);

  return { settings, setRate, setVoiceURI, speak };
}

export function getNamedVoices(): { name: string; emoji: string; voiceURI: string | null }[] {
  const allVoices = window.speechSynthesis.getVoices().filter(v => v.lang.startsWith('en'));
  
  const findVoice = (keywords: string[]): SpeechSynthesisVoice | null => {
    for (const kw of keywords) {
      const found = allVoices.find(v => v.name.toLowerCase().includes(kw));
      if (found) return found;
    }
    return null;
  };

  const entries: { name: string; emoji: string; voiceURI: string | null }[] = [
    { name: 'Default', emoji: '🔊', voiceURI: null },
  ];

  const zoya = findVoice(NAMED_VOICES['Zoya']);
  if (zoya) entries.push({ name: 'Zoya', emoji: '👩', voiceURI: zoya.voiceURI });

  const shan = findVoice(NAMED_VOICES['Shan']);
  if (shan) entries.push({ name: 'Shan', emoji: '👨', voiceURI: shan.voiceURI });

  const mac = findVoice(NAMED_VOICES['Mac']);
  if (mac) entries.push({ name: 'Mac', emoji: '👦', voiceURI: mac.voiceURI });

  const lina = findVoice(NAMED_VOICES['Lina']);
  if (lina) entries.push({ name: 'Lina', emoji: '👩‍🏫', voiceURI: lina.voiceURI });

  const kora = findVoice(NAMED_VOICES['Kora']);
  if (kora) entries.push({ name: 'Kora', emoji: '👧', voiceURI: kora.voiceURI });

  const meke = findVoice(NAMED_VOICES['Meke']);
  if (meke) entries.push({ name: 'Meke', emoji: '🤖', voiceURI: meke.voiceURI });

  // If no named voices found, add first 3 available
  if (entries.length === 1 && allVoices.length > 0) {
    allVoices.slice(0, 3).forEach(v => {
      entries.push({ name: v.name.replace(/Microsoft |Google |Apple /, '').slice(0, 12), emoji: '🎤', voiceURI: v.voiceURI });
    });
  }

  return entries;
}
