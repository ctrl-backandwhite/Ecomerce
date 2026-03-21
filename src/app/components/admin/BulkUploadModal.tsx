/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  BulkUploadModal                                             ║
 * ║                                                              ║
 * ║  Modal reutilizable para carga masiva de productos o         ║
 * ║  variantes. Soporta CSV y JSON.                              ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

import { useState, useRef, useCallback } from "react";
import {
    X, Upload, FileJson, FileSpreadsheet, Download,
    Loader2, CheckCircle2, AlertTriangle, Info,
} from "lucide-react";
import { toast } from "sonner";
import type { BulkImportResult } from "../../repositories/NexaProductAdminRepository";

// ── Types ────────────────────────────────────────────────────────────────────

export type BulkEntityType = "products" | "variants";

interface BulkUploadModalProps {
    open: boolean;
    onClose: () => void;
    entityType: BulkEntityType;
    onUpload: (rows: Record<string, unknown>[]) => Promise<BulkImportResult>;
    onSuccess?: () => void;
}

// ── CSV field definitions per entity ─────────────────────────────────────────

const PRODUCT_CSV_FIELDS = [
    "sku", "categoryId", "bigImage", "productImageSet", "sellPrice", "productType",
    "description", "listedNum", "warehouseInventoryNum", "isVideo",
    "translation_es_name", "translation_en_name", "translation_pt_name",
] as const;

const VARIANT_CSV_FIELDS = [
    "pid", "variantNameEn", "variantSku", "variantUnit", "variantKey",
    "variantImage", "variantLength", "variantWidth", "variantHeight",
    "variantVolume", "variantWeight", "variantSellPrice", "variantSugSellPrice",
    "variantStandard",
    "translation_es_variantName", "translation_en_variantName", "translation_pt_variantName",
    "inventory_CN_total", "inventory_US_total",
] as const;

// ── CSV template generators ──────────────────────────────────────────────────

function generateProductCSVTemplate(): string {
    const header = PRODUCT_CSV_FIELDS.join(",");
    const example = [
        "SKU-001", "CATEGORY-UUID-HERE", "https://img.example.com/prod1.jpg",
        "https://img.example.com/img2.jpg,https://img.example.com/img3.jpg",
        "19.99", "NORMAL", "Descripción del producto en texto libre",
        "100", "500", "false",
        "Nombre del producto", "Product name", "Nome do produto",
    ].join(",");
    return `${header}\n${example}`;
}

function generateVariantCSVTemplate(): string {
    const header = VARIANT_CSV_FIELDS.join(",");
    const example = [
        "PID-UUID-HERE", "Variant Name EN", "VAR-SKU-001", "pcs", "color-red",
        "https://img.example.com/var1.jpg", "30", "20", "5", "3000", "0.5",
        "29.99", "39.99", "Standard",
        "Nombre variante", "Variant name", "Nome da variante",
        "100", "50",
    ].join(",");
    return `${header}\n${example}`;
}

// ── JSON template generators ─────────────────────────────────────────────────

function generateProductJSONTemplate(): string {
    return JSON.stringify([{
        sku: "SKU-001",
        categoryId: "CATEGORY-UUID-HERE",
        bigImage: "https://img.example.com/prod1.jpg",
        productImageSet: "https://img.example.com/img2.jpg,https://img.example.com/img3.jpg",
        sellPrice: "19.99",
        productType: "NORMAL",
        description: "Descripción del producto en texto libre",
        listedNum: 100,
        warehouseInventoryNum: 500,
        isVideo: false,
        translations: [
            { locale: "es", name: "Nombre del producto" },
            { locale: "en", name: "Product name" },
            { locale: "pt", name: "Nome do produto" },
        ],
    }], null, 2);
}

function generateVariantJSONTemplate(): string {
    return JSON.stringify([{
        pid: "PID-UUID-HERE",
        variantNameEn: "Variant Name EN",
        variantSku: "VAR-SKU-001",
        variantUnit: "pcs",
        variantKey: "color-red",
        variantImage: "https://img.example.com/var1.jpg",
        variantLength: 30,
        variantWidth: 20,
        variantHeight: 5,
        variantVolume: 3000,
        variantWeight: 0.5,
        variantSellPrice: 29.99,
        variantSugSellPrice: 39.99,
        variantStandard: "Standard",
        translations: [
            { locale: "es", variantName: "Nombre variante" },
            { locale: "en", variantName: "Variant name" },
            { locale: "pt", variantName: "Nome da variante" },
        ],
        inventories: [
            { countryCode: "CN", totalInventory: 100, cjInventory: 80, factoryInventory: 20, verifiedWarehouse: 0 },
        ],
    }], null, 2);
}

// ── CSV parsing ──────────────────────────────────────────────────────────────

function parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (inQuotes) {
            if (ch === '"' && line[i + 1] === '"') {
                current += '"';
                i++;
            } else if (ch === '"') {
                inQuotes = false;
            } else {
                current += ch;
            }
        } else {
            if (ch === '"') {
                inQuotes = true;
            } else if (ch === ",") {
                result.push(current.trim());
                current = "";
            } else {
                current += ch;
            }
        }
    }
    result.push(current.trim());
    return result;
}

function csvToProductRows(csvText: string): Record<string, unknown>[] {
    const lines = csvText.split(/\r?\n/).filter(l => l.trim());
    if (lines.length < 2) return [];

    const headers = parseCSVLine(lines[0]);
    const rows: Record<string, unknown>[] = [];

    for (let i = 1; i < lines.length; i++) {
        const vals = parseCSVLine(lines[i]);
        if (vals.every(v => !v)) continue; // skip empty rows

        const obj: Record<string, unknown> = {};
        const translations: { locale: string; name: string }[] = [];

        headers.forEach((h, idx) => {
            const val = vals[idx] ?? "";
            if (h.startsWith("translation_")) {
                const parts = h.split("_");
                const locale = parts[1];
                if (val) translations.push({ locale, name: val });
            } else if (h === "listedNum" || h === "warehouseInventoryNum") {
                obj[h] = val ? parseInt(val, 10) : null;
            } else if (h === "isVideo") {
                obj[h] = val.toLowerCase() === "true";
            } else {
                obj[h] = val || null;
            }
        });

        if (translations.length > 0) obj.translations = translations;
        rows.push(obj);
    }

    return rows;
}

function csvToVariantRows(csvText: string): Record<string, unknown>[] {
    const lines = csvText.split(/\r?\n/).filter(l => l.trim());
    if (lines.length < 2) return [];

    const headers = parseCSVLine(lines[0]);
    const rows: Record<string, unknown>[] = [];

    const numericFields = new Set([
        "variantLength", "variantWidth", "variantHeight", "variantVolume",
        "variantWeight", "variantSellPrice", "variantSugSellPrice",
    ]);

    for (let i = 1; i < lines.length; i++) {
        const vals = parseCSVLine(lines[i]);
        if (vals.every(v => !v)) continue;

        const obj: Record<string, unknown> = {};
        const translations: { locale: string; variantName: string | null }[] = [];
        const inventoryMap: Record<string, number> = {};

        headers.forEach((h, idx) => {
            const val = vals[idx] ?? "";
            if (h.startsWith("translation_")) {
                const parts = h.split("_");
                const locale = parts[1];
                if (val) translations.push({ locale, variantName: val });
            } else if (h.startsWith("inventory_")) {
                const parts = h.split("_");
                const country = parts[1];
                if (val) inventoryMap[country] = parseInt(val, 10);
            } else if (numericFields.has(h)) {
                obj[h] = val ? parseFloat(val) : null;
            } else {
                obj[h] = val || null;
            }
        });

        if (translations.length > 0) obj.translations = translations;
        if (Object.keys(inventoryMap).length > 0) {
            obj.inventories = Object.entries(inventoryMap).map(([code, total]) => ({
                countryCode: code,
                totalInventory: total,
                cjInventory: 0,
                factoryInventory: 0,
                verifiedWarehouse: 0,
            }));
        }
        rows.push(obj);
    }

    return rows;
}

// ── Component ────────────────────────────────────────────────────────────────

export function BulkUploadModal({ open, onClose, entityType, onUpload, onSuccess }: BulkUploadModalProps) {
    const [step, setStep] = useState<"upload" | "preview" | "result">("upload");
    const [fileType, setFileType] = useState<"csv" | "json">("csv");
    const [parsedRows, setParsedRows] = useState<Record<string, unknown>[]>([]);
    const [fileName, setFileName] = useState("");
    const [uploading, setUploading] = useState(false);
    const [result, setResult] = useState<BulkImportResult | null>(null);
    const [parseError, setParseError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const label = entityType === "products" ? "productos" : "variantes";
    const Label = entityType === "products" ? "Productos" : "Variantes";

    const resetState = useCallback(() => {
        setStep("upload");
        setParsedRows([]);
        setFileName("");
        setParseError(null);
        setResult(null);
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
    }, []);

    const handleClose = () => {
        resetState();
        onClose();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setParseError(null);
        setFileName(file.name);

        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const text = ev.target?.result as string;
                const isJSON = file.name.endsWith(".json") || fileType === "json";

                let rows: Record<string, unknown>[];

                if (isJSON) {
                    const parsed = JSON.parse(text);
                    rows = Array.isArray(parsed) ? parsed : parsed.rows || [];
                    setFileType("json");
                } else {
                    rows = entityType === "products"
                        ? csvToProductRows(text)
                        : csvToVariantRows(text);
                    setFileType("csv");
                }

                if (rows.length === 0) {
                    setParseError("El archivo no contiene registros válidos");
                    return;
                }

                setParsedRows(rows);
                setStep("preview");
            } catch (err) {
                setParseError(err instanceof Error ? err.message : "Error al parsear archivo");
            }
        };
        reader.readAsText(file);
    };

    const handleUpload = async () => {
        setUploading(true);
        try {
            const res = await onUpload(parsedRows);
            setResult(res);
            setStep("result");

            if (res.failed === 0) {
                toast.success(`${res.created} ${label} creados exitosamente`);
            } else {
                toast.warning(`${res.created} creados, ${res.failed} fallidos de ${res.totalRows}`);
            }

            if (res.created > 0 && onSuccess) onSuccess();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Error al subir");
        } finally {
            setUploading(false);
        }
    };

    const downloadTemplate = (format: "csv" | "json") => {
        let content: string;
        let mimeType: string;
        let ext: string;

        if (format === "csv") {
            content = entityType === "products" ? generateProductCSVTemplate() : generateVariantCSVTemplate();
            mimeType = "text/csv";
            ext = "csv";
        } else {
            content = entityType === "products" ? generateProductJSONTemplate() : generateVariantJSONTemplate();
            mimeType = "application/json";
            ext = "json";
        }

        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `template_${entityType}.${ext}`;
        a.click();
        URL.revokeObjectURL(url);
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={handleClose} />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                            <Upload className="w-5 h-5 text-indigo-600" strokeWidth={1.5} />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-800">Carga masiva de {label}</h2>
                            <p className="text-xs text-gray-400">Sube un archivo CSV o JSON</p>
                        </div>
                    </div>
                    <button onClick={handleClose} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
                        <X className="w-4 h-4" strokeWidth={1.5} />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-auto px-6 py-5 space-y-5">
                    {/* ─── Step 1: Upload ─── */}
                    {step === "upload" && (
                        <>
                            {/* Template downloads */}
                            <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4">
                                <div className="flex items-start gap-2 mb-3">
                                    <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" strokeWidth={1.5} />
                                    <p className="text-xs text-blue-700">
                                        Descarga una plantilla de ejemplo para conocer el formato esperado.
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => downloadTemplate("csv")}
                                        className="flex items-center gap-1.5 text-xs font-medium text-blue-600 bg-white border border-blue-200 rounded-lg px-3 py-1.5 hover:bg-blue-50 transition-colors"
                                    >
                                        <FileSpreadsheet className="w-3.5 h-3.5" strokeWidth={1.5} />
                                        Plantilla CSV
                                    </button>
                                    <button
                                        onClick={() => downloadTemplate("json")}
                                        className="flex items-center gap-1.5 text-xs font-medium text-blue-600 bg-white border border-blue-200 rounded-lg px-3 py-1.5 hover:bg-blue-50 transition-colors"
                                    >
                                        <FileJson className="w-3.5 h-3.5" strokeWidth={1.5} />
                                        Plantilla JSON
                                    </button>
                                </div>
                            </div>

                            {/* File type selector */}
                            <div className="flex items-center gap-3">
                                <span className="text-xs text-gray-500">Formato:</span>
                                <div className="flex rounded-lg border border-gray-200 overflow-hidden">
                                    <button
                                        onClick={() => setFileType("csv")}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${fileType === "csv"
                                            ? "bg-gray-800 text-white"
                                            : "bg-white text-gray-500 hover:bg-gray-50"
                                            }`}
                                    >
                                        <FileSpreadsheet className="w-3.5 h-3.5" strokeWidth={1.5} />
                                        CSV
                                    </button>
                                    <button
                                        onClick={() => setFileType("json")}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${fileType === "json"
                                            ? "bg-gray-800 text-white"
                                            : "bg-white text-gray-500 hover:bg-gray-50"
                                            }`}
                                    >
                                        <FileJson className="w-3.5 h-3.5" strokeWidth={1.5} />
                                        JSON
                                    </button>
                                </div>
                            </div>

                            {/* Drop zone */}
                            <label className="group flex flex-col items-center justify-center gap-3 p-8 border-2 border-dashed border-gray-200 rounded-xl hover:border-indigo-300 hover:bg-indigo-50/30 transition-all cursor-pointer">
                                <div className="w-12 h-12 bg-gray-100 group-hover:bg-indigo-100 rounded-xl flex items-center justify-center transition-colors">
                                    <Upload className="w-5 h-5 text-gray-400 group-hover:text-indigo-500" strokeWidth={1.5} />
                                </div>
                                <div className="text-center">
                                    <p className="text-sm text-gray-600 font-medium">
                                        Arrastra tu archivo aquí o <span className="text-indigo-600">busca</span>
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1">
                                        {fileType === "csv" ? ".csv" : ".json"} — máximo 10 MB
                                    </p>
                                </div>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept={fileType === "csv" ? ".csv" : ".json"}
                                    onChange={handleFileChange}
                                    className="hidden"
                                />
                            </label>

                            {/* Parse error */}
                            {parseError && (
                                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-100 rounded-xl">
                                    <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" strokeWidth={1.5} />
                                    <p className="text-xs text-red-600">{parseError}</p>
                                </div>
                            )}
                        </>
                    )}

                    {/* ─── Step 2: Preview ─── */}
                    {step === "preview" && (
                        <>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    {fileType === "csv" ? (
                                        <FileSpreadsheet className="w-4 h-4 text-emerald-500" strokeWidth={1.5} />
                                    ) : (
                                        <FileJson className="w-4 h-4 text-amber-500" strokeWidth={1.5} />
                                    )}
                                    <span className="text-sm text-gray-700">{fileName}</span>
                                </div>
                                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                                    {parsedRows.length} {label}
                                </span>
                            </div>

                            {/* Preview table */}
                            <div className="border border-gray-100 rounded-xl overflow-hidden">
                                <div className="overflow-auto max-h-64">
                                    <table className="w-full text-xs">
                                        <thead>
                                            <tr className="bg-gray-50 border-b border-gray-100">
                                                <th className="text-left px-3 py-2 text-gray-400 font-medium">#</th>
                                                {Object.keys(parsedRows[0] || {}).slice(0, 6).map(k => (
                                                    <th key={k} className="text-left px-3 py-2 text-gray-400 font-medium truncate max-w-[120px]">
                                                        {k}
                                                    </th>
                                                ))}
                                                {Object.keys(parsedRows[0] || {}).length > 6 && (
                                                    <th className="text-left px-3 py-2 text-gray-400 font-medium">...</th>
                                                )}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {parsedRows.slice(0, 10).map((row, i) => (
                                                <tr key={i} className="border-b border-gray-50">
                                                    <td className="px-3 py-2 text-gray-400">{i + 1}</td>
                                                    {Object.values(row).slice(0, 6).map((val, j) => (
                                                        <td key={j} className="px-3 py-2 text-gray-600 truncate max-w-[120px]">
                                                            {typeof val === "object" ? JSON.stringify(val).slice(0, 30) : String(val ?? "—")}
                                                        </td>
                                                    ))}
                                                    {Object.keys(row).length > 6 && (
                                                        <td className="px-3 py-2 text-gray-400">...</td>
                                                    )}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                {parsedRows.length > 10 && (
                                    <div className="px-3 py-2 bg-gray-50/50 border-t border-gray-100 text-xs text-gray-400 text-center">
                                        Mostrando 10 de {parsedRows.length} registros
                                    </div>
                                )}
                            </div>
                        </>
                    )}

                    {/* ─── Step 3: Result ─── */}
                    {step === "result" && result && (
                        <>
                            {/* Summary */}
                            <div className={`flex items-center gap-3 p-4 rounded-xl border ${result.failed === 0
                                ? "bg-emerald-50/50 border-emerald-100"
                                : "bg-amber-50/50 border-amber-100"
                                }`}>
                                {result.failed === 0 ? (
                                    <CheckCircle2 className="w-6 h-6 text-emerald-500" strokeWidth={1.5} />
                                ) : (
                                    <AlertTriangle className="w-6 h-6 text-amber-500" strokeWidth={1.5} />
                                )}
                                <div>
                                    <p className="text-sm font-medium text-gray-800">
                                        {result.failed === 0
                                            ? `¡${result.created} ${label} creados exitosamente!`
                                            : `${result.created} creados, ${result.failed} fallidos`
                                        }
                                    </p>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        {result.totalRows} filas procesadas en total
                                    </p>
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-3 gap-3">
                                <div className="flex flex-col items-center p-3 bg-gray-50 rounded-xl">
                                    <p className="text-lg font-bold text-gray-800">{result.totalRows}</p>
                                    <p className="text-[10px] text-gray-400 uppercase tracking-wider">Total</p>
                                </div>
                                <div className="flex flex-col items-center p-3 bg-emerald-50 rounded-xl">
                                    <p className="text-lg font-bold text-emerald-600">{result.created}</p>
                                    <p className="text-[10px] text-emerald-500 uppercase tracking-wider">Creados</p>
                                </div>
                                <div className="flex flex-col items-center p-3 bg-red-50 rounded-xl">
                                    <p className="text-lg font-bold text-red-600">{result.failed}</p>
                                    <p className="text-[10px] text-red-500 uppercase tracking-wider">Fallidos</p>
                                </div>
                            </div>

                            {/* Error list */}
                            {result.errors.length > 0 && (
                                <div className="border border-red-100 rounded-xl overflow-hidden">
                                    <div className="px-4 py-2.5 bg-red-50/50 border-b border-red-100">
                                        <p className="text-xs font-medium text-red-600">Errores detallados</p>
                                    </div>
                                    <div className="max-h-40 overflow-auto">
                                        {result.errors.map((err, i) => (
                                            <div key={i} className="flex items-start gap-2 px-4 py-2 border-b border-red-50 last:border-0">
                                                <span className="text-[10px] text-red-400 font-mono bg-red-50 px-1.5 py-0.5 rounded flex-shrink-0">
                                                    Fila {err.row + 1}
                                                </span>
                                                <span className="text-xs text-red-600">{err.message}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/50">
                    {step === "upload" && (
                        <div className="flex items-center gap-2 w-full justify-end">
                            <button onClick={handleClose} className="text-xs text-gray-500 hover:text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors">
                                Cancelar
                            </button>
                        </div>
                    )}

                    {step === "preview" && (
                        <>
                            <button
                                onClick={resetState}
                                className="text-xs text-gray-500 hover:text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                                ← Elegir otro archivo
                            </button>
                            <button
                                onClick={handleUpload}
                                disabled={uploading}
                                className="flex items-center gap-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 rounded-xl px-5 py-2.5 transition-colors"
                            >
                                {uploading ? (
                                    <>
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={1.5} />
                                        Subiendo...
                                    </>
                                ) : (
                                    <>
                                        <Upload className="w-3.5 h-3.5" strokeWidth={1.5} />
                                        Importar {parsedRows.length} {label}
                                    </>
                                )}
                            </button>
                        </>
                    )}

                    {step === "result" && (
                        <div className="flex items-center gap-2 w-full justify-end">
                            <button
                                onClick={resetState}
                                className="text-xs text-gray-500 hover:text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                                Subir otro archivo
                            </button>
                            <button
                                onClick={handleClose}
                                className="text-xs font-medium text-white bg-gray-800 hover:bg-gray-900 rounded-xl px-5 py-2.5 transition-colors"
                            >
                                Cerrar
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
