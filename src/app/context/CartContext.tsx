import { createContext, useContext, useState, ReactNode } from "react";
import { Product } from "../types/product";

export interface CartItem extends Product {
  quantity: number;
  productId: string;                        // always the original product id (for navigation)
  variantId?: string;                        // selected variant id (if any)
  selectedAttrs?: Record<string, string>;       // e.g. { Color: "Black", Size: "M" }
}

interface AddToCartOptions {
  quantity?: number;
  variantId?: string;
  selectedAttrs?: Record<string, string>;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, options?: AddToCartOptions) => void;
  removeFromCart: (cartId: string) => void;
  updateQuantity: (cartId: string, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  const addToCart = (product: Product, options?: AddToCartOptions) => {
    const qty = options?.quantity ?? 1;
    // Composite key: productId::variantId when a variant is chosen
    const cartId = options?.variantId
      ? `${product.id}::${options.variantId}`
      : product.id;

    setItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.id === cartId);
      if (existingItem) {
        return prevItems.map((item) =>
          item.id === cartId
            ? { ...item, quantity: item.quantity + qty }
            : item
        );
      }
      return [
        ...prevItems,
        {
          ...product,
          id: cartId,          // cart-unique key
          productId: product.id,      // base product id for navigation
          variantId: options?.variantId,
          selectedAttrs: options?.selectedAttrs,
          quantity: qty,
        },
      ];
    });
  };

  const removeFromCart = (cartId: string) => {
    setItems((prevItems) => prevItems.filter((item) => item.id !== cartId));
  };

  const updateQuantity = (cartId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(cartId);
      return;
    }
    setItems((prevItems) =>
      prevItems.map((item) =>
        item.id === cartId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const getTotalItems = () => {
    return items.reduce((total, item) => total + item.quantity, 0);
  };

  const getTotalPrice = () => {
    return items.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getTotalItems,
        getTotalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
}