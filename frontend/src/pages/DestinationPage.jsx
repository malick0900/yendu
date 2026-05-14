import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '@/lib/api';
import { PropertyCard } from '@/components/PropertyCard';
import { ExperienceCard } from '@/components/ExperienceCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';
import { resolveImage } from '@/components/ImageUpload';

const DestinationPage = () => {
  const { slug } = useParams();
  const [destination, setDestination] = useState(null);
  const [properties, setProperties] = useState([]);
  const [experiences, setExperiences] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get(`/destinations/${slug}`),
      api.get('/properties', { params: { destination: slug } }),
      api.get('/experiences', { params: { destination: slug } }),
    ]).then(([d, p, e]) => { setDestination(d.data); setProperties(p.data); setExperiences(e.data); }).finally(() => setLoading(false));
  }, [slug]);

  if (loading || !destination) return <Skeleton className="h-96 m-6 rounded-3xl" />;

  return (
    <div data-testid="destination-page">
      <section className="relative h-[60vh] min-h-[420px] hero-overlay overflow-hidden">
        <img src={resolveImage(destination.hero_image)} alt={destination.name} className="absolute inset-0 h-full w-full object-cover" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex flex-col justify-end pb-10">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur border border-white/20 px-3 py-1 text-white text-xs font-semibold tracking-wider uppercase w-fit">
            <Sparkles className="h-3.5 w-3.5 text-[hsl(var(--premium))]" /> {destination.tagline || destination.country}
          </span>
          <h1 className="font-display text-5xl sm:text-7xl text-white mt-3">{destination.name}</h1>
          <p className="text-white/85 mt-2 max-w-2xl">{destination.short_description}</p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <p className="text-lg leading-relaxed text-foreground/85 max-w-3xl">{destination.description}</p>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="flex items-end justify-between mb-6">
          <h2 className="font-display text-3xl">Hébergements à {destination.name}</h2>
          <Link to={`/stays?destination=${slug}`}><Button variant="outline" className="rounded-full">Voir tout</Button></Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">{properties.slice(0, 8).map((p) => <PropertyCard key={p.id} item={p} />)}</div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="flex items-end justify-between mb-6">
          <h2 className="font-display text-3xl">Expériences à {destination.name}</h2>
          <Link to={`/experiences?destination=${slug}`}><Button variant="outline" className="rounded-full">Voir tout</Button></Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">{experiences.slice(0, 8).map((e) => <ExperienceCard key={e.id} item={e} />)}</div>
      </section>
    </div>
  );
};

export default DestinationPage;
