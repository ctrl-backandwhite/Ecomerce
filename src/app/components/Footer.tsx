import { Facebook, Instagram, Twitter, Youtube, Mail, Phone, MapPin, Gift } from "lucide-react";
import { Link } from "react-router";

export function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200 mt-auto hidden sm:block">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">

          {/* Brand */}
          <div className="col-span-2 md:col-span-3 lg:col-span-1">
            <h3 className="text-lg mb-3">NX036</h3>
            <p className="text-sm text-gray-600 mb-5 leading-relaxed">
              Tu marketplace premium con los mejores productos, precios y servicio al cliente.
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
            <h3 className="text-sm mb-4">Tienda</h3>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/" className="text-gray-500 hover:text-gray-900 transition-colors">Todos los productos</Link></li>
              <li><Link to="/?ofertas=true" className="text-gray-500 hover:text-gray-900 transition-colors">Ofertas especiales</Link></li>
              <li><Link to="/?category=Electrónica" className="text-gray-500 hover:text-gray-900 transition-colors">Electrónica</Link></li>
              <li><Link to="/?category=Calzado" className="text-gray-500 hover:text-gray-900 transition-colors">Calzado</Link></li>
              <li><Link to="/?category=Audio" className="text-gray-500 hover:text-gray-900 transition-colors">Audio</Link></li>
              <li><Link to="/comparar" className="text-gray-500 hover:text-gray-900 transition-colors">Comparar productos</Link></li>
              <li>
                <Link to="/tarjetas-regalo" className="inline-flex items-center gap-1.5 text-gray-500 hover:text-gray-900 transition-colors">
                  <Gift className="w-3 h-3" strokeWidth={1.5} />
                  Tarjetas regalo
                </Link>
              </li>
            </ul>
          </div>

          {/* Mi cuenta */}
          <div>
            <h3 className="text-sm mb-4">Mi cuenta</h3>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/cuenta" className="text-gray-500 hover:text-gray-900 transition-colors">Mi perfil</Link></li>
              <li><Link to="/cuenta?tab=pedidos" className="text-gray-500 hover:text-gray-900 transition-colors">Mis pedidos</Link></li>
              <li><Link to="/cuenta?tab=favoritos" className="text-gray-500 hover:text-gray-900 transition-colors">Favoritos</Link></li>
              <li><Link to="/cuenta?tab=giftcards" className="text-gray-500 hover:text-gray-900 transition-colors">Tarjetas regalo</Link></li>
              <li><Link to="/seguimiento" className="text-gray-500 hover:text-gray-900 transition-colors">Rastrear pedido</Link></li>
              <li><Link to="/carrito" className="text-gray-500 hover:text-gray-900 transition-colors">Mi carrito</Link></li>
            </ul>
          </div>

          {/* Ayuda */}
          <div>
            <h3 className="text-sm mb-4">Ayuda</h3>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/faq" className="text-gray-500 hover:text-gray-900 transition-colors">Preguntas frecuentes</Link></li>
              <li><Link to="/envios" className="text-gray-500 hover:text-gray-900 transition-colors">Información de envíos</Link></li>
              <li><Link to="/contacto" className="text-gray-500 hover:text-gray-900 transition-colors">Contacto</Link></li>
              <li><Link to="/nosotros" className="text-gray-500 hover:text-gray-900 transition-colors">Sobre nosotros</Link></li>
            </ul>
          </div>

          {/* Contacto */}
          <div>
            <h3 className="text-sm mb-4">Contacto</h3>
            <ul className="space-y-3 text-sm text-gray-500">
              <li className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                <span>Calle Principal 123, Madrid 28001</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 flex-shrink-0" strokeWidth={1.5} />
                <span>+34 91 234 56 78</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 flex-shrink-0" strokeWidth={1.5} />
                <span>info@nexa.com</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-gray-200 mt-10 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-500">© 2026 NX036 Commerce S.L. Todos los derechos reservados.</p>
          <div className="flex flex-wrap gap-5 text-sm">
            <Link to="/legal/privacidad" className="text-gray-500 hover:text-gray-900 transition-colors">Privacidad</Link>
            <Link to="/legal/terminos"   className="text-gray-500 hover:text-gray-900 transition-colors">Términos</Link>
            <Link to="/legal/cookies"    className="text-gray-500 hover:text-gray-900 transition-colors">Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}