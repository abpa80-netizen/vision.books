import React from 'react';
import { Header } from './Header';
import { Hero } from './Hero';
import { BestSellersSection } from './BestSellersSection';
import { CategoriesSection } from './CategoriesSection';
import { AboutSection } from './AboutSection';
import { VipPackSection } from './VipPackSection';
import { LeadMagnetHomeSection } from './LeadMagnetHomeSection';
import { TestimonialsSection } from './TestimonialsSection';
import { BlogSection } from './BlogSection';
import { FaqSection } from './FaqSection';
import { FinalCtaSection } from './FinalCtaSection';
import { Footer } from './Footer';
import { AudioPreviewModal } from './AudioPreviewModal';

export const PublicPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col selection:bg-amber-500/30 selection:text-amber-200">
      <Header />
      <main className="flex-1">
        {/* 1. HERO */}
        <Hero />

        {/* 2. Best-Sellers */}
        <BestSellersSection />

        {/* 3. Section « Nos livres audio par thématique » (cartes/boutons uniquement) */}
        <CategoriesSection />

        {/* 4. Présentation / arguments de VISION BOOKS */}
        <AboutSection />

        {/* 5. Pack VIP (affiché UNIQUEMENT si activé) */}
        <VipPackSection />

        {/* 6. Lead Magnet */}
        <LeadMagnetHomeSection />

        {/* 7. Témoignages */}
        <TestimonialsSection />

        {/* 8. Blog */}
        <BlogSection />

        {/* 9. FAQ */}
        <FaqSection />

        {/* 10. CTA final */}
        <FinalCtaSection />
      </main>

      {/* 11. Footer */}
      <Footer />
      <AudioPreviewModal />
    </div>
  );
};

