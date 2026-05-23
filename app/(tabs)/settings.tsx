import { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Linking,
  Alert,
  Modal,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { router } from 'expo-router';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { Colors } from '@/src/theme/colors';
import Sheep from '@/src/components/Sheep';
import { isProActive, setProActive } from '@/src/pro/gate';
import { restorePurchases } from '@/src/pro/revenuecat';

const BGM_OPTIONS = [
  { id: 'rain', label: 'やさしい雨音' },
  { id: 'piano', label: 'やさしいピアノ' },
  { id: 'white', label: 'ホワイトノイズ' },
] as const;

const ALARM_OPTIONS = [
  { id: 'bell', label: 'シンプルベル' },
  { id: 'chime', label: 'やわらかチャイム' },
  { id: 'nature', label: '自然の音' },
] as const;

type BgmId = typeof BGM_OPTIONS[number]['id'];
type AlarmId = typeof ALARM_OPTIONS[number]['id'];

export default function SettingsScreen() {
  const [notifStatus, setNotifStatus] = useState<'granted' | 'denied' | 'undetermined'>('undetermined');
  const [bgmId, setBgmId] = useState<BgmId>('rain');
  const [alarmId, setAlarmId] = useState<AlarmId>('bell');
  const [bgmModalVisible, setBgmModalVisible] = useState(false);
  const [alarmModalVisible, setAlarmModalVisible] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const isPro = isProActive();

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const { status } = await Notifications.getPermissionsAsync();
        setNotifStatus(status as 'granted' | 'denied' | 'undetermined');
        const storedBgm = await AsyncStorage.getItem('settings:bgm_id');
        if (storedBgm) setBgmId(storedBgm as BgmId);
        const storedAlarm = await AsyncStorage.getItem('settings:alarm_sound_id');
        if (storedAlarm) setAlarmId(storedAlarm as AlarmId);
      })();
    }, [])
  );

  async function handleNotifRow() {
    if (notifStatus === 'denied') {
      Alert.alert(
        '通知が許可されていません',
        '設定アプリから通知を許可してください。',
        [
          { text: 'キャンセル', style: 'cancel' },
          { text: '設定を開く', onPress: () => Linking.openSettings() },
        ]
      );
    } else if (notifStatus === 'undetermined') {
      const { status } = await Notifications.requestPermissionsAsync();
      setNotifStatus(status as 'granted' | 'denied' | 'undetermined');
    }
  }

  async function handleSelectBgm(id: BgmId) {
    setBgmId(id);
    await AsyncStorage.setItem('settings:bgm_id', id);
    setBgmModalVisible(false);
  }

  async function handleSelectAlarm(id: AlarmId) {
    setAlarmId(id);
    await AsyncStorage.setItem('settings:alarm_sound_id', id);
    setAlarmModalVisible(false);
  }

  async function handleRestore() {
    setRestoring(true);
    const success = await restorePurchases();
    setRestoring(false);
    if (success) {
      setProActive(true);
      Alert.alert('復元しました', 'Pro機能が有効になりました。');
    } else {
      Alert.alert('復元できませんでした', '購入履歴が見つかりませんでした。');
    }
  }

  const notifLabel =
    notifStatus === 'granted'
      ? '許可されています'
      : notifStatus === 'denied'
      ? '許可されていません'
      : '未設定';

  const bgmLabel = BGM_OPTIONS.find((b) => b.id === bgmId)?.label ?? '—';
  const alarmLabel = ALARM_OPTIONS.find((a) => a.id === alarmId)?.label ?? '—';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* ヘッダー */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>設定</Text>
        <Sheep pose="read" size={36} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* メイン設定 */}
        <View style={styles.listCard}>
          <SettingRow
            icon="🔔"
            label="通知設定"
            detail={notifLabel}
            onPress={notifStatus !== 'granted' ? handleNotifRow : undefined}
          />
          <SettingRow
            icon="🎵"
            label="BGM選択"
            detail={bgmLabel}
            onPress={() => setBgmModalVisible(true)}
          />
          <SettingRow
            icon="⏰"
            label="アラーム音"
            detail={alarmLabel}
            isPro
            onPress={isPro ? () => setAlarmModalVisible(true) : () => router.push('/pro-modal')}
          />
          <SettingRow
            icon="🌗"
            label="テーマ"
            detail="ライトモード"
            isPro
            onPress={() => router.push('/pro-modal')}
            isLast
          />
        </View>

        {/* Pro */}
        <View style={[styles.listCard, { marginTop: 14 }]}>
          {isPro ? (
            <SettingRow
              icon="👑"
              label="NapFit Pro"
              detail="ご利用中"
              isLast
            />
          ) : (
            <>
              <SettingRow
                icon="👑"
                label="NapFit Pro"
                detail="機能をアップグレード"
                onPress={() => router.push('/pro-modal')}
              />
              <SettingRow
                icon="🔄"
                label="購入を復元"
                detail={restoring ? '復元中...' : 'Restore Purchases'}
                onPress={handleRestore}
                isLast
              />
            </>
          )}
        </View>

        {/* 情報 */}
        <View style={[styles.listCard, { marginTop: 14 }]}>
          <SettingRow
            icon="📊"
            label="分析ダッシュボード"
            detail={isPro ? '' : 'Pro'}
            isPro={!isPro}
            onPress={() => isPro ? router.push('/analytics') : router.push('/pro-modal')}
          />
          <SettingRow
            icon="🔒"
            label="プライバシーポリシー"
            onPress={() => Linking.openURL('https://sknk-aaa.github.io/napfit/privacy.html')}
          />
          <SettingRow
            icon="📄"
            label="利用規約"
            onPress={() => Linking.openURL('https://sknk-aaa.github.io/napfit/terms.html')}
          />
          <SettingRow
            icon="ℹ️"
            label="アプリ情報"
            detail="v1.0.0"
            isLast
          />
        </View>

        <Text style={styles.version}>NapFit v1.0.0</Text>
      </ScrollView>

      {/* BGM 選択モーダル */}
      <SelectModal
        visible={bgmModalVisible}
        title="BGM を選択"
        options={BGM_OPTIONS.map((b) => ({ id: b.id, label: b.label }))}
        selectedId={bgmId}
        onSelect={(id) => handleSelectBgm(id as BgmId)}
        onClose={() => setBgmModalVisible(false)}
      />

      {/* アラーム音選択モーダル */}
      <SelectModal
        visible={alarmModalVisible}
        title="アラーム音を選択"
        options={ALARM_OPTIONS.map((a) => ({ id: a.id, label: a.label }))}
        selectedId={alarmId}
        onSelect={(id) => handleSelectAlarm(id as AlarmId)}
        onClose={() => setAlarmModalVisible(false)}
      />
    </SafeAreaView>
  );
}

function SettingRow({
  icon,
  label,
  detail,
  onPress,
  isPro,
  isLast,
}: {
  icon: string;
  label: string;
  detail?: string;
  onPress?: () => void;
  isPro?: boolean;
  isLast?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.row, !isLast && styles.rowBorder]}
      onPress={onPress}
      activeOpacity={onPress ? 0.65 : 1}
      disabled={!onPress}
    >
      <Text style={styles.rowIcon}>{icon}</Text>
      <Text style={styles.rowLabel}>{label}</Text>
      {isPro && <ProBadge />}
      {detail ? <Text style={styles.rowDetail}>{detail}</Text> : null}
      {onPress && <Text style={styles.chevron}>›</Text>}
    </TouchableOpacity>
  );
}

function ProBadge() {
  return (
    <View style={styles.proBadge}>
      <Text style={styles.proBadgeText}>Pro</Text>
    </View>
  );
}

function SelectModal({
  visible,
  title,
  options,
  selectedId,
  onSelect,
  onClose,
}: {
  visible: boolean;
  title: string;
  options: { id: string; label: string }[];
  selectedId: string;
  onSelect: (id: string) => void;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={modalStyles.backdrop} onPress={onClose}>
        <Pressable style={modalStyles.card}>
          <Text style={modalStyles.title}>{title}</Text>
          {options.map((opt, i) => (
            <TouchableOpacity
              key={opt.id}
              style={[
                modalStyles.option,
                i < options.length - 1 && modalStyles.optionBorder,
                selectedId === opt.id && modalStyles.optionSelected,
              ]}
              onPress={() => onSelect(opt.id)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  modalStyles.optionText,
                  selectedId === opt.id && modalStyles.optionTextSelected,
                ]}
              >
                {opt.label}
              </Text>
              {selectedId === opt.id && <Text style={modalStyles.checkmark}>✓</Text>}
            </TouchableOpacity>
          ))}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.ink,
    flex: 1,
  },
  scroll: {
    padding: 16,
    paddingBottom: 40,
  },
  listCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 8,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  rowIcon: {
    fontSize: 18,
    width: 28,
    textAlign: 'center',
  },
  rowLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: Colors.ink,
  },
  rowDetail: {
    fontSize: 11.5,
    color: Colors.ink3,
    marginRight: 4,
  },
  chevron: {
    fontSize: 20,
    color: Colors.ink4,
    lineHeight: 22,
    width: 16,
    textAlign: 'center',
  },
  proBadge: {
    backgroundColor: Colors.primaryChip,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  proBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.primary,
    letterSpacing: 0.3,
  },
  version: {
    textAlign: 'center',
    fontSize: 11,
    color: Colors.ink3,
    marginTop: 24,
  },
});

const modalStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxWidth: 320,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 12,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.ink,
    marginBottom: 12,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
  },
  optionBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  optionSelected: {},
  optionText: {
    flex: 1,
    fontSize: 14,
    color: Colors.ink,
    fontWeight: '500',
  },
  optionTextSelected: {
    color: Colors.primary,
    fontWeight: '700',
  },
  checkmark: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: '700',
  },
});
