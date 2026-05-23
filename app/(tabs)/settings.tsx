import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors } from '@/src/theme/colors';
import Sheep from '@/src/components/Sheep';

function ChevronRight() {
  return (
    <View style={styles.chevron}>
      <Text style={styles.chevronText}>›</Text>
    </View>
  );
}

interface SettingRow {
  icon: string;
  label: string;
  detail?: string;
  onPress?: () => void;
  isPro?: boolean;
}

export default function SettingsScreen() {
  const mainRows: SettingRow[] = [
    { icon: '🔔', label: '通知設定',      detail: '許可されています' },
    { icon: '🎵', label: 'BGM選択',       detail: 'やさしいピアノ' },
    { icon: '⏰', label: 'アラーム音',    detail: 'シンプルベル', isPro: true },
    { icon: '🌗', label: 'テーマ',        detail: 'ライトモード',  isPro: true },
    { icon: '👑', label: 'NapFit Pro',    detail: '機能をアップグレード' },
    { icon: '🔄', label: '購入を復元',    detail: 'Restore Purchases' },
  ];

  const infoRows: SettingRow[] = [
    {
      icon: '🔒',
      label: 'プライバシーポリシー',
      onPress: () => Linking.openURL('https://example.com/privacy'),
    },
    {
      icon: '📄',
      label: '利用規約',
      onPress: () => Linking.openURL('https://example.com/terms'),
    },
    { icon: 'ℹ️', label: 'アプリ情報', detail: 'v1.0.0' },
  ];

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
          {mainRows.map((row, i) => (
            <SettingRowItem
              key={row.label}
              row={row}
              isLast={i === mainRows.length - 1}
            />
          ))}
        </View>

        {/* 情報・リンク */}
        <View style={[styles.listCard, { marginTop: 14 }]}>
          {infoRows.map((row, i) => (
            <SettingRowItem
              key={row.label}
              row={row}
              isLast={i === infoRows.length - 1}
            />
          ))}
        </View>

        {/* バージョン */}
        <Text style={styles.version}>NapFit v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function SettingRowItem({ row, isLast }: { row: SettingRow; isLast: boolean }) {
  return (
    <TouchableOpacity
      style={[styles.row, !isLast && styles.rowBorder]}
      onPress={row.onPress}
      activeOpacity={row.onPress ? 0.65 : 1}
      disabled={!row.onPress}
    >
      <Text style={styles.rowIcon}>{row.icon}</Text>
      <Text style={styles.rowLabel}>{row.label}</Text>
      {row.isPro && <ProBadge />}
      {row.detail ? (
        <Text style={styles.rowDetail}>{row.detail}</Text>
      ) : null}
      <ChevronRight />
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
    width: 16,
    alignItems: 'center',
  },
  chevronText: {
    fontSize: 20,
    color: Colors.ink4,
    lineHeight: 22,
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
