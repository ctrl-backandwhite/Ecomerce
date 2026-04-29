import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { useAuth } from "./AuthContext";
import { profileRepository } from "../repositories/ProfileRepository";
import { orderRepository } from "../repositories/OrderRepository";
import type {
  Address as ApiAddress,
  AddressPayload,
  PaymentMethod as ApiPaymentMethod,
  PaymentMethodPayload,
  NotificationPrefs,
} from "../repositories/ProfileRepository";

export interface Address {
  id: string;
  label: string;
  name: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  isDefault: boolean;
  deliveryType: "home" | "store" | "pickup";
  locationId?: string;
  locationName?: string;
}

export type PayMethodType = "card" | "paypal" | "usdt" | "btc";

export interface PaymentMethod {
  id: string;
  type: PayMethodType;
  label: string;
  isDefault: boolean;
  /* Card */
  cardBrand?: "visa" | "mastercard";
  cardLast4?: string;
  cardName?: string;
  cardExpiry?: string;
  stripePaymentMethodId?: string; // pm_xxx from Stripe.js
  /* PayPal */
  paypalEmail?: string;
  /* Crypto */
  cryptoNetwork?: string;
  cryptoAddress?: string;
}

export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  phone: string;
  birthDate: string;
  avatar: string;
  memberSince: string;
  totalOrders: number;
  totalSpent: number;
  loyaltyPoints: number;
  addresses: Address[];
  paymentMethods: PaymentMethod[];
  favoriteIds: string[];
  documentType: "DNI" | "PASSPORT" | "NIE" | "CIF" | "OTHER" | "";
  documentNumber: string;
  isSeller: boolean;
  faceVerified: boolean;
  faceVerificationStatus: "unverified" | "pending" | "verified" | "rejected";
  notifications: {
    email: boolean;
    sms: boolean;
    promotions: boolean;
    orderUpdates: boolean;
  };
  store: {
    name: string;
    slug: string;
    description: string;
    category: string;
    phone: string;
    email: string;
    website: string;
    instagram: string;
    facebook: string;
    tiktok: string;
    status: "draft" | "pending" | "active" | "suspended";
    totalSales: number;
    totalRevenue: number;
    rating: number;
    reviewCount: number;
    returnPolicy: string;
    shippingPolicy: string;
  };
}

// ── Mappers: API → UI ────────────────────────────────────────────────────────

const ADDRESS_TYPE_TO_UI: Record<string, Address["deliveryType"]> = {
  HOME: "home",
  STORE_PICKUP: "store",
  PICKUP_POINT: "pickup",
};

const ADDRESS_TYPE_TO_API: Record<string, "HOME" | "STORE_PICKUP" | "PICKUP_POINT"> = {
  home: "HOME",
  store: "STORE_PICKUP",
  pickup: "PICKUP_POINT",
};

function mapApiAddress(a: ApiAddress): Address {
  return {
    id: a.id,
    label: a.label ?? "",
    name: a.line2 ?? "",
    street: a.line1 ?? "",
    city: a.city ?? "",
    state: a.state ?? "",
    zip: a.postalCode ?? "",
    country: a.country ?? "",
    isDefault: a.isDefault ?? false,
    deliveryType: ADDRESS_TYPE_TO_UI[a.type] ?? "home",
    locationId: a.storeId ?? a.pickupPointId,
    locationName: a.pickupPointId ?? a.storeId,
  };
}

function mapApiPaymentMethod(pm: ApiPaymentMethod): PaymentMethod {
  const expiryStr =
    pm.expiryMonth != null && pm.expiryYear != null
      ? `${String(pm.expiryMonth).padStart(2, "0")}/${String(pm.expiryYear).slice(-2)}`
      : undefined;
  return {
    id: pm.id,
    type: pm.type.toLowerCase() as PayMethodType,
    label: pm.label ?? "",
    isDefault: pm.isDefault ?? false,
    cardBrand: pm.brand
      ? (pm.brand.toLowerCase() as PaymentMethod["cardBrand"])
      : undefined,
    cardLast4: pm.last4,
    cardExpiry: expiryStr,
    paypalEmail: pm.paypalEmail,
    cryptoAddress: pm.walletAddress,
    stripePaymentMethodId: pm.stripePaymentMethodId,
  };
}

// ── Mappers: UI → API ────────────────────────────────────────────────────────

function toAddressPayload(a: Omit<Address, "id">): AddressPayload {
  return {
    label: a.label,
    type: ADDRESS_TYPE_TO_API[a.deliveryType] ?? "HOME",
    line1: a.street,
    line2: a.name || undefined,
    city: a.city,
    state: a.state,
    postalCode: a.zip,
    country: a.country,
    storeId: a.deliveryType === "store" ? a.locationId : undefined,
    pickupPointId: a.deliveryType === "pickup" ? a.locationId : undefined,
  };
}

function toPaymentMethodPayload(
  pm: Omit<PaymentMethod, "id">,
): PaymentMethodPayload {
  let expiryMonth: number | undefined;
  let expiryYear: number | undefined;
  if (pm.cardExpiry) {
    const [mm, yy] = pm.cardExpiry.split("/");
    expiryMonth = parseInt(mm, 10) || undefined;
    expiryYear = yy ? 2000 + parseInt(yy, 10) : undefined;
  }
  return {
    type: pm.type.toUpperCase() as PaymentMethodPayload["type"],
    label: pm.label,
    last4: pm.cardLast4,
    brand: pm.cardBrand,
    expiryMonth,
    expiryYear,
    paypalEmail: pm.paypalEmail,
    walletAddress: pm.cryptoAddress,
    stripePaymentMethodId: pm.stripePaymentMethodId,
    isDefault: pm.isDefault ?? false,
  };
}

interface UserContextType {
  user: UserProfile;
  loading: boolean;
  updateProfile: (data: Partial<UserProfile>) => void;
  addAddress: (address: Omit<Address, "id">) => Promise<void>;
  updateAddress: (id: string, data: Omit<Address, "id">) => Promise<void>;
  removeAddress: (id: string) => Promise<void>;
  setDefaultAddress: (id: string) => Promise<void>;
  toggleFavorite: (productId: string) => Promise<void>;
  isFavorite: (productId: string) => boolean;
  addPaymentMethod: (pm: Omit<PaymentMethod, "id">) => Promise<void>;
  updatePaymentMethod: (id: string, pm: Omit<PaymentMethod, "id">) => Promise<void>;
  removePaymentMethod: (id: string) => Promise<void>;
  setDefaultPaymentMethod: (id: string) => Promise<void>;
  saveNotificationPrefs: (prefs: UserProfile["notifications"]) => Promise<void>;
  reloadUserData: () => Promise<void>;
}

const emptyUser: UserProfile = {
  id: "",
  firstName: "",
  lastName: "",
  username: "",
  email: "",
  phone: "",
  birthDate: "",
  avatar: "",
  memberSince: "",
  totalOrders: 0,
  totalSpent: 0,
  loyaltyPoints: 0,
  documentType: "",
  documentNumber: "",
  isSeller: false,
  faceVerified: false,
  faceVerificationStatus: "unverified",
  store: {
    name: "",
    slug: "",
    description: "",
    category: "",
    phone: "",
    email: "",
    website: "",
    instagram: "",
    facebook: "",
    tiktok: "",
    status: "draft",
    totalSales: 0,
    totalRevenue: 0,
    rating: 0,
    reviewCount: 0,
    returnPolicy: "",
    shippingPolicy: "",
  },
  addresses: [],
  paymentMethods: [],
  favoriteIds: [],
  notifications: {
    email: false,
    sms: false,
    promotions: false,
    orderUpdates: false,
  },
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [user, setUser] = useState<UserProfile>(emptyUser);
  const [loading, setLoading] = useState(true);

  // ── Load all user data in parallel ───────────────────────────────────────

  const loadUserData = useCallback(async () => {
    setLoading(true);
    try {
      const [profileRes, addressesRes, paymentsRes, favoritesRes, notifsRes, ordersRes] =
        await Promise.allSettled([
          profileRepository.getMyProfile(),
          profileRepository.getAddresses(),
          profileRepository.getPaymentMethods(),
          profileRepository.getFavorites(),
          profileRepository.getNotificationPrefs(),
          // size=1 is enough — we only need totalElements for the badge.
          orderRepository.getMyOrders(0, 1),
        ]);

      setUser((prev) => {
        const next = { ...prev };

        if (profileRes.status === "fulfilled") {
          const p = profileRes.value;
          next.id = p.id;
          next.firstName = p.firstName ?? "";
          next.lastName = p.lastName ?? "";
          next.username = p.nickName ?? p.email ?? "";
          next.email = p.email ?? "";
          next.phone = p.phone ?? "";
          next.birthDate = p.birthDate ?? "";
          next.avatar = p.avatarUrl ?? "";
          next.documentType = (p.documentType ?? "") as UserProfile["documentType"];
          next.documentNumber = p.documentNumber ?? "";
          next.memberSince = p.memberSince;
          next.loyaltyPoints = p.loyaltyPoints;
        }

        if (addressesRes.status === "fulfilled") {
          next.addresses = addressesRes.value.map(mapApiAddress);
        }

        if (paymentsRes.status === "fulfilled") {
          next.paymentMethods = paymentsRes.value.map(mapApiPaymentMethod);
        }

        if (favoritesRes.status === "fulfilled") {
          next.favoriteIds = favoritesRes.value;
        }

        if (notifsRes.status === "fulfilled") {
          const n = notifsRes.value;
          next.notifications = {
            email: n.emailOrders ?? false,
            sms: n.smsOrders ?? false,
            promotions: n.emailPromos ?? false,
            orderUpdates: n.smsPromos ?? false,
          };
        }

        if (ordersRes.status === "fulfilled") {
          next.totalOrders = ordersRes.value.totalElements ?? 0;
        }

        return next;
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Only load user data when auth is resolved and user is authenticated
    if (authLoading) return;
    if (!isAuthenticated) {
      setUser(emptyUser);
      setLoading(false);
      return;
    }
    loadUserData();
  }, [loadUserData, authLoading, isAuthenticated]);

  // ── Profile (local-only for now) ─────────────────────────────────────────

  const updateProfile = (data: Partial<UserProfile>) => {
    setUser((prev) => ({ ...prev, ...data }));
  };

  // ── Addresses ────────────────────────────────────────────────────────────

  const addAddress = async (address: Omit<Address, "id">) => {
    const created = await profileRepository.createAddress(toAddressPayload(address));
    if (address.isDefault) {
      await profileRepository.setDefaultAddress(created.id);
    }
    const fresh = await profileRepository.getAddresses();
    setUser((prev) => ({ ...prev, addresses: fresh.map(mapApiAddress) }));
  };

  const updateAddress = async (id: string, data: Omit<Address, "id">) => {
    await profileRepository.updateAddress(id, toAddressPayload(data));
    if (data.isDefault) {
      await profileRepository.setDefaultAddress(id);
    }
    const fresh = await profileRepository.getAddresses();
    setUser((prev) => ({ ...prev, addresses: fresh.map(mapApiAddress) }));
  };

  const removeAddress = async (id: string) => {
    await profileRepository.deleteAddress(id);
    setUser((prev) => ({
      ...prev,
      addresses: prev.addresses.filter((addr) => addr.id !== id),
    }));
  };

  const setDefaultAddress = async (id: string) => {
    await profileRepository.setDefaultAddress(id);
    const fresh = await profileRepository.getAddresses();
    setUser((prev) => ({ ...prev, addresses: fresh.map(mapApiAddress) }));
  };

  // ── Favorites ────────────────────────────────────────────────────────────

  const toggleFavorite = async (productId: string) => {
    const removing = user.favoriteIds.includes(productId);
    // Optimistic local update
    setUser((prev) => ({
      ...prev,
      favoriteIds: removing
        ? prev.favoriteIds.filter((id) => id !== productId)
        : [...prev.favoriteIds, productId],
    }));
    try {
      if (removing) {
        await profileRepository.removeFavorite(productId);
      } else {
        await profileRepository.addFavorite(productId);
      }
      const fresh = await profileRepository.getFavorites();
      setUser((prev) => ({ ...prev, favoriteIds: fresh }));
    } catch {
      // Revert on error
      setUser((prev) => ({
        ...prev,
        favoriteIds: removing
          ? [...prev.favoriteIds, productId]
          : prev.favoriteIds.filter((id) => id !== productId),
      }));
    }
  };

  const isFavorite = (productId: string) => {
    return user.favoriteIds.includes(productId);
  };

  // ── Payment Methods ──────────────────────────────────────────────────────

  const addPaymentMethod = async (pm: Omit<PaymentMethod, "id">) => {
    const created = await profileRepository.createPaymentMethod(toPaymentMethodPayload(pm));
    if (pm.isDefault) {
      await profileRepository.setDefaultPaymentMethod(created.id);
    }
    const fresh = await profileRepository.getPaymentMethods();
    setUser((prev) => ({ ...prev, paymentMethods: fresh.map(mapApiPaymentMethod) }));
  };

  const removePaymentMethod = async (id: string) => {
    await profileRepository.deletePaymentMethod(id);
    setUser((prev) => ({
      ...prev,
      paymentMethods: prev.paymentMethods.filter((pm) => pm.id !== id),
    }));
  };

  const updatePaymentMethod = async (id: string, pm: Omit<PaymentMethod, "id">) => {
    await profileRepository.updatePaymentMethod(id, toPaymentMethodPayload(pm));
    const fresh = await profileRepository.getPaymentMethods();
    setUser((prev) => ({ ...prev, paymentMethods: fresh.map(mapApiPaymentMethod) }));
  };

  const setDefaultPaymentMethod = async (id: string) => {
    await profileRepository.setDefaultPaymentMethod(id);
    const fresh = await profileRepository.getPaymentMethods();
    setUser((prev) => ({ ...prev, paymentMethods: fresh.map(mapApiPaymentMethod) }));
  };

  // ── Notification Preferences ─────────────────────────────────────────────

  const saveNotificationPrefs = async (prefs: UserProfile["notifications"]) => {
    const apiPrefs: NotificationPrefs = {
      emailOrders: prefs.email,
      emailPromos: prefs.promotions,
      smsOrders: prefs.sms,
      smsPromos: prefs.orderUpdates,
    };
    const updated = await profileRepository.updateNotificationPrefs(apiPrefs);
    setUser((prev) => ({
      ...prev,
      notifications: {
        email: updated.emailOrders ?? false,
        sms: updated.smsOrders ?? false,
        promotions: updated.emailPromos ?? false,
        orderUpdates: updated.smsPromos ?? false,
      },
    }));
  };

  // ── Provider ─────────────────────────────────────────────────────────────

  return (
    <UserContext.Provider
      value={{
        user,
        loading,
        updateProfile,
        addAddress,
        updateAddress,
        removeAddress,
        setDefaultAddress,
        toggleFavorite,
        isFavorite,
        addPaymentMethod,
        updatePaymentMethod,
        removePaymentMethod,
        setDefaultPaymentMethod,
        saveNotificationPrefs,
        reloadUserData: loadUserData,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}