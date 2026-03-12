'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import { fetchAPI } from '@/lib/api';
import { useI18n } from '@/lib/i18n';

interface PagoInfo {
  estado: string;
  monto: number;
  reservacion_id: number;
  reservacion_estado: string;
  fecha_evento: string;
  cliente_nombre: string;
  paquete_nombre: string;
}

export default function PagoExitosoPage() {
  return (
    <Suspense>
      <PagoExitosoContent />
    </Suspense>
  );
}

function PagoExitosoContent() {
  const searchParams = useSearchParams();
  const chargeId = searchParams.get('charge_id');
  const reservacionId = searchParams.get('reservacion_id');
  const { t } = useI18n();
  const [pago, setPago] = useState<PagoInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (chargeId) {
      fetchAPI(`/api/pagos/verificar/${encodeURIComponent(chargeId)}`)
        .then((data) => setPago(data))
        .catch(() => setError('No se pudo verificar el pago'))
        .finally(() => setLoading(false));
    } else if (reservacionId) {
      fetchAPI(`/api/pagos/reservacion/${encodeURIComponent(reservacionId)}`)
        .then((data) => {
          if (data.length > 0) {
            setPago(data[0]);
          } else {
            setError('No se encontraron pagos para esta reservación');
          }
        })
        .catch(() => setError('No se pudo verificar el pago'))
        .finally(() => setLoading(false));
    } else {
      setError('No se proporcionó referencia de pago');
      setLoading(false);
    }
  }, [chargeId, reservacionId]);

  return (
    <div className="min-h-screen pb-20 bg-background">
      <Header />

      <div className="px-6 pt-10 max-w-lg mx-auto text-center space-y-6">
        {loading && (
          <div className="space-y-4">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-gray-500">{t('pago.verificando')}</p>
          </div>
        )}

        {error && !loading && (
          <div className="space-y-4">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <span className="text-4xl">❌</span>
            </div>
            <h2 className="text-xl font-bold">{t('pago.error_titulo')}</h2>
            <p className="text-gray-500 text-sm">{error}</p>
            <Link href="/" className="inline-block bg-primary text-white font-bold px-8 py-3 rounded-full">
              {t('pago.volver_inicio')}
            </Link>
          </div>
        )}

        {pago && !loading && (
          <>
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <span className="text-4xl">🎉</span>
            </div>

            <h2 className="text-2xl font-extrabold">{t('pago.exitoso_titulo')}</h2>
            <p className="text-gray-500">{t('pago.exitoso_subtitulo')}</p>

            <div className="bg-green-50 border border-green-200 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-center gap-2">
                <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
                <span className="font-bold text-green-700">{t('pago.confirmado')}</span>
              </div>
              <p className="text-3xl font-extrabold text-green-700">
                ${Number(pago.monto).toLocaleString('es-MX')} MXN
              </p>
              <p className="text-xs text-green-600">{t('pago.anticipo_pagado')}</p>
            </div>

            <div className="bg-white/70 rounded-2xl border border-primary-light/15 p-5 text-left space-y-3">
              <div>
                <p className="font-bold">{pago.paquete_nombre}</p>
                <p className="text-sm text-gray-500">{t('pago.reservacion')} #{pago.reservacion_id}</p>
              </div>
              <div className="space-y-2 text-sm border-t pt-3">
                <div className="flex justify-between">
                  <span className="text-gray-500">{t('pago.fecha')}</span>
                  <span className="font-semibold">{pago.fecha_evento}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">{t('pago.cliente')}</span>
                  <span className="font-semibold">{pago.cliente_nombre}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">{t('pago.estado')}</span>
                  <span className="font-semibold text-green-600">✓ {t('pago.estado_confirmada')}</span>
                </div>
              </div>
            </div>

            <p className="text-sm text-gray-500">
              {t('pago.whatsapp_confirmacion')}
            </p>

            <div className="flex flex-col gap-3">
              <a
                href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 bg-green-500 text-white font-bold py-4 rounded-full active:scale-95 transition-transform"
              >
                💬 {t('pago.btn_whatsapp')}
              </a>
              <Link
                href="/"
                className="w-full inline-flex items-center justify-center bg-gray-100 text-gray-700 font-semibold py-3 rounded-full active:scale-95 transition-transform"
              >
                {t('pago.volver_inicio')}
              </Link>
            </div>
          </>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
