import { RouterProvider } from "react-router";
import { router } from "./routes";
import { CartProvider } from "./context/CartContext";
import { UserProvider } from "./context/UserContext";
import { CompareProvider } from "./context/CompareContext";
import { RecentlyViewedProvider } from "./context/RecentlyViewedContext";
import { NewsletterProvider } from "./context/NewsletterContext";
import { StoreProvider } from "./context/StoreContext";
import { Toaster } from "./components/ui/sonner";

export default function App() {
  return (
    <StoreProvider>
      <UserProvider>
        <CartProvider>
          <CompareProvider>
            <RecentlyViewedProvider>
              <NewsletterProvider>
                <RouterProvider router={router} />
                <Toaster position="top-center" />
              </NewsletterProvider>
            </RecentlyViewedProvider>
          </CompareProvider>
        </CartProvider>
      </UserProvider>
    </StoreProvider>
  );
}