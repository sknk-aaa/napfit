import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import type { PurchasesPackage } from 'react-native-purchases';

import { getProPackage, purchasePro, restorePurchases } from '@/src/pro/revenuecat';
import { setProActive } from '@/src/pro/gate';
import { Colors } from '@/src/theme/colors';
import Sheep from '@/src/components/Sheep';

const PRO_FEATURES = [
  { icon: '📊', title: '分析ダッシュボード', desc: '時間帯別・曜日別のすっきり率を可視化' },
  { icon: '📅', title: 'カレンダー表示', desc: '月単位で仮眠記録をひと目で確認' },
  { icon: '∞', title: '無制限の履歴', desc: '直近10件を超えた記録もすべて閲覧' },
  { icon: '📤', title: 'データエクスポート', desc: 'CSV・JSON形式でデータを書き出し' },
  { icon: '🌗', title: 'テーマ選択', desc: 'ライト/ダークモードを自由に選択' },
  { icon: '⏰', title: 'アラーム音の選択', desc: '複数のアラーム音から好みを選べる' },
];

export default function ProModalScreen() {
  const [pkg, setPkg] = useState<PurchasesPackage | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getProPackage().then(setPkg);
  }, []);

  async function handlePurchase() {
    if (!pkg) {
      Alert.alert('エラー', '購入情報を取得できません。しばらくしてからお試しください。');
      return;
    }
    setLoading(true);
    const success = await purchasePro(pkg);
    setLoading(false);
    if (success) {
      setProActive(true);
      Alert.alert('ありがとうございます！', 'Pro機能が有効になりました。', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } else {
      Alert.alert('購入できませんでした', '再度お試しください。');
    }
  }

  async function handleRestore() {
    setLoading(true);
    const success = await restorePurchases();
    setLoading(false);
    if (success) {
      setProActive(true);
      Alert.alert('復元しました', 'Pro機能が有効になりました。', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } else {
      Alert.alert('復元できませんでした', '購入履歴が見つかりませんでした。');
    }
  }

  const priceLabel = pkg?.product.priceString ?? '¥480';

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
        <Text style={styles.closeBtnText}>✕</Text>
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.heroSection}>
          <Sheep pose="read" size={80} />
          <Text style={styles.heroTitle}>NapFit Pro</Text>
          <Text style={styles.heroSub}>あなたの仮眠をもっと深く分析</Text>
        </View>

        <View style={styles.featureList}>
          {PRO_FEATURES.map((f) => (
            <View key={f.title} style={styles.featureRow}>
              <Text style={styles.featureIcon}>{f.icon}</Text>
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>{f.title}</Text>
                <Text style={styles.featureDesc}>{f.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.bottom}>
          <Text style={styles.priceNote}>買い切り {priceLabel}（税込）</Text>
          <TouchableOpacity
            style={[styles.purchaseBtn, loading && styles.purchaseBtnDisabled]}
            onPress={handlePurchase}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.purchaseBtnText}>{priceLabel} で購入する</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={handleRestore} disabled={loading} activeOpacity={0.7}>
            <Text style={styles.restoreText}>購入を復元する</Text>
          </TouchableOpacity>
          <Text style={styles.legalNote}>
            お支払いは Apple IDに請求されます。購入後はアカウントが管理されます。
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  closeBtn: {
    position: 'absolute',
    top: 56,
    right: 20,
    zIndex: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.ink4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: 14,
    color: Colors.ink2,
    fontWeight: '600',
  },
  scroll: {
    padding: 24,
    paddingTop: 16,
  },
  heroSection: {
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 24,
    gap: 10,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.ink,
    letterSpacing: -0.5,
  },
  heroSub: {
    fontSize: 14,
    color: Colors.ink2,
  },
  featureList: {
    backgroundColor: Colors.card,
    borderRadius: 18,
    padding: 16,
    gap: 14,
    marginBottom: 24,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureIcon: {
    fontSize: 22,
    width: 32,
    textAlign: 'center',
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.ink,
  },
  featureDesc: {
    fontSize: 11.5,
    color: Colors.ink3,
    marginTop: 1,
  },
  bottom: {
    alignItems: 'center',
    gap: 12,
  },
  priceNote: {
    fontSize: 13,
    color: Colors.ink2,
    fontWeight: '600',
  },
  purchaseBtn: {
    width: '100%',
    height: 54,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 18,
    elevation: 6,
  },
  purchaseBtnDisabled: {
    opacity: 0.6,
  },
  purchaseBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  restoreText: {
    fontSize: 12,
    color: Colors.ink3,
    textDecorationLine: 'underline',
  },
  legalNote: {
    fontSize: 10,
    color: Colors.ink3,
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 8,
  },
});
