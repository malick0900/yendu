import React from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useSiteContent } from '@/contexts/SiteContentContext';

const FaqPage = () => {
  const { content } = useSiteContent();
  const faqs = content?.faqs || [];
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
      <p className="text-[11px] uppercase tracking-[0.2em] text-[hsl(var(--primary))] font-semibold">Questions fréquentes</p>
      <h1 className="font-display text-4xl mt-2">FAQ</h1>
      <Accordion type="single" collapsible className="mt-8" data-testid="faq-accordion">
        {faqs.map((f, i) => (
          <AccordionItem key={i} value={`item-${i}`}>
            <AccordionTrigger className="text-left">{f.q}</AccordionTrigger>
            <AccordionContent className="whitespace-pre-line">{f.a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
};
export default FaqPage;
