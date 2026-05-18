import * as Notifications from 'expo-notifications';

export function setupNotificationHandler(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

// §9.1 step4: 保険のローカル通知を予約(アプリが落ちても通知だけは届く)
export async function scheduleAlarmNotification(
  date: Date,
  durationMinutes: number
): Promise<string | null> {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') return null;

    return await Notifications.scheduleNotificationAsync({
      content: {
        title: '仮眠時間が終わりました',
        body: `${durationMinutes}分の仮眠が完了しました。起きましょう！`,
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date,
      },
    });
  } catch {
    return null;
  }
}

export async function cancelNotification(id: string): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(id);
  } catch {}
}
