import type { Notification } from "../../repositories/NotificationRepository";
import type { AppNotification, NotifType } from "./NotificationsPanel";

function classify(n: Notification): NotifType {
    const tplName = ((n as unknown as { template?: { name?: string } }).template?.name ?? "").toLowerCase();
    const subj = (n.subject ?? "").toLowerCase();
    const hay = `${tplName} ${subj}`;

    if (/factura|invoice|payment|pago|order|pedido|compra|sale|venta|shipped|enviad|delivered|entregad/.test(hay)) return "venta";
    if (/return|devoluc|refund|reembolso/.test(hay)) return "devolucion";
    if (/review|reseña|rating/.test(hay)) return "reseña";
    if (/customer|cliente|login-success|registered|welcome|bienven|activation/.test(hay)) return "cliente";
    if (/stock|alert|alarma|warning|critical|certificate/.test(hay)) return "alerta";
    return "sistema";
}

function relativeTime(iso: string): string {
    try {
        const then = new Date(iso).getTime();
        const diff = Date.now() - then;
        const sec = Math.floor(diff / 1000);
        if (sec < 60) return `hace ${sec}s`;
        const min = Math.floor(sec / 60);
        if (min < 60) return `hace ${min} min`;
        const h = Math.floor(min / 60);
        if (h < 24) return `hace ${h} h`;
        const d = Math.floor(h / 24);
        if (d === 1) return "ayer";
        if (d < 7) return `hace ${d} días`;
        return new Date(iso).toLocaleDateString("es");
    } catch {
        return iso;
    }
}

function inferLink(type: NotifType): string | undefined {
    switch (type) {
        case "venta":      return "/admin/orders";
        case "devolucion": return "/admin/returns";
        case "reseña":     return "/admin/reviews";
        case "cliente":    return "/admin/customers";
        case "alerta":     return "/admin/products";
        default:           return undefined;
    }
}

export function mapToAppNotification(n: Notification, readIds: Set<string>): AppNotification {
    const type = classify(n);
    const id = String(n.id);
    const body = (n as unknown as { variables?: Record<string, unknown> }).variables
        ? Object.entries((n as unknown as { variables: Record<string, unknown> }).variables)
            .slice(0, 3)
            .map(([k, v]) => `${k}: ${v}`)
            .join(" · ")
        : "";
    return {
        id,
        type,
        title: n.subject ?? "(sin asunto)",
        body: body || (n as unknown as { recipient?: string }).recipient || "",
        time: relativeTime(n.createdAt),
        read: readIds.has(id),
        link: inferLink(type),
    };
}

const READ_KEY = "nx036_admin_notif_read";

export function loadReadIds(): Set<string> {
    try {
        const raw = localStorage.getItem(READ_KEY);
        return new Set<string>(raw ? (JSON.parse(raw) as string[]) : []);
    } catch {
        return new Set<string>();
    }
}

export function saveReadIds(ids: Set<string>): void {
    try {
        localStorage.setItem(READ_KEY, JSON.stringify(Array.from(ids)));
    } catch { /* ignore */ }
}
