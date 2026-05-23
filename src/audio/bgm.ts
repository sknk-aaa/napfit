import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setupAudioSession } from './session';

const BGM_SOURCES: Record<string, number> = {
  rain: require('../../assets/audio/bgm/rain.mp3'),
};
const DEFAULT_BGM = BGM_SOURCES.rain;

let _sound: Audio.Sound | null = null;

export async function startBgm(): Promise<void> {
  const id = (await AsyncStorage.getItem('settings:bgm_id')) ?? 'rain';
  const file = BGM_SOURCES[id] ?? DEFAULT_BGM;
  if (!file) return;

  await setupAudioSession();
  await stopBgm();

  const { sound } = await Audio.Sound.createAsync(file, {
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
