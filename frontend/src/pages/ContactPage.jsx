import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Mail, Phone, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { useSiteContent } from '@/contexts/SiteContentContext';

const ContactPage = () => {
  const { content } = useSiteContent();
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const submit = (e) => { e.preventDefault(); toast.success('Message envoyé · Nous vous répondons sous 24h'); setForm({ name: '', email: '', message: '' }); };
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14 grid grid-cols-1 lg:grid-cols-2 gap-10">
      <div>
        <p className="text-[11px] uppercase tracking-[0.2em] text-[hsl(var(--primary))] font-semibold">Nous contacter</p>
        <h1 className="font-display text-4xl mt-2">Parlons de votre voyage.</h1>
        <p className="text-muted-foreground mt-3 max-w-md">Notre équipe est là pour vous aider à organiser votre séjour, sur-mesure si besoin.</p>
        <ul className="mt-8 space-y-3 text-sm">
          <li className="flex items-center gap-3"><div className="h-9 w-9 rounded-full bg-muted inline-flex items-center justify-center"><Mail className="h-4 w-4" /></div> {content?.contact_email || 'contact@terangastay.sn'}</li>
          <li className="flex items-center gap-3"><div className="h-9 w-9 rounded-full bg-muted inline-flex items-center justify-center"><Phone className="h-4 w-4" /></div> {content?.contact_phone || '+221 33 800 00 00'}</li>
          <li className="flex items-center gap-3"><div className="h-9 w-9 rounded-full bg-muted inline-flex items-center justify-center"><MapPin className="h-4 w-4" /></div> {content?.contact_address || 'Almadies, Dakar, Sénégal'}</li>
        </ul>
      </div>
      <form onSubmit={submit} className="rounded-3xl bg-white border border-border p-6 sm:p-8 space-y-4" data-testid="contact-form">
        <div><Label>Nom</Label><Input required value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} className="mt-1 h-12 rounded-xl" /></div>
        <div><Label>Email</Label><Input required type="email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} className="mt-1 h-12 rounded-xl" /></div>
        <div><Label>Message</Label><Textarea required rows={5} value={form.message} onChange={(e) => setForm({...form, message: e.target.value})} className="mt-1 rounded-xl" /></div>
        <Button type="submit" className="w-full h-12 rounded-xl bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90" data-testid="contact-submit">Envoyer</Button>
      </form>
    </div>
  );
};
export default ContactPage;
