import { useCallback, useEffect, useState } from 'react';
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

import {
  getProProduct,
  purchasePro,
  restorePurchases,
  type ProOperationResult,
  type ProProduct,
} from '@/src/pro/revenuecat';
import { setProActive } from '@/src/pro/gate';
import { Colors } from '@/src/theme/colors';
import Sheep from '@/src/components/Sheep';

const PRO_FEATURES = [
  { icon: '📊', title: '分析ダッシュボード', desc: '時間帯別・曜日別のすっきり率を可視化' },
  { icon: '📅', title: 'カレンダー表示', desc: '月単位で仮眠記録をひと目で確認' },
  { icon: '∞', title: '無制限の履歴', desc: '直近10件を超えた記録もすべて閲覧' },
  { icon: '📤', title: 'データエクスポート', desc: 'CSV・JSON形式でデータを書き出し' },
];

export default function ProModalScreen() {
  const [product, setProduct] = useState<ProProduct | null>(null);
  const [productLoading, setProductLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const loadProduct = useCallback(async () => {
    setProductLoading(true);
    const nextProduct = await getProProduct();
    setProduct(nextProduct);
    setProductLoading(false);
  }, []);

  useEffect(() => {
    void loadProduct();
  }, [loadProduct]);

  function showPurchaseOutcome(result: ProOperationResult) {
    if (result.status === 'success') {
      setProActive(true);
      Alert.alert('ありがとうございます！', 'Pro機能が有効になりました。', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } else if (result.status === 'pending') {
      Alert.alert('購入は保留中です', '承認が完了するとPro機能をご利用いただけます。');
    } else if (result.status === 'no_entitlement') {
      Alert.alert(
        '購入を確認しています',
        '購入を復元してもPro機能が有効にならない場合は、サポートへお問い合わせください。'
      );
    } else if (result.status === 'error') {
      Alert.alert('購入を完了できませんでした', '通信状況をご確認のうえ、再度お試しください。');
    }
  }

  async function handlePurchase() {
    if (!product) return;

    setProcessing(true);
    const result = await purchasePro(product);
    setProcessing(false);
    showPurchaseOutcome(result);
  }

  async function handleRestore() {
    setProcessing(true);
    const result = await restorePurchases();
    setProcessing(false);
    if (result.status === 'success') {
      setProActive(true);
      Alert.alert('復元しました', 'Pro機能が有効になりました。', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } else if (result.status === 'no_entitlement') {
      Alert.alert('復元できませんでした', '購入履歴が見つかりませんでした。');
    } else if (result.status === 'error') {
      Alert.alert('復元を完了できませんでした', '通信状況をご確認のうえ、再度お試しください。');
    }
  }

  const priceLabel = product?.product.priceString;
  const unavailable = !productLoading && !product;

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
          <Text style={styles.priceNote}>
            {productLoading
              ? '価格を読み込み中...'
              : priceLabel
                ? `買い切り ${priceLabel}（税込）`
                : '購入情報を取得できませんでした'}
          </Text>
          <TouchableOpacity
            style={[
              styles.purchaseBtn,
              (processing || productLoading || unavailable) && styles.purchaseBtnDisabled,
            ]}
            onPress={handlePurchase}
            disabled={processing || productLoading || unavailable}
            activeOpacity={0.8}
          >
            {processing || productLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.purchaseBtnText}>
                {priceLabel ? `${priceLabel} で購入する` : '現在購入できません'}
              </Text>
            )}
          </TouchableOpacity>
          {unavailable && (
            <TouchableOpacity onPress={loadProduct} disabled={processing} activeOpacity={0.7}>
              <Text style={styles.retryText}>購入情報を再読み込みする</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={handleRestore} disabled={processing} activeOpacity={0.7}>
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
  retryText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600',
  },
  legalNote: {
    fontSize: 10,
    color: Colors.ink3,
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 8,
  },
});
