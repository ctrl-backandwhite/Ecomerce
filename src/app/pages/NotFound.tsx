import { Button } from "../components/ui/button";
import { Link } from "react-router";
import { Home, Search } from "lucide-react";

export function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-gray-300">404</h1>
          <h2 className="text-3xl font-bold text-gray-900 mt-4 mb-2">
            Página no encontrada
          </h2>
          <p className="text-gray-600 mb-8">
            Lo sentimos, la página que buscas no existe o ha sido movida.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/">
            <Button size="lg">
              <Home className="w-5 h-5 mr-2" />
              Ir al Inicio
            </Button>
          </Link>
          <Link to="/">
            <Button size="lg" variant="outline">
              <Search className="w-5 h-5 mr-2" />
              Ver Productos
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
