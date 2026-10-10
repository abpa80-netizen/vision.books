import React from 'react';
import { AuthProvider } from './context/AuthContext';
import { AppProvider, useApp } from './context/AppContext';
import { PublicPage } from './components/public/PublicPage';
import { CatalogPage } from './components/public/CatalogPage';
import { AdminLayout } from './components/admin/AdminLayout';
import { ProductDetailPage } from './components/public/ProductDetailPage';
import { CategoryPage } from './components/public/CategoryPage';
import { LeadMagnetCapturePage } from './components/public/LeadMagnetCapturePage';
import { ThankYouPage } from './components/public/ThankYouPage';
import { BlogPage } from './components/public/BlogPage';
import { BlogPostPage } from './components/public/BlogPostPage';
import { CommercialAssistant } from './components/chat/CommercialAssistant';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { trackSiteVisit } from './services/analytics';

const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-20 right-5 z-50 flex flex-col gap-2 pointer-events-none max-w-md w-full px-4 sm:px-0">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-center justify-between gap-3 rounded-xl border p-3.5 text-xs shadow-2xl backdrop-blur-md transition-all animate-in fade-in slide-in-from-bottom-2 ${
            toast.type === 'error'
              ? 'border-red-500/50 bg-red-950/95 text-red-200'
              : toast.type === 'info'
              ? 'border-blue-500/50 bg-neutral-950/95 text-blue-200'
              : 'border-amber-500/50 bg-neutral-950/95 text-amber-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {toast.type === 'error' && <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />}
            {toast.type === 'info' && <Info className="h-4 w-4 shrink-0 text-blue-400" />}
            {toast.type === 'success' && <CheckCircle2 className="h-4 w-4 shrink-0 text-amber-400" />}
            <span className="leading-snug">{toast.message}</span>
          </div>
          <button
            onClick={() => removeToast(toast.id)}
            className="rounded p-1 text-neutral-400 hover:text-white transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
};

const MainRouter: React.FC = () => {
  const { currentPath } = useApp();

  // Track site visits on public pages
  React.useEffect(() => {
    if (!currentPath.startsWith('/admin') && !currentPath.startsWith('/produit/')) {
      trackSiteVisit(currentPath);
    }
  }, [currentPath]);

  // Page routing logic
  const renderPageContent = () => {
    // Admin Route: /admin or /admin/...
    if (currentPath.startsWith('/admin')) {
      return <AdminLayout />;
    }

    // Blog Post Route: /blog/[slug]
    const blogPostMatch = currentPath.match(/^\/blog\/(.+)$/);
    if (blogPostMatch) {
      const rawSlug = blogPostMatch[1].split('?')[0].replace(/\/$/, '');
      const cleanSlug = decodeURIComponent(rawSlug);
      return <BlogPostPage slug={cleanSlug} />;
    }

    // Blog Index Route: /blog or /blog/
    if (currentPath === '/blog' || currentPath === '/blog/') {
      return <BlogPage />;
    }

    // Full Catalog Route: /produits or /produits/ (without a slug)
    if (currentPath === '/produits' || currentPath === '/produits/') {
      return <CatalogPage />;
    }

    // Single Product Route: /produit/[slug] (also accepts /produits/[slug])
    const productMatch = currentPath.match(/^\/produits?\/(.+)$/);
    if (productMatch) {
      const rawSlug = productMatch[1].split('?')[0].replace(/\/$/, '');
      const cleanSlug = decodeURIComponent(rawSlug);
      return <ProductDetailPage slug={cleanSlug} />;
    }

    // Category Route: /categorie/[slug] (also accepts /categories/[slug])
    const categoryMatch = currentPath.match(/^\/categories?\/(.+)$/);
    if (categoryMatch) {
      const rawSlug = categoryMatch[1].split('?')[0].replace(/\/$/, '');
      const cleanSlug = decodeURIComponent(rawSlug);
      return <CategoryPage slug={cleanSlug} />;
    }

    // Lead Magnet Capture Page: /lead-magnet/[slug] (also accepts /lead-magnets/[slug])
    const leadMagnetMatch = currentPath.match(/^\/lead-magnets?\/(.+)$/);
    if (leadMagnetMatch) {
      const rawSlug = leadMagnetMatch[1].split('?')[0].replace(/\/$/, '');
      const cleanSlug = decodeURIComponent(rawSlug);
      return <LeadMagnetCapturePage slug={cleanSlug} />;
    }

    // Confirmation / Thank You Page: /merci
    if (currentPath === '/merci' || currentPath.startsWith('/merci')) {
      return <ThankYouPage />;
    }

    // Default: Homepage (Public storefront)
    return <PublicPage />;
  };

  return (
    <>
      {renderPageContent()}
      <CommercialAssistant />
      <ToastContainer />
    </>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <MainRouter />
      </AppProvider>
    </AuthProvider>
  );
}
