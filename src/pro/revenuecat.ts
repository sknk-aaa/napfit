import AsyncStorage from '@react-native-async-storage/async-storage';
import Purchases, {
  LOG_LEVEL,
  PRODUCT_CATEGORY,
  PURCHASES_ERROR_CODE,
  type CustomerInfo,
  type PurchasesError,
  type PurchasesPackage,
  type PurchasesStoreProduct,
} from 'react-native-purchases';

const API_KEY_IOS = 'appl_ZoBpkBbwboBDiQLJWofAYIHAtNT';
const PRO_PRODUCT_ID = 'com.napfit.pro';
const PRO_ENTITLEMENT_ID = 'pro';

const KEYS = {
  entitlementActive: 'pro:entitlement_active',
  lastVerifiedAt: 'pro:last_verified_at',
} as const;

const VERIFY_INTERVAL_MS = 24 * 60 * 60 * 1000;

let configured = false;

export type ProProduct = {
  product: PurchasesStoreProduct;
  package: PurchasesPackage | null;
};

export type ProOperationResult =
  | { status: 'success' }
  | { status: 'cancelled' }
  | { status: 'pending' }
  | { status: 'no_entitlement' }
  | { status: 'error' };

export async function initRevenueCat(): Promise<void> {
  if (configured) return;

  Purchases.setLogLevel(LOG_LEVEL.ERROR);
  Purchases.configure({ apiKey: API_KEY_IOS });
  configured = true;
}

async function ensureConfigured(): Promise<void> {
  await initRevenueCat();
}

async function updateEntitlementCache(info: CustomerInfo): Promise<boolean> {
  const active = info.entitlements.active[PRO_ENTITLEMENT_ID] !== undefined;
  await AsyncStorage.multiSet([
    [KEYS.entitlementActive, String(active)],
    [KEYS.lastVerifiedAt, new Date().toISOString()],
  ]);
  return active;
}

function getOperationErrorStatus(error: unknown): ProOperationResult {
  const purchasesError = error as Partial<PurchasesError> | undefined;

  if (
    purchasesError?.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR ||
    purchasesError?.userCancelled === true
  ) {
    return { status: 'cancelled' };
  }

  if (purchasesError?.code === PURCHASES_ERROR_CODE.PAYMENT_PENDING_ERROR) {
    return { status: 'pending' };
  }

  return { status: 'error' };
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
    await ensureConfigured();
    const info = await Purchases.getCustomerInfo();
    return await updateEntitlementCache(info);
  } catch {
    return cached === 'true';
  }
}

export async function getProProduct(): Promise<ProProduct | null> {
  try {
    await ensureConfigured();

    try {
      const offerings = await Purchases.getOfferings();
      const offeringPackage = offerings.current?.availablePackages.find(
        (pkg) => pkg.product.identifier === PRO_PRODUCT_ID
      );
      if (offeringPackage) {
        return { product: offeringPackage.product, package: offeringPackage };
      }
    } catch {
      // Fetch directly below when an Offering is unavailable or misconfigured.
    }

    // The purchase still works when a RevenueCat Offering is not being used.
    const products = await Purchases.getProducts(
      [PRO_PRODUCT_ID],
      PRODUCT_CATEGORY.NON_SUBSCRIPTION
    );
    const product = products.find((candidate) => candidate.identifier === PRO_PRODUCT_ID);
    return product ? { product, package: null } : null;
  } catch {
    return null;
  }
}

export async function purchasePro(item: ProProduct): Promise<ProOperationResult> {
  try {
    await ensureConfigured();
    const { customerInfo } = item.package
      ? await Purchases.purchasePackage(item.package)
      : await Purchases.purchaseStoreProduct(item.product);
    const active = await updateEntitlementCache(customerInfo);
    return active ? { status: 'success' } : { status: 'no_entitlement' };
  } catch (error) {
    return getOperationErrorStatus(error);
  }
}

export async function restorePurchases(): Promise<ProOperationResult> {
  try {
    await ensureConfigured();
    const info = await Purchases.restorePurchases();
    const active = await updateEntitlementCache(info);
    return active ? { status: 'success' } : { status: 'no_entitlement' };
  } catch (error) {
    return getOperationErrorStatus(error);
  }
}

export async function getCachedProStatus(): Promise<boolean> {
  const cached = await AsyncStorage.getItem(KEYS.entitlementActive);
  return cached === 'true';
}
