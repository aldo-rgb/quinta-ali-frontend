'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { fetchAPI } from '@/lib/api';
import { Waves, Flame, BedDouble, Target, Droplets, TreePine, Gamepad2 } from 'lucide-react';

interface Foto {
  id: number;
  area: string;
  url_foto: string;
  descripcion: string | null;
}

interface GalleryModalProps {
  area: string;
  label: string;
  emoji: string;
  onClose: () => void;
}

export default function GalleryModal({ area, label, emoji, onClose }: GalleryModalProps) {
  const areaIcons = { alberca: Waves, asador: Flame, hospedaje: BedDouble, cancha: Target, jacuzzi: Droplets, palapa: TreePine, juegos: Gamepad2 };
  const AreaIconComp = areaIcons[area as keyof typeof areaIcons];
  const [fotos, setFotos] = useState<Foto[]>([]);
  const [cargando, setCargando] = useState(true);
  const [current, setCurrent] = useState<number | null>(null);

  useEffect(() => {
    console.log('[GalleryModal] Loading photos for area:', area);
    // Build URL - try area endpoint first, fallback to all and filter
    const photoUrl = `/api/galeria/${area}`;
    
    fetchAPI(photoUrl)
      .then((data) => {
        console.log('[GalleryModal] Fetched', data.length, 'photos for', area);
        setFotos(data);
      })
      .catch((err) => {
        console.error('[GalleryModal] Error fetching from', photoUrl, ':', err);
        // Fallback: fetch all and filter
        return fetchAPI('/api/galeria')
          .then((allData: Foto[]) => {
            const filtered = allData.filter((f: Foto) => f.area === area);
            console.log('[GalleryModal] Fetched', filtered.length, 'photos from fallback');
            setFotos(filtered);
          })
          .catch((fallbackErr) => {
            console.error('[GalleryModal] Error fetching from fallback:', fallbackErr);
            setFotos([]);
          });
      })
      .finally(() => setCargando(false));
  }, [area]);

  // Cerrar con Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        if (current !== null) setCurrent(null);
        else onClose();
      }
      if (current !== null) {
        if (e.key === 'ArrowRight') setCurrent((p) => Math.min((p ?? 0) + 1, fotos.length - 1));
        if (e.key === 'ArrowLeft') setCurrent((p) => Math.max((p ?? 0) - 1, 0));
      }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [current, fotos.length, onClose]);

  // Bloquear scroll del body
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const handleSwipe = useCallback((dir: 'left' | 'right') => {
    if (current === null) return;
    if (dir === 'left') setCurrent((p) => Math.min((p ?? 0) + 1, fotos.length - 1));
    if (dir === 'right') setCurrent((p) => Math.max((p ?? 0) - 1, 0));
  }, [current, fotos.length]);

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative z-10 bg-white w-full max-w-lg max-h-[90vh] rounded-t-3xl sm:rounded-3xl overflow-hidden flex flex-col animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            {AreaIconComp ? <AreaIconComp className="w-6 h-6 text-primary/60" /> : <span className="text-2xl">{emoji}</span>}
            <h2 className="font-bold text-lg">{label}</h2>
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
              {cargando ? '...' : `${fotos.length} fotos`}
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 active:scale-90 transition-transform"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {cargando ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : fotos.length === 0 ? (
            <div className="text-center py-12">
              <span className="text-5xl block mb-4">📷</span>
              <p className="font-semibold text-gray-700">Próximamente</p>
              <p className="text-sm text-gray-400 mt-1">
                Estamos preparando las fotos de esta área
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {fotos.map((foto, i) => (
                <button
                  key={foto.id}
                  onClick={() => setCurrent(i)}
                  className="relative aspect-square rounded-xl overflow-hidden group active:scale-[0.98] transition-transform"
                >
                  <Image
                    src={foto.url_foto}
                    alt={foto.descripcion || `${label} ${i + 1}`}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 768px) 45vw, 200px"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Fullscreen viewer */}
      {current !== null && fotos[current] && (
        <div className="fixed inset-0 z-[110] bg-black flex items-center justify-center">
          <button
            onClick={() => setCurrent(null)}
            className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center active:scale-90 backdrop-blur-sm"
          >
            ✕
          </button>

          {/* Counter */}
          <span className="absolute top-4 left-4 z-20 text-white/70 text-sm font-medium bg-black/30 px-3 py-1 rounded-full backdrop-blur-sm">
            {current + 1} / {fotos.length}
          </span>

          {/* Nav arrows */}
          {current > 0 && (
            <button
              onClick={() => setCurrent(current - 1)}
              className="absolute left-2 z-20 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center active:scale-90 backdrop-blur-sm"
            >
              ‹
            </button>
          )}
          {current < fotos.length - 1 && (
            <button
              onClick={() => setCurrent(current + 1)}
              className="absolute right-2 z-20 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center active:scale-90 backdrop-blur-sm"
            >
              ›
            </button>
          )}

          {/* Image */}
          <div
            className="w-full h-full relative"
            onTouchStart={(e) => {
              const startX = e.touches[0].clientX;
              const el = e.currentTarget;
              el.dataset.startX = String(startX);
            }}
            onTouchEnd={(e) => {
              const startX = Number(e.currentTarget.dataset.startX);
              const endX = e.changedTouches[0].clientX;
              const diff = startX - endX;
              if (Math.abs(diff) > 50) handleSwipe(diff > 0 ? 'left' : 'right');
            }}
          >
            <Image
              src={fotos[current].url_foto}
              alt={fotos[current].descripcion || ''}
              fill
              className="object-contain"
              sizes="100vw"
              priority
            />
          </div>

          {fotos[current].descripcion && (
            <p className="absolute bottom-6 left-0 right-0 text-center text-white/80 text-sm px-6 bg-black/30 py-2 backdrop-blur-sm">
              {fotos[current].descripcion}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
