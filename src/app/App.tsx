import { RouterProvider } from "react-router";
import { router } from "./routes";
import { Toaster } from "./components/ui/sonner";

/**
 * App — minimal entry point.
 * All React context providers live inside RootLayout (a pathless root route
 * in routes.tsx) so they are guaranteed to be part of the React Router tree.
 */
export default function App() {
  return (
    <>
      <RouterProvider router={router} />
      <Toaster position="top-center" />
    </>
  );
}
