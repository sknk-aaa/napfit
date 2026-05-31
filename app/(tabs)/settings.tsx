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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, router } from 'expo-router';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useTheme, useThemedStyles, type ThemePref } from '@/src/theme/ThemeProvider';
import { type ThemeColors } from '@/src/theme/colors';
import { useLocale, useT, type LangPref } from '@/src/i18n';
import Sheep from '@/src/components/Sheep';
import { isProActive, setProActive } from '@/src/pro/gate';
import { restorePurchases } from '@/src/pro/revenuecat';

const BGM_OPTIONS = [{ id: 'rain' }] as const;
type BgmId = typeof BGM_OPTIONS[number]['id'];

const APP_VERSION = Constants.expoConfig?.version ?? '1.0.1';

export default function SettingsScreen() {
  const { colors, pref: themePref, setPref: setThemePref } = useTheme();
  const { pref: langPref, setPref: setLangPref } = useLocale();
  const t = useT();
  const styles = useThemedStyles(makeStyles);

  const [notifStatus, setNotifStatus] = useState<'granted' | 'denied' | 'undetermined'>('undetermined');
  const [bgmId, setBgmId] = useState<BgmId>('rain');
  const [bgmModalVisible, setBgmModalVisible] = useState(false);
  const [themeModalVisible, setThemeModalVisible] = useState(false);
  const [langModalVisible, setLangModalVisible] = useState(false);
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
      Alert.alert(t.settings.notifBlockedTitle, t.settings.notifBlockedBody, [
        { text: t.settings.cancel, style: 'cancel' },
        { text: t.settings.openSettings, onPress: () => Linking.openSettings() },
      ]);
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
      Alert.alert(t.settings.restoreSuccessTitle, t.settings.restoreSuccessBody);
    } else if (result.status === 'no_entitlement') {
      Alert.alert(t.settings.restoreNoneTitle, t.settings.restoreNoneBody);
    } else if (result.status === 'error') {
      Alert.alert(t.settings.restoreErrorTitle, t.settings.restoreErrorBody);
    }
  }

  const notifLabel =
    notifStatus === 'granted'
      ? t.settings.notificationGranted
      : notifStatus === 'denied'
      ? t.settings.notificationDenied
      : t.settings.notificationUndetermined;

  const themeLabelText =
    themePref === 'light' ? t.settings.themeLight : themePref === 'dark' ? t.settings.themeDark : t.settings.themeSystem;
  const langLabelText =
    langPref === 'ja' ? '日本語' : langPref === 'en' ? 'English' : t.settings.languageSystem;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t.settings.title}</Text>
        <Sheep pose="read" size={36} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={[styles.sectionLabel, styles.sectionLabelFirst]}>{t.settings.sectionDisplay}</Text>
        <View style={styles.listCard}>
          <SettingRow icon="contrast-outline" label={t.settings.theme} detail={themeLabelText} onPress={() => setThemeModalVisible(true)} />
          <SettingRow icon="language-outline" label={t.settings.language} detail={langLabelText} onPress={() => setLangModalVisible(true)} isLast />
        </View>

        <Text style={styles.sectionLabel}>{t.settings.sectionSound}</Text>
        <View style={styles.listCard}>
          <SettingRow
            icon="notifications-outline"
            label={t.settings.notification}
            detail={notifLabel}
            onPress={notifStatus !== 'granted' ? handleNotifRow : undefined}
          />
          <SettingRow icon="musical-notes-outline" label={t.settings.bgm} detail={t.settings.bgmRain} onPress={() => setBgmModalVisible(true)} />
          <SettingRow icon="alarm-outline" label={t.settings.alarmSound} detail={t.settings.alarmDefault} isLast />
        </View>

        <Text style={styles.sectionLabel}>{t.settings.sectionPro}</Text>
        <View style={styles.listCard}>
          {isPro ? (
            <SettingRow icon="sparkles" tint={colors.yellowBtn} label={t.settings.pro} detail={t.settings.proActive} isLast />
          ) : (
            <>
              <SettingRow icon="sparkles" tint={colors.yellowBtn} label={t.settings.pro} detail={t.settings.proUpgrade} onPress={() => router.push('/pro-modal')} />
              <SettingRow
                icon="refresh-outline"
                label={t.settings.proRestore}
                detail={restoring ? t.settings.proRestoring : undefined}
                onPress={restoring ? undefined : handleRestore}
                isLast
              />
            </>
          )}
        </View>

        <Text style={styles.sectionLabel}>{t.settings.sectionInfo}</Text>
        <View style={styles.listCard}>
          <SettingRow
            icon="stats-chart-outline"
            label={t.settings.analytics}
            detail={isPro ? undefined : 'Pro'}
            isPro={!isPro}
            onPress={() => (isPro ? router.push('/analytics') : router.push('/pro-modal'))}
          />
          <SettingRow icon="lock-closed-outline" label={t.settings.privacy} onPress={() => Linking.openURL('https://sknk-aaa.github.io/napfit/privacy.html')} />
          <SettingRow icon="document-text-outline" label={t.settings.terms} onPress={() => Linking.openURL('https://sknk-aaa.github.io/napfit/terms.html')} />
          <SettingRow icon="information-circle-outline" label={t.settings.appInfo} detail={`v${APP_VERSION}`} isLast />
        </View>

        <Text style={styles.version}>NapFit v{APP_VERSION}</Text>
      </ScrollView>

      <SelectModal
        visible={bgmModalVisible}
        title={t.settings.selectBgmTitle}
        options={[{ id: 'rain', label: t.settings.bgmRain }]}
        selectedId={bgmId}
        onSelect={(id) => handleSelectBgm(id as BgmId)}
        onClose={() => setBgmModalVisible(false)}
      />
      <SelectModal
        visible={themeModalVisible}
        title={t.settings.selectThemeTitle}
        options={[
          { id: 'system', label: t.settings.themeSystem },
          { id: 'light', label: t.settings.themeLight },
          { id: 'dark', label: t.settings.themeDark },
        ]}
        selectedId={themePref}
        onSelect={(id) => {
          setThemePref(id as ThemePref);
          setThemeModalVisible(false);
        }}
        onClose={() => setThemeModalVisible(false)}
      />
      <SelectModal
        visible={langModalVisible}
        title={t.settings.selectLanguageTitle}
        options={[
          { id: 'system', label: t.settings.languageSystem },
          { id: 'ja', label: '日本語' },
          { id: 'en', label: 'English' },
        ]}
        selectedId={langPref}
        onSelect={(id) => {
          setLangPref(id as LangPref);
          setLangModalVisible(false);
        }}
        onClose={() => setLangModalVisible(false)}
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
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  return (
    <TouchableOpacity
      style={[styles.row, !isLast && styles.rowBorder]}
      onPress={onPress}
      activeOpacity={onPress ? 0.65 : 1}
      disabled={!onPress}
    >
      <View style={styles.rowIcon}>
        <Ionicons name={icon} size={19} color={tint ?? colors.primary} />
      </View>
      <Text style={styles.rowLabel}>{label}</Text>
      {isPro && <ProBadge />}
      {detail ? <Text style={styles.rowDetail}>{detail}</Text> : null}
      {onPress && <Ionicons name="chevron-forward" size={16} color={colors.ink4} style={styles.chevron} />}
    </TouchableOpacity>
  );
}

function ProBadge() {
  const styles = useThemedStyles(makeStyles);
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
  const { colors } = useTheme();
  const styles = useThemedStyles(makeModalStyles);
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.card}>
          <Text style={styles.title}>{title}</Text>
          {options.map((opt, i) => (
            <TouchableOpacity
              key={opt.id}
              style={[styles.option, i < options.length - 1 && styles.optionBorder]}
              onPress={() => onSelect(opt.id)}
              activeOpacity={0.7}
            >
              <Text style={[styles.optionText, selectedId === opt.id && styles.optionTextSelected]}>{opt.label}</Text>
              {selectedId === opt.id && <Ionicons name="checkmark" size={16} color={colors.primary} />}
            </TouchableOpacity>
          ))}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingHorizontal: 20,
      paddingTop: 8,
      paddingBottom: 8,
    },
    headerTitle: { fontSize: 22, fontWeight: '800', color: c.ink, flex: 1 },
    scroll: { padding: 16, paddingBottom: 40 },
    sectionLabel: {
      fontSize: 12,
      fontWeight: '700',
      color: c.ink2,
      marginLeft: 4,
      marginBottom: 7,
      marginTop: 20,
      letterSpacing: 0.3,
    },
    sectionLabelFirst: { marginTop: 4 },
    listCard: {
      backgroundColor: c.card,
      borderRadius: 16,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },
    row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 14, gap: 8 },
    rowBorder: { borderBottomWidth: 1, borderBottomColor: c.divider },
    rowIcon: { width: 28, alignItems: 'center', justifyContent: 'center' },
    rowLabel: { flex: 1, fontSize: 13, fontWeight: '600', color: c.ink },
    rowDetail: { fontSize: 11.5, color: c.ink3, marginRight: 4 },
    chevron: { width: 16, marginLeft: 2 },
    proBadge: { backgroundColor: c.primaryChip, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
    proBadgeText: { fontSize: 10, fontWeight: '700', color: c.primary, letterSpacing: 0.3 },
    version: { textAlign: 'center', fontSize: 11, color: c.ink3, marginTop: 24 },
  });

const makeModalStyles = (c: ThemeColors) =>
  StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.4)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
    },
    card: {
      backgroundColor: c.card,
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
    title: { fontSize: 17, fontWeight: '700', color: c.ink, marginBottom: 12 },
    option: { flexDirection: 'row', alignItems: 'center', paddingVertical: 13 },
    optionBorder: { borderBottomWidth: 1, borderBottomColor: c.divider },
    optionText: { flex: 1, fontSize: 14, color: c.ink, fontWeight: '500' },
    optionTextSelected: { color: c.primary, fontWeight: '700' },
  });
