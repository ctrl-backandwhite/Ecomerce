/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  ProfileRepository                                           ║
 * ║                                                              ║
 * ║  User profile, addresses, payment methods, favorites:        ║
 * ║    GET  /api/v1/profile/me                                   ║
 * ║    PUT  /api/v1/profile/me                                   ║
 * ║    PUT  /api/v1/profile/me/avatar                            ║
 * ║    GET  /api/v1/addresses                                    ║
 * ║    POST /api/v1/addresses                                    ║
 * ║    PUT  /api/v1/addresses/{id}                               ║
 * ║    DELETE /api/v1/addresses/{id}                              ║
 * ║    PATCH /api/v1/addresses/{id}/default                      ║
 * ║    GET  /api/v1/payment-methods                              ║
 * ║    POST /api/v1/payment-methods                              ║
 * ║    PUT  /api/v1/payment-methods/{id}                          ║
 * ║    DELETE /api/v1/payment-methods/{id}                       ║
 * ║    PATCH /api/v1/payment-methods/{id}/default                ║
 * ║    GET  /api/v1/favorites                                    ║
 * ║    POST /api/v1/favorites/{productId}                        ║
 * ║    DELETE /api/v1/favorites/{productId}                      ║
 * ║    GET  /api/v1/favorites/check/{productId}                  ║
 * ║    GET  /api/v1/notification-prefs                           ║
 * ║    PUT  /api/v1/notification-prefs                           ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

import { authFetch } from "../lib/authFetch";
import { handleRes, wrapErr } from "../lib/apiHelpers";
import { ApiError } from "../lib/AppError";
import { API_BASE } from "../config/api";

// ── Types ────────────────────────────────────────────────────────────────────

export interface UserProfile {
    id: string;
    userId: string;
    firstName: string | null;
    lastName: string | null;
    nickName: string | null;
    email: string | null;
    phone: string | null;
    birthDate: string | null;
    avatarUrl: string | null;
    documentType: string | null;
    documentNumber: string | null;
    memberSince: string;
    loyaltyPoints: number;
    profileSynced: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface ProfilePayload {
    phone?: string;
    birthDate?: string;
    documentType?: string;
    documentNumber?: string;
    avatarUrl?: string;
}

export interface SyncIdentityPayload {
    firstName: string;
    lastName: string;
    nickName: string;
    email: string;
}

export interface Address {
    id: string;
    userId?: string;
    label: string;
    type: "HOME" | "STORE_PICKUP" | "PICKUP_POINT";
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phone?: string;
    storeId?: string;
    pickupPointId?: string;
    isDefault: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export interface AddressPayload {
    label: string;
    type: "HOME" | "STORE_PICKUP" | "PICKUP_POINT";
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phone?: string;
    storeId?: string;
    pickupPointId?: string;
    isDefault?: boolean;
}

export interface PaymentMethod {
    id: string;
    userId?: string;
    type: "CARD" | "PAYPAL" | "USDT" | "BTC";
    label: string;
    last4?: string;
    brand?: string;
    expiryMonth?: number;
    expiryYear?: number;
    paypalEmail?: string;
    walletAddress?: string;
    isDefault: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export interface PaymentMethodPayload {
    type: "CARD" | "PAYPAL" | "USDT" | "BTC";
    label: string;
    last4?: string;
    brand?: string;
    expiryMonth?: number;
    expiryYear?: number;
    paypalEmail?: string;
    walletAddress?: string;
    isDefault?: boolean;
}

export interface NotificationPrefs {
    emailOrders: boolean;
    emailPromos: boolean;
    smsOrders: boolean;
    smsPromos: boolean;
}

export interface ChangePasswordRequest {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}

export interface ConfirmPasswordChange {
    code: string;
}

export interface OperationResponse {
    code: string;
    message: string;
    details: string[];
    dateTime: string;
}

export interface UserSessionInfo {
    sessionId: string;
    deviceInfo: string;
    ipAddress: string;
    createdAt: string;
    lastActiveAt: string;
}

export interface RevokeSessionRequest {
    sessionId: string;
}

export interface ConfirmRevokeSession {
    code: string;
}

// ── Repository ───────────────────────────────────────────────────────────────

class ProfileRepository {
    // ── Profile ────────────────────────────────────────────────────

    async getMyProfile(): Promise<UserProfile> {
        try {
            const res = await authFetch(`${API_BASE}/api/v1/profile/me`);
            return handleRes<UserProfile>(res);
        } catch (err) { wrapErr(err, "No se pudo obtener el perfil"); }
    }

    async syncIdentity(data: SyncIdentityPayload): Promise<UserProfile> {
        try {
            const res = await authFetch(`${API_BASE}/api/v1/profile/me/sync`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            return handleRes<UserProfile>(res);
        } catch (err) { wrapErr(err, "No se pudo sincronizar la identidad"); }
    }

    async updateMyProfile(data: ProfilePayload): Promise<UserProfile> {
        try {
            const res = await authFetch(`${API_BASE}/api/v1/profile/me`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            return handleRes<UserProfile>(res);
        } catch (err) { wrapErr(err, "No se pudo actualizar el perfil"); }
    }

    async updateAvatar(file: File): Promise<UserProfile> {
        try {
            const form = new FormData();
            form.append("avatar", file);
            const res = await authFetch(`${API_BASE}/api/v1/profile/me/avatar`, {
                method: "PUT",
                body: form,
            });
            return handleRes<UserProfile>(res);
        } catch (err) { wrapErr(err, "No se pudo actualizar el avatar"); }
    }

    async updateAvatarUrl(avatarUrl: string): Promise<UserProfile> {
        try {
            const res = await authFetch(`${API_BASE}/api/v1/profile/me/avatar`, {
                method: "PUT",
                headers: { "Content-Type": "text/plain" },
                body: avatarUrl,
            });
            return handleRes<UserProfile>(res);
        } catch (err) { wrapErr(err, "No se pudo actualizar el avatar"); }
    }

    // ── Addresses ──────────────────────────────────────────────────

    async getAddresses(): Promise<Address[]> {
        try {
            const res = await authFetch(`${API_BASE}/api/v1/addresses`);
            return handleRes<Address[]>(res);
        } catch (err) { wrapErr(err, "No se pudieron obtener las direcciones"); }
    }

    async createAddress(data: AddressPayload): Promise<Address> {
        try {
            const res = await authFetch(`${API_BASE}/api/v1/addresses`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            return handleRes<Address>(res);
        } catch (err) { wrapErr(err, "No se pudo crear la dirección"); }
    }

    async updateAddress(id: string, data: AddressPayload): Promise<Address> {
        try {
            const res = await authFetch(`${API_BASE}/api/v1/addresses/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            return handleRes<Address>(res);
        } catch (err) { wrapErr(err, "No se pudo actualizar la dirección"); }
    }

    async deleteAddress(id: string): Promise<void> {
        try {
            const res = await authFetch(`${API_BASE}/api/v1/addresses/${id}`, { method: "DELETE" });
            if (!res.ok) throw new ApiError(res.status, `HTTP ${res.status}`);
        } catch (err) { wrapErr(err, "No se pudo eliminar la dirección"); }
    }

    async setDefaultAddress(id: string): Promise<void> {
        try {
            const res = await authFetch(`${API_BASE}/api/v1/addresses/${id}/default`, {
                method: "PATCH", headers: { accept: "*/*" },
            });
            if (!res.ok) throw new ApiError(res.status, `HTTP ${res.status}`);
        } catch (err) { wrapErr(err, "No se pudo establecer la dirección por defecto"); }
    }

    // ── Payment Methods ────────────────────────────────────────────

    async getPaymentMethods(): Promise<PaymentMethod[]> {
        try {
            const res = await authFetch(`${API_BASE}/api/v1/payment-methods`);
            return handleRes<PaymentMethod[]>(res);
        } catch (err) { wrapErr(err, "No se pudieron obtener los métodos de pago"); }
    }

    async createPaymentMethod(data: PaymentMethodPayload): Promise<PaymentMethod> {
        try {
            const res = await authFetch(`${API_BASE}/api/v1/payment-methods`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            return handleRes<PaymentMethod>(res);
        } catch (err) { wrapErr(err, "No se pudo crear el método de pago"); }
    }

    async deletePaymentMethod(id: string): Promise<void> {
        try {
            const res = await authFetch(`${API_BASE}/api/v1/payment-methods/${id}`, { method: "DELETE" });
            if (!res.ok) throw new ApiError(res.status, `HTTP ${res.status}`);
        } catch (err) { wrapErr(err, "No se pudo eliminar el método de pago"); }
    }

    async updatePaymentMethod(id: string, data: PaymentMethodPayload): Promise<PaymentMethod> {
        try {
            const res = await authFetch(`${API_BASE}/api/v1/payment-methods/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            return handleRes<PaymentMethod>(res);
        } catch (err) { wrapErr(err, "No se pudo actualizar el método de pago"); }
    }

    async setDefaultPaymentMethod(id: string): Promise<void> {
        try {
            const res = await authFetch(`${API_BASE}/api/v1/payment-methods/${id}/default`, {
                method: "PATCH", headers: { accept: "*/*" },
            });
            if (!res.ok) throw new ApiError(res.status, `HTTP ${res.status}`);
        } catch (err) { wrapErr(err, "No se pudo establecer el método de pago por defecto"); }
    }

    // ── Favorites ──────────────────────────────────────────────────

    async getFavorites(): Promise<string[]> {
        try {
            const res = await authFetch(`${API_BASE}/api/v1/favorites?size=1000`);
            const page = await handleRes<{ content: { productId: string }[] }>(res);
            return (page.content ?? []).map((f) => f.productId);
        } catch (err) { wrapErr(err, "No se pudieron obtener los favoritos"); }
    }

    async addFavorite(productId: string): Promise<void> {
        try {
            const res = await authFetch(`${API_BASE}/api/v1/favorites/${productId}`, { method: "POST" });
            if (!res.ok) throw new ApiError(res.status, `HTTP ${res.status}`);
        } catch (err) { wrapErr(err, "No se pudo agregar a favoritos"); }
    }

    async removeFavorite(productId: string): Promise<void> {
        try {
            const res = await authFetch(`${API_BASE}/api/v1/favorites/${productId}`, { method: "DELETE" });
            if (!res.ok) throw new ApiError(res.status, `HTTP ${res.status}`);
        } catch (err) { wrapErr(err, "No se pudo eliminar de favoritos"); }
    }

    async isFavorite(productId: string): Promise<boolean> {
        try {
            const res = await authFetch(`${API_BASE}/api/v1/favorites/check/${productId}`);
            return handleRes<boolean>(res);
        } catch (err) { wrapErr(err, "No se pudo verificar favorito"); }
    }

    // ── Notification Prefs ─────────────────────────────────────────

    async getNotificationPrefs(): Promise<NotificationPrefs> {
        try {
            const res = await authFetch(`${API_BASE}/api/v1/notification-prefs`);
            return handleRes<NotificationPrefs>(res);
        } catch (err) { wrapErr(err, "No se pudieron obtener las preferencias de notificación"); }
    }

    async updateNotificationPrefs(data: NotificationPrefs): Promise<NotificationPrefs> {
        try {
            const res = await authFetch(`${API_BASE}/api/v1/notification-prefs`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            return handleRes<NotificationPrefs>(res);
        } catch (err) { wrapErr(err, "No se pudieron actualizar las preferencias de notificación"); }
    }

    // ── Password Change ────────────────────────────────────────────

    async requestPasswordChange(data: ChangePasswordRequest): Promise<OperationResponse> {
        try {
            const res = await authFetch(`${API_BASE}/api/v1/users/change-password/request`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            return handleRes<OperationResponse>(res);
        } catch (err) { wrapErr(err, "No se pudo solicitar el cambio de contraseña"); }
    }

    async confirmPasswordChange(data: ConfirmPasswordChange): Promise<OperationResponse> {
        try {
            const res = await authFetch(`${API_BASE}/api/v1/users/change-password/confirm`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            return handleRes<OperationResponse>(res);
        } catch (err) { wrapErr(err, "No se pudo confirmar el cambio de contraseña"); }
    }

    // ── Active Sessions ────────────────────────────────────────────

    async getActiveSessions(): Promise<UserSessionInfo[]> {
        try {
            const res = await authFetch(`${API_BASE}/api/v1/users/sessions`);
            return handleRes<UserSessionInfo[]>(res);
        } catch (err) { wrapErr(err, "No se pudieron obtener las sesiones activas"); }
    }

    async requestSessionRevoke(data: RevokeSessionRequest): Promise<OperationResponse> {
        try {
            const res = await authFetch(`${API_BASE}/api/v1/users/sessions/revoke/request`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            return handleRes<OperationResponse>(res);
        } catch (err) { wrapErr(err, "No se pudo solicitar el cierre de sesión"); }
    }

    async confirmSessionRevoke(data: ConfirmRevokeSession): Promise<OperationResponse> {
        try {
            const res = await authFetch(`${API_BASE}/api/v1/users/sessions/revoke/confirm`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            return handleRes<OperationResponse>(res);
        } catch (err) { wrapErr(err, "No se pudo confirmar el cierre de sesión"); }
    }
}

export const profileRepository = new ProfileRepository();
