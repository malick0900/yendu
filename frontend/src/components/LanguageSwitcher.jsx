import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

export const LanguageSwitcher = ({ className = '' }) => {
  const { i18n } = useTranslation();
  const current = (i18n.resolvedLanguage || 'fr').slice(0, 2);
  const next = current === 'fr' ? 'en' : 'fr';
  const toggle = () => i18n.changeLanguage(next);

  return (
    <button
      onClick={toggle}
      data-testid="lang-switcher"
      aria-label={`Switch language to ${next.toUpperCase()}`}
      className={`inline-flex items-center gap-1.5 h-10 px-3 rounded-full border border-border bg-white hover:bg-muted transition-colors text-xs font-semibold uppercase ${className}`}
    >
      <Globe className="h-3.5 w-3.5 text-foreground/70" />
      {current.toUpperCase()}
    </button>
  );
};

export default LanguageSwitcher;
