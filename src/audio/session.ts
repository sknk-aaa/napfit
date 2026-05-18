import { Audio, InterruptionModeIOS, InterruptionModeAndroid } from 'expo-av';

// §3.1: background audio 方式 — サイレントモードでも鳴り、バックグラウンドで継続する
export async function setupAudioSession(): Promise<void> {
  await Audio.setAudioModeAsync({
    allowsRecordingIOS: false,
    staysActiveInBackground: true,
    interruptionModeIOS: InterruptionModeIOS.DoNotMix,
    playsInSilentModeIOS: true,
    shouldDuckAndroid: true,
    interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
    playThroughEarpieceAndroid: false,
  });
}
