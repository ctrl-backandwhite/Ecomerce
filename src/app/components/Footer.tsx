import { Facebook, Instagram, Twitter, Mail, Phone, MapPin } from "lucide-react";
import { Link } from "react-router";

export function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Company Info */}
          <div>
            <h3 className="text-lg mb-4">NEXA</h3>
            <p className="text-sm text-gray-600 mb-6 leading-relaxed">
              Tu destino para compras en línea. Productos de calidad con los
              mejores precios y envío rápido.
            </p>
            <div className="flex gap-3">
              <a
                href="#"
                className="w-9 h-9 flex items-center justify-center rounded-full border border-gray-300 hover:bg-gray-900 hover:text-white hover:border-gray-900 transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="w-4 h-4" />
              </a>
              <a
                href="#"
                className="w-9 h-9 flex items-center justify-center rounded-full border border-gray-300 hover:bg-gray-900 hover:text-white hover:border-gray-900 transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href="#"
                className="w-9 h-9 flex items-center justify-center rounded-full border border-gray-300 hover:bg-gray-900 hover:text-white hover:border-gray-900 transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg mb-4">Enlaces Rápidos</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link to="/" className="text-gray-600 hover:text-gray-900 transition-colors">
                  Todos los Productos
                </Link>
              </li>
              <li>
                <Link to="/?ofertas=true" className="text-gray-600 hover:text-gray-900 transition-colors">
                  Ofertas Especiales
                </Link>
              </li>
              <li>
                <Link to="/novedades" className="text-gray-600 hover:text-gray-900 transition-colors">
                  Novedades
                </Link>
              </li>
              <li>
                <Link to="/blog" className="text-gray-600 hover:text-gray-900 transition-colors">
                  Blog
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h3 className="text-lg mb-4">Atención al Cliente</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link to="/ayuda" className="text-gray-600 hover:text-gray-900 transition-colors">
                  Centro de Ayuda
                </Link>
              </li>
              <li>
                <Link to="/envios" className="text-gray-600 hover:text-gray-900 transition-colors">
                  Información de Envíos
                </Link>
              </li>
              <li>
                <Link to="/devoluciones" className="text-gray-600 hover:text-gray-900 transition-colors">
                  Devoluciones
                </Link>
              </li>
              <li>
                <Link to="/garantias" className="text-gray-600 hover:text-gray-900 transition-colors">
                  Garantías
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg mb-4">Contacto</h3>
            <ul className="space-y-3 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>Calle Principal 123, Ciudad, País</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 flex-shrink-0" />
                <span>+1 234 567 890</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 flex-shrink-0" />
                <span>info@nexa.com</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-gray-200 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-600">
            © 2026 NEXA. Todos los derechos reservados.
          </p>
          <div className="flex gap-6 text-sm">
            <Link to="/privacidad" className="text-gray-600 hover:text-gray-900 transition-colors">
              Privacidad
            </Link>
            <Link to="/terminos" className="text-gray-600 hover:text-gray-900 transition-colors">
              Términos
            </Link>
            <Link to="/cookies" className="text-gray-600 hover:text-gray-900 transition-colors">
              Cookies
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}