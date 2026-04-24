import { useState, useEffect, useCallback, useRef } from 'react';
import {
  isSampleVoice,
  playSampleVoice,
  stopSampleVoice,
  pauseSampleVoice,
  resumeSampleVoice,
  replaySampleVoice,
  getSampleAudio,
} from '@/lib/sampleVoices';

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

// Module-level state so playback controls stay in sync across hook instances
// (e.g. the screen that calls speak() and the shell that renders controls).
type SpeechState = 'idle' | 'playing' | 'paused';
let currentState: SpeechState = 'idle';
let lastText: string | null = null;
const listeners = new Set<(s: SpeechState) => void>();
const setGlobalState = (s: SpeechState) => {
  currentState = s;
  listeners.forEach((l) => l(s));
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
  const [playbackState, setPlaybackState] = useState<SpeechState>(currentState);
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  useEffect(() => {
    listeners.add(setPlaybackState);
    return () => { listeners.delete(setPlaybackState); };
  }, []);

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
    lastText = text;
    const handleStart = () => { setGlobalState('playing'); onStart?.(); };
    const handleEnd = () => { setGlobalState('idle'); onEnd?.(); };

    // Sample narrator voices play a pre-recorded clip instead of TTS.
    if (isSampleVoice(settings.voiceURI)) {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      playSampleVoice(settings.voiceURI as string, settings.rate, handleStart, handleEnd);
      return;
    }

    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    stopSampleVoice();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = settings.rate;
    utterance.pitch = 1;
    utterance.lang = 'en-US';

    if (settings.voiceURI) {
      const voices = window.speechSynthesis.getVoices();
      const found = voices.find(v => v.voiceURI === settings.voiceURI);
      if (found) utterance.voice = found;
    }

    utterance.onstart = handleStart;
    utterance.onend = handleEnd;
    utterance.onerror = handleEnd;
    window.speechSynthesis.speak(utterance);
  }, [settings.rate, settings.voiceURI]);

  const pause = useCallback(() => {
    if (isSampleVoice(settingsRef.current.voiceURI)) {
      pauseSampleVoice();
    } else if ('speechSynthesis' in window) {
      window.speechSynthesis.pause();
    }
    setGlobalState('paused');
  }, []);

  const resume = useCallback(() => {
    if (isSampleVoice(settingsRef.current.voiceURI)) {
      const audio = getSampleAudio();
      if (audio && audio.paused) {
        resumeSampleVoice();
        setGlobalState('playing');
      }
    } else if ('speechSynthesis' in window && window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      setGlobalState('playing');
    }
  }, []);

  const replay = useCallback(() => {
    if (isSampleVoice(settingsRef.current.voiceURI)) {
      const audio = getSampleAudio();
      if (audio) {
        replaySampleVoice();
        setGlobalState('playing');
        return;
      }
    }
    if (lastText) speak(lastText);
  }, [speak]);

  const stop = useCallback(() => {
    stopSampleVoice();
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    setGlobalState('idle');
  }, []);

  return {
    settings,
    setRate,
    setVoiceURI,
    speak,
    pause,
    resume,
    replay,
    stop,
    playbackState,
    hasSpoken: lastText !== null,
  };
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
