import React, { useState } from 'react';
import {
  LayoutDashboard,
  BookOpen,
  Layers,
  Users,
  Gift,
  MessageSquare,
  FileText,
  Settings,
  Headphones,
  ArrowUpRight,
  Menu,
  X,
  ChevronRight,
  Crown,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AdminTab } from '../../types';
import { DashboardView } from './views/DashboardView';
import { ProductsView } from './views/ProductsView';
import { CategoriesView } from './views/CategoriesView';
import { VipPackView } from './views/VipPackView';
import { LeadsView } from './views/LeadsView';
import { LeadMagnetsView } from './views/LeadMagnetsView';
import { TestimonialsView } from './views/TestimonialsView';
import { BlogView } from './views/BlogView';
import { SettingsView } from './views/SettingsView';

export const AdminLayout: React.FC = () => {
  const { currentPath, activeAdminTab, setActiveAdminTab, navigateTo, products, categories, leads } = useApp();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Sync activeAdminTab with currentPath (e.g. /admin/dashboard, /admin/parametres, /admin/pack-vip)
  React.useEffect(() => {
    const match = currentPath.match(/^\/admin\/([a-z0-9_-]+)/);
    if (match) {
      const tab = match[1] as AdminTab;
      const validTabs: AdminTab[] = ['dashboard', 'produits', 'categories', 'pack-vip', 'leads', 'lead-magnets', 'temoignages', 'blog', 'parametres'];
      if (validTabs.includes(tab) && tab !== activeAdminTab) {
        setActiveAdminTab(tab);
      }
    } else if (currentPath === '/admin' || currentPath === '/admin/') {
      if (activeAdminTab !== 'dashboard') {
        setActiveAdminTab('dashboard');
      }
    }
  }, [currentPath, activeAdminTab, setActiveAdminTab]);

  const handleTabClick = (tabId: AdminTab) => {
    setActiveAdminTab(tabId);
    navigateTo(`/admin/${tabId}`);
  };

  const menuItems: { id: AdminTab; label: string; icon: any; count?: number }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'produits', label: 'Produits', icon: BookOpen, count: products.length },
    { id: 'categories', label: 'Catégories', icon: Layers, count: categories.length },
    { id: 'pack-vip', label: 'Pack VIP', icon: Crown },
    { id: 'leads', label: 'Leads', icon: Users, count: leads.length },
    { id: 'lead-magnets', label: 'Lead Magnets', icon: Gift },
    { id: 'temoignages', label: 'Témoignages', icon: MessageSquare },
    { id: 'blog', label: 'Blog', icon: FileText },
    { id: 'parametres', label: 'Paramètres', icon: Settings },
  ];

  const currentTabLabel = menuItems.find((i) => i.id === activeAdminTab)?.label || 'Dashboard';

  const renderActiveView = () => {
    switch (activeAdminTab) {
      case 'dashboard':
        return <DashboardView />;
      case 'produits':
        return <ProductsView />;
      case 'categories':
        return <CategoriesView />;
      case 'pack-vip':
        return <VipPackView />;
      case 'leads':
        return <LeadsView />;
      case 'lead-magnets':
        return <LeadMagnetsView />;
      case 'temoignages':
        return <TestimonialsView />;
      case 'blog':
        return <BlogView />;
      case 'parametres':
        return <SettingsView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="flex min-h-screen bg-neutral-950 text-neutral-100 antialiased">
      {/* Sidebar Desktop */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-neutral-850 bg-neutral-950 lg:flex">
        {/* Brand Lockup */}
        <div className="flex h-18 items-center justify-between border-b border-neutral-850 px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500 text-neutral-950">
              <Headphones className="h-5 w-5 stroke-[2.2]" />
            </div>
            <div>
              <span className="font-display text-base font-bold tracking-tight text-white">
                VISION BOOKS
              </span>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-amber-500">
                Administration V1
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Nav */}
        <div className="flex-1 overflow-y-auto px-4 py-6">
          <div className="mb-2 px-2 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
            Gestion Plateforme
          </div>

          <nav className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeAdminTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabClick(item.id)}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-amber-500/10 text-amber-400 font-semibold'
                      : 'text-neutral-400 hover:bg-neutral-900 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`h-4 w-4 ${isActive ? 'text-amber-500' : 'text-neutral-500'}`} />
                    <span>{item.label}</span>
                  </div>

                  {item.count !== undefined && (
                    <span className="font-mono text-[10px] text-neutral-400 tabular-nums">
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Bottom - Switch to public store */}
        <div className="border-t border-neutral-850 p-4">
          <button
            onClick={() => navigateTo('/')}
            className="flex w-full items-center justify-between rounded-lg border border-neutral-800 bg-neutral-900/80 px-3 py-2 text-xs font-medium text-neutral-300 hover:border-amber-500/50 hover:text-white transition-colors"
          >
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Voir le site public</span>
            </span>
            <ArrowUpRight className="h-3.5 w-3.5 text-neutral-500" />
          </button>
        </div>
      </aside>

      {/* Main Content Zone */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Top Header */}
        <header className="sticky top-0 z-30 flex h-18 items-center justify-between border-b border-neutral-850 bg-neutral-950/90 px-4 sm:px-8 backdrop-blur-md">
          <div className="flex items-center gap-3">
            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-800 text-neutral-300 lg:hidden hover:bg-neutral-900"
            >
              {mobileSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>

            {/* Breadcrumb Trail */}
            <nav className="flex items-center gap-2 text-xs text-neutral-400">
              <button
                onClick={() => navigateTo('/admin')}
                className="hover:text-white transition-colors font-medium"
              >
                Admin
              </button>
              <ChevronRight className="h-3.5 w-3.5 text-neutral-600" />
              <span className="font-semibold text-white">{currentTabLabel}</span>
            </nav>
          </div>

          {/* Quick Right Action */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigateTo('/')}
              className="flex items-center gap-1.5 rounded-lg border border-neutral-800 bg-neutral-900 px-3.5 py-1.5 text-xs font-medium text-neutral-300 hover:border-neutral-700 hover:text-white transition-colors"
            >
              <span>Boutique Publique</span>
              <ArrowUpRight className="h-3.5 w-3.5 text-amber-500" />
            </button>

            <div className="flex items-center gap-2 border-l border-neutral-800 pl-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-500/20 text-[11px] font-bold text-amber-400">
                VB
              </div>
              <span className="hidden sm:inline text-xs font-semibold text-neutral-300">
                Directeur
              </span>
            </div>
          </div>
        </header>

        {/* Mobile Sidebar Overlay Drawer */}
        {mobileSidebarOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 lg:hidden">
            <div className="h-full w-64 bg-neutral-950 p-4 border-r border-neutral-800 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
                  <div className="flex items-center gap-2">
                    <Headphones className="h-5 w-5 text-amber-500" />
                    <span className="font-display font-bold text-white">VISION BOOKS</span>
                  </div>
                  <button
                    onClick={() => setMobileSidebarOpen(false)}
                    className="p-1 text-neutral-400 hover:text-white"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <nav className="mt-4 space-y-1">
                  {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeAdminTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          handleTabClick(item.id);
                          setMobileSidebarOpen(false);
                        }}
                        className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-xs font-medium ${
                          isActive
                            ? 'bg-amber-500/10 text-amber-400 font-semibold'
                            : 'text-neutral-400 hover:bg-neutral-900'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="h-4 w-4" />
                          <span>{item.label}</span>
                        </div>
                        {item.count !== undefined && (
                          <span className="font-mono text-[10px] text-neutral-500">
                            {item.count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </nav>
              </div>

              <div className="pt-4 border-t border-neutral-800">
                <button
                  onClick={() => {
                    setMobileSidebarOpen(false);
                    navigateTo('/');
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-neutral-900 py-2.5 text-xs font-semibold text-white"
                >
                  <span>Aller sur le site public</span>
                  <ArrowUpRight className="h-4 w-4 text-amber-500" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Viewport Content */}
        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">
          {renderActiveView()}
        </main>
      </div>
    </div>
  );
};
