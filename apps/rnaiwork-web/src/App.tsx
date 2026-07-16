import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "react-router-dom";
import { useAuthStore } from "@/stores/auth";
import { Spinner } from "@/components/ui";
import { router } from "@/router";

const queryClient = new QueryClient();

/** Boot loading screen shown while the auth session is being resolved. */
function BootScreen() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-[var(--color-bg)]">
      <Spinner size="lg" />
    </div>
  );
}

/**
 * App root.
 *
 * Wires the two cross-cutting providers (React Query, React Router) and
 * kicks off the one-time auth probe on mount. The router is only mounted
 * once `initialized` flips true so workspace routes can rely on a settled
 * auth state (and redirect to /login when there's no session) without
 * flashing the wrong surface first.
 */
export default function App() {
  const initialized = useAuthStore((s) => s.initialized);
  const init = useAuthStore((s) => s.init);

  useEffect(() => {
    if (!initialized) void init();
  }, [initialized, init]);

  return (
    <QueryClientProvider client={queryClient}>
      {initialized ? <RouterProvider router={router} /> : <BootScreen />}
    </QueryClientProvider>
  );
}
