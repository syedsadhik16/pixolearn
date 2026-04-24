// Pre-recorded "sample narrator" voices.
// Selected via VoicePicker. When chosen, the bundled audio clip is played
// instead of using the browser's speechSynthesis engine.

export interface SampleVoice {
  /** Stable id stored in settings.voiceURI */
  id: string;
  name: string;
  emoji: string;
  description: string;
  /** Public URL to the bundled audio sample */
  src: string;
}

export const SAMPLE_VOICES: SampleVoice[] = [
  {
    id: 'sample:aria',
    name: 'Aria',
    emoji: '🎙️',
    description: 'Warm, friendly storyteller',
    src: '/voices/narrator-aria.mp3',
  },
  {
    id: 'sample:nova',
    name: 'Nova',
    emoji: '✨',
    description: 'Cinematic, expressive narrator',
    src: '/voices/narrator-nova.mp3',
  },
];

export const SAMPLE_VOICE_PREFIX = 'sample:';

export function isSampleVoice(uri: string | null | undefined): boolean {
  return !!uri && uri.startsWith(SAMPLE_VOICE_PREFIX);
}

export function getSampleVoice(uri: string | null | undefined): SampleVoice | null {
  if (!isSampleVoice(uri)) return null;
  return SAMPLE_VOICES.find((v) => v.id === uri) ?? null;
}

/** Single shared <audio> element so a new utterance cancels the previous one. */
let sharedAudio: HTMLAudioElement | null = null;

export function playSampleVoice(
  uri: string,
  rate: number = 1,
  onStart?: () => void,
  onEnd?: () => void,
): void {
  const voice = getSampleVoice(uri);
  if (!voice) return;

  if (sharedAudio) {
    sharedAudio.pause();
    sharedAudio.currentTime = 0;
  }

  const audio = new Audio(voice.src);
  audio.playbackRate = Math.min(Math.max(rate, 0.5), 2);
  audio.onplay = () => onStart?.();
  audio.onended = () => onEnd?.();
  audio.onerror = () => onEnd?.();
  sharedAudio = audio;
  void audio.play().catch(() => onEnd?.());
}

export function pauseSampleVoice(): void {
  if (sharedAudio && !sharedAudio.paused) sharedAudio.pause();
}

export function resumeSampleVoice(): void {
  if (sharedAudio && sharedAudio.paused) {
    void sharedAudio.play().catch(() => {});
  }
}

export function replaySampleVoice(): void {
  if (sharedAudio) {
    sharedAudio.currentTime = 0;
    void sharedAudio.play().catch(() => {});
  }
}

export function getSampleAudio(): HTMLAudioElement | null {
  return sharedAudio;
}

export function stopSampleVoice(): void {
  if (sharedAudio) {
    sharedAudio.pause();
    sharedAudio.currentTime = 0;
    sharedAudio = null;
  }
}
