/**
 * RootLayout — pathless root route that owns all React context providers.
 *
 * Placing providers HERE (inside the React Router tree) guarantees that every
 * route component rendered by RouterProvider has access to the contexts,
 * regardless of how the host environment mounts the app.
 */
import { Outlet } from "react-router";
import { CartProvider }           from "../context/CartContext";
import { UserProvider }           from "../context/UserContext";
import { CompareProvider }        from "../context/CompareContext";
import { RecentlyViewedProvider } from "../context/RecentlyViewedContext";
import { NewsletterProvider }     from "../context/NewsletterContext";
import { StoreProvider }          from "../context/StoreContext";
import { CJProvider }             from "../context/CJContext";

export function RootLayout() {
  return (
    <StoreProvider>
      <UserProvider>
        <CartProvider>
          <CompareProvider>
            <RecentlyViewedProvider>
              <NewsletterProvider>
                <CJProvider>
                  <Outlet />
                </CJProvider>
              </NewsletterProvider>
            </RecentlyViewedProvider>
          </CompareProvider>
        </CartProvider>
      </UserProvider>
    </StoreProvider>
  );
}
