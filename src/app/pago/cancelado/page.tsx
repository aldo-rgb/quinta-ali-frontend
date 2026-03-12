'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import { useI18n } from '@/lib/i18n';

export default function PagoCanceladoPage() {
  return (
    <Suspense>
      <PagoCanceladoContent />
    </Suspense>
  );
}

function PagoCanceladoContent() {
  const searchParams = useSearchParams();
  const reservacionId = searchParams.get('reservacion_id');
  const { t } = useI18n();

  return (
    <div className="min-h-screen pb-20">
      <Header />

      <div className="px-6 pt-10 max-w-lg mx-auto text-center space-y-6">
        <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto">
          <span className="text-4xl">⏳</span>
        </div>

        <h2 className="text-2xl font-extrabold">{t('pago.cancelado_titulo')}</h2>
        <p className="text-gray-500">{t('pago.cancelado_subtitulo')}</p>

        {reservacionId && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-sm text-blue-700">
              {t('pago.cancelado_reservacion')} <span className="font-bold">#{reservacionId}</span> {t('pago.cancelado_guardada')}
            </p>
          </div>
        )}

        <div className="space-y-3">
          <a
            href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP}?text=${encodeURIComponent(`Hola! Tengo la reservación #${reservacionId || ''} pendiente de pago y quiero coordinar.`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full inline-flex items-center justify-center gap-2 bg-green-500 text-white font-bold py-4 rounded-full active:scale-95 transition-transform"
          >
            💬 {t('pago.btn_coordinar_whatsapp')}
          </a>
          <Link
            href="/"
            className="w-full inline-flex items-center justify-center bg-gray-100 text-gray-700 font-semibold py-3 rounded-full active:scale-95 transition-transform"
          >
            {t('pago.volver_inicio')}
          </Link>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
