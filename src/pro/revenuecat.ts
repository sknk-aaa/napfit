import Purchases, { LOG_LEVEL, PurchasesPackage } from 'react-native-purchases';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_KEY_IOS = 'appl_ZoBpkBbwboBDiQLJWofAYIHAtNT';

const KEYS = {
  entitlementActive: 'pro:entitlement_active',
  lastVerifiedAt: 'pro:last_verified_at',
} as const;

const VERIFY_INTERVAL_MS = 24 * 60 * 60 * 1000;

export async function initRevenueCat(): Promise<void> {
  Purchases.setLogLevel(LOG_LEVEL.ERROR);
  Purchases.configure({ apiKey: API_KEY_IOS });
}

export async function isPro(): Promise<boolean> {
  const cached = await AsyncStorage.getItem(KEYS.entitlementActive);
  const lastVerified = await AsyncStorage.getItem(KEYS.lastVerifiedAt);
  const now = Date.now();
  const stale =
    !lastVerified || now - new Date(lastVerified).getTime() > VERIFY_INTERVAL_MS;

  if (!stale) {
    return cached === 'true';
  }

  try {
    const info = await Purchases.getCustomerInfo();
    const active = info.entitlements.active['pro'] !== undefined;
    await AsyncStorage.multiSet([
      [KEYS.entitlementActive, String(active)],
      [KEYS.lastVerifiedAt, new Date().toISOString()],
    ]);
    return active;
  } catch {
    return cached === 'true';
  }
}

export async function getProPackage(): Promise<PurchasesPackage | null> {
  try {
    const offerings = await Purchases.getOfferings();
    return offerings.current?.availablePackages[0] ?? null;
  } catch {
    return null;
  }
}

export async function purchasePro(pkg: PurchasesPackage): Promise<boolean> {
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    const active = customerInfo.entitlements.active['pro'] !== undefined;
    await AsyncStorage.multiSet([
      [KEYS.entitlementActive, String(active)],
      [KEYS.lastVerifiedAt, new Date().toISOString()],
    ]);
    return active;
  } catch {
    return false;
  }
}

export async function restorePurchases(): Promise<boolean> {
  try {
    const info = await Purchases.restorePurchases();
    const active = info.entitlements.active['pro'] !== undefined;
    await AsyncStorage.multiSet([
      [KEYS.entitlementActive, String(active)],
      [KEYS.lastVerifiedAt, new Date().toISOString()],
    ]);
    return active;
  } catch {
    return false;
  }
}

export async function getCachedProStatus(): Promise<boolean> {
  const cached = await AsyncStorage.getItem(KEYS.entitlementActive);
  return cached === 'true';
}
