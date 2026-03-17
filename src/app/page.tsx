'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Waves, Flame, BedDouble, Target, Droplets, TreePine, Gamepad2,
  Star, Heart, AlertTriangle, Building2, X, FileText, CheckCircle2
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import GalleryModal from '@/components/GalleryModal';
import HeroCarousel from '@/components/HeroCarousel';
import { Paquete, paquetesFallback } from '@/lib/paquetes';
import { fetchAPI } from '@/lib/api';
import { useI18n } from '@/lib/i18n';


export default function Home() {
  const { t, locale } = useI18n();
  const { data: session } = useSession();
  const [paquetes, setPaquetes] = useState<Paquete[]>(paquetesFallback);
  const destacados = paquetes.slice(0, 3);
  const [galeriaArea, setGaleriaArea] = useState<{ area: string; label: string; emoji: string } | null>(null);
  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  const descMap: Record<string, string> = {
    'ali-party': 'paquetes.desc_ali_party',
    'pijama-party': 'paquetes.desc_pijama_party',
    'pijama-party-deluxe': 'paquetes.desc_pijama_party_deluxe',
  };
  function getDesc(paq: Paquete) {
    const key = descMap[paq.slug || ''];
    if (key) return t(key);
    return paq.descripcion;
  }
  const [heroTexts, setHeroTexts] = useState<Record<string, string>>({});
  const [amenidadFotos, setAmenidadFotos] = useState<Record<string, string>>({});
  const [areaFotosAll, setAreaFotosAll] = useState<Record<string, string[]>>({});
  const [carouselIdx, setCarouselIdx] = useState<Record<string, number>>({});

  // B2B modal state
  const [b2bOpen, setB2bOpen] = useState(false);
  const [b2bEnviando, setB2bEnviando] = useState(false);
  const [b2bExito, setB2bExito] = useState<{ folio: string; total: number } | null>(null);
  const [b2bError, setB2bError] = useState('');
  const [b2bForm, setB2bForm] = useState({
    empresa: '', contacto: '', email: '', telefono: '',
    num_empleados: '', rfc: '', razon_social: '',
    fecha_evento: '', paquete_base: '', num_asistentes: '50', notas: '',
  });

  useEffect(() => {
    fetchAPI('/api/paquetes').then((data) => {
      if (Array.isArray(data) && data.length > 0) setPaquetes(data.map((p: Paquete) => ({ ...p, precio: Number(p.precio) })));
    }).catch(() => {});
    fetchAPI('/api/config').then((data) => {
      if (data && typeof data === 'object') setHeroTexts(data);
    }).catch(() => {});
    fetchAPI('/api/galeria').then((data) => {
      if (Array.isArray(data)) {
        const porArea: Record<string, string> = {};
        const allPorArea: Record<string, string[]> = {};
        for (const foto of data) {
          if (!porArea[foto.area]) porArea[foto.area] = foto.url_foto;
          if (!allPorArea[foto.area]) allPorArea[foto.area] = [];
          allPorArea[foto.area].push(foto.url_foto);
        }
        setAmenidadFotos(porArea);
        setAreaFotosAll(allPorArea);
      }
    }).catch(() => {});
  }, []);

  // Auto-rotate carousels
  useEffect(() => {
    const interval = setInterval(() => {
      setCarouselIdx((prev) => {
        const next = { ...prev };
        for (const area of Object.keys(areaFotosAll)) {
          const len = areaFotosAll[area].length;
          if (len > 1) {
            next[area] = ((prev[area] || 0) + 1) % len;
          }
        }
        return next;
      });
    }, 3000);
    return () => clearInterval(interval);
  }, [areaFotosAll]);

  const amenidades = [
    { emoji: '🏊', key: 'alberca' },
    { emoji: '🔥', key: 'asador' },
    { emoji: '🛏️', key: 'hospedaje' },
    { emoji: '⚽', key: 'cancha' },
    { emoji: '🫧', key: 'jacuzzi' },
    { emoji: '🌴', key: 'palapa' },
    { emoji: '🎪', key: 'brincolin' },
    { emoji: '🚗', key: 'estacionamiento' },
  ];

  const galeriaAreas = [
    { area: 'alberca', labelKey: 'home.galeria_alberca', emoji: '🏊', Icon: Waves, color: 'from-[#d4eef6] to-[#e8f4f8]' },
    { area: 'asador', labelKey: 'home.galeria_asador', emoji: '🔥', Icon: Flame, color: 'from-[#f5e6d0] to-[#faf2e8]' },
    { area: 'hospedaje', labelKey: 'home.galeria_hospedaje', emoji: '🛏️', Icon: BedDouble, color: 'from-[#e2ddf0] to-[#eeebf5]' },
    { area: 'cancha', labelKey: 'home.galeria_cancha', emoji: '⚽', Icon: Target, color: 'from-[#d4edda] to-[#e6f0eb]' },
    { area: 'jacuzzi', labelKey: 'home.galeria_jacuzzi', emoji: '🫧', Icon: Droplets, color: 'from-[#d0e8f5] to-[#e4f0f8]' },
    { area: 'palapa', labelKey: 'home.galeria_palapa', emoji: '🌴', Icon: TreePine, color: 'from-[#e8edd0] to-[#f2f5e8]' },
    { area: 'juegos', labelKey: 'home.galeria_juegos', emoji: '🎠', Icon: Gamepad2, color: 'from-[#f5ddd4] to-[#faf0eb]' },
  ];

  const testimonios = [1, 2, 3].map((i) => ({
    nombre: t(`home.testimonio_${i}_nombre`),
    texto: t(`home.testimonio_${i}_texto`),
    evento: t(`home.testimonio_${i}_evento`),
  }));

  const testimonioFotos = [
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face',
  ];

  const faqs = [1, 2, 3, 4].map((i) => ({
    q: t(`home.faq_${i}_q`),
    a: t(`home.faq_${i}_a`),
  }));

  return (
    <div className="min-h-screen pb-20 bg-background">
      <Header />

      {/* ───────── 1. HERO SECTION ───────── */}
      <section className="relative w-full h-[85vh] min-h-[620px] flex items-center justify-center overflow-hidden">
        <HeroCarousel />

        <div className="absolute z-10 w-full h-full bg-gradient-to-b from-black/60 via-black/40 to-black/80" />

        <div className="relative z-20 flex flex-col items-center justify-center px-4 text-center max-w-4xl mx-auto">
          {/* Logo */}
          <div className="animate-fade-in-up mb-4">
            <Image src="/logo.png" alt="La Quinta de Alí" width={300} height={160} className="h-40 w-auto drop-shadow-2xl" />
          </div>

          {/* Badge */}
          <span className="animate-fade-in-up inline-flex items-center gap-2 bg-white/10 backdrop-blur-md text-primary-light font-semibold tracking-wide uppercase text-xs px-4 py-2 rounded-full border border-white/20 mb-6">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" /></svg>
            {heroTexts.hero_badge || t('home.hero_badge')}
          </span>

          <h1 className="animate-fade-in-up delay-100 text-white text-4xl sm:text-5xl md:text-7xl font-bold mb-6 drop-shadow-lg leading-tight">
            {heroTexts.hero_titulo || t('home.hero_titulo')}
          </h1>
          <p className="animate-fade-in-up delay-200 text-gray-200 text-lg md:text-2xl mb-10 max-w-2xl drop-shadow-md">
            {heroTexts.hero_subtitulo || t('home.hero_subtitulo')}
          </p>
          <div className="animate-fade-in-up delay-300 flex flex-col sm:flex-row gap-3">
            <Link
              href="#paquetes"
              className="bg-primary hover:bg-primary-dark text-white font-bold py-4 px-8 rounded-full text-lg animate-pulse-glow transition-all active:scale-[0.98]"
            >
              {heroTexts.hero_cta || t('home.hero_cta')}
            </Link>
            <a
              href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white/15 backdrop-blur-sm text-white font-semibold py-4 px-8 rounded-full text-lg active:scale-[0.98] transition-all border border-white/20 hover:bg-white/25"
            >
              {heroTexts.hero_whatsapp || t('home.hero_whatsapp')}
            </a>
          </div>
        </div>

      </section>

      {/* ───────── 2. GALERÍA ───────── */}
      <section className="px-6 py-12 max-w-lg mx-auto">
        <h2 className="text-xl font-bold text-center mb-2">{t('home.galeria_titulo')}</h2>
        <p className="text-gray-500 text-sm text-center mb-6">{t('home.galeria_sub')}</p>
        <div className="grid grid-cols-2 gap-2">
          {galeriaAreas.map((item, idx) => (
            <button
              key={item.area}
              type="button"
              onClick={() => setGaleriaArea({ area: item.area, label: t(item.labelKey), emoji: item.emoji })}
              className={`${idx === galeriaAreas.length - 1 ? 'col-span-2 aspect-[2/1]' : 'aspect-square'} rounded-2xl overflow-hidden relative flex flex-col items-center justify-center gap-2 border border-primary-light/20 active:scale-[0.97] transition-transform cursor-pointer group`}
            >
              {areaFotosAll[item.area] && areaFotosAll[item.area].length > 0 ? (
                <>
                  {areaFotosAll[item.area].map((url, fIdx) => (
                    <Image
                      key={url}
                      src={url}
                      alt={t(item.labelKey)}
                      fill
                      className={`object-cover transition-opacity duration-700 ${fIdx === (carouselIdx[item.area] || 0) ? 'opacity-100' : 'opacity-0'}`}
                      sizes="(max-width: 768px) 50vw, 250px"
                    />
                  ))}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                  <div className="relative z-10 mt-auto mb-3">
                    <span className="text-white text-sm font-bold drop-shadow-lg">{t(item.labelKey)}</span>
                    <span className="block text-white/80 text-[10px] font-medium">{t('home.galeria_ver')} →</span>
                  </div>
                  {areaFotosAll[item.area].length > 1 && (
                    <div className="absolute bottom-1 left-1/2 -translate-x-1/2 z-10 flex gap-1">
                      {areaFotosAll[item.area].map((_, dIdx) => (
                        <span key={dIdx} className={`w-1.5 h-1.5 rounded-full transition-colors ${dIdx === (carouselIdx[item.area] || 0) ? 'bg-white' : 'bg-white/40'}`} />
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className={`absolute inset-0 bg-gradient-to-br ${item.color} flex flex-col items-center justify-center gap-2`}>
                  <item.Icon className="w-10 h-10 text-gray-500/60" />
                  <span className="text-xs font-semibold text-gray-600">{t(item.labelKey)}</span>
                  <span className="text-[10px] text-primary font-medium">{t('home.galeria_ver')} →</span>
                </div>
              )}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-400 text-center mt-3 italic">
          {t('home.galeria_nota')}
        </p>
      </section>

      {/* ───────── 3. PAIN POINTS ───────── */}
      <section className="px-6 py-12 max-w-lg mx-auto">
        <h2 className="text-xl font-bold text-center mb-2">{t('home.porque_titulo')}</h2>
        <p className="text-gray-500 text-sm text-center mb-8">{t('home.porque_sub')}</p>
        <div className="space-y-4">
          {[
            {
              icon: (
                <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M12.75 21h7.5V10.75M2.25 21h1.5m18 0h-18M2.25 9l4.5-1.636M18.75 3l-1.5.545m0 6.205 3 1m1.5.5-1.5-.5M6.75 7.364V3h-3v18m3-13.636 10.5-3.819" />
                </svg>
              ),
              title: t('home.pain_1_titulo'),
              desc: t('home.pain_1_desc'),
            },
            {
              icon: (
                <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
                </svg>
              ),
              title: t('home.pain_2_titulo'),
              desc: t('home.pain_2_desc'),
            },
            {
              icon: (
                <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
                </svg>
              ),
              title: t('home.pain_3_titulo'),
              desc: t('home.pain_3_desc'),
            },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-4 bg-white/70 rounded-2xl p-5 border border-primary-light/15 shadow-sm">
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                {item.icon}
              </div>
              <div>
                <h3 className="font-semibold text-base">{item.title}</h3>
                <p className="text-sm text-gray-500 mt-0.5">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ───────── 4. PAQUETES ───────── */}
      <section id="paquetes" className="px-6 py-12 max-w-lg mx-auto scroll-mt-16 bg-section-blue rounded-[2rem]">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">{t('home.paquetes_titulo')}</h2>
          <Link href="/paquetes" className="text-primary text-sm font-semibold">
            {t('home.paquetes_ver_todos')} →
          </Link>
        </div>
        <div className="space-y-4">
          {destacados.map((paq, idx) => (
            <div
              key={paq.id}
              className="bg-white/80 rounded-2xl border border-primary-light/20 shadow-sm overflow-hidden relative"
            >
              {/* Badge "Más popular" en el segundo paquete */}
              {idx === 1 && (
                <div className="absolute top-3 right-3 z-10 bg-accent text-gray-900 text-[11px] font-bold px-3 py-1 rounded-full shadow-md flex items-center gap-1">
                  <Star className="w-3 h-3 fill-current" /> {t('home.paquete_popular')}
                </div>
              )}
              <div className="h-40 relative overflow-hidden">
                {paq.imagen_url ? (
                  <>
                    <Image src={paq.imagen_url} alt={paq.nombre} fill className="object-cover" sizes="(max-width: 768px) 100vw, 500px" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                  </>
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                    <span className="text-6xl">{paq.emoji}</span>
                  </div>
                )}
              </div>
              <div className="p-5">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-lg">{paq.nombre}</h3>
                  <span className="text-xs bg-primary/10 text-primary rounded-full px-3 py-1 font-semibold">
                    {paq.tipo_duracion === 'horas' ? `${paq.duracion_horas}h` : t('home.paquete_noche')}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-1">{getDesc(paq)}</p>
                <div className="flex items-center justify-between mt-4">
                  <div>
                    <span className="text-2xl font-extrabold text-primary">
                      ${paq.precio.toLocaleString('es-MX')}
                    </span>
                    <span className="text-xs text-gray-400 ml-1">MXN</span>
                  </div>
                  <Link
                    href={`/reservar?paquete=${paq.id}`}
                    className="bg-primary text-white font-bold px-5 py-2.5 rounded-full text-sm active:scale-[0.98] transition-all"
                  >
                    {t('home.paquete_elegir')}
                  </Link>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  {t('home.paquete_capacidad')} {paq.capacidad_max} {t('home.paquete_personas')}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {galeriaArea && (
        <GalleryModal
          area={galeriaArea.area}
          label={galeriaArea.label}
          emoji={galeriaArea.emoji}
          onClose={() => setGaleriaArea(null)}
        />
      )}

      {/* ───────── 6. TESTIMONIOS ───────── */}
      <section className="px-6 py-12 max-w-lg mx-auto bg-section-green rounded-[2rem]">
        <h2 className="text-xl font-bold text-center mb-1">{t('home.testimonios_titulo')}</h2>
        <p className="text-gray-500 text-sm text-center mb-8">{t('home.testimonios_sub')}</p>
        <div className="space-y-4">
          {testimonios.map((test, i) => (
            <div key={i} className="bg-white/70 rounded-2xl p-5 border border-primary-light/15 shadow-sm">
              <div className="flex items-center gap-1 mb-3">
                {[...Array(5)].map((_, s) => (
                  <svg key={s} className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-sm text-gray-600 italic leading-relaxed">&quot;{test.texto}&quot;</p>
              <div className="flex items-center gap-3 mt-4">
                <Image
                  src={testimonioFotos[i]}
                  alt={test.nombre}
                  width={40}
                  height={40}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div>
                  <p className="font-semibold text-sm">{test.nombre}</p>
                  <p className="text-xs text-gray-400">{test.evento}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ───────── 7. FAQ ───────── */}
      <section className="px-6 py-12 max-w-lg mx-auto">
        <h2 className="text-xl font-bold text-center mb-8">{t('home.faq_titulo')}</h2>
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div key={i} className="bg-white/70 rounded-2xl border border-primary-light/15 shadow-sm overflow-hidden">
              <button
                type="button"
                onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                className="w-full flex items-center justify-between p-5 text-left cursor-pointer"
              >
                <span className="font-semibold text-sm pr-4">{faq.q}</span>
                <svg
                  className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform duration-200 ${faqOpen === i ? 'rotate-180' : ''}`}
                  fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                </svg>
              </button>
              {faqOpen === i && (
                <div className="px-5 pb-5 -mt-2">
                  <p className="text-sm text-gray-500 leading-relaxed">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ───────── 7.5 B2B CORPORATIVO ───────── */}
      <section className="px-6 py-12 max-w-lg mx-auto">
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 text-center border border-gray-700 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <Building2 className="w-10 h-10 text-primary mx-auto mb-3" />
          <h3 className="text-white font-bold text-lg">{t('home.b2b_titulo')}</h3>
          <p className="text-gray-400 text-sm mt-2 max-w-xs mx-auto">{t('home.b2b_subtitulo')}</p>
          <button
            type="button"
            onClick={() => { setB2bOpen(true); setB2bExito(null); setB2bError(''); }}
            className="mt-5 bg-primary hover:bg-primary-dark text-white font-bold px-8 py-3.5 rounded-full text-sm active:scale-[0.98] transition-all shadow-lg shadow-primary/30 inline-flex items-center gap-2"
          >
            <FileText className="w-4 h-4" />
            {t('home.b2b_boton')}
          </button>
          <p className="text-gray-500 text-[10px] mt-3">{t('home.b2b_incluye_iva')}</p>
        </div>
      </section>

      {/* Modal B2B */}
      {b2bOpen && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !b2bEnviando && setB2bOpen(false)} />
          <div className="relative bg-white rounded-t-3xl sm:rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl animate-slide-up">
            {/* Header */}
            <div className="sticky top-0 bg-white/95 backdrop-blur-lg border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-3xl sm:rounded-t-2xl z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-primary" />
                </div>
                <h2 className="font-bold text-lg">{t('home.b2b_modal_titulo')}</h2>
              </div>
              <button type="button" onClick={() => !b2bEnviando && setB2bOpen(false)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              {b2bExito ? (
                <div className="text-center space-y-4 py-6">
                  <CheckCircle2 className="w-14 h-14 text-green-500 mx-auto" />
                  <h3 className="font-bold text-xl text-green-800">{t('home.b2b_exito_titulo')}</h3>
                  <p className="text-gray-500 text-sm">{t('home.b2b_exito_desc')}</p>
                  <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">{t('home.b2b_exito_folio')}</span>
                      <span className="font-bold text-gray-900">{b2bExito.folio}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">{t('home.b2b_exito_total')}</span>
                      <span className="font-bold text-primary">${b2bExito.total.toLocaleString('es-MX')} MXN</span>
                    </div>
                  </div>
                  <p className="text-red-600 text-xs font-bold">{t('home.b2b_vigencia')}</p>
                  <button
                    type="button"
                    onClick={() => {
                      setB2bExito(null);
                      setB2bForm({ empresa: '', contacto: '', email: '', telefono: '', num_empleados: '', rfc: '', razon_social: '', fecha_evento: '', paquete_base: '', num_asistentes: '50', notas: '' });
                    }}
                    className="text-primary font-semibold text-sm"
                  >
                    {t('home.b2b_nueva')}
                  </button>
                </div>
              ) : (
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!b2bForm.empresa || !b2bForm.contacto || !b2bForm.email) return;
                    setB2bEnviando(true);
                    setB2bError('');
                    try {
                      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
                      const result = await fetch(`${API_URL}/api/corporativo/cotizar`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(b2bForm),
                      }).then(r => r.json());
                      if (result.ok) {
                        setB2bExito({ folio: result.folio, total: result.total });
                      } else {
                        setB2bError(result.message || 'Error al generar cotización');
                      }
                    } catch {
                      setB2bError('Error de conexión. Intenta de nuevo.');
                    } finally {
                      setB2bEnviando(false);
                    }
                  }}
                  className="space-y-4"
                >
                  {/* Empresa + Contacto */}
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1.5">{t('home.b2b_empresa')} *</label>
                      <input type="text" required value={b2bForm.empresa} onChange={e => setB2bForm(p => ({ ...p, empresa: e.target.value }))} className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:ring-primary focus:border-primary" placeholder="Ej. Ternium, Cemex, Banorte..." />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1.5">{t('home.b2b_contacto')} *</label>
                      <input type="text" required value={b2bForm.contacto} onChange={e => setB2bForm(p => ({ ...p, contacto: e.target.value }))} className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:ring-primary focus:border-primary" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1.5">{t('home.b2b_email')} *</label>
                        <input type="email" required value={b2bForm.email} onChange={e => setB2bForm(p => ({ ...p, email: e.target.value }))} className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:ring-primary focus:border-primary" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1.5">{t('home.b2b_telefono')}</label>
                        <input type="tel" value={b2bForm.telefono} onChange={e => setB2bForm(p => ({ ...p, telefono: e.target.value }))} className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:ring-primary focus:border-primary" />
                      </div>
                    </div>
                  </div>

                  {/* Datos fiscales */}
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1.5">{t('home.b2b_rfc')}</label>
                        <input type="text" value={b2bForm.rfc} onChange={e => setB2bForm(p => ({ ...p, rfc: e.target.value.toUpperCase() }))} maxLength={13} className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:ring-primary focus:border-primary uppercase" placeholder="ABC123456XY0" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1.5">{t('home.b2b_empleados')}</label>
                        <input type="text" value={b2bForm.num_empleados} onChange={e => setB2bForm(p => ({ ...p, num_empleados: e.target.value }))} className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:ring-primary focus:border-primary" placeholder="50-100" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1.5">{t('home.b2b_razon')}</label>
                      <input type="text" value={b2bForm.razon_social} onChange={e => setB2bForm(p => ({ ...p, razon_social: e.target.value }))} className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:ring-primary focus:border-primary" />
                    </div>
                  </div>

                  {/* Evento */}
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1.5">{t('home.b2b_fecha')}</label>
                        <input type="date" value={b2bForm.fecha_evento} onChange={e => setB2bForm(p => ({ ...p, fecha_evento: e.target.value }))} className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:ring-primary focus:border-primary" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1.5">{t('home.b2b_asistentes')}</label>
                        <input type="number" min="10" max="200" value={b2bForm.num_asistentes} onChange={e => setB2bForm(p => ({ ...p, num_asistentes: e.target.value }))} className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:ring-primary focus:border-primary" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1.5">{t('home.b2b_paquete')}</label>
                      <select value={b2bForm.paquete_base} onChange={e => setB2bForm(p => ({ ...p, paquete_base: e.target.value }))} className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:ring-primary focus:border-primary bg-white">
                        <option value="">{t('home.b2b_paquete_placeholder')}</option>
                        {paquetes.map(p => (
                          <option key={p.id} value={p.id}>{p.emoji} {p.nombre} — ${p.precio.toLocaleString('es-MX')}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1.5">{t('home.b2b_notas')}</label>
                      <textarea rows={2} value={b2bForm.notas} onChange={e => setB2bForm(p => ({ ...p, notas: e.target.value }))} className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:ring-primary focus:border-primary resize-none" placeholder="Ej. Necesitamos servicio de catering, DJ, etc." />
                    </div>
                  </div>

                  {b2bError && <p className="text-red-500 text-sm text-center font-semibold">{b2bError}</p>}

                  <button
                    type="submit"
                    disabled={b2bEnviando}
                    className="w-full bg-gray-900 hover:bg-black text-white font-bold py-4 rounded-xl shadow-lg transition-all active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {b2bEnviando ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        {t('home.b2b_generando')}
                      </>
                    ) : (
                      <>
                        <FileText className="w-5 h-5" />
                        {t('home.b2b_generar')}
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ───────── 8. URGENCIA + MAPA ───────── */}
      <section className="px-6 py-12 max-w-lg mx-auto space-y-6 bg-section-cream rounded-[2rem]">
        <div className="bg-gradient-to-r from-accent/20 to-accent/5 rounded-2xl p-6 border border-accent/30 text-center">
          <Flame className="w-8 h-8 text-accent mx-auto" />
          <h3 className="font-bold text-lg mt-2">{t('home.urgencia_titulo')}</h3>
          <p className="text-sm text-gray-600 mt-2 max-w-xs mx-auto">
            {t('home.urgencia_desc')}
          </p>
          <Link
            href="/reservar"
            className="inline-block mt-4 bg-accent text-gray-900 font-bold px-6 py-3 rounded-full active:scale-[0.98] transition-all shadow-md"
          >
            {t('home.urgencia_cta')}
          </Link>
          <Link
            href="/disponibilidad"
            className="block mt-3 text-sm font-semibold text-primary underline underline-offset-4 hover:text-primary/80"
          >
            📅 Ver calendario de disponibilidad
          </Link>
        </div>

        <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
          <div className="bg-white p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-sm">La Quinta de Alí</p>
                <p className="text-xs text-gray-500">Santiago, Nuevo León</p>
              </div>
            </div>
          </div>
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d14370.0!2d-100.15!3d25.42!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8662c1b0e0a0a0a1%3A0x1234567890abcdef!2sSantiago%2C%20N.L.!5e0!3m2!1ses!2smx!4v1"
            width="100%"
            height="200"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Ubicación La Quinta de Alí"
          />
        </div>
      </section>

      {/* ───────── 9. FOOTER ───────── */}
      <footer className="px-6 pb-24 max-w-lg mx-auto text-center">
        <div className="border-t border-primary-light/20 pt-8">
          <div className="flex justify-center mb-3">
            <Image src="/logo.png" alt="La Quinta de Alí" width={160} height={56} className="h-14 w-auto" />
          </div>
          <p className="text-xs text-gray-400 mt-2">
            © {new Date().getFullYear()} La Quinta de Alí. {t('home.footer_derechos')}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Monterrey, N.L.
          </p>
        </div>
      </footer>

      {/* Botón flotante: Reportar Problema (solo usuarios autenticados) */}
      {session && (
        <a
          href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP}?text=${encodeURIComponent('🚨 Hola, estoy en La Quinta de Alí y necesito reportar un detalle en las instalaciones:')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-36 right-4 z-50 w-14 h-14 bg-red-500 rounded-full flex items-center justify-center shadow-lg shadow-red-500/30 active:scale-90 transition-transform"
          aria-label="Reportar Problema"
        >
          <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
          </svg>
        </a>
      )}

      {/* WhatsApp flotante */}
      <a
        href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP}`}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-20 right-4 z-50 w-14 h-14 bg-green-500 rounded-full flex items-center justify-center shadow-lg shadow-green-500/30 active:scale-90 transition-transform"
        aria-label="WhatsApp"
      >
        <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
        </svg>
      </a>

      <BottomNav />
    </div>
  );
}
