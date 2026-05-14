import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '@/lib/api';

const SiteContentContext = createContext({ content: null, loading: true, reload: () => {} });

export const SiteContentProvider = ({ children }) => {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/site/content');
      setContent(data);
    } catch { setContent(null); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  return <SiteContentContext.Provider value={{ content, loading, reload: load }}>{children}</SiteContentContext.Provider>;
};

export const useSiteContent = () => useContext(SiteContentContext);
