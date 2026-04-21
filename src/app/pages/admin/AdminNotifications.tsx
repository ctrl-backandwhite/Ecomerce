import { useState, useEffect, useCallback, useMemo } from "react";
import {
    Mail, Search, Filter, Trash2, X, Send, Eye,
    RefreshCw, CheckCircle2, AlertCircle, Clock,
} from "lucide-react";
import { toast } from "sonner";
import {
    notificationRepository,
    type Notification,
    type NotificationTemplate,
} from "../../repositories/NotificationRepository";
import { Pagination } from "../../components/admin/Pagination";
import { useLanguage } from "../../context/LanguageContext";
import { logger } from "../../lib/logger";

const PAGE_SIZE = 15;

type StatusFilter = "ALL" | "PENDING" | "SENT" | "FAILED";
type Tab = "notifications" | "templates";

const STATUS_META: Record<string, { labelKey: string; tone: string; dot: string; Icon: React.ElementType }> = {
    PENDING: { labelKey: "admin.notif.status.pending", tone: "bg-amber-50 text-amber-700 border-amber-100", dot: "bg-amber-400", Icon: Clock },
    SENT: { labelKey: "admin.notif.status.sent", tone: "bg-green-50 text-green-700 border-green-100", dot: "bg-green-400", Icon: CheckCircle2 },
    FAILED: { labelKey: "admin.notif.status.failed", tone: "bg-red-50 text-red-700 border-red-100", dot: "bg-red-400", Icon: AlertCircle },
};

export function AdminNotifications() {
    const { t } = useLanguage();
    const [tab, setTab] = useState<Tab>("notifications");

    // ── Notifications state ─────────────────────────────────────────────────
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(0);
    const [loading, setLoading] = useState(false);
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
    const [search, setSearch] = useState("");
    const [selected, setSelected] = useState<Notification | null>(null);

    // ── Templates state ─────────────────────────────────────────────────────
    const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
    const [tplLoading, setTplLoading] = useState(false);

    const loadNotifications = useCallback(async () => {
        setLoading(true);
        try {
            const query: Record<string, unknown> = { page, size: PAGE_SIZE };
            if (statusFilter !== "ALL") query.status = statusFilter;
            if (search.trim()) query.recipient = search.trim();
            const res = await notificationRepository.findAll(query);
            setNotifications(res.content ?? []);
            setTotal(res.totalElements ?? 0);
        } catch (err) {
            logger.warn("notifications load failed", err);
            toast.error(t("admin.notif.loadError"));
        } finally {
            setLoading(false);
        }
    }, [page, statusFilter, search, t]);

    const loadTemplates = useCallback(async () => {
        setTplLoading(true);
        try {
            const list = await notificationRepository.findAllTemplates();
            setTemplates(list);
        } catch (err) {
            logger.warn("templates load failed", err);
            toast.error(t("admin.notif.tpl.loadError"));
        } finally {
            setTplLoading(false);
        }
    }, [t]);

    useEffect(() => { if (tab === "notifications") loadNotifications(); }, [tab, loadNotifications]);
    useEffect(() => { if (tab === "templates") loadTemplates(); }, [tab, loadTemplates]);

    const handleDelete = async (id: string) => {
        if (!confirm(t("admin.notif.confirmDelete"))) return;
        try {
            await notificationRepository.delete(id);
            toast.success(t("admin.notif.deleted"));
            if (selected?.id === id) setSelected(null);
            loadNotifications();
        } catch {
            toast.error(t("admin.notif.deleteError"));
        }
    };

    const handleDeleteTemplate = async (id: string) => {
        if (!confirm(t("admin.notif.tpl.confirmDelete"))) return;
        try {
            await notificationRepository.deleteTemplate(id);
            toast.success(t("admin.notif.tpl.deleted"));
            loadTemplates();
        } catch {
            toast.error(t("admin.notif.tpl.deleteError"));
        }
    };

    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

    // ── Counts by status (from currently loaded page — indicative) ──────────
    const counts = useMemo(() => {
        const c = { pending: 0, sent: 0, failed: 0 };
        for (const n of notifications) {
            if (n.status === "PENDING") c.pending++;
            else if (n.status === "SENT") c.sent++;
            else if (n.status === "FAILED") c.failed++;
        }
        return c;
    }, [notifications]);

    return (
        <div className="flex flex-col gap-5">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                    <h1 className="text-xl text-gray-900 tracking-tight">{t("admin.notif.title")}</h1>
                    <p className="text-xs text-gray-400 mt-0.5">{t("admin.notif.subtitle")}</p>
                </div>
                <button
                    onClick={() => tab === "notifications" ? loadNotifications() : loadTemplates()}
                    className="inline-flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg px-3 py-1.5 bg-white"
                >
                    <RefreshCw className="w-3.5 h-3.5" strokeWidth={1.5} />
                    {t("admin.common.refresh")}
                </button>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1 border-b border-gray-100">
                {(["notifications", "templates"] as Tab[]).map(k => (
                    <button
                        key={k}
                        onClick={() => setTab(k)}
                        className={`px-4 py-2 text-sm transition-colors border-b-2 ${tab === k
                            ? "border-gray-900 text-gray-900"
                            : "border-transparent text-gray-500 hover:text-gray-700"
                            }`}
                    >
                        {k === "notifications" ? t("admin.notif.tab.notifications") : t("admin.notif.tab.templates")}
                    </button>
                ))}
            </div>

            {tab === "notifications" && (
                <>
                    {/* Stat strip */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="bg-white border border-gray-100 rounded-xl p-4">
                            <p className="text-[11px] text-gray-400">{t("admin.notif.kpi.total")}</p>
                            <p className="text-xl text-gray-900 tabular-nums mt-1">{total}</p>
                        </div>
                        <div className="bg-white border border-gray-100 rounded-xl p-4">
                            <p className="text-[11px] text-gray-400">{t("admin.notif.status.pending")} ({t("admin.notif.pageLabel")})</p>
                            <p className="text-xl text-amber-600 tabular-nums mt-1">{counts.pending}</p>
                        </div>
                        <div className="bg-white border border-gray-100 rounded-xl p-4">
                            <p className="text-[11px] text-gray-400">{t("admin.notif.status.sent")} ({t("admin.notif.pageLabel")})</p>
                            <p className="text-xl text-green-600 tabular-nums mt-1">{counts.sent}</p>
                        </div>
                        <div className="bg-white border border-gray-100 rounded-xl p-4">
                            <p className="text-[11px] text-gray-400">{t("admin.notif.status.failed")} ({t("admin.notif.pageLabel")})</p>
                            <p className="text-xl text-red-600 tabular-nums mt-1">{counts.failed}</p>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="bg-white border border-gray-100 rounded-xl p-3 flex flex-wrap items-center gap-2">
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Filter className="w-3.5 h-3.5" strokeWidth={1.5} />
                            {t("admin.common.filter")}:
                        </div>
                        {(["ALL", "PENDING", "SENT", "FAILED"] as StatusFilter[]).map(s => (
                            <button
                                key={s}
                                onClick={() => { setStatusFilter(s); setPage(0); }}
                                className={`px-2.5 py-1 text-[11px] rounded-full border transition-colors ${statusFilter === s
                                    ? "bg-gray-900 text-white border-gray-900"
                                    : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                                    }`}
                            >
                                {s === "ALL" ? t("admin.common.all") : t(STATUS_META[s].labelKey)}
                            </button>
                        ))}
                        <div className="flex-1" />
                        <div className="relative">
                            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" strokeWidth={1.5} />
                            <input
                                type="email"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={(e) => { if (e.key === "Enter") { setPage(0); loadNotifications(); } }}
                                placeholder={t("admin.notif.searchPlaceholder")}
                                className="pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 w-60"
                            />
                        </div>
                    </div>

                    {/* List */}
                    <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
                        <div className="grid grid-cols-[1fr_120px_120px_100px_40px] gap-3 px-5 py-2.5 bg-gray-50/60 border-b border-gray-100 text-[10px] text-gray-400 uppercase tracking-wider">
                            <span>{t("admin.notif.col.recipient")}</span>
                            <span>{t("admin.notif.col.status")}</span>
                            <span>{t("admin.notif.col.channel")}</span>
                            <span className="text-right">{t("admin.notif.col.date")}</span>
                            <span />
                        </div>
                        {loading ? (
                            <div className="p-10 text-center text-xs text-gray-400">{t("admin.common.loading")}</div>
                        ) : notifications.length === 0 ? (
                            <div className="p-10 text-center text-xs text-gray-400">{t("admin.notif.empty")}</div>
                        ) : (
                            <div className="divide-y divide-gray-50">
                                {notifications.map(n => {
                                    const meta = STATUS_META[n.status] ?? STATUS_META.PENDING;
                                    return (
                                        <div
                                            key={n.id}
                                            className="grid grid-cols-[1fr_120px_120px_100px_40px] gap-3 items-center px-5 py-3 hover:bg-gray-50/70 transition-colors cursor-pointer"
                                            onClick={() => setSelected(n)}
                                        >
                                            <div className="min-w-0">
                                                <p className="text-xs text-gray-900 truncate">{n.subject}</p>
                                                <p className="text-[11px] text-gray-400 truncate">{n.recipient}</p>
                                            </div>
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full border inline-flex items-center gap-1 w-fit ${meta.tone}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                                                {t(meta.labelKey)}
                                            </span>
                                            <span className="text-[11px] text-gray-500">{n.channel}</span>
                                            <span className="text-[11px] text-gray-400 text-right tabular-nums">
                                                {n.createdAt ? new Date(n.createdAt).toLocaleDateString() : "—"}
                                            </span>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDelete(n.id); }}
                                                className="text-gray-300 hover:text-red-500 transition-colors"
                                                title={t("admin.common.delete")}
                                            >
                                                <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                        <div className="px-5 py-3 border-t border-gray-100">
                            <Pagination
                                page={page + 1}
                                totalPages={totalPages}
                                total={total}
                                pageSize={PAGE_SIZE}
                                onChange={(p) => setPage(p - 1)}
                            />
                        </div>
                    </div>
                </>
            )}

            {tab === "templates" && (
                <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
                    <div className="grid grid-cols-[1fr_140px_120px_40px] gap-3 px-5 py-2.5 bg-gray-50/60 border-b border-gray-100 text-[10px] text-gray-400 uppercase tracking-wider">
                        <span>{t("admin.notif.tpl.col.name")}</span>
                        <span>{t("admin.notif.tpl.col.channel")}</span>
                        <span>{t("admin.notif.tpl.col.updated")}</span>
                        <span />
                    </div>
                    {tplLoading ? (
                        <div className="p-10 text-center text-xs text-gray-400">{t("admin.common.loading")}</div>
                    ) : templates.length === 0 ? (
                        <div className="p-10 text-center text-xs text-gray-400">{t("admin.notif.tpl.empty")}</div>
                    ) : (
                        <div className="divide-y divide-gray-50">
                            {templates.map(tpl => (
                                <div key={tpl.id} className="grid grid-cols-[1fr_140px_120px_40px] gap-3 items-center px-5 py-3 hover:bg-gray-50/70 transition-colors">
                                    <div className="min-w-0">
                                        <p className="text-xs text-gray-900 truncate">{tpl.name}</p>
                                        <p className="text-[11px] text-gray-400 truncate">{tpl.subject}</p>
                                    </div>
                                    <span className="text-[11px] text-gray-500">{tpl.channel}</span>
                                    <span className="text-[11px] text-gray-400 tabular-nums">
                                        {tpl.updatedAt ? new Date(tpl.updatedAt).toLocaleDateString() : "—"}
                                    </span>
                                    <button
                                        onClick={() => handleDeleteTemplate(tpl.id)}
                                        className="text-gray-300 hover:text-red-500 transition-colors"
                                        title={t("admin.common.delete")}
                                    >
                                        <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Detail drawer */}
            {selected && (
                <div className="fixed inset-0 z-50 flex justify-end bg-black/20" onClick={() => setSelected(null)}>
                    <div
                        className="w-full max-w-md bg-white h-full overflow-y-auto shadow-2xl flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Mail className="w-4 h-4 text-gray-500" strokeWidth={1.5} />
                                <h2 className="text-sm text-gray-900">{t("admin.notif.detail.title")}</h2>
                            </div>
                            <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-700">
                                <X className="w-4 h-4" strokeWidth={1.5} />
                            </button>
                        </div>
                        <div className="p-5 space-y-4 flex-1">
                            <DetailRow label={t("admin.notif.col.recipient")} value={selected.recipient} />
                            <DetailRow label={t("admin.notif.col.status")} value={t(STATUS_META[selected.status]?.labelKey ?? "admin.notif.status.pending")} />
                            <DetailRow label={t("admin.notif.col.channel")} value={selected.channel} />
                            <DetailRow label={t("admin.notif.detail.type")} value={selected.type} />
                            <DetailRow label={t("admin.notif.detail.subject")} value={selected.subject} />
                            <div>
                                <p className="text-[11px] text-gray-400 uppercase tracking-wider mb-1.5">{t("admin.notif.detail.body")}</p>
                                <div
                                    className="text-xs text-gray-700 border border-gray-100 rounded-lg p-3 bg-gray-50 max-h-64 overflow-auto"
                                    dangerouslySetInnerHTML={{ __html: selected.body }}
                                />
                            </div>
                            <DetailRow label={t("admin.notif.col.date")} value={selected.createdAt ? new Date(selected.createdAt).toLocaleString() : "—"} />
                        </div>
                        <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
                            <span className="text-[11px] text-gray-400 font-mono">{selected.id}</span>
                            <button
                                onClick={() => handleDelete(selected.id)}
                                className="inline-flex items-center gap-1.5 text-xs text-red-600 hover:text-red-700 border border-red-100 hover:border-red-200 rounded-lg px-3 py-1.5 bg-white"
                            >
                                <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                                {t("admin.common.delete")}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function DetailRow({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <p className="text-[11px] text-gray-400 uppercase tracking-wider mb-0.5">{label}</p>
            <p className="text-xs text-gray-800 break-words">{value}</p>
        </div>
    );
}
