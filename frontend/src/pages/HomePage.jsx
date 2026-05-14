import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { SearchBar } from '@/components/SearchBar';
import { PropertyCard } from '@/components/PropertyCard';
import { ExperienceCard } from '@/components/ExperienceCard';
import { api, EXPERIENCE_CATEGORIES } from '@/lib/api';
import { ArrowRight, Star, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSiteContent } from '@/contexts/SiteContentContext';
import { resolveImage } from '@/components/ImageUpload';

const HomePage = () => {
  const { content } = useSiteContent();
  const [destinations, setDestinations] = useState([]);
  const [properties, setProperties] = useState([]);
  const [experiences, setExperiences] = useState([]);

  useEffect(() => {
    api.get('/destinations').then((r) => setDestinations(r.data)).catch(() => {});
    api.get('/properties?limit=8&sort=rating').then((r) => setProperties(r.data)).catch(() => {});
    api.get('/experiences?limit=8&trending=true').then((r) => setExperiences(r.data)).catch(() => {});
  }, []);

  if (!content) return <div className="min-h-screen bg-background" />;
  const heroImg = resolveImage(content.hero_image);
  const terangaImg = resolveImage(content.teranga_image);

  return (
    <div data-testid="homepage-root">
      <section className="relative h-[88vh] min-h-[640px] hero-overlay overflow-hidden">
        <img src={heroImg} alt="Sénégal" className="absolute inset-0 h-full w-full object-cover" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex flex-col justify-end pb-12 sm:pb-16">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: 'easeOut' }}>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur border border-white/20 px-3 py-1 text-white text-xs font-semibold tracking-wider uppercase">
              <Sparkles className="h-3.5 w-3.5 text-[hsl(var(--premium))]" /> {content.hero_badge}
            </span>
            <h1 className="mt-4 font-display text-4xl sm:text-6xl lg:text-7xl text-white leading-[1.04] max-w-4xl whitespace-pre-line">{content.hero_title}</h1>
            <p className="mt-4 text-white/85 text-base sm:text-lg max-w-2xl">{content.hero_subtitle}</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 30, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay: 0.25, duration: 0.5 }} className="mt-7">
            <SearchBar />
          </motion.div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="font-display text-3xl sm:text-4xl">{content.destinations_title}</h2>
            <p className="text-muted-foreground mt-1">{content.destinations_subtitle}</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" data-testid="destinations-grid">
          {destinations.map((d) => (
            <Link key={d.slug} to={`/destinations/${d.slug}`} data-testid={`destination-card-${d.slug}`} className="group relative rounded-3xl overflow-hidden aspect-[4/5] block">
              <img src={resolveImage(d.hero_image)} alt={d.name} className="absolute inset-0 h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                <p className="text-[11px] uppercase tracking-[0.18em] text-[hsl(var(--premium))] font-semibold">{d.tagline || d.country}</p>
                <h3 className="font-display text-2xl mt-1">{d.name}</h3>
                <p className="text-sm text-white/85 mt-1 line-clamp-2">{d.short_description}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="section-warm-wash">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
          <div className="flex items-end justify-between mb-8 gap-4">
            <div>
              <h2 className="font-display text-3xl sm:text-4xl">{content.properties_title}</h2>
              <p className="text-muted-foreground mt-1">{content.properties_subtitle}</p>
            </div>
            <Link to="/stays" data-testid="home-see-all-stays" className="hidden sm:inline-flex items-center gap-1 text-sm font-semibold text-foreground hover:text-[hsl(var(--primary))]">Tout voir <ArrowRight className="h-4 w-4" /></Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
            {properties.slice(0, 8).map((p) => (<PropertyCard key={p.id} item={p} />))}
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
        <div className="flex items-end justify-between mb-8 gap-4">
          <div>
            <h2 className="font-display text-3xl sm:text-4xl">{content.experiences_title}</h2>
            <p className="text-muted-foreground mt-1">{content.experiences_subtitle}</p>
          </div>
          <Link to="/experiences" data-testid="home-see-all-experiences" className="hidden sm:inline-flex items-center gap-1 text-sm font-semibold hover:text-[hsl(var(--primary))]">Tout voir <ArrowRight className="h-4 w-4" /></Link>
        </div>
        <div className="flex flex-wrap gap-2 mb-6">
          {EXPERIENCE_CATEGORIES.map((c) => (
            <Link key={c.value} to={`/experiences?category=${c.value}`} className="inline-flex items-center gap-2 rounded-full border border-border bg-white hover:bg-muted px-3 py-1.5 text-sm transition-colors">
              <span>{c.icon}</span> {c.label}
            </Link>
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
          {experiences.slice(0, 8).map((e) => (<ExperienceCard key={e.id} item={e} />))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div className="rounded-3xl overflow-hidden aspect-[4/3] relative noise-overlay">
            <img src={terangaImg} alt="Teranga" className="absolute inset-0 h-full w-full object-cover" />
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-[hsl(var(--primary))] font-semibold">Teranga</p>
            <h2 className="font-display text-3xl sm:text-4xl mt-2">{content.teranga_title}</h2>
            <p className="text-muted-foreground mt-4 leading-relaxed whitespace-pre-line">{content.teranga_text}</p>
            <div className="flex items-center gap-3 mt-6 flex-wrap">
              <Link to="/about"><Button variant="outline" className="rounded-full" data-testid="home-about-button">Découvrir notre histoire</Button></Link>
              <Link to="/stays"><Button className="rounded-full bg-[hsl(var(--secondary))] hover:bg-[hsl(var(--secondary))]/90" data-testid="home-discover-stays">Trouver mon séjour</Button></Link>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[hsl(var(--muted))]/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
          <h2 className="font-display text-3xl sm:text-4xl text-center">{content.testimonials_title}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-10">
            {(content.testimonials || []).map((t, i) => (
              <div key={i} className="rounded-2xl bg-white border border-border p-6">
                <div className="flex text-[hsl(var(--premium))] mb-3">{[...Array(t.rating || 5)].map((_, j) => <Star key={j} className="h-4 w-4 fill-current" />)}</div>
                <p className="text-foreground/85 leading-relaxed">« {t.text} »</p>
                <div className="flex items-center gap-3 mt-5">
                  <img src={resolveImage(t.img)} alt={t.name} className="h-10 w-10 rounded-full object-cover" />
                  <div>
                    <p className="font-semibold text-sm">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.city}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
