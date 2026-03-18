import { useState, useRef, useCallback } from "react";
import {
    X, Upload, Download, FileSpreadsheet, AlertTriangle,
    Loader2, CheckCircle2, Info,
} from "lucide-react";
import { toast } from "sonner";
import {
    nexaCategoryPagedRepository,
    type BulkCategoryRow,
    type BulkCategoryResult,
} from "../../repositories/NexaCategoryPagedRepository";

/* ── Constants ──────────────────────────────────────────── */

const LOCALES = ["es", "en", "pt"] as const;

const CSV_HEADERS = [
    "level1_es", "level1_en", "level1_pt",
    "level2_es", "level2_en", "level2_pt",
    "level3_es", "level3_en", "level3_pt",
];

const TEMPLATE_ROWS = [
    ["Electrónica", "Electronics", "Eletrônica", "Teléfonos", "Phones", "Telefones", "Smartphones", "Smartphones", "Smartphones"],
    ["Electrónica", "Electronics", "Eletrônica", "Computadoras", "Computers", "Computadores", "Laptops", "Laptops", "Laptops"],
    ["Ropa", "Clothing", "Roupas", "Hombre", "Men", "Homem", "Camisetas", "T-Shirts", "Camisetas"],
    ["Ropa", "Clothing", "Roupas", "Mujer", "Women", "Mulher", "", "", ""],
];

/* ── i18n ───────────────────────────────────────────────── */

const tr = {
    es: {
        title: "Carga masiva de categorías",
        subtitle: "Sube un archivo CSV para crear categorías con hasta 3 niveles de jerarquía.",
        downloadTemplate: "Descargar plantilla CSV",
        dropZone: "Arrastra tu archivo CSV aquí o haz clic para seleccionar",
        dropZoneActive: "Suelta el archivo aquí",
        selectedFile: "Archivo seleccionado",
        preview: "Vista previa",
        rows: "filas",
        upload: "Subir categorías",
        uploading: "Subiendo...",
        cancel: "Cancelar",
        close: "Cerrar",
        success: (c: number, s: number, t: number) =>
            `Carga completada: ${c} creadas, ${s} omitidas, ${t} filas procesadas`,
        errorParsing: "Error al leer el archivo CSV",
        errorEmpty: "El archivo CSV está vacío o no tiene filas válidas",
        errorNoLevel1: (row: number) => `Fila ${row}: name de nivel 1 (es) es obligatorio`,
        instructions: "Instrucciones",
        inst1: "Descarga la plantilla CSV de ejemplo",
        inst2: "Cada fila representa una ruta completa: Nivel 1 → Nivel 2 → Nivel 3",
        inst3: "Los nombres se traducen a ES, EN y PT en cada nivel",
        inst4: "Nivel 2 y 3 son opcionales (deja en blanco si no aplican)",
        inst5: "Las categorías que ya existen se omiten automáticamente",
        colLevel1: "Nivel 1 (obligatorio)",
        colLevel2: "Nivel 2 (opcional)",
        colLevel3: "Nivel 3 (opcional)",
        remove: "Quitar",
    },
    en: {
        title: "Bulk category upload",
        subtitle: "Upload a CSV file to create categories with up to 3 hierarchy levels.",
        downloadTemplate: "Download CSV template",
        dropZone: "Drop your CSV file here or click to select",
        dropZoneActive: "Drop the file here",
        selectedFile: "Selected file",
        preview: "Preview",
        rows: "rows",
        upload: "Upload categories",
        uploading: "Uploading...",
        cancel: "Cancel",
        close: "Close",
        success: (c: number, s: number, t: number) =>
            `Upload complete: ${c} created, ${s} skipped, ${t} rows processed`,
        errorParsing: "Error reading CSV file",
        errorEmpty: "CSV file is empty or has no valid rows",
        errorNoLevel1: (row: number) => `Row ${row}: level 1 name (es) is required`,
        instructions: "Instructions",
        inst1: "Download the sample CSV template",
        inst2: "Each row represents a full path: Level 1 → Level 2 → Level 3",
        inst3: "Names are translated into ES, EN and PT at each level",
        inst4: "Levels 2 and 3 are optional (leave blank if not applicable)",
        inst5: "Categories that already exist are automatically skipped",
        colLevel1: "Level 1 (required)",
        colLevel2: "Level 2 (optional)",
        colLevel3: "Level 3 (optional)",
        remove: "Remove",
    },
    pt: {
        title: "Carga em massa de categorias",
        subtitle: "Envie um arquivo CSV para criar categorias com até 3 níveis de hierarquia.",
        downloadTemplate: "Baixar modelo CSV",
        dropZone: "Arraste seu arquivo CSV aqui ou clique para selecionar",
        dropZoneActive: "Solte o arquivo aqui",
        selectedFile: "Arquivo selecionado",
        preview: "Pré-visualização",
        rows: "linhas",
        upload: "Enviar categorias",
        uploading: "Enviando...",
        cancel: "Cancelar",
        close: "Fechar",
        success: (c: number, s: number, t: number) =>
            `Carga concluída: ${c} criadas, ${s} ignoradas, ${t} linhas processadas`,
        errorParsing: "Erro ao ler o arquivo CSV",
        errorEmpty: "O arquivo CSV está vazio ou não tem linhas válidas",
        errorNoLevel1: (row: number) => `Linha ${row}: nome do nível 1 (es) é obrigatório`,
        instructions: "Instruções",
        inst1: "Baixe o modelo CSV de exemplo",
        inst2: "Cada linha representa um caminho completo: Nível 1 → Nível 2 → Nível 3",
        inst3: "Os nomes são traduzidos em ES, EN e PT em cada nível",
        inst4: "Níveis 2 e 3 são opcionais (deixe em branco se não aplicáveis)",
        inst5: "Categorias já existentes são ignoradas automaticamente",
        colLevel1: "Nível 1 (obrigatório)",
        colLevel2: "Nível 2 (opcional)",
        colLevel3: "Nível 3 (opcional)",
        remove: "Remover",
    },
} as const;

/* ── Props ──────────────────────────────────────────────── */

interface Props {
    open: boolean;
    onClose: () => void;
    onUploaded: () => void;
    locale?: string;
}

/* ── Parsed row type ────────────────────────────────────── */

interface ParsedRow {
    level1_es: string; level1_en: string; level1_pt: string;
    level2_es: string; level2_en: string; level2_pt: string;
    level3_es: string; level3_en: string; level3_pt: string;
}

/* ── Component ──────────────────────────────────────────── */

export function BulkCategoryUploadModal({ open, onClose, onUploaded, locale = "es" }: Props) {
    const labels = tr[locale as keyof typeof tr] ?? tr.es;

    const [file, setFile] = useState<File | null>(null);
    const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
    const [errors, setErrors] = useState<string[]>([]);
    const [uploading, setUploading] = useState(false);
    const [result, setResult] = useState<BulkCategoryResult | null>(null);
    const [dragOver, setDragOver] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    /* ── Download template ──────────────────── */
    function downloadTemplate() {
        const bom = "\uFEFF";
        const csvContent = bom + [CSV_HEADERS.join(","), ...TEMPLATE_ROWS.map(r => r.map(c => `"${c}"`).join(","))].join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "categorias_template.csv";
        a.click();
        URL.revokeObjectURL(url);
    }

    /* ── Parse CSV ──────────────────────────── */
    const parseCSV = useCallback((text: string): { rows: ParsedRow[]; errors: string[] } => {
        const errs: string[] = [];
        const lines = text
            .split(/\r?\n/)
            .map(l => l.trim())
            .filter(l => l.length > 0);

        if (lines.length < 2) {
            return { rows: [], errors: [labels.errorEmpty] };
        }

        // Skip header row
        const dataLines = lines.slice(1);
        const rows: ParsedRow[] = [];

        for (let i = 0; i < dataLines.length; i++) {
            const cols = parseCSVLine(dataLines[i]);
            if (cols.length < 3) continue;

            const row: ParsedRow = {
                level1_es: (cols[0] ?? "").trim(),
                level1_en: (cols[1] ?? "").trim(),
                level1_pt: (cols[2] ?? "").trim(),
                level2_es: (cols[3] ?? "").trim(),
                level2_en: (cols[4] ?? "").trim(),
                level2_pt: (cols[5] ?? "").trim(),
                level3_es: (cols[6] ?? "").trim(),
                level3_en: (cols[7] ?? "").trim(),
                level3_pt: (cols[8] ?? "").trim(),
            };

            if (!row.level1_es) {
                errs.push(labels.errorNoLevel1(i + 2));
                continue;
            }

            rows.push(row);
        }

        if (rows.length === 0 && errs.length === 0) {
            errs.push(labels.errorEmpty);
        }

        return { rows, errors: errs };
    }, [labels]);

    /* ── Parse a single CSV line (handles quoted fields) */
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
                } else if (ch === "," || ch === ";") {
                    result.push(current);
                    current = "";
                } else {
                    current += ch;
                }
            }
        }
        result.push(current);
        return result;
    }

    /* ── File handling ──────────────────────── */
    function handleFile(f: File) {
        setResult(null);
        setErrors([]);
        setFile(f);

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result as string;
                const { rows, errors: parseErrors } = parseCSV(text);
                setParsedRows(rows);
                setErrors(parseErrors);
            } catch {
                setErrors([labels.errorParsing]);
                setParsedRows([]);
            }
        };
        reader.readAsText(f, "UTF-8");
    }

    function handleDrop(e: React.DragEvent) {
        e.preventDefault();
        setDragOver(false);
        const f = e.dataTransfer.files?.[0];
        if (f && (f.name.endsWith(".csv") || f.type === "text/csv")) {
            handleFile(f);
        }
    }

    function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
        const f = e.target.files?.[0];
        if (f) handleFile(f);
    }

    function removeFile() {
        setFile(null);
        setParsedRows([]);
        setErrors([]);
        setResult(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    }

    /* ── Convert parsed rows to API format ──── */
    function toApiRows(rows: ParsedRow[]): BulkCategoryRow[] {
        return rows.map(r => {
            const l1: { locale: string; name: string }[] = [];
            if (r.level1_es) l1.push({ locale: "es", name: r.level1_es });
            if (r.level1_en) l1.push({ locale: "en", name: r.level1_en });
            if (r.level1_pt) l1.push({ locale: "pt", name: r.level1_pt });

            let l2: { locale: string; name: string }[] | null = null;
            if (r.level2_es || r.level2_en || r.level2_pt) {
                l2 = [];
                if (r.level2_es) l2.push({ locale: "es", name: r.level2_es });
                if (r.level2_en) l2.push({ locale: "en", name: r.level2_en });
                if (r.level2_pt) l2.push({ locale: "pt", name: r.level2_pt });
            }

            let l3: { locale: string; name: string }[] | null = null;
            if (r.level3_es || r.level3_en || r.level3_pt) {
                l3 = [];
                if (r.level3_es) l3.push({ locale: "es", name: r.level3_es });
                if (r.level3_en) l3.push({ locale: "en", name: r.level3_en });
                if (r.level3_pt) l3.push({ locale: "pt", name: r.level3_pt });
            }

            return { level1Translations: l1, level2Translations: l2, level3Translations: l3 };
        });
    }

    /* ── Upload ─────────────────────────────── */
    async function handleUpload() {
        if (uploading || parsedRows.length === 0) return;
        setUploading(true);
        setResult(null);
        try {
            const apiRows = toApiRows(parsedRows);
            const res = await nexaCategoryPagedRepository.bulkCreateCategories(apiRows);
            setResult(res);
            toast.success(labels.success(res.created, res.skipped, res.totalRows));
            onUploaded();
        } catch (err) {
            const msg = err instanceof Error ? err.message : "Error";
            toast.error(msg, { duration: 5000 });
        } finally {
            setUploading(false);
        }
    }

    /* ── Reset on close ─────────────────────── */
    function handleClose() {
        removeFile();
        onClose();
    }

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleClose} />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col mx-4">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-violet-50 rounded-xl flex items-center justify-center">
                            <FileSpreadsheet className="w-4.5 h-4.5 text-violet-600" strokeWidth={1.5} />
                        </div>
                        <div>
                            <h2 className="text-sm font-semibold text-gray-900">{labels.title}</h2>
                            <p className="text-xs text-gray-400 mt-0.5">{labels.subtitle}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
                    >
                        <X className="w-4 h-4 text-gray-400" strokeWidth={1.5} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

                    {/* Instructions */}
                    <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-4">
                        <div className="flex items-start gap-2.5">
                            <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" strokeWidth={1.5} />
                            <div className="text-xs text-blue-700 space-y-1">
                                <p className="font-medium">{labels.instructions}:</p>
                                <ol className="list-decimal list-inside space-y-0.5 text-blue-600">
                                    <li>{labels.inst1}</li>
                                    <li>{labels.inst2}</li>
                                    <li>{labels.inst3}</li>
                                    <li>{labels.inst4}</li>
                                    <li>{labels.inst5}</li>
                                </ol>
                            </div>
                        </div>
                    </div>

                    {/* Template download */}
                    <button
                        onClick={downloadTemplate}
                        className="flex items-center gap-2 text-xs text-violet-600 bg-violet-50 hover:bg-violet-100 border border-violet-200 rounded-xl px-4 py-2.5 transition-colors"
                    >
                        <Download className="w-3.5 h-3.5" strokeWidth={1.5} />
                        {labels.downloadTemplate}
                    </button>

                    {/* CSV column layout preview */}
                    <div className="grid grid-cols-3 gap-2 text-[10px]">
                        <div className="bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2 text-center text-emerald-700 font-medium">
                            {labels.colLevel1}
                            <div className="text-emerald-500 font-normal mt-0.5">level1_es, level1_en, level1_pt</div>
                        </div>
                        <div className="bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 text-center text-amber-700 font-medium">
                            {labels.colLevel2}
                            <div className="text-amber-500 font-normal mt-0.5">level2_es, level2_en, level2_pt</div>
                        </div>
                        <div className="bg-sky-50 border border-sky-100 rounded-lg px-3 py-2 text-center text-sky-700 font-medium">
                            {labels.colLevel3}
                            <div className="text-sky-500 font-normal mt-0.5">level3_es, level3_en, level3_pt</div>
                        </div>
                    </div>

                    {/* Drop zone / File display */}
                    {!file ? (
                        <div
                            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                            onDragLeave={() => setDragOver(false)}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${dragOver
                                    ? "border-violet-400 bg-violet-50/50"
                                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50/50"
                                }`}
                        >
                            <Upload className={`w-8 h-8 mx-auto mb-3 ${dragOver ? "text-violet-400" : "text-gray-300"}`} strokeWidth={1.5} />
                            <p className={`text-xs ${dragOver ? "text-violet-600" : "text-gray-400"}`}>
                                {dragOver ? labels.dropZoneActive : labels.dropZone}
                            </p>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".csv"
                                onChange={handleFileInput}
                                className="hidden"
                            />
                        </div>
                    ) : (
                        <div className="border border-gray-200 rounded-xl p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                    <FileSpreadsheet className="w-4.5 h-4.5 text-violet-500" strokeWidth={1.5} />
                                    <div>
                                        <p className="text-xs font-medium text-gray-700">{file.name}</p>
                                        <p className="text-[10px] text-gray-400">
                                            {parsedRows.length} {labels.rows}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={removeFile}
                                    className="text-[10px] text-red-500 hover:text-red-600 border border-red-200 rounded-lg px-2.5 py-1 transition-colors"
                                >
                                    {labels.remove}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Errors */}
                    {errors.length > 0 && (
                        <div className="bg-red-50 border border-red-100 rounded-xl p-3 space-y-1">
                            {errors.map((err, i) => (
                                <div key={i} className="flex items-start gap-2 text-xs text-red-600">
                                    <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                                    {err}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Preview table */}
                    {parsedRows.length > 0 && (
                        <div>
                            <p className="text-xs font-medium text-gray-600 mb-2">
                                {labels.preview} ({parsedRows.length} {labels.rows})
                            </p>
                            <div className="border border-gray-200 rounded-xl overflow-hidden">
                                <div className="overflow-x-auto max-h-60">
                                    <table className="w-full text-[10px]">
                                        <thead className="bg-gray-50 sticky top-0">
                                            <tr>
                                                <th className="px-3 py-2 text-left font-medium text-gray-500">#</th>
                                                {CSV_HEADERS.map(h => (
                                                    <th key={h} className="px-3 py-2 text-left font-medium text-gray-500 whitespace-nowrap">
                                                        {h}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {parsedRows.slice(0, 50).map((row, i) => (
                                                <tr key={i} className="hover:bg-gray-50/50">
                                                    <td className="px-3 py-1.5 text-gray-400">{i + 1}</td>
                                                    <td className="px-3 py-1.5 text-gray-700">{row.level1_es}</td>
                                                    <td className="px-3 py-1.5 text-gray-500">{row.level1_en}</td>
                                                    <td className="px-3 py-1.5 text-gray-500">{row.level1_pt}</td>
                                                    <td className="px-3 py-1.5 text-gray-700">{row.level2_es}</td>
                                                    <td className="px-3 py-1.5 text-gray-500">{row.level2_en}</td>
                                                    <td className="px-3 py-1.5 text-gray-500">{row.level2_pt}</td>
                                                    <td className="px-3 py-1.5 text-gray-700">{row.level3_es}</td>
                                                    <td className="px-3 py-1.5 text-gray-500">{row.level3_en}</td>
                                                    <td className="px-3 py-1.5 text-gray-500">{row.level3_pt}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Result */}
                    {result && (
                        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex items-center gap-3">
                            <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" strokeWidth={1.5} />
                            <div className="text-xs text-emerald-700">
                                {labels.success(result.created, result.skipped, result.totalRows)}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100">
                    <button
                        onClick={handleClose}
                        className="text-xs text-gray-500 hover:text-gray-700 border border-gray-200 rounded-xl px-4 py-2 transition-colors"
                    >
                        {result ? labels.close : labels.cancel}
                    </button>
                    {!result && (
                        <button
                            onClick={handleUpload}
                            disabled={uploading || parsedRows.length === 0}
                            className={`flex items-center gap-1.5 text-xs text-white rounded-xl px-4 py-2 transition-colors ${uploading || parsedRows.length === 0
                                    ? "bg-gray-300 cursor-not-allowed"
                                    : "bg-violet-600 hover:bg-violet-700"
                                }`}
                        >
                            {uploading ? (
                                <>
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={1.5} />
                                    {labels.uploading}
                                </>
                            ) : (
                                <>
                                    <Upload className="w-3.5 h-3.5" strokeWidth={1.5} />
                                    {labels.upload}
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
