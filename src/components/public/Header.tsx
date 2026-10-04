import React, { useState } from 'react';
import { Headphones, ShieldCheck, Menu, X, ArrowUpRight, Sparkles } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const Header: React.FC = () => {
  const { currentPath, navigateTo } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: 'Best-Sellers', href: '#bestsellers' },
    { label: 'Catégories', href: '#categories' },
    { label: 'Catalogue', href: '/produits' },
    { label: 'Guides Offerts 🎁', href: '#ressource-gratuite' },
    { label: 'Témoignages', href: '#temoignages' },
    { label: 'Blog', href: '/blog' },
    { label: 'FAQ', href: '#faq' },
  ];

  const handleLinkClick = (e: React.MouseEvent, href: string) => {
    e.preventDefault();
    setMobileMenuOpen(false);

    if (href.startsWith('/')) {
      navigateTo(href);
      return;
    }

    if (currentPath === '/') {
      const element = document.querySelector(href);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      navigateTo(`/${href}`);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-neutral-800/80 bg-neutral-950/90 backdrop-blur-md">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Zone 1: Single Brand element */}
        <a
          href="/"
          onClick={(e) => {
            e.preventDefault();
            navigateTo('/');
          }}
          className="group flex items-center gap-3"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 text-neutral-950 shadow-sm transition-transform group-hover:scale-105">
            <Headphones className="h-6 w-6 stroke-[2.2]" />
          </div>
          <div className="flex flex-col">
            <span className="font-display text-xl font-bold tracking-tight text-white group-hover:text-amber-400 transition-colors">
              VISION BOOKS
            </span>
            <span className="text-[10px] uppercase tracking-widest text-neutral-400">
              Édition Audio Premium
            </span>
          </div>
        </a>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden items-center gap-6 lg:gap-8 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={(e) => handleLinkClick(e, link.href)}
              className="text-xs lg:text-sm font-medium text-neutral-300 transition-colors hover:text-amber-400"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Zone 3: Primary Actions */}
        <div className="hidden items-center gap-4 md:flex">
          <button
            onClick={() => navigateTo('/admin')}
            className="flex items-center gap-2 text-xs font-semibold text-neutral-300 transition-colors hover:text-white"
            title="Espace d'administration de VISION BOOKS"
          >
            <ShieldCheck className="h-4 w-4 text-amber-500" />
            <span>Admin</span>
          </button>

          <button
            onClick={() => navigateTo('/produits')}
            className="flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-bold text-neutral-950 transition-all hover:bg-amber-400 hover:shadow-md active:scale-95"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Catalogue Complet</span>
          </button>
        </div>

        {/* Mobile menu trigger */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-neutral-800 text-neutral-300 md:hidden hover:bg-neutral-900"
          aria-label="Ouvrir le menu"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="border-b border-neutral-800 bg-neutral-950 px-4 py-6 md:hidden">
          <nav className="flex flex-col gap-4">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={(e) => handleLinkClick(e, link.href)}
                className="text-base font-medium text-neutral-200 hover:text-amber-400"
              >
                {link.label}
              </a>
            ))}
            <div className="my-2 h-px bg-neutral-800" />
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                navigateTo('/admin');
              }}
              className="flex items-center justify-between py-2 text-sm font-semibold text-neutral-200 hover:text-amber-400"
            >
              <span className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-amber-500" />
                Accéder à l'Admin
              </span>
              <ArrowUpRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                navigateTo('/produits');
              }}
              className="mt-2 flex items-center justify-center gap-2 rounded-xl bg-amber-500 py-3 text-center text-sm font-bold text-neutral-950"
            >
              <Sparkles className="h-4 w-4" />
              Explorer le catalogue
            </button>
          </nav>
        </div>
      )}
    </header>
  );
};
