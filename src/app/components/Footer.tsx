import { Facebook, Instagram, Twitter, Youtube, Mail, Phone, MapPin, Gift } from "lucide-react";
import { Link } from "react-router";
import { useLanguage } from "../context/LanguageContext";

export function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="bg-gray-50 border-t border-gray-200 mt-auto hidden sm:block">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">

          {/* Brand */}
          <div className="col-span-2 md:col-span-3 lg:col-span-1">
            <h3 className="text-lg mb-3">NX036</h3>
            <p className="text-sm text-gray-600 mb-5 leading-relaxed">
              {t("footer.brand.desc")}
            </p>
            <div className="flex gap-2">
              {[
                { icon: Facebook, label: "Facebook" },
                { icon: Instagram, label: "Instagram" },
                { icon: Twitter, label: "Twitter/X" },
                { icon: Youtube, label: "YouTube" },
              ].map(({ icon: Icon, label }) => (
                <a key={label} href="#" aria-label={label}
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-600 hover:text-white hover:border-gray-600 transition-colors">
                  <Icon className="w-3.5 h-3.5" />
                </a>
              ))}
            </div>
          </div>

          {/* Tienda */}
          <div>
            <h3 className="text-sm mb-4">{t("footer.store")}</h3>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/" className="text-gray-500 hover:text-gray-900 transition-colors">{t("footer.store.all")}</Link></li>
              <li><Link to="/?ofertas=true" className="text-gray-500 hover:text-gray-900 transition-colors">{t("footer.store.deals")}</Link></li>
              <li><Link to="/?category=Electrónica" className="text-gray-500 hover:text-gray-900 transition-colors">{t("footer.store.electronics")}</Link></li>
              <li><Link to="/?category=Calzado" className="text-gray-500 hover:text-gray-900 transition-colors">{t("footer.store.footwear")}</Link></li>
              <li><Link to="/?category=Audio" className="text-gray-500 hover:text-gray-900 transition-colors">{t("footer.store.audio")}</Link></li>
              <li><Link to="/compare" className="text-gray-500 hover:text-gray-900 transition-colors">{t("footer.store.compare")}</Link></li>
              <li>
                <Link to="/gift-cards" className="inline-flex items-center gap-1.5 text-gray-500 hover:text-gray-900 transition-colors">
                  <Gift className="w-3 h-3" strokeWidth={1.5} />
                  {t("footer.store.giftcards")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Mi cuenta */}
          <div>
            <h3 className="text-sm mb-4">{t("footer.account")}</h3>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/account" className="text-gray-500 hover:text-gray-900 transition-colors">{t("footer.account.profile")}</Link></li>
              <li><Link to="/account?tab=orders" className="text-gray-500 hover:text-gray-900 transition-colors">{t("footer.account.orders")}</Link></li>
              <li><Link to="/account?tab=favorites" className="text-gray-500 hover:text-gray-900 transition-colors">{t("footer.account.favorites")}</Link></li>
              <li><Link to="/account?tab=giftcards" className="text-gray-500 hover:text-gray-900 transition-colors">{t("footer.account.giftcards")}</Link></li>
              <li><Link to="/tracking" className="text-gray-500 hover:text-gray-900 transition-colors">{t("footer.account.tracking")}</Link></li>
              <li><Link to="/cart" className="text-gray-500 hover:text-gray-900 transition-colors">{t("footer.account.cart")}</Link></li>
            </ul>
          </div>

          {/* Ayuda */}
          <div>
            <h3 className="text-sm mb-4">{t("footer.help.section")}</h3>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/faq" className="text-gray-500 hover:text-gray-900 transition-colors">{t("footer.help.faqLink")}</Link></li>
              <li><Link to="/shipping" className="text-gray-500 hover:text-gray-900 transition-colors">{t("footer.help.shippingInfo")}</Link></li>
              <li><Link to="/contact" className="text-gray-500 hover:text-gray-900 transition-colors">{t("footer.help.contactLink")}</Link></li>
              <li><Link to="/about" className="text-gray-500 hover:text-gray-900 transition-colors">{t("footer.help.about")}</Link></li>
            </ul>
          </div>

          {/* Contacto */}
          <div>
            <h3 className="text-sm mb-4">{t("footer.contact.title")}</h3>
            <ul className="space-y-3 text-sm text-gray-500">
              <li className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                <span>{t("footer.contact.address")}</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 flex-shrink-0" strokeWidth={1.5} />
                <span>+1 (212) 555-0199</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 flex-shrink-0" strokeWidth={1.5} />
                <span>info@nx036.com</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-gray-200 mt-10 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-500">{t("footer.bottom.copyright")}</p>
          <div className="flex flex-wrap gap-5 text-sm">
            <Link to="/legal/privacidad" className="text-gray-500 hover:text-gray-900 transition-colors">{t("footer.bottom.privacy")}</Link>
            <Link to="/legal/terminos" className="text-gray-500 hover:text-gray-900 transition-colors">{t("footer.bottom.terms")}</Link>
            <Link to="/legal/cookies" className="text-gray-500 hover:text-gray-900 transition-colors">{t("footer.bottom.cookies")}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
