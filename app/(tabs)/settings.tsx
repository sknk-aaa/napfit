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
import { Ionicons } from '@expo/vector-icons';
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
] as const;

type BgmId = typeof BGM_OPTIONS[number]['id'];

export default function SettingsScreen() {
  const [notifStatus, setNotifStatus] = useState<'granted' | 'denied' | 'undetermined'>('undetermined');
  const [bgmId, setBgmId] = useState<BgmId>('rain');
  const [bgmModalVisible, setBgmModalVisible] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [isPro, setIsPro] = useState(() => isProActive());

  useFocusEffect(
    useCallback(() => {
      (async () => {
        setIsPro(isProActive());
        const { status } = await Notifications.getPermissionsAsync();
        setNotifStatus(status as 'granted' | 'denied' | 'undetermined');
        const storedBgm = await AsyncStorage.getItem('settings:bgm_id');
        if (storedBgm) setBgmId(storedBgm as BgmId);
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

  async function handleRestore() {
    setRestoring(true);
    const result = await restorePurchases();
    setRestoring(false);
    if (result.status === 'success') {
      setProActive(true);
      setIsPro(true);
      Alert.alert('復元しました', 'Pro機能が有効になりました。');
    } else if (result.status === 'no_entitlement') {
      Alert.alert('復元できませんでした', '購入履歴が見つかりませんでした。');
    } else if (result.status === 'error') {
      Alert.alert('復元を完了できませんでした', '通信状況をご確認のうえ、再度お試しください。');
    }
  }

  const notifLabel =
    notifStatus === 'granted'
      ? '許可されています'
      : notifStatus === 'denied'
      ? '許可されていません'
      : '未設定';

  const bgmLabel = BGM_OPTIONS.find((b) => b.id === bgmId)?.label ?? '—';

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
            icon="notifications-outline"
            label="通知設定"
            detail={notifLabel}
            onPress={notifStatus !== 'granted' ? handleNotifRow : undefined}
          />
          <SettingRow
            icon="musical-notes-outline"
            label="BGM選択"
            detail={bgmLabel}
            onPress={() => setBgmModalVisible(true)}
          />
          <SettingRow
            icon="alarm-outline"
            label="アラーム音"
            detail="シンプルベル"
            isLast
          />
        </View>

        {/* Pro */}
        <View style={[styles.listCard, { marginTop: 14 }]}>
          {isPro ? (
            <SettingRow
              icon="sparkles"
              tint={Colors.yellowBtn}
              label="NapFit Pro"
              detail="ご利用中"
              isLast
            />
          ) : (
            <>
              <SettingRow
                icon="sparkles"
                tint={Colors.yellowBtn}
                label="NapFit Pro"
                detail="機能をアップグレード"
                onPress={() => router.push('/pro-modal')}
              />
              <SettingRow
                icon="refresh-outline"
                label="購入を復元"
                detail={restoring ? '復元中...' : 'Restore Purchases'}
                onPress={restoring ? undefined : handleRestore}
                isLast
              />
            </>
          )}
        </View>

        {/* 情報 */}
        <View style={[styles.listCard, { marginTop: 14 }]}>
          <SettingRow
            icon="stats-chart-outline"
            label="分析ダッシュボード"
            detail={isPro ? '' : 'Pro'}
            isPro={!isPro}
            onPress={() => isPro ? router.push('/analytics') : router.push('/pro-modal')}
          />
          <SettingRow
            icon="lock-closed-outline"
            label="プライバシーポリシー"
            onPress={() => Linking.openURL('https://sknk-aaa.github.io/napfit/privacy.html')}
          />
          <SettingRow
            icon="document-text-outline"
            label="利用規約"
            onPress={() => Linking.openURL('https://sknk-aaa.github.io/napfit/terms.html')}
          />
          <SettingRow
            icon="information-circle-outline"
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
  tint,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  detail?: string;
  onPress?: () => void;
  isPro?: boolean;
  isLast?: boolean;
  tint?: string;
}) {
  return (
    <TouchableOpacity
      style={[styles.row, !isLast && styles.rowBorder]}
      onPress={onPress}
      activeOpacity={onPress ? 0.65 : 1}
      disabled={!onPress}
    >
      <View style={styles.rowIcon}>
        <Ionicons name={icon} size={19} color={tint ?? Colors.primary} />
      </View>
      <Text style={styles.rowLabel}>{label}</Text>
      {isPro && <ProBadge />}
      {detail ? <Text style={styles.rowDetail}>{detail}</Text> : null}
      {onPress && (
        <Ionicons name="chevron-forward" size={16} color={Colors.ink4} style={styles.chevron} />
      )}
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
              {selectedId === opt.id && <Ionicons name="checkmark" size={16} color={Colors.primary} />}
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
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
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
    width: 16,
    marginLeft: 2,
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
