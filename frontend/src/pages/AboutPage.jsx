import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useSiteContent } from '@/contexts/SiteContentContext';

const AboutPage = () => {
  const { content } = useSiteContent();
  if (!content) return null;
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
      <p className="text-[11px] uppercase tracking-[0.2em] text-[hsl(var(--primary))] font-semibold">{content.about_kicker}</p>
      <h1 className="font-display text-4xl sm:text-5xl mt-2">{content.about_title}</h1>
      <div className="prose prose-lg max-w-none mt-6 text-foreground/85">
        {content.about_text.split('\n\n').map((p, i) => (<p key={i}>{p}</p>))}
      </div>
      <div className="mt-8 flex gap-3 flex-wrap">
        <Link to="/stays"><Button className="rounded-full bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90">Voir les logements</Button></Link>
        <Link to="/experiences"><Button variant="outline" className="rounded-full">Découvrir les expériences</Button></Link>
      </div>
    </div>
  );
};
export default AboutPage;
