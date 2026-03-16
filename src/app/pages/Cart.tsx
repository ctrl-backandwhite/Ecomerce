import { useCart } from "../context/CartContext";
import { Button } from "../components/ui/button";
import { Link, useNavigate } from "react-router";
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight } from "lucide-react";
import { Badge } from "../components/ui/badge";

export function Cart() {
  const { items, removeFromCart, updateQuantity, getTotalPrice } = useCart();
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center px-4">
          <ShoppingBag className="w-24 h-24 mx-auto text-gray-300 mb-6" />
          <h2 className="text-3xl font-bold mb-4">Tu carrito está vacío</h2>
          <p className="text-gray-600 mb-8">
            ¡Agrega algunos productos increíbles a tu carrito!
          </p>
          <Link to="/">
            <Button size="lg">
              Explorar Productos
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const subtotal = getTotalPrice();
  const shipping = subtotal > 100 ? 0 : 15;
  const tax = subtotal * 0.1;
  const total = subtotal + shipping + tax;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-xl tracking-tight mb-6">Carrito de Compras</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-lg p-4 sm:p-6 shadow-sm"
              >
                <div className="flex gap-4">
                  {/* Image */}
                  <Link
                    to={`/producto/${item.productId ?? item.id}`}
                    className="flex-shrink-0"
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-24 h-24 sm:w-32 sm:h-32 object-cover rounded-lg hover:opacity-75 transition-opacity"
                    />
                  </Link>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1 min-w-0 pr-4">
                        <Link to={`/producto/${item.productId ?? item.id}`}>
                          <h3 className="text-sm text-gray-900 hover:text-gray-600 transition-colors line-clamp-2">
                            {item.name}
                          </h3>
                        </Link>
                        <Badge variant="secondary" className="mt-1">
                          {item.category}
                        </Badge>
                        {/* Variant attributes selected */}
                        {item.selectedAttrs && Object.keys(item.selectedAttrs).length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {Object.entries(item.selectedAttrs).map(([k, v]) => (
                              <span key={k} className="text-[11px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">
                                {k}: {v}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFromCart(item.id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 flex-shrink-0"
                      >
                        <Trash2 className="w-5 h-5" />
                      </Button>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-4">
                      {/* Quantity */}
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600 mr-2">
                          Cantidad:
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() =>
                            updateQuantity(item.id, item.quantity - 1)
                          }
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        <span className="w-10 text-center text-sm text-gray-900">
                          {item.quantity}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() =>
                            updateQuantity(
                              item.id,
                              Math.min(item.stock, item.quantity + 1)
                            )
                          }
                          disabled={item.quantity >= item.stock}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>

                      {/* Price */}
                      <div className="text-right">
                        <p className="text-base text-gray-900">
                          ${(item.price * item.quantity).toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-400">
                          ${item.price} c/u
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg p-6 shadow-sm sticky top-24">
              <h2 className="text-sm tracking-widest uppercase text-gray-400 mb-5">Resumen del Pedido</h2>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Envío</span>
                  <span>
                    {shipping === 0 ? (
                      <Badge variant="secondary" className="text-green-600">
                        Gratis
                      </Badge>
                    ) : (
                      `$${shipping.toFixed(2)}`
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Impuestos (10%)</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                <div className="border-t pt-3 flex justify-between items-center">
                  <span className="text-sm text-gray-900">Total</span>
                  <span className="text-lg text-gray-900">
                    ${total.toFixed(2)}
                  </span>
                </div>
              </div>

              {shipping > 0 && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4 text-sm text-gray-600">
                  <p>
                    ¡Agrega ${(100 - subtotal).toFixed(2)} más para envío
                    gratis!
                  </p>
                </div>
              )}

              <Button
                size="lg"
                className="w-full mb-3"
                onClick={() => navigate("/checkout")}
              >
                Proceder al Pago
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>

              <Link to="/">
                <Button variant="outline" size="lg" className="w-full">
                  Continuar Comprando
                </Button>
              </Link>

              <div className="mt-6 pt-6 border-t text-sm text-gray-600 space-y-2">
                <p>✓ Compra 100% segura</p>
                <p>✓ Devoluciones gratuitas en 30 días</p>
                <p>✓ Garantía de satisfacción</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}