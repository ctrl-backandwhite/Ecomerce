import { ShoppingCart, Menu, Search, X, Heart, User, LogOut, LayoutDashboard, Gift, Clock } from "lucide-react";
import { Link, useNavigate } from "react-router";
import { urls } from "../lib/urls";
import { useCart } from "../context/CartContext";
import { useUser } from "../context/UserContext";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { useTimezone } from "../context/TimezoneContext";
import { useState, useRef, useEffect } from "react";

export function Header() {
  const { getTotalItems } = useCart();
  const { user } = useUser();
  const { logout } = useAuth();
  const { t } = useLanguage();
  const { selectedCountry, toggleSidebar } = useTimezone();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const initials = `${user.firstName[0]}${user.lastName[0]}`;

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsUserDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(urls.search(searchQuery));
      setSearchQuery("");
      setIsMenuOpen(false);
      setTimeout(() => {
        const el = document.getElementById("productos");
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 150);
    }
  };

  const handleProductos = () => {
    navigate(urls.store());
    setIsMenuOpen(false);
    setTimeout(() => {
      const el = document.getElementById("productos");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  };

  const handleLogout = () => {
    setIsUserDropdownOpen(false);
    logout();
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        {/* Main header bar */}
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gray-500 rounded flex items-center justify-center sm:flex hidden">
              <ShoppingCart className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl tracking-tight">NX036</span>
          </Link>

          {/* Desktop Search */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder={t("search.placeholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
            </div>
          </form>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <Link to="/cuenta?tab=favoritos" className="p-2 text-gray-700 hover:text-gray-900 transition-colors" title={t("nav.favorites")}>
              <Heart className="w-5 h-5" />
            </Link>

            <Link to="/carrito" className="relative p-2 text-gray-700 hover:text-gray-900 transition-colors">
              <ShoppingCart className="w-5 h-5" />
              {getTotalItems() > 0 && (
                <span className="absolute -top-1 -right-1 bg-gray-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                  {getTotalItems()}
                </span>
              )}
            </Link>

            {/* ── Country / Timezone Selector (also sets language) ── */}
            <button
              onClick={toggleSidebar}
              className="flex items-center gap-1.5 px-2 py-1.5 text-gray-700 hover:text-gray-900 transition-colors rounded-lg hover:bg-gray-50"
              title={t("tz.tooltip")}
            >
              <Clock className="w-4 h-4" strokeWidth={1.5} />
              <span className="text-base leading-none">{selectedCountry.flag}</span>
            </button>

            {/* ── User Dropdown ── */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsUserDropdownOpen((v) => !v)}
                className="flex items-center gap-2 group"
              >
                <div className="w-8 h-8 rounded-full bg-gray-500 flex items-center justify-center text-white text-xs tracking-widest group-hover:bg-gray-400 transition-colors">
                  {initials}
                </div>
              </button>

              {isUserDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-gray-100 rounded-xl shadow-lg overflow-hidden z-50">
                  {/* Header del dropdown */}
                  <div className="px-4 py-5 border-b border-gray-100 bg-gray-50 flex flex-col items-center text-center">
                    <div className="w-12 h-12 rounded-full bg-gray-500 flex items-center justify-center text-white text-sm tracking-widest mb-3">
                      {initials}
                    </div>
                    <p className="text-sm text-gray-900">{user.firstName} {user.lastName}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{user.email}</p>
                    <div className="mt-2.5 flex items-center justify-center gap-1.5 text-xs text-gray-500">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                      Miembro NX036 · {user.loyaltyPoints.toLocaleString()} pts
                    </div>
                  </div>

                  {/* Opciones principales */}
                  <div className="py-1.5">
                    <Link
                      to="/cuenta"
                      onClick={() => setIsUserDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <User className="w-3.5 h-3.5 text-gray-600" strokeWidth={1.5} />
                      </div>
                      <div>
                        <p className="text-sm text-gray-900">{t("nav.profile")}</p>
                        <p className="text-xs text-gray-400">{t("nav.profile.desc")}</p>
                      </div>
                    </Link>
                  </div>

                  {/* Administrar tienda */}
                  <div className="px-3 pb-2">
                    <div className="border border-gray-100 rounded-xl overflow-hidden">
                      <div className="px-3 py-2 bg-gray-50 border-b border-gray-100">
                        <p className="text-xs text-gray-400 tracking-wide uppercase">{t("nav.store")}</p>
                      </div>
                      <Link
                        to="/admin"
                        onClick={() => setIsUserDropdownOpen(false)}
                        className="flex items-center gap-3 px-3 py-3 hover:bg-gray-50 transition-colors"
                      >
                        <div className="w-7 h-7 rounded-lg bg-gray-500 flex items-center justify-center flex-shrink-0">
                          <LayoutDashboard className="w-3.5 h-3.5 text-white" strokeWidth={1.5} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-900">{t("nav.admin")}</p>
                          <p className="text-xs text-gray-400">{t("nav.admin.desc")}</p>
                        </div>
                        <span className="text-xs text-green-600 bg-green-50 border border-green-100 px-1.5 py-0.5 rounded-full flex-shrink-0">
                          {t("nav.store.active")}
                        </span>
                      </Link>
                    </div>
                  </div>

                  {/* Cerrar sesión */}
                  <div className="border-t border-gray-100 py-1.5">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4" strokeWidth={1.5} />
                      {t("nav.logout")}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center gap-1 md:hidden">
            {/* Gift card icon — mobile only */}
            <Link to="/tarjetas-regalo" className="p-2 text-gray-500 hover:text-gray-900 transition-colors">
              <Gift className="w-5 h-5" strokeWidth={1.5} />
            </Link>
            <Link to="/carrito" className="relative p-2">
              <ShoppingCart className="w-5 h-5" />
              {getTotalItems() > 0 && (
                <span className="absolute -top-1 -right-1 bg-gray-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                  {getTotalItems()}
                </span>
              )}
            </Link>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            {/* Mobile Search */}

            {/* Mobile Country / Timezone Button (also sets language) */}
            <button
              onClick={() => { setIsMenuOpen(false); toggleSidebar(); }}
              className="flex items-center gap-2 w-full px-3 py-2 mb-3 rounded-lg text-sm text-gray-700 bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <Clock className="w-4 h-4" strokeWidth={1.5} />
              <span>{selectedCountry.flag}</span>
              <span>{t("tz.tooltip")}</span>
              <span className="ml-auto text-xs text-gray-400">{selectedCountry.country}</span>
            </button>

            <form onSubmit={handleSearch} className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder={t("search.placeholder")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                />
              </div>
            </form>

            <nav className="flex flex-col gap-1">
              <Link
                to="/cuenta?tab=favoritos"
                onClick={() => setIsMenuOpen(false)}
                className="px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2"
              >
                <Heart className="w-4 h-4" strokeWidth={1.5} />
                {t("nav.favorites")}
              </Link>

              {/* Mobile user section */}
              <div className="mt-2 pt-2 border-t border-gray-100 space-y-1">
                <div className="px-3 py-2 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-500 flex items-center justify-center text-white text-xs tracking-widest">
                    {initials}
                  </div>
                  <div>
                    <p className="text-sm text-gray-900">{user.firstName} {user.lastName}</p>
                    <p className="text-xs text-gray-400">{user.email}</p>
                  </div>
                </div>
                <Link
                  to="/cuenta"
                  onClick={() => setIsMenuOpen(false)}
                  className="px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2"
                >
                  <User className="w-4 h-4" strokeWidth={1.5} />
                  {t("nav.profile")}
                </Link>
                <Link
                  to="/admin"
                  onClick={() => setIsMenuOpen(false)}
                  className="px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2"
                >
                  <LayoutDashboard className="w-4 h-4" strokeWidth={1.5} />
                  {t("nav.admin.short")}
                </Link>
                <button
                  onClick={() => { setIsMenuOpen(false); navigate("/"); }}
                  className="w-full px-3 py-2 text-left text-red-400 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" strokeWidth={1.5} />
                  {t("nav.logout")}
                </button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}