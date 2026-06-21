import { useEffect } from 'react';

/**
 * Lightweight, dependency-free SEO head manager (React 19 / CSR friendly).
 * Imperatively upserts <title>, description, robots, canonical, Open Graph,
 * Twitter Card and optional JSON-LD. Tags are reused/updated (no duplicates),
 * and JSON-LD is cleaned up on unmount so each route advertises its own schema.
 */
export const SITE_URL = 'https://yendou.sn';
const SITE_NAME = 'Yendou';
const DEFAULT_TITLE = 'Yendou — Logements & Expériences au Sénégal';
const DEFAULT_DESC =
  'Yendou — logements premium et expériences locales au Sénégal. Vivez une destination, pas seulement un séjour.';
const DEFAULT_IMAGE = `${SITE_URL}/assets/yendou-logo.png`;

function upsertMeta(attr, key, content) {
  if (content == null) return;
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function upsertLink(rel, href) {
  if (!href) return;
  let el = document.head.querySelector(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

const Seo = ({ title, description, image, type = 'website', path, noindex = false, jsonLd }) => {
  const jsonLdKey = jsonLd ? JSON.stringify(jsonLd) : '';
  useEffect(() => {
    const fullTitle = title ? `${title} · ${SITE_NAME}` : DEFAULT_TITLE;
    const desc = description || DEFAULT_DESC;
    const img = image || DEFAULT_IMAGE;
    const url = `${SITE_URL}${path || window.location.pathname}`;

    document.title = fullTitle;
    upsertMeta('name', 'description', desc);
    upsertMeta('name', 'robots', noindex ? 'noindex, nofollow' : 'index, follow');
    upsertLink('canonical', url);

    upsertMeta('property', 'og:title', fullTitle);
    upsertMeta('property', 'og:description', desc);
    upsertMeta('property', 'og:image', img);
    upsertMeta('property', 'og:url', url);
    upsertMeta('property', 'og:type', type);
    upsertMeta('property', 'og:site_name', SITE_NAME);

    upsertMeta('name', 'twitter:card', 'summary_large_image');
    upsertMeta('name', 'twitter:title', fullTitle);
    upsertMeta('name', 'twitter:description', desc);
    upsertMeta('name', 'twitter:image', img);

    let script = null;
    if (jsonLdKey) {
      script = document.createElement('script');
      script.type = 'application/ld+json';
      script.setAttribute('data-seo-jsonld', '1');
      script.text = jsonLdKey;
      document.head.appendChild(script);
    }
    return () => {
      if (script && script.parentNode) script.parentNode.removeChild(script);
    };
  }, [title, description, image, type, path, noindex, jsonLdKey]);

  return null;
};

export default Seo;
