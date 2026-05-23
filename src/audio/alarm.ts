import { Audio } from 'expo-av';
import { setupAudioSession } from './session';

const ALARM_FILE = require('../../assets/audio/alarm/bell.mp3');

// §9.3: フェードイン3秒 / 最大5分で自動停止
const FADE_IN_STEPS = 30;
const FADE_IN_INTERVAL_MS = 100;
const ALARM_MAX_MS = 5 * 60 * 1000;

let _sound: Audio.Sound | null = null;
let _autoStopTimer: ReturnType<typeof setTimeout> | null = null;

export async function startAlarm(): Promise<void> {
  if (!ALARM_FILE) return;
  await setupAudioSession();
  await stopAlarm();

  const { sound } = await Audio.Sound.createAsync(ALARM_FILE, {
    isLooping: true,
    volume: 0,
    shouldPlay: true,
  });
  _sound = sound;

  let step = 0;
  const fade = setInterval(async () => {
    step++;
    try {
      await sound.setVolumeAsync(Math.min(step / FADE_IN_STEPS, 1.0));
    } catch {}
    if (step >= FADE_IN_STEPS) clearInterval(fade);
  }, FADE_IN_INTERVAL_MS);

  _autoStopTimer = setTimeout(() => stopAlarm(), ALARM_MAX_MS);
}

export async function stopAlarm(): Promise<void> {
  if (_autoStopTimer) {
    clearTimeout(_autoStopTimer);
    _autoStopTimer = null;
  }
  if (!_sound) return;
  try {
    await _sound.stopAsync();
    await _sound.unloadAsync();
  } catch {}
  _sound = null;
}
