import { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { X, Upload, Check } from "lucide-react";
import { DEFAULT_AVATARS, resolveAvatar } from "../../lib/avatars";

/* ── Props ─────────────────────────────────────────────────────────── */
interface AvatarPickerProps {
    currentAvatar: string;
    onSelect: (url: string) => void;
    onClose: () => void;
}

export function AvatarPicker({ currentAvatar, onSelect, onClose }: AvatarPickerProps) {
    const [selected, setSelected] = useState(currentAvatar);
    const [uploading, setUploading] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);

    /** Resolve the current selection to a displayable src */
    const previewSrc = resolveAvatar(selected);

    const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith("image/")) return;
        if (file.size > 2 * 1024 * 1024) {
            alert("La imagen no puede pesar más de 2 MB");
            return;
        }
        setUploading(true);
        const reader = new FileReader();
        reader.onload = () => {
            const dataUrl = reader.result as string;
            setSelected(dataUrl);
            setUploading(false);
        };
        reader.readAsDataURL(file);
    };

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/40" onClick={onClose} />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <h3 className="text-sm font-medium text-gray-900">Cambiar foto de perfil</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Preview */}
                <div className="flex justify-center py-6">
                    <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-gray-200 bg-gray-100 flex items-center justify-center">
                        {previewSrc ? (
                            <img src={previewSrc} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-2xl text-gray-400">?</span>
                        )}
                    </div>
                </div>

                {/* Default avatars */}
                <div className="px-6">
                    <p className="text-xs text-gray-400 mb-3 tracking-wide uppercase">Elige un avatar</p>
                    <div className="grid grid-cols-5 gap-3">
                        {DEFAULT_AVATARS.map((dataUri, i) => {
                            const id = `default:${i + 1}`;
                            return (
                                <button
                                    key={id}
                                    onClick={() => setSelected(id)}
                                    className={`relative w-full aspect-square rounded-full overflow-hidden border-2 transition-all ${selected === id
                                        ? "border-gray-900 ring-2 ring-gray-900/20"
                                        : "border-gray-200 hover:border-gray-400"
                                        }`}
                                >
                                    <img src={dataUri} alt={`Avatar ${i + 1}`} className="w-full h-full" />
                                    {selected === id && (
                                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                                            <Check className="w-4 h-4 text-white" />
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Upload custom */}
                <div className="px-6 mt-4">
                    <p className="text-xs text-gray-400 mb-3 tracking-wide uppercase">O sube tu propia foto</p>
                    <input
                        ref={fileRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFile}
                        className="hidden"
                    />
                    <button
                        onClick={() => fileRef.current?.click()}
                        disabled={uploading}
                        className="w-full flex items-center justify-center gap-2 text-xs text-gray-700 border border-dashed border-gray-300 rounded-xl py-3 hover:border-gray-400 hover:bg-gray-50 transition-all disabled:opacity-50"
                    >
                        <Upload className="w-4 h-4" />
                        {uploading ? "Procesando…" : "Subir imagen (máx. 2 MB)"}
                    </button>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-2 px-6 py-4 mt-2 border-t border-gray-100">
                    <button
                        onClick={onClose}
                        className="text-xs text-gray-500 border border-gray-200 rounded-lg px-4 py-2 hover:bg-gray-50 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={() => { onSelect(selected); onClose(); }}
                        disabled={!selected}
                        className="text-xs text-white bg-gray-900 rounded-lg px-4 py-2 hover:bg-gray-800 transition-colors disabled:opacity-50"
                    >
                        Guardar
                    </button>
                </div>
            </div>
        </div>,
        document.body,
    );
}
