import { useState, useRef, useEffect, useCallback } from "react";
import { Search, X } from "lucide-react";
import { searchRepository, type AutocompleteSuggestion } from "../repositories/SearchRepository";

interface SearchAutocompleteProps {
    placeholder?: string;
    onSearch: (query: string) => void;
    onSelect?: (suggestion: AutocompleteSuggestion) => void;
}

export function SearchAutocomplete({ placeholder = "Buscar productos...", onSearch, onSelect }: SearchAutocompleteProps) {
    const [query, setQuery] = useState("");
    const [suggestions, setSuggestions] = useState<AutocompleteSuggestion[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const abortRef = useRef<AbortController | null>(null);

    const fetchSuggestions = useCallback(async (q: string) => {
        if (q.trim().length < 2) {
            setSuggestions([]);
            setIsOpen(false);
            return;
        }
        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        try {
            const results = await searchRepository.autocomplete(q, 8, controller.signal);
            setSuggestions(results);
            setIsOpen(results.length > 0);
            setActiveIndex(-1);
        } catch {
            // Silently ignore aborts/errors
        }
    }, []);

    // Debounced fetch on input change
    useEffect(() => {
        const timer = setTimeout(() => fetchSuggestions(query), 200);
        return () => {
            clearTimeout(timer);
            abortRef.current?.abort();
        };
    }, [query, fetchSuggestions]);

    // Close on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            setIsOpen(false);
            onSearch(query.trim());
        }
    };

    const handleSelect = (suggestion: AutocompleteSuggestion) => {
        setQuery(suggestion.text);
        setIsOpen(false);
        if (onSelect) {
            onSelect(suggestion);
        } else {
            onSearch(suggestion.text);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!isOpen) return;
        switch (e.key) {
            case "ArrowDown":
                e.preventDefault();
                setActiveIndex(prev => Math.min(prev + 1, suggestions.length - 1));
                break;
            case "ArrowUp":
                e.preventDefault();
                setActiveIndex(prev => Math.max(prev - 1, -1));
                break;
            case "Enter":
                e.preventDefault();
                if (activeIndex >= 0 && activeIndex < suggestions.length) {
                    handleSelect(suggestions[activeIndex]);
                } else if (query.trim()) {
                    setIsOpen(false);
                    onSearch(query.trim());
                }
                break;
            case "Escape":
                setIsOpen(false);
                break;
        }
    };

    return (
        <div ref={containerRef} className="relative w-full">
            <form onSubmit={handleSubmit}>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder={placeholder}
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onFocus={() => suggestions.length > 0 && setIsOpen(true)}
                        className="w-full pl-10 pr-8 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                        autoComplete="off"
                    />
                    {query && (
                        <button
                            type="button"
                            onClick={() => { setQuery(""); setSuggestions([]); setIsOpen(false); inputRef.current?.focus(); }}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </form>

            {isOpen && suggestions.length > 0 && (
                <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-y-auto">
                    {suggestions.map((s, idx) => (
                        <button
                            key={`${s.pid}-${idx}`}
                            type="button"
                            onClick={() => handleSelect(s)}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-50 transition-colors ${
                                idx === activeIndex ? "bg-gray-50" : ""
                            }`}
                        >
                            {s.imageUrl && (
                                <img
                                    src={s.imageUrl}
                                    alt=""
                                    className="w-10 h-10 object-cover rounded"
                                    loading="lazy"
                                />
                            )}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm text-gray-900 truncate">{s.text}</p>
                                {s.price != null && (
                                    <p className="text-xs text-gray-500">${s.price.toFixed(2)}</p>
                                )}
                            </div>
                            <Search className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
