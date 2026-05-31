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
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import {
  getProPlans,
  purchasePro,
  restorePurchases,
  type ProOperationResult,
  type ProPlans,
  type ProProduct,
} from '@/src/pro/revenuecat';
import { setProActive } from '@/src/pro/gate';
import { useTheme, useThemedStyles } from '@/src/theme/ThemeProvider';
import { type ThemeColors } from '@/src/theme/colors';
import { useT } from '@/src/i18n';
import Sheep from '@/src/components/Sheep';

const FEATURE_ICONS: (keyof typeof Ionicons.glyphMap)[] = [
  'stats-chart',
  'calendar',
  'infinite',
  'download-outline',
];

type PlanKey = 'monthly' | 'lifetime';

export default function ProModalScreen() {
  const t = useT();
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  const [plans, setPlans] = useState<ProPlans | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<PlanKey>('monthly');
  const [processing, setProcessing] = useState(false);

  const loadPlans = useCallback(async () => {
    setLoading(true);
    const next = await getProPlans();
    setPlans(next);
    setSelected(next.monthly ? 'monthly' : 'lifetime');
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadPlans();
  }, [loadPlans]);

  function showOutcome(result: ProOperationResult) {
    if (result.status === 'success') {
      setProActive(true);
      Alert.alert(t.proModal.successTitle, t.proModal.successBody, [{ text: 'OK', onPress: () => router.back() }]);
    } else if (result.status === 'pending') {
      Alert.alert(t.proModal.pendingTitle, t.proModal.pendingBody);
    } else if (result.status === 'no_entitlement') {
      Alert.alert(t.proModal.noEntitlementTitle, t.proModal.noEntitlementBody);
    } else if (result.status === 'error') {
      Alert.alert(t.proModal.errorTitle, t.proModal.errorBody);
    }
  }

  const selectedProduct: ProProduct | null =
    selected === 'monthly' ? plans?.monthly ?? null : plans?.lifetime ?? null;

  async function handlePurchase() {
    if (!selectedProduct) return;
    setProcessing(true);
    const result = await purchasePro(selectedProduct);
    setProcessing(false);
    showOutcome(result);
  }

  async function handleRestore() {
    setProcessing(true);
    const result = await restorePurchases();
    setProcessing(false);
    if (result.status === 'success') {
      setProActive(true);
      Alert.alert(t.proModal.successTitle, t.proModal.successBody, [{ text: 'OK', onPress: () => router.back() }]);
    } else if (result.status === 'no_entitlement') {
      Alert.alert(t.proModal.restoreNoneTitle, t.proModal.restoreNoneBody);
    } else if (result.status === 'error') {
      Alert.alert(t.proModal.errorTitle, t.proModal.errorBody);
    }
  }

  const unavailable = !loading && !plans?.monthly && !plans?.lifetime;
  const ctaLabel = selected === 'monthly' ? t.proModal.subscribeCta : t.proModal.purchaseCta;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
        <Ionicons name="close" size={18} color={colors.ink2} />
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.heroSection}>
          <Sheep pose="read" size={80} />
          <Text style={styles.heroTitle}>NapFit Pro</Text>
          <Text style={styles.heroSub}>{t.proModal.heroSub}</Text>
        </View>

        <View style={styles.featureList}>
          {FEATURE_ICONS.map((icon, i) => (
            <View key={icon} style={styles.featureRow}>
              <View style={styles.featureIcon}>
                <Ionicons name={icon} size={22} color={colors.primary} />
              </View>
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>{t.proModal.features[i].title}</Text>
                <Text style={styles.featureDesc}>{t.proModal.features[i].desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginVertical: 16 }} />
        ) : (
          <View style={styles.plans}>
            {plans?.monthly && (
              <PlanCard
                selected={selected === 'monthly'}
                onPress={() => setSelected('monthly')}
                label={t.proModal.planMonthly}
                price={plans.monthly.product.priceString}
                suffix={t.proModal.perMonth}
              />
            )}
            {plans?.lifetime && (
              <PlanCard
                selected={selected === 'lifetime'}
                onPress={() => setSelected('lifetime')}
                label={t.proModal.planLifetime}
                price={plans.lifetime.product.priceString}
                note={t.proModal.oneTimeNote}
              />
            )}
          </View>
        )}

        <View style={styles.bottom}>
          <TouchableOpacity
            style={[styles.purchaseBtn, (processing || loading || unavailable) && styles.purchaseBtnDisabled]}
            onPress={handlePurchase}
            disabled={processing || loading || unavailable}
            activeOpacity={0.8}
          >
            {processing ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.purchaseBtnText}>{unavailable ? t.proModal.unavailable : ctaLabel}</Text>
            )}
          </TouchableOpacity>

          {unavailable && (
            <TouchableOpacity onPress={loadPlans} disabled={processing} activeOpacity={0.7}>
              <Text style={styles.retryText}>{t.proModal.retry}</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity onPress={handleRestore} disabled={processing} activeOpacity={0.7}>
            <Text style={styles.restoreText}>{t.proModal.restore}</Text>
          </TouchableOpacity>

          <Text style={styles.legalNote}>{t.proModal.legal}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function PlanCard({
  selected,
  onPress,
  label,
  price,
  suffix,
  note,
}: {
  selected: boolean;
  onPress: () => void;
  label: string;
  price: string;
  suffix?: string;
  note?: string;
}) {
  const styles = useThemedStyles(makeStyles);
  return (
    <TouchableOpacity
      style={[styles.planCard, selected && styles.planCardSelected]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={styles.planRadioWrap}>
        <View style={[styles.planRadio, selected && styles.planRadioSelected]}>
          {selected && <View style={styles.planRadioDot} />}
        </View>
      </View>
      <View style={styles.planInfo}>
        <Text style={styles.planLabel}>{label}</Text>
        {note ? <Text style={styles.planNote}>{note}</Text> : null}
      </View>
      <View style={styles.planPriceWrap}>
        <Text style={styles.planPrice}>{price}</Text>
        {suffix ? <Text style={styles.planSuffix}>{suffix}</Text> : null}
      </View>
    </TouchableOpacity>
  );
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    closeBtn: {
      position: 'absolute',
      top: 56,
      right: 20,
      zIndex: 10,
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: c.backgroundAlt,
      alignItems: 'center',
      justifyContent: 'center',
    },
    scroll: { padding: 24, paddingTop: 16 },
    heroSection: { alignItems: 'center', paddingTop: 16, paddingBottom: 20, gap: 10 },
    heroTitle: { fontSize: 28, fontWeight: '800', color: c.ink, letterSpacing: -0.5 },
    heroSub: { fontSize: 14, color: c.ink2 },
    featureList: { backgroundColor: c.card, borderRadius: 18, padding: 16, gap: 14, marginBottom: 20 },
    featureRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    featureIcon: { width: 32, alignItems: 'center' },
    featureText: { flex: 1 },
    featureTitle: { fontSize: 13, fontWeight: '700', color: c.ink },
    featureDesc: { fontSize: 11.5, color: c.ink3, marginTop: 1 },
    plans: { gap: 10, marginBottom: 20 },
    planCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.card,
      borderRadius: 16,
      padding: 16,
      borderWidth: 2,
      borderColor: 'transparent',
      gap: 12,
    },
    planCardSelected: { borderColor: c.primary, backgroundColor: c.primarySoft },
    planRadioWrap: { width: 22 },
    planRadio: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: c.ink4,
      alignItems: 'center',
      justifyContent: 'center',
    },
    planRadioSelected: { borderColor: c.primary },
    planRadioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: c.primary },
    planInfo: { flex: 1 },
    planLabel: { fontSize: 15, fontWeight: '700', color: c.ink },
    planNote: { fontSize: 11, color: c.ink3, marginTop: 2 },
    planPriceWrap: { flexDirection: 'row', alignItems: 'flex-end' },
    planPrice: { fontSize: 18, fontWeight: '800', color: c.ink },
    planSuffix: { fontSize: 12, fontWeight: '600', color: c.ink2, marginBottom: 2, marginLeft: 1 },
    bottom: { alignItems: 'center', gap: 12 },
    purchaseBtn: {
      width: '100%',
      height: 54,
      borderRadius: 16,
      backgroundColor: c.primary,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: c.primary,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.3,
      shadowRadius: 18,
      elevation: 6,
    },
    purchaseBtnDisabled: { opacity: 0.6 },
    purchaseBtnText: { fontSize: 16, fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.2 },
    retryText: { fontSize: 12, color: c.primary, fontWeight: '600' },
    restoreText: { fontSize: 12, color: c.ink3, textDecorationLine: 'underline' },
    legalNote: { fontSize: 10, color: c.ink3, textAlign: 'center', lineHeight: 16, paddingHorizontal: 8 },
  });
