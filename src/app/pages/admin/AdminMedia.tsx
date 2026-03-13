import { useState, useRef, useMemo, useEffect } from "react";
import {
  Upload, X, Search, Trash2, Image as ImageIcon,
  Download, Copy, Check, LayoutGrid, List, Calendar,
  FileImage, AlertTriangle, Eye, Plus, Filter, ArrowUpDown,
  ExternalLink, Maximize2, Info, ChevronLeft, ChevronRight
} from "lucide-react";
import { toast } from "sonner";

/* ── Types ──────────────────────────────────────────── */
interface MediaItem {
  id: string;
  url: string;
  name: string;
  size: number; // bytes
  type: string; // image/jpeg, image/png, etc.
  uploadedAt: Date;
  width?: number;
  height?: number;
  category?: string;
  tags: string[];
}

/* ── Mock data ────────────────────────────────────────── */
const INITIAL_MEDIA: MediaItem[] = [
  {
    id: "1",
    url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800",
    name: "producto-auriculares.jpg",
    size: 245680,
    type: "image/jpeg",
    uploadedAt: new Date("2024-03-10"),
    width: 1920,
    height: 1080,
    category: "productos",
    tags: ["auriculares", "audio", "electrónica"],
  },
  {
    id: "2",
    url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800",
    name: "reloj-smartwatch.jpg",
    size: 189234,
    type: "image/jpeg",
    uploadedAt: new Date("2024-03-09"),
    width: 1920,
    height: 1280,
    category: "productos",
    tags: ["reloj", "smartwatch", "wearable"],
  },
  {
    id: "3",
    url: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800",
    name: "banner-promo.jpg",
    size: 512400,
    type: "image/jpeg",
    uploadedAt: new Date("2024-03-08"),
    width: 2560,
    height: 1440,
    category: "banners",
    tags: ["promoción", "descuento", "banner"],
  },
  {
    id: "4",
    url: "https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=800",
    name: "zapatos-deportivos.jpg",
    size: 298765,
    type: "image/jpeg",
    uploadedAt: new Date("2024-03-07"),
    width: 1920,
    height: 1080,
    category: "productos",
    tags: ["zapatos", "deporte", "calzado"],
  },
  {
    id: "5",
    url: "https://images.unsplash.com/photo-1560393464-5c69a73c5770?w=800",
    name: "mochila-urbana.jpg",
    size: 156789,
    type: "image/jpeg",
    uploadedAt: new Date("2024-03-06"),
    width: 1600,
    height: 1200,
    category: "productos",
    tags: ["mochila", "accesorios", "viaje"],
  },
  {
    id: "6",
    url: "https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=800",
    name: "perfume-fragancia.jpg",
    size: 223456,
    type: "image/jpeg",
    uploadedAt: new Date("2024-03-05"),
    width: 1920,
    height: 1280,
    category: "productos",
    tags: ["perfume", "fragancia", "belleza"],
  },
];

/* ── Utility functions ─────────────────────────────────── */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

/* ── Upload Modal ──────────────────────────────────────── */
function UploadModal({
  onUpload,
  onClose,
}: {
  onUpload: (items: MediaItem[]) => void;
  onClose: () => void;
}) {
  const [dragActive, setDragActive] = useState(false);
  const [imageUrls, setImageUrls] = useState<string>("");
  const [category, setCategory] = useState("productos");
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleDrag(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  }

  function handleFiles(files: FileList) {
    const newItems: MediaItem[] = [];

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith("image/")) {
        toast.error(`${file.name} no es una imagen válida`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const url = e.target?.result as string;
        const img = new Image();
        img.onload = () => {
          const item: MediaItem = {
            id: `${Date.now()}-${Math.random()}`,
            url,
            name: file.name,
            size: file.size,
            type: file.type,
            uploadedAt: new Date(),
            width: img.width,
            height: img.height,
            category,
            tags: [...tags],
          };
          newItems.push(item);

          if (newItems.length === files.length) {
            onUpload(newItems);
            toast.success(`${newItems.length} imagen(es) cargadas`);
          }
        };
        img.src = url;
      };
      reader.readAsDataURL(file);
    });
  }

  function handleUrlUpload() {
    if (!imageUrls.trim()) {
      toast.error("Por favor ingresa al menos una URL");
      return;
    }

    const urls = imageUrls
      .split("\n")
      .map((u) => u.trim())
      .filter((u) => u.length > 0);

    const newItems: MediaItem[] = urls.map((url, idx) => ({
      id: `${Date.now()}-${idx}`,
      url,
      name: `imagen-${Date.now()}-${idx}.jpg`,
      size: 0, // Unknown size for external URLs
      type: "image/jpeg",
      uploadedAt: new Date(),
      category,
      tags: [...tags],
    }));

    onUpload(newItems);
    toast.success(`${newItems.length} imagen(es) agregadas desde URL`);
  }

  function handleAddTag() {
    if (!newTag.trim()) return;
    if (tags.includes(newTag.trim().toLowerCase())) {
      toast.error("Este tag ya existe");
      return;
    }
    setTags((prev) => [...prev, newTag.trim().toLowerCase()]);
    setNewTag("");
  }

  const field = "w-full text-xs text-gray-900 border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-gray-400 placeholder-gray-300 bg-white";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-lg w-full max-w-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex-1 text-center">
            <h2 className="text-sm text-gray-900">Cargar imágenes</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Arrastra archivos o pega URLs de imágenes
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Drag & Drop zone */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
              dragActive
                ? "border-gray-900 bg-gray-50"
                : "border-gray-200 hover:border-gray-400 hover:bg-gray-50"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileInput}
              className="hidden"
            />
            <Upload
              className={`w-10 h-10 mx-auto mb-3 transition-colors ${
                dragActive ? "text-gray-900" : "text-gray-300"
              }`}
              strokeWidth={1.5}
            />
            <p className="text-sm text-gray-700 mb-1">
              Arrastra imágenes aquí o haz clic para seleccionar
            </p>
            <p className="text-xs text-gray-400">
              Formatos soportados: JPG, PNG, GIF, WebP
            </p>
          </div>

          {/* URL input */}
          <div className="border-t border-gray-100 pt-5">
            <label className="block text-xs text-gray-400 mb-1.5 uppercase tracking-wider">
              O pega URLs de imágenes (una por línea)
            </label>
            <textarea
              value={imageUrls}
              onChange={(e) => setImageUrls(e.target.value)}
              className={`${field} h-24 resize-none font-mono`}
              placeholder="https://example.com/imagen1.jpg&#10;https://example.com/imagen2.jpg"
            />
          </div>

          {/* Category selector */}
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">
              Categoría
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={field}
            >
              <option value="productos">Productos</option>
              <option value="banners">Banners</option>
              <option value="categorias">Categorías</option>
              <option value="logos">Logos</option>
              <option value="otros">Otros</option>
            </select>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs text-gray-400 mb-1.5 uppercase tracking-wider">
              Tags ({tags.length})
            </label>
            <div className="flex gap-2 mb-3">
              <input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddTag()}
                className={field}
                placeholder="Agregar tag..."
              />
              <button
                onClick={handleAddTag}
                className="flex items-center gap-1.5 text-xs text-white bg-gray-900 rounded-xl px-4 py-2.5 hover:bg-gray-800 transition-colors whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" strokeWidth={1.5} />
                Agregar
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {tags.length === 0 && (
                <p className="text-xs text-gray-400 text-center py-4 bg-gray-50 rounded-xl w-full">
                  No hay tags aún
                </p>
              )}
              {tags.map((tag) => (
                <div
                  key={tag}
                  className="inline-flex items-center gap-2 bg-gray-100 text-gray-700 text-xs rounded-lg px-3 py-1.5"
                >
                  <span>{tag}</span>
                  <button
                    onClick={() => setTags((prev) => prev.filter((t) => t !== tag))}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <X className="w-3 h-3" strokeWidth={1.5} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50">
          <button
            onClick={onClose}
            className="text-xs text-gray-500 border border-gray-200 rounded-xl px-4 py-2.5 hover:bg-white transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleUrlUpload}
            className="flex items-center gap-1.5 text-xs text-white bg-gray-900 rounded-xl px-5 py-2.5 hover:bg-gray-800 transition-colors"
          >
            <Upload className="w-3.5 h-3.5" strokeWidth={1.5} />
            Agregar desde URLs
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Image Detail Modal ────────────────────────────────── */
function ImageDetailModal({
  item,
  onClose,
  onDelete,
  onUpdate,
}: {
  item: MediaItem;
  onClose: () => void;
  onDelete: () => void;
  onUpdate: (updated: MediaItem) => void;
}) {
  const [editMode, setEditMode] = useState(false);
  const [name, setName] = useState(item.name);
  const [category, setCategory] = useState(item.category || "productos");
  const [tags, setTags] = useState<string[]>(item.tags);
  const [newTag, setNewTag] = useState("");
  const [copied, setCopied] = useState(false);

  function handleCopyUrl() {
    navigator.clipboard.writeText(item.url);
    setCopied(true);
    toast.success("URL copiada");
    setTimeout(() => setCopied(false), 2000);
  }

  function handleSave() {
    onUpdate({
      ...item,
      name,
      category,
      tags,
    });
    setEditMode(false);
    toast.success("Imagen actualizada");
  }

  function handleAddTag() {
    if (!newTag.trim()) return;
    if (tags.includes(newTag.trim().toLowerCase())) {
      toast.error("Este tag ya existe");
      return;
    }
    setTags((prev) => [...prev, newTag.trim().toLowerCase()]);
    setNewTag("");
  }

  const field = "w-full text-xs text-gray-900 border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-gray-400 placeholder-gray-300 bg-white";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-lg w-full max-w-4xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex-1">
            <h2 className="text-sm text-gray-900">{item.name}</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {formatFileSize(item.size)} · {formatDate(item.uploadedAt)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </div>

        {/* Body */}
        <div className="grid md:grid-cols-2 gap-6 p-6 max-h-[80vh] overflow-y-auto">
          {/* Image preview */}
          <div className="space-y-4">
            <div className="bg-gray-50 border border-gray-200 rounded-xl overflow-hidden aspect-square flex items-center justify-center">
              <img
                src={item.url}
                alt={item.name}
                className="w-full h-full object-contain"
              />
            </div>

            {/* Quick actions */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleCopyUrl}
                className="flex items-center justify-center gap-2 text-xs text-gray-700 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 hover:bg-gray-100 transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5" strokeWidth={1.5} />
                    Copiado
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" strokeWidth={1.5} />
                    Copiar URL
                  </>
                )}
              </button>
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 text-xs text-gray-700 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 hover:bg-gray-100 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" strokeWidth={1.5} />
                Abrir
              </a>
            </div>
          </div>

          {/* Details & Edit */}
          <div className="space-y-5">
            {/* Info */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Info className="w-3.5 h-3.5" strokeWidth={1.5} />
                <span className="uppercase tracking-wider">Información</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="text-gray-400">Dimensiones</p>
                  <p className="text-gray-900 mt-0.5">
                    {item.width && item.height
                      ? `${item.width} × ${item.height}px`
                      : "Desconocido"}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400">Tipo</p>
                  <p className="text-gray-900 mt-0.5">{item.type}</p>
                </div>
                <div>
                  <p className="text-gray-400">Tamaño</p>
                  <p className="text-gray-900 mt-0.5">{formatFileSize(item.size)}</p>
                </div>
                <div>
                  <p className="text-gray-400">Subida</p>
                  <p className="text-gray-900 mt-0.5">{formatDate(item.uploadedAt)}</p>
                </div>
              </div>
            </div>

            {/* Edit form */}
            {editMode ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">Nombre</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={field}
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">Categoría</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className={field}
                  >
                    <option value="productos">Productos</option>
                    <option value="banners">Banners</option>
                    <option value="categorias">Categorías</option>
                    <option value="logos">Logos</option>
                    <option value="otros">Otros</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-1.5 uppercase tracking-wider">
                    Tags ({tags.length})
                  </label>
                  <div className="flex gap-2 mb-3">
                    <input
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAddTag()}
                      className={field}
                      placeholder="Agregar tag..."
                    />
                    <button
                      onClick={handleAddTag}
                      className="flex items-center gap-1.5 text-xs text-white bg-gray-900 rounded-xl px-4 py-2.5 hover:bg-gray-800 transition-colors whitespace-nowrap"
                    >
                      <Plus className="w-3.5 h-3.5" strokeWidth={1.5} />
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <div
                        key={tag}
                        className="inline-flex items-center gap-2 bg-gray-100 text-gray-700 text-xs rounded-lg px-3 py-1.5"
                      >
                        <span>{tag}</span>
                        <button
                          onClick={() => setTags((prev) => prev.filter((t) => t !== tag))}
                          className="text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <X className="w-3 h-3" strokeWidth={1.5} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setEditMode(false)}
                    className="flex-1 text-xs text-gray-500 border border-gray-200 rounded-xl px-4 py-2.5 hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSave}
                    className="flex-1 flex items-center justify-center gap-1.5 text-xs text-white bg-gray-900 rounded-xl px-4 py-2.5 hover:bg-gray-800 transition-colors"
                  >
                    <Check className="w-3.5 h-3.5" strokeWidth={1.5} />
                    Guardar
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-gray-400 mb-1.5">Categoría</p>
                  <span className="inline-block text-xs bg-gray-100 text-gray-700 rounded-lg px-3 py-1.5">
                    {item.category || "Sin categoría"}
                  </span>
                </div>

                <div>
                  <p className="text-xs text-gray-400 mb-1.5">Tags</p>
                  <div className="flex flex-wrap gap-2">
                    {item.tags.length === 0 && (
                      <span className="text-xs text-gray-400">Sin tags</span>
                    )}
                    {item.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-block text-xs bg-blue-50 text-blue-700 rounded-lg px-3 py-1.5"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setEditMode(true)}
                    className="flex-1 flex items-center justify-center gap-1.5 text-xs text-gray-700 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 hover:bg-gray-100 transition-colors"
                  >
                    <FileImage className="w-3.5 h-3.5" strokeWidth={1.5} />
                    Editar
                  </button>
                  <button
                    onClick={onDelete}
                    className="flex-1 flex items-center justify-center gap-1.5 text-xs text-white bg-red-500 rounded-xl px-4 py-2.5 hover:bg-red-600 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                    Eliminar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Main Component ────────────────────────────────────── */
export function AdminMedia() {
  const [mediaList, setMediaList] = useState<MediaItem[]>(INITIAL_MEDIA);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"date" | "name" | "size">("date");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<MediaItem | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const ITEMS_PER_PAGE = 12;

  // Reset page when filters change
  useEffect(() => { setCurrentPage(1); }, [search, selectedCategory, sortBy, viewMode]);

  // Filter and sort
  const filtered = mediaList.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.tags.some((tag) => tag.toLowerCase().includes(search.toLowerCase()));
    const matchesCategory =
      selectedCategory === "all" || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "date") return b.uploadedAt.getTime() - a.uploadedAt.getTime();
    if (sortBy === "name") return a.name.localeCompare(b.name);
    if (sortBy === "size") return b.size - a.size;
    return 0;
  });

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sorted.length / ITEMS_PER_PAGE));
  const paginated = useMemo(
    () => sorted.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE),
    [sorted, currentPage]
  );

  // Stats
  const totalSize = mediaList.reduce((sum, item) => sum + item.size, 0);
  const categories = Array.from(new Set(mediaList.map((item) => item.category || "otros")));

  function handleUpload(newItems: MediaItem[]) {
    setMediaList((prev) => [...newItems, ...prev]);
    setShowUploadModal(false);
    setCurrentPage(1);
  }

  function handleDelete(id: string) {
    setMediaList((prev) => prev.filter((item) => item.id !== id));
    setSelectedImage(null);
    toast.success("Imagen eliminada");
  }

  function handleUpdate(updated: MediaItem) {
    setMediaList((prev) =>
      prev.map((item) => (item.id === updated.id ? updated : item))
    );
    setSelectedImage(updated);
  }

  return (
    <div className="h-full flex flex-col space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl text-gray-900 tracking-tight">Galería de Medios</h1>
          <p className="text-xs text-gray-400 mt-1">
            {mediaList.length} imágenes · {formatFileSize(totalSize)} total
          </p>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="w-9 h-9 bg-gray-900 text-white rounded-full hover:bg-gray-800 transition-all flex items-center justify-center shadow-sm hover:shadow-md flex-shrink-0"
          title="Cargar imágenes"
        >
          <Plus className="w-4 h-4" strokeWidth={1.5} />
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-100 rounded-xl px-4 py-3.5">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300"
              strokeWidth={1.5}
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre o tags..."
              className="w-full text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-xl pl-8 pr-3 py-2 focus:outline-none focus:border-gray-400 placeholder-gray-300"
            />
          </div>

          {/* Category filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-xs text-gray-700 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-gray-400"
          >
            <option value="all">Todas las categorías</option>
            <option value="productos">Productos</option>
            <option value="banners">Banners</option>
            <option value="categorias">Categorías</option>
            <option value="logos">Logos</option>
            <option value="otros">Otros</option>
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="text-xs text-gray-700 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-gray-400"
          >
            <option value="date">Más recientes</option>
            <option value="name">Nombre A-Z</option>
            <option value="size">Tamaño</option>
          </select>

          {/* View mode */}
          <div className="flex gap-1 bg-gray-50 border border-gray-200 rounded-xl p-1">
            <button
              onClick={() => setViewMode("grid")}
              className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all ${
                viewMode === "grid"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-400 hover:text-gray-700"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" strokeWidth={1.5} />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all ${
                viewMode === "list"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-400 hover:text-gray-700"
              }`}
            >
              <List className="w-3.5 h-3.5" strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </div>

      {/* Media Grid/List */}
      <div className="flex-1 overflow-auto pr-1">
        {sorted.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 bg-white border border-gray-100 rounded-xl text-center">
            <ImageIcon className="w-12 h-12 text-gray-200 mb-3" strokeWidth={1.5} />
            <p className="text-sm text-gray-400 mb-1">No hay imágenes</p>
            <p className="text-xs text-gray-300">
              {search ? "Intenta con otra búsqueda" : "Sube tu primera imagen"}
            </p>
          </div>
        )}

        {viewMode === "grid" ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {paginated.map((item) => (
              <div
                key={item.id}
                onClick={() => setSelectedImage(item)}
                className="group bg-white border border-gray-100 rounded-xl overflow-hidden cursor-pointer hover:border-gray-300 hover:shadow-md transition-all"
              >
                <div className="aspect-square bg-gray-50 overflow-hidden relative">
                  <img
                    src={item.url}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                    <Eye className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" strokeWidth={1.5} />
                  </div>
                </div>
                <div className="p-3">
                  <p className="text-xs text-gray-900 truncate mb-1">{item.name}</p>
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>{formatFileSize(item.size)}</span>
                    <span className="truncate ml-2">
                      {item.width && item.height ? `${item.width}×${item.height}` : ""}
                    </span>
                  </div>
                  {item.tags.length > 0 && (
                    <div className="flex gap-1 mt-2">
                      {item.tags.slice(0, 2).map((tag) => (
                        <span
                          key={tag}
                          className="inline-block text-[10px] bg-blue-50 text-blue-600 rounded px-1.5 py-0.5 truncate"
                        >
                          {tag}
                        </span>
                      ))}
                      {item.tags.length > 2 && (
                        <span className="text-[10px] text-gray-400">+{item.tags.length - 2}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {paginated.map((item) => (
              <div
                key={item.id}
                onClick={() => setSelectedImage(item)}
                className="group bg-white border border-gray-100 rounded-xl p-4 cursor-pointer hover:border-gray-300 hover:shadow-sm transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gray-50 border border-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                    <img
                      src={item.url}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 truncate mb-1">
                      {item.name}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-gray-400">
                      <span>{formatFileSize(item.size)}</span>
                      <span>·</span>
                      {item.width && item.height && (
                        <>
                          <span>{item.width} × {item.height}px</span>
                          <span>·</span>
                        </>
                      )}
                      <span>{formatDate(item.uploadedAt)}</span>
                      {item.category && (
                        <>
                          <span>·</span>
                          <span className="bg-gray-100 text-gray-600 rounded px-2 py-0.5">
                            {item.category}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigator.clipboard.writeText(item.url);
                        toast.success("URL copiada");
                      }}
                      className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <Copy className="w-3.5 h-3.5" strokeWidth={1.5} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedImage(item);
                      }}
                      className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Eye className="w-3.5 h-3.5" strokeWidth={1.5} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-white border border-gray-100 rounded-xl px-4 py-3 flex items-center justify-between flex-shrink-0">
          <p className="text-xs text-gray-400">
            {(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, sorted.length)} de {sorted.length} imágenes
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:text-gray-700 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" strokeWidth={1.5} />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
              .reduce<(number | "…")[]>((acc, p, idx, arr) => {
                if (idx > 0 && (p as number) - (arr[idx - 1] as number) > 1) acc.push("…");
                acc.push(p);
                return acc;
              }, [])
              .map((p, i) =>
                p === "…" ? (
                  <span key={`ellipsis-${i}`} className="w-8 h-8 flex items-center justify-center text-xs text-gray-300">…</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setCurrentPage(p as number)}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs transition-colors ${
                      currentPage === p
                        ? "bg-gray-900 text-white"
                        : "border border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {p}
                  </button>
                )
              )}

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:text-gray-700 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-3.5 h-3.5" strokeWidth={1.5} />
            </button>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <UploadModal onUpload={handleUpload} onClose={() => setShowUploadModal(false)} />
      )}

      {/* Image Detail Modal */}
      {selectedImage && (
        <ImageDetailModal
          item={selectedImage}
          onClose={() => setSelectedImage(null)}
          onDelete={() => handleDelete(selectedImage.id)}
          onUpdate={handleUpdate}
        />
      )}
    </div>
  );
}