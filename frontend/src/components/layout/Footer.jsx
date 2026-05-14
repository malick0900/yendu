import React from 'react';
import { Link } from 'react-router-dom';
import { Instagram, Facebook, Twitter, Mail, MapPin } from 'lucide-react';
import { useSiteContent } from '@/contexts/SiteContentContext';

export const Footer = () => {
  const { content } = useSiteContent();
  return (
    <footer className="bg-[hsl(var(--secondary))] text-white mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 grid grid-cols-2 md:grid-cols-4 gap-8">
        <div className="col-span-2 md:col-span-1">
          <img src="/assets/teranga-stay-logo.png" alt="Teranga Stay" className="h-20 w-auto object-contain rounded-lg mb-3" />
          <p className="text-sm text-white/75 leading-relaxed max-w-xs">{content?.footer_tagline || 'La plateforme africaine.'}</p>
          <div className="flex items-center gap-3 mt-5">
            <a href="#" aria-label="Instagram" className="hover:text-[hsl(var(--premium))]"><Instagram className="h-4 w-4" /></a>
            <a href="#" aria-label="Facebook" className="hover:text-[hsl(var(--premium))]"><Facebook className="h-4 w-4" /></a>
            <a href="#" aria-label="Twitter" className="hover:text-[hsl(var(--premium))]"><Twitter className="h-4 w-4" /></a>
          </div>
        </div>
        <div>
          <h4 className="font-semibold text-sm mb-3">Découvrir</h4>
          <ul className="space-y-2 text-sm text-white/75">
            <li><Link to="/stays" className="hover:text-white">Hébergements</Link></li>
            <li><Link to="/experiences" className="hover:text-white">Expériences</Link></li>
            <li><Link to="/destinations/dakar" className="hover:text-white">Dakar</Link></li>
            <li><Link to="/destinations/saly" className="hover:text-white">Saly</Link></li>
            <li><Link to="/destinations/casamance" className="hover:text-white">Casamance</Link></li>
            <li><Link to="/destinations/saint-louis" className="hover:text-white">Saint-Louis</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold text-sm mb-3">Teranga Stay</h4>
          <ul className="space-y-2 text-sm text-white/75">
            <li><Link to="/about" className="hover:text-white">À propos</Link></li>
            <li><Link to="/contact" className="hover:text-white">Contact</Link></li>
            <li><Link to="/faq" className="hover:text-white">FAQ</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold text-sm mb-3">Nous contacter</h4>
          <ul className="space-y-2 text-sm text-white/75">
            <li className="flex items-center gap-2"><Mail className="h-3.5 w-3.5" /> {content?.contact_email || 'contact@terangastay.sn'}</li>
            <li className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5" /> {content?.contact_address || 'Almadies, Dakar, Sénégal'}</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 text-xs text-white/55 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© {new Date().getFullYear()} Teranga Stay. Tous droits réservés.</p>
          <p>Fait avec passion au Sénégal.</p>
        </div>
      </div>
    </footer>
  );
};
