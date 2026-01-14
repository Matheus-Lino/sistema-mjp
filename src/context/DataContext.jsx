import { createContext, useContext, useState, useCallback } from 'react';

const DataContext = createContext();

export function DataProvider({ children }) {
  const [cache, setCache] = useState({});
  const [loading, setLoading] = useState({});

  const buildCacheKey = useCallback((key, url) => `${key}::${url}`, []);

  const fetchData = useCallback(async (key, url) => {
    const cacheKey = buildCacheKey(key, url);

    if (cache[cacheKey]) {
      return cache[cacheKey];
    }

    if (loading[cacheKey]) {
      return new Promise((resolve) => {
        const interval = setInterval(() => {
          if (cache[cacheKey]) {
            clearInterval(interval);
            resolve(cache[cacheKey]);
          }
        }, 100);
      });
    }

    setLoading(prev => ({ ...prev, [cacheKey]: true }));

    try {
      const response = await fetch(url);
      const data = await response.json();
      
      setCache(prev => ({ ...prev, [cacheKey]: data }));
      setLoading(prev => ({ ...prev, [cacheKey]: false }));
      
      return data;
    } catch (error) {
      setLoading(prev => ({ ...prev, [cacheKey]: false }));
      return null;
    }
  }, [buildCacheKey, cache, loading]);

  const invalidateCache = useCallback((key) => {
    setCache(prev => {
      const newCache = { ...prev };
      Object.keys(newCache).forEach((k) => {
        if (k === key || k.startsWith(`${key}::`)) {
          delete newCache[k];
        }
      });
      return newCache;
    });
    setLoading(prev => {
      const newLoading = { ...prev };
      Object.keys(newLoading).forEach((k) => {
        if (k === key || k.startsWith(`${key}::`)) {
          delete newLoading[k];
        }
      });
      return newLoading;
    });
  }, []);

  const clearCache = useCallback(() => {
    setCache({});
  }, []);

  return (
    <DataContext.Provider value={{ fetchData, invalidateCache, clearCache, cache }}>
      {children}
    </DataContext.Provider>
  );
}

export function useDataCache() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useDataCache deve ser usado dentro de DataProvider');
  }
  return context;
}
