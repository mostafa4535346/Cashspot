import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { I18nProvider } from "@/lib/i18n";
import { ThemeProvider } from "@/lib/theme";
import { AuthProvider } from "@/lib/auth";
import { Toaster } from "sonner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-7xl font-bold text-foreground">404</h1>
        <p className="mt-2 text-sm text-muted-foreground">Page not found.</p>
        <Link to="/" className="mt-6 inline-flex items-center justify-center rounded-full brand-gradient px-5 py-2 text-sm font-medium text-brand-foreground">
          Go home
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => { reportLovableError(error, { boundary: "tanstack_root_error_component" }); }, [error]);
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">Something went wrong</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <div className="mt-6 flex justify-center gap-2">
          <button onClick={() => { router.invalidate(); reset(); }} className="rounded-full brand-gradient px-5 py-2 text-sm font-medium text-brand-foreground">Try again</button>
          <a href="/" className="rounded-full border px-5 py-2 text-sm">Go home</a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { title: "CashSpot — Find ATMs with cash in real time" },
      { name: "description", content: "CashSpot is a community-powered app that shows which ATMs have cash right now, in Egypt, the Arab world, and beyond." },
      { name: "author", content: "CashSpot" },
      { name: "theme-color", content: "#0b1220" },
      { property: "og:title", content: "CashSpot — Find ATMs with cash in real time" },
      { property: "og:description", content: "CashSpot is a community-powered app that shows which ATMs have cash right now, in Egypt, the Arab world, and beyond." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "CashSpot — Find ATMs with cash in real time" },
      { name: "twitter:description", content: "CashSpot is a community-powered app that shows which ATMs have cash right now, in Egypt, the Arab world, and beyond." },
      { property: "og:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/otbwzOfd3sVihtPmBfup27JaYmy1/social-images/social-1783371948519-28056.webp" },
      { name: "twitter:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/otbwzOfd3sVihtPmBfup27JaYmy1/social-images/social-1783371948519-28056.webp" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Cairo:wght@400;600;700;800&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head><HeadContent /></head>
      <body className="min-h-screen antialiased">
        {children}
        <Scripts />
        <script dangerouslySetInnerHTML={{ __html: `
          (function removeLovableBadge() {
            function remove() {
              document.querySelectorAll(
                '[data-lovable-badge], [class*="lovable"], [id*="lovable-badge"], iframe[src*="lovable"]'
              ).forEach(el => el.remove());
              // Also remove any fixed-position anchors linking to lovable.dev
              document.querySelectorAll('a[href*="lovable.dev"]').forEach(el => {
                const s = el.getAttribute('style') || '';
                if (s.includes('fixed') || s.includes('position')) el.remove();
              });
            }
            remove();
            new MutationObserver(remove).observe(document.body, { childList: true, subtree: true });
          })();
        `}} />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <I18nProvider>
          <AuthProvider>
            <Outlet />
            <Toaster position="top-center" richColors />
          </AuthProvider>
        </I18nProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
