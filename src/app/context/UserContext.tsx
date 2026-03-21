import { createContext, useContext, useState, type ReactNode } from "react";

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
  documentType: "dni" | "passport" | "ce" | "other";
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

interface UserContextType {
  user: UserProfile;
  updateProfile: (data: Partial<UserProfile>) => void;
  addAddress: (address: Omit<Address, "id">) => void;
  updateAddress: (id: string, data: Partial<Address>) => void;
  removeAddress: (id: string) => void;
  toggleFavorite: (productId: string) => void;
  isFavorite: (productId: string) => boolean;
  addPaymentMethod: (pm: Omit<PaymentMethod, "id">) => void;
  removePaymentMethod: (id: string) => void;
  setDefaultPaymentMethod: (id: string) => void;
}

const defaultUser: UserProfile = {
  id: "u-001",
  firstName: "James",
  lastName: "Carter",
  username: "james.carter",
  email: "james.carter@email.com",
  phone: "+1 (212) 555-0147",
  birthDate: "1990-07-15",
  avatar: "",
  memberSince: "2023-03-10",
  totalOrders: 12,
  totalSpent: 3847,
  loyaltyPoints: 1240,
  documentType: "passport",
  documentNumber: "US-A12345678",
  isSeller: true,
  faceVerified: false,
  faceVerificationStatus: "unverified",
  store: {
    name: "Tech Zone NYC",
    slug: "tech-zone-nyc",
    description: "Specialist store for tech, accessories and next-gen gadgets. Fast shipping across the US and UK.",
    category: "Tecnología",
    phone: "+1 (212) 555-0193",
    email: "sales@techzonenyc.com",
    website: "https://techzonenyc.com",
    instagram: "@techzonenyc",
    facebook: "techzonenyc",
    tiktok: "@techzonenyc",
    status: "active",
    totalSales: 148,
    totalRevenue: 12480000,
    rating: 4.7,
    reviewCount: 83,
    returnPolicy: "We accept returns within 30 days of delivery. Items must be in their original packaging and unused condition.",
    shippingPolicy: "Orders dispatched within 24–48 business hours. Free shipping on orders over $75.",
  },
  addresses: [
    {
      id: "addr-1",
      label: "Home",
      name: "James Carter",
      street: "742 Evergreen Terrace, Apt 4B",
      city: "New York",
      state: "NY",
      zip: "10001",
      country: "United States",
      isDefault: true,
      deliveryType: "home",
    },
    {
      id: "addr-2",
      label: "Office",
      name: "James Carter",
      street: "350 Fifth Avenue, Suite 2100",
      city: "New York",
      state: "NY",
      zip: "10118",
      country: "United States",
      isDefault: false,
      deliveryType: "home",
    },
  ],
  paymentMethods: [
    {
      id: "pm-1",
      type: "card",
      label: "Personal Visa",
      isDefault: true,
      cardBrand: "visa",
      cardLast4: "4242",
      cardName: "JAMES CARTER",
      cardExpiry: "09/27",
    },
    {
      id: "pm-2",
      type: "paypal",
      label: "My PayPal",
      isDefault: false,
      paypalEmail: "james.carter@email.com",
    },
  ],
  favoriteIds: ["3", "4", "14", "26", "7"],
  notifications: {
    email: true,
    sms: false,
    promotions: true,
    orderUpdates: true,
  },
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile>(defaultUser);

  const updateProfile = (data: Partial<UserProfile>) => {
    setUser((prev) => ({ ...prev, ...data }));
  };

  const addAddress = (address: Omit<Address, "id">) => {
    setUser((prev) => ({
      ...prev,
      addresses: [
        ...prev.addresses,
        { ...address, id: `addr-${prev.addresses.length + 1}` },
      ],
    }));
  };

  const updateAddress = (id: string, data: Partial<Address>) => {
    setUser((prev) => ({
      ...prev,
      addresses: prev.addresses.map((addr) =>
        addr.id === id ? { ...addr, ...data } : addr
      ),
    }));
  };

  const removeAddress = (id: string) => {
    setUser((prev) => ({
      ...prev,
      addresses: prev.addresses.filter((addr) => addr.id !== id),
    }));
  };

  const toggleFavorite = (productId: string) => {
    setUser((prev) => ({
      ...prev,
      favoriteIds: prev.favoriteIds.includes(productId)
        ? prev.favoriteIds.filter((id) => id !== productId)
        : [...prev.favoriteIds, productId],
    }));
  };

  const isFavorite = (productId: string) => {
    return user.favoriteIds.includes(productId);
  };

  const addPaymentMethod = (pm: Omit<PaymentMethod, "id">) => {
    setUser((prev) => ({
      ...prev,
      paymentMethods: [
        ...prev.paymentMethods,
        { ...pm, id: `pm-${prev.paymentMethods.length + 1}` },
      ],
    }));
  };

  const removePaymentMethod = (id: string) => {
    setUser((prev) => ({
      ...prev,
      paymentMethods: prev.paymentMethods.filter((pm) => pm.id !== id),
    }));
  };

  const setDefaultPaymentMethod = (id: string) => {
    setUser((prev) => ({
      ...prev,
      paymentMethods: prev.paymentMethods.map((pm) =>
        pm.id === id ? { ...pm, isDefault: true } : { ...pm, isDefault: false }
      ),
    }));
  };

  return (
    <UserContext.Provider
      value={{
        user,
        updateProfile,
        addAddress,
        updateAddress,
        removeAddress,
        toggleFavorite,
        isFavorite,
        addPaymentMethod,
        removePaymentMethod,
        setDefaultPaymentMethod,
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