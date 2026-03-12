'use client';

import { useState, useEffect, useCallback } from 'react';
import { fetchAPI } from '@/lib/api';

interface GaleriaFoto {
  id: number;
  area: string;
  url_foto: string;
  descripcion: string | null;
}

export default function HeroCarousel() {
  const [imagenes, setImagenes] = useState<string[]>([]);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    fetchAPI('/api/galeria')
      .then((data: GaleriaFoto[]) => {
        if (!Array.isArray(data) || data.length === 0) return;
        // Pick one image per area for variety, then fill up to ~6
        const porArea = new Map<string, string>();
        for (const foto of data) {
          if (!porArea.has(foto.area)) {
            porArea.set(foto.area, foto.url_foto);
          }
        }
        const seleccionadas = [...porArea.values()];
        // Add more from remaining pool if we have fewer than 6
        if (seleccionadas.length < 6) {
          for (const foto of data) {
            if (!seleccionadas.includes(foto.url_foto)) {
              seleccionadas.push(foto.url_foto);
              if (seleccionadas.length >= 6) break;
            }
          }
        }
        setImagenes(seleccionadas);
      })
      .catch(() => {});
  }, []);

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % imagenes.length);
  }, [imagenes.length]);

  useEffect(() => {
    if (imagenes.length <= 1) return;
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [imagenes.length, next]);

  if (imagenes.length === 0) {
    return <div className="absolute z-0 w-full h-full bg-gradient-to-br from-gray-800 to-gray-900" />;
  }

  return (
    <>
      {imagenes.map((url, i) => (
        <img
          key={url}
          src={url}
          alt={`La Quinta de Alí - ${i + 1}`}
          className={`absolute z-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out ${
            i === current ? 'opacity-100' : 'opacity-0'
          }`}
        />
      ))}
    </>
  );
}
