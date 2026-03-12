'use client';

import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import { useI18n } from '@/lib/i18n';

export default function ContactoPage() {
  const { t } = useI18n();

  return (
    <div className="min-h-screen pb-20 bg-background">
      <Header />

      <div className="px-6 pt-6 max-w-lg mx-auto">
        <h1 className="text-2xl font-extrabold text-foreground">{t('contacto.titulo')}</h1>
        <p className="text-gray-400 text-sm mt-1">{t('contacto.subtitulo')}</p>
      </div>

      <div className="px-6 mt-6 max-w-lg mx-auto space-y-4">
        {/* WhatsApp */}
        <a
          href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-4 bg-green-50/80 border border-green-200/50 rounded-2xl p-5 active:scale-[0.98] transition-transform"
        >
          <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xl">💬</span>
          </div>
          <div>
            <p className="font-bold">{t('contacto.whatsapp')}</p>
            <p className="text-sm text-gray-500">{t('contacto.whatsapp_desc')}</p>
          </div>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </a>

        {/* Teléfono */}
        <a
          href={`tel:+${process.env.NEXT_PUBLIC_WHATSAPP}`}
          className="flex items-center gap-4 bg-section-blue/80 border border-blue-200/50 rounded-2xl p-5 active:scale-[0.98] transition-transform"
        >
          <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xl">📞</span>
          </div>
          <div>
            <p className="font-bold">{t('contacto.llamar')}</p>
            <p className="text-sm text-gray-500">81 4906 0693</p>
          </div>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </a>

        {/* Ubicación */}
        <div className="bg-section-cream/80 border border-primary-light/15 rounded-2xl p-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xl">📍</span>
            </div>
            <div>
              <p className="font-bold">{t('contacto.ubicacion')}</p>
              <p className="text-sm text-gray-500">{t('contacto.ubicacion_ciudad')}</p>
            </div>
          </div>
          <div className="mt-4 bg-gray-200 rounded-xl h-40 flex items-center justify-center text-gray-400 text-sm">
            {t('contacto.mapa_pronto')}
          </div>
        </div>

        {/* Horarios */}
        <div className="bg-white/70 border border-primary-light/15 rounded-2xl p-5">
          <h3 className="font-bold mb-3">🕐 {t('contacto.horarios')}</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">{t('contacto.lun_vie')}</span>
              <span className="font-semibold">9:00 - 21:00</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">{t('contacto.sabados')}</span>
              <span className="font-semibold">10:00 - 22:00</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">{t('contacto.domingos')}</span>
              <span className="font-semibold">10:00 - 20:00</span>
            </div>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
