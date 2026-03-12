'use client';

import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import { useI18n } from '@/lib/i18n';

export default function TerminosPage() {
  const { t } = useI18n();

  return (
    <div className="min-h-screen pb-20 bg-background">
      <Header />

      <div className="px-6 pt-8 max-w-3xl mx-auto">
        <h1 className="text-2xl font-extrabold mb-6">{t('terminos.titulo')}</h1>
        <p className="text-xs text-gray-400 mb-6">{t('terminos.ultima_actualizacion')}: Enero 2025</p>

        <div className="prose prose-sm max-w-none space-y-6 text-gray-700">
          <section>
            <h2 className="text-lg font-bold text-gray-900">{t('terminos.sec1_titulo')}</h2>
            <p>{t('terminos.sec1_texto')}</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900">{t('terminos.sec2_titulo')}</h2>
            <p>{t('terminos.sec2_texto')}</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900">{t('terminos.sec3_titulo')}</h2>
            <p>{t('terminos.sec3_texto')}</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900">{t('terminos.sec4_titulo')}</h2>
            <p>{t('terminos.sec4_texto')}</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900">{t('terminos.sec5_titulo')}</h2>
            <p>{t('terminos.sec5_texto')}</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900">{t('terminos.sec6_titulo')}</h2>
            <p>{t('terminos.sec6_texto')}</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900">{t('terminos.sec7_titulo')}</h2>
            <p>{t('terminos.sec7_texto')}</p>
          </section>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
