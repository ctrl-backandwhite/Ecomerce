/**
 * RootLayout — pathless root route that owns all React context providers.
 *
 * Placing providers HERE (inside the React Router tree) guarantees that every
 * route component rendered by RouterProvider has access to the contexts,
 * regardless of how the host environment mounts the app.
 */
import type { ReactNode } from "react";
import { Outlet } from "react-router";
import { CartProvider } from "../context/CartContext";
import { UserProvider } from "../context/UserContext";
import { CompareProvider } from "../context/CompareContext";
import { RecentlyViewedProvider } from "../context/RecentlyViewedContext";
import { NewsletterProvider } from "../context/NewsletterContext";
import { LanguageProvider } from "../context/LanguageContext";
import { TimezoneProvider } from "../context/TimezoneContext";
import { CurrencyProvider } from "../context/CurrencyContext";
import { AuthProvider } from "../context/AuthContext";

type Provider = ({ children }: { children: ReactNode }) => ReactNode;

function composeProviders(...providers: Provider[]) {
  return function Providers({ children }: { children: ReactNode }) {
    return providers.reduceRight(
      (acc, Provider) => <Provider>{acc}</Provider>,
      children,
    ) as React.ReactElement;
  };
}

const AllProviders = composeProviders(
  AuthProvider,
  LanguageProvider,
  TimezoneProvider,
  CurrencyProvider,
  UserProvider,
  CartProvider,
  CompareProvider,
  RecentlyViewedProvider,
  NewsletterProvider,
);

export function RootLayout() {
  return (
    <AllProviders>
      <Outlet />
    </AllProviders>
  );
}
