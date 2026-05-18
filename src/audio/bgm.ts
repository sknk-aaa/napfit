import { Audio } from 'expo-av';
import { setupAudioSession } from './session';

// TODO: BGM音源を assets/audio/bgm/ に配置したら差し替える
// 例: const BGM_FILE = require('../../assets/audio/bgm/nature.mp3');
const BGM_FILE: Parameters<typeof Audio.Sound.createAsync>[0] | null = null;

let _sound: Audio.Sound | null = null;

export async function startBgm(): Promise<void> {
  if (!BGM_FILE) return;
  await setupAudioSession();
  await stopBgm();

  const { sound } = await Audio.Sound.createAsync(BGM_FILE, {
    isLooping: true,
    volume: 0.4,
    shouldPlay: true,
  });
  _sound = sound;
}

export async function stopBgm(): Promise<void> {
  if (!_sound) return;
  try {
    await _sound.stopAsync();
    await _sound.unloadAsync();
  } catch {}
  _sound = null;
}

// §9.6.1: 電話終了後などに BGM を自動再開する
export async function resumeBgm(): Promise<void> {
  if (!_sound) return;
  try {
    const status = await _sound.getStatusAsync();
    if (status.isLoaded && !status.isPlaying) {
      await _sound.playAsync();
    }
  } catch {}
}

export function hasBgm(): boolean {
  return _sound !== null;
}
