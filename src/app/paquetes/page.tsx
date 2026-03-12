'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import { Paquete, paquetesFallback } from '@/lib/paquetes';
import { fetchAPI } from '@/lib/api';
import { useI18n } from '@/lib/i18n';

export default function PaquetesPage() {
  const { t, locale } = useI18n();
  const [paquetes, setPaquetes] = useState<Paquete[]>(paquetesFallback);

  // Mapa de traducciones: slug → claves i18n
  const descMap: Record<string, string> = {
    'ali-party': 'paquetes.desc_ali_party',
    'pijama-party': 'paquetes.desc_pijama_party',
    'pijama-party-deluxe': 'paquetes.desc_pijama_party_deluxe',
  };

  const caracMap: Record<string, string[]> = {
    'ali-party': ['paquetes.c_asador', 'paquetes.c_alberca', 'paquetes.c_bar', 'paquetes.c_brincolines', 'paquetes.c_futbol', 'paquetes.c_juegos', 'paquetes.c_palapa'],
    'pijama-party': ['paquetes.c_asador', 'paquetes.c_alberca', 'paquetes.c_bar', 'paquetes.c_brincolines', 'paquetes.c_futbol', 'paquetes.c_juegos', 'paquetes.c_palapa', 'paquetes.c_casa', 'paquetes.c_cuartos'],
    'pijama-party-deluxe': ['paquetes.c_asador', 'paquetes.c_alberca', 'paquetes.c_bar', 'paquetes.c_brincolines', 'paquetes.c_futbol', 'paquetes.c_juegos', 'paquetes.c_palapa', 'paquetes.c_casa', 'paquetes.c_cuartos_base', 'paquetes.c_suite', 'paquetes.c_litera'],
  };

  function getDesc(paq: Paquete) {
    const key = descMap[paq.slug || ''];
    if (key) return t(key);
    return paq.descripcion;
  }

  function getCaracs(paq: Paquete) {
    const keys = caracMap[paq.slug || ''];
    if (keys) return keys.map(k => t(k));
    return paq.caracteristicas || [];
  }

  useEffect(() => {
    fetchAPI('/api/paquetes').then((data) => {
      if (Array.isArray(data) && data.length > 0) setPaquetes(data.map((p: Paquete) => ({ ...p, precio: Number(p.precio) })));
    }).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen pb-20 bg-background">
      <Header />

      <div className="px-6 pt-6 pb-4 max-w-lg mx-auto">
        <h1 className="text-2xl font-extrabold text-foreground">{t('paquetes.titulo')}</h1>
        <p className="text-gray-400 text-sm mt-1">
          {t('paquetes.subtitulo')}
        </p>
      </div>

      {/* Filtros */}
      <div className="px-6 max-w-lg mx-auto flex gap-2 mb-4">
        <span className="bg-primary text-white text-sm font-semibold px-4 py-1.5 rounded-full">
          {t('paquetes.todos')}
        </span>
        <span className="bg-primary-light/20 text-foreground/60 text-sm font-semibold px-4 py-1.5 rounded-full">
          {t('paquetes.por_horas')}
        </span>
        <span className="bg-primary-light/20 text-foreground/60 text-sm font-semibold px-4 py-1.5 rounded-full">
          {t('paquetes.noche')}
        </span>
      </div>

      {/* Lista de paquetes */}
      <div className="px-6 max-w-lg mx-auto space-y-4">
        {paquetes.map((paq) => (
          <div
            key={paq.id}
            id={String(paq.id)}
            className="bg-white/70 rounded-2xl border border-primary-light/20 shadow-sm overflow-hidden backdrop-blur-sm"
          >
            {/* Image header */}
            <div className="h-40 relative overflow-hidden">
              {paq.imagen_url ? (
                <>
                  <Image src={paq.imagen_url} alt={paq.nombre} fill className="object-cover" sizes="(max-width: 768px) 100vw, 500px" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                </>
              ) : (
                <div className="w-full h-full bg-gradient-to-r from-primary/90 to-primary-dark/90 flex items-center justify-center">
                  <span className="text-6xl">{paq.emoji}</span>
                </div>
              )}
              <div className="absolute bottom-3 left-5 right-5 flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-2xl mr-2">{paq.emoji}</span>
                  <span className="font-bold text-xl text-white drop-shadow-md">{paq.nombre}</span>
                </div>
                <span className="bg-white/20 backdrop-blur-sm text-white text-sm font-semibold px-3 py-1 rounded-full">
                  {paq.tipo_duracion === 'horas' ? `${paq.duracion_horas} ${t('paquetes.horas')}` : t('paquetes.noche_completa')}
                </span>
              </div>
            </div>

            <div className="p-5">
              <p className="text-gray-600 text-sm">{getDesc(paq)}</p>

              {getCaracs(paq).length > 0 && (
                <ul className="mt-3 space-y-1.5">
                  {getCaracs(paq).map((c, i) => (
                    <li key={i} className="text-sm text-gray-600">{c}</li>
                  ))}
                </ul>
              )}

              <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>{t('paquetes.hasta')} {paq.capacidad_max} {t('paquetes.personas')}</span>
                </div>
              </div>

              <div className="flex items-center justify-between mt-5">
                <div>
                  <span className="text-2xl font-extrabold text-primary">
                    ${paq.precio.toLocaleString('es-MX')}
                  </span>
                  <span className="text-gray-400 text-sm ml-1">MXN</span>
                </div>
                <Link
                  href={`/reservar?paquete=${paq.id}`}
                  className="bg-primary text-white font-bold px-6 py-2.5 rounded-full active:scale-95 transition-transform text-sm"
                >
                  {t('paquetes.reservar')}
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      <BottomNav />
    </div>
  );
}
