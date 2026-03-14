import { useState, useMemo } from "react";
import {
  X, Bell, ShoppingBag, AlertTriangle, Settings, Users,
  RotateCcw, Star, Check, CheckCheck, Trash2, ExternalLink,
  Package, CreditCard, Zap, ChevronRight,
} from "lucide-react";
import { Link } from "react-router";

/* ═══════════════════════════════════════════════════════════════
   TYPES
═══════════════════════════════════════════════════════════════ */
export type NotifType = "venta" | "alerta" | "sistema" | "cliente" | "devolucion" | "reseña";

export interface AppNotification {
  id: string;
  type: NotifType;
  title: string;
  body: string;
  time: string;
  read: boolean;
  link?: string;
}

/* ── Default notifications (initial state) ──────────────────── */
export const DEFAULT_NOTIFICATIONS: AppNotification[] = [
  { id:"n01", type:"venta",     title:"Nueva orden recibida",          body:"#NX-001284 · Laura Gómez · $1,899",                 time:"hace 8 min",   read:false, link:"/admin/ordenes" },
  { id:"n02", type:"venta",     title:"Pago confirmado",               body:"#NX-001283 · Andrés Ruiz · $349 via tarjeta",        time:"hace 22 min",  read:false, link:"/admin/ordenes" },
  { id:"n03", type:"alerta",    title:"Stock crítico",                 body:"Sony WH-1000XM5 · solo 3 unidades restantes",        time:"hace 35 min",  read:false, link:"/admin/productos" },
  { id:"n04", type:"cliente",   title:"Nuevo cliente VIP",             body:"Carlos Mendoza alcanzó nivel Premium",               time:"hace 1 h",     read:false, link:"/admin/clientes" },
  { id:"n05", type:"reseña",    title:"Reseña negativa recibida",      body:"iPhone 15 Pro · 2 estrellas · \"Llegó dañado\"",     time:"hace 1 h",     read:false, link:"/admin/resenas" },
  { id:"n06", type:"venta",     title:"Orden completada",              body:"#NX-001281 · Carlos Mendoza · $4,299",               time:"hace 2 h",     read:true,  link:"/admin/ordenes" },
  { id:"n07", type:"devolucion",title:"Solicitud de devolución",       body:"#NX-001270 · Isabel Herrera · $1,599 pendiente",     time:"hace 2 h",     read:false, link:"/admin/devoluciones" },
  { id:"n08", type:"sistema",   title:"Copia de seguridad completada", body:"Backup automático realizado correctamente",          time:"hace 3 h",     read:true  },
  { id:"n09", type:"alerta",    title:"Certificado SSL por vencer",    body:"El certificado vence en 14 días · renovar ahora",    time:"hace 4 h",     read:true,  link:"/admin/configuracion" },
  { id:"n10", type:"venta",     title:"Meta diaria alcanzada",         body:"$8,940 recaudados hoy · 100% de la meta",            time:"hace 4 h",     read:true  },
  { id:"n11", type:"cliente",   title:"Pico de registros",             body:"8 nuevos clientes en las últimas 6 horas",           time:"hace 5 h",     read:true,  link:"/admin/clientes" },
  { id:"n12", type:"reseña",    title:"12 reseñas 5 estrellas",        body:"Sony WH-1000XM5 lidera con 98% satisfacción",        time:"hace 6 h",     read:true,  link:"/admin/resenas" },
  { id:"n13", type:"sistema",   title:"Actualización disponible",      body:"NEXA Admin v2.4.1 · mejoras de rendimiento",         time:"ayer",         read:true  },
  { id:"n14", type:"devolucion",title:"Devolución aprobada",           body:"#NX-001263 · Marcos Molina · $699 reembolsado",      time:"ayer",         read:true,  link:"/admin/devoluciones" },
  { id:"n15", type:"alerta",    title:"Tasa devolución alta",          body:"Alcanzó 6.1% esta semana · umbral recomendado: 5%",  time:"ayer",         read:true,  link:"/admin/reportes" },
  { id:"n16", type:"sistema",   title:"Nuevo administrador añadido",   body:"admin@nexastore.com tiene acceso desde hoy",         time:"hace 2 días",  read:true  },
  { id:"n17", type:"venta",     title:"Orden de alto valor",           body:"#NX-001257 · Héctor Santos · $7,499",               time:"hace 2 días",  read:true,  link:"/admin/ordenes" },
  { id:"n18", type:"cliente",   title:"Cuenta verificada",             body:"Gloria Peña completó verificación de identidad",     time:"hace 3 días",  read:true,  link:"/admin/clientes" },
];

/* ── Type metadata ───────────────────────────────────────────── */
const TYPE_META: Record<NotifType, { label: string; icon: React.ElementType; bg: string; icon_color: string }> = {
  venta:      { label: "Venta",      icon: ShoppingBag, bg: "bg-gray-900",    icon_color: "text-white"        },
  alerta:     { label: "Alerta",     icon: AlertTriangle, bg: "bg-amber-100", icon_color: "text-amber-600"    },
  sistema:    { label: "Sistema",    icon: Settings,    bg: "bg-gray-100",    icon_color: "text-gray-500"     },
  cliente:    { label: "Cliente",    icon: Users,       bg: "bg-blue-100",    icon_color: "text-blue-600"     },
  devolucion: { label: "Devolución", icon: RotateCcw,   bg: "bg-orange-100", icon_color: "text-orange-600"   },
  reseña:     { label: "Reseña",     icon: Star,        bg: "bg-violet-100",  icon_color: "text-violet-600"   },
};

type FilterTab = "todas" | "no_leidas" | "alerta" | "venta" | "sistema";
const TABS: { id: FilterTab; label: string }[] = [
  { id: "todas",     label: "Todas"    },
  { id: "no_leidas", label: "No leídas"},
  { id: "alerta",    label: "Alertas"  },
  { id: "venta",     label: "Ventas"   },
  { id: "sistema",   label: "Sistema"  },
];

/* ═══════════════════════════════════════════════════════════════
   COMPONENT
═══════════════════════════════════════════════════════════════ */
interface Props {
  open: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  onMarkRead:    (id: string) => void;
  onMarkAllRead: () => void;
  onDelete:      (id: string) => void;
  onClearRead:   () => void;
}

export function NotificationsPanel({
  open, onClose, notifications,
  onMarkRead, onMarkAllRead, onDelete, onClearRead,
}: Props) {
  const [tab, setTab] = useState<FilterTab>("todas");
  const [selected, setSelected] = useState<string | null>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  const filtered = useMemo(() => {
    switch (tab) {
      case "no_leidas": return notifications.filter(n => !n.read);
      case "alerta":    return notifications.filter(n => n.type === "alerta");
      case "venta":     return notifications.filter(n => n.type === "venta");
      case "sistema":   return notifications.filter(n => n.type === "sistema");
      default:          return notifications;
    }
  }, [notifications, tab]);

  const tabCount = (t: FilterTab) => {
    if (t === "todas")     return notifications.length;
    if (t === "no_leidas") return notifications.filter(n => !n.read).length;
    if (t === "alerta")    return notifications.filter(n => n.type === "alerta").length;
    if (t === "venta")     return notifications.filter(n => n.type === "venta").length;
    if (t === "sistema")   return notifications.filter(n => n.type === "sistema" || n.type === "devolucion" || n.type === "reseña" || n.type === "cliente").length;
    return 0;
  };

  const selectedNotif = selected ? notifications.find(n => n.id === selected) : null;

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 backdrop-blur-[1px] z-40"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed top-0 right-0 h-full w-[400px] bg-white border-l border-gray-100 shadow-2xl z-50 flex flex-col">

        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="w-8 h-8 bg-gray-900 rounded-xl flex items-center justify-center relative">
            <Bell className="w-3.5 h-3.5 text-white" strokeWidth={1.5} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[9px] text-white flex items-center justify-center font-medium">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-900">Notificaciones</p>
            <p className="text-[11px] text-gray-400">{unreadCount} sin leer · {notifications.length} en total</p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-0.5 px-4 py-2.5 border-b border-gray-50 flex-shrink-0 overflow-x-auto">
          {TABS.map(t => {
            const cnt = tabCount(t.id);
            return (
              <button
                key={t.id}
                onClick={() => { setTab(t.id); setSelected(null); }}
                className={`flex items-center gap-1.5 h-6 px-2.5 text-[11px] rounded-lg whitespace-nowrap transition-colors flex-shrink-0 ${
                  tab === t.id ? "bg-gray-900 text-white" : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
                }`}
              >
                {t.label}
                {cnt > 0 && (
                  <span className={`text-[10px] px-1 min-w-[16px] text-center rounded-full ${
                    tab === t.id ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
                  }`}>
                    {cnt}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Bulk actions */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-50 flex-shrink-0">
          <button
            onClick={onMarkAllRead}
            disabled={unreadCount === 0}
            className="flex items-center gap-1.5 text-[11px] text-gray-500 hover:text-gray-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <CheckCheck className="w-3.5 h-3.5" strokeWidth={1.5} />
            Marcar todas leídas
          </button>
          <button
            onClick={onClearRead}
            className="flex items-center gap-1.5 text-[11px] text-gray-400 hover:text-red-600 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
            Limpiar leídas
          </button>
        </div>

        {/* Detail view (when a notification is selected) */}
        {selectedNotif ? (
          <div className="flex-1 overflow-y-auto">
            <button
              onClick={() => setSelected(null)}
              className="flex items-center gap-1.5 px-4 pt-4 pb-2 text-xs text-gray-400 hover:text-gray-700 transition-colors"
            >
              ← Volver
            </button>
            <div className="px-4 pb-4">
              {/* Icon */}
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${TYPE_META[selectedNotif.type].bg}`}>
                {(() => {
                  const Icon = TYPE_META[selectedNotif.type].icon;
                  return <Icon className={`w-5 h-5 ${TYPE_META[selectedNotif.type].icon_color}`} strokeWidth={1.5} />;
                })()}
              </div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className={`text-[11px] px-2 py-0.5 rounded-full ${TYPE_META[selectedNotif.type].bg} ${TYPE_META[selectedNotif.type].icon_color}`}>
                  {TYPE_META[selectedNotif.type].label}
                </span>
                <span className="text-[11px] text-gray-400">{selectedNotif.time}</span>
              </div>
              <h3 className="text-sm text-gray-900 mb-2">{selectedNotif.title}</h3>
              <p className="text-xs text-gray-500 leading-relaxed mb-5">{selectedNotif.body}</p>

              <div className="flex flex-col gap-2">
                {selectedNotif.link && (
                  <Link
                    to={selectedNotif.link}
                    onClick={onClose}
                    className="flex items-center justify-between h-8 px-3 text-xs bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors"
                  >
                    Ver detalle
                    <ExternalLink className="w-3 h-3" strokeWidth={1.5} />
                  </Link>
                )}
                <button
                  onClick={() => { onMarkRead(selectedNotif.id); setSelected(null); }}
                  className="flex items-center justify-between h-8 px-3 text-xs text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Marcar como leída
                  <Check className="w-3 h-3" strokeWidth={1.5} />
                </button>
                <button
                  onClick={() => { onDelete(selectedNotif.id); setSelected(null); }}
                  className="flex items-center justify-between h-8 px-3 text-xs text-red-500 border border-red-100 rounded-xl hover:bg-red-50 transition-colors"
                >
                  Eliminar notificación
                  <Trash2 className="w-3 h-3" strokeWidth={1.5} />
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Notification list */
          <div className="flex-1 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
                <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center mb-3">
                  <Bell className="w-5 h-5 text-gray-300" strokeWidth={1.5} />
                </div>
                <p className="text-xs text-gray-400">Sin notificaciones{tab !== "todas" ? " en esta categoría" : ""}</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {filtered.map(notif => {
                  const meta = TYPE_META[notif.type];
                  const Icon = meta.icon;
                  return (
                    <div
                      key={notif.id}
                      onClick={() => { setSelected(notif.id); onMarkRead(notif.id); }}
                      className={`flex items-start gap-3 px-4 py-3.5 cursor-pointer hover:bg-gray-50/70 transition-colors group ${!notif.read ? "bg-blue-50/30" : ""}`}
                    >
                      {/* Icon */}
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${meta.bg}`}>
                        <Icon className={`w-3.5 h-3.5 ${meta.icon_color}`} strokeWidth={1.5} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-xs leading-tight ${notif.read ? "text-gray-700" : "text-gray-900"}`}>
                            {notif.title}
                          </p>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            {!notif.read && (
                              <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                            )}
                            <button
                              onClick={(e) => { e.stopPropagation(); onDelete(notif.id); }}
                              className="opacity-0 group-hover:opacity-100 w-5 h-5 flex items-center justify-center text-gray-300 hover:text-red-500 transition-all rounded-md hover:bg-red-50"
                            >
                              <X className="w-3 h-3" strokeWidth={1.5} />
                            </button>
                          </div>
                        </div>
                        <p className="text-[11px] text-gray-400 mt-0.5 truncate">{notif.body}</p>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-[10px] text-gray-300">{notif.time}</span>
                          <ChevronRight className="w-3 h-3 text-gray-200 group-hover:text-gray-400 transition-colors" strokeWidth={1.5} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="px-4 py-3 border-t border-gray-100 flex-shrink-0">
          <p className="text-[10px] text-gray-300 text-center">
            Las notificaciones de sistema se eliminan automáticamente después de 30 días
          </p>
        </div>
      </div>
    </>
  );
}
