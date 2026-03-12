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

interface PaseAbordar {
  reservacion_id: number;
  estado: string;
  cliente_nombre: string;
  cliente_email: string;
  paquete_nombre: string;
  tipo_duracion: string;
  fecha_evento: string;
  hora_inicio: string;
  hora_fin: string;
  capacidad: number;
  monto_total: number;
  monto_pagado: number;
  codigo_pin: string | null;
  pin_valido_desde: string | null;
  pin_valido_hasta: string | null;
  extras: { nombre: string; emoji: string; cantidad: number; subtotal: number }[];
  google_maps_link: string;
}

export default function PagoExitosoPage() {
  return (
    <Suspense>
      <PagoExitosoContent />
    </Suspense>
  );
}

function formatearFecha(fechaStr: string): string {
  const dias = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
  const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  const d = new Date(fechaStr + 'T12:00:00');
  return `${dias[d.getDay()]} ${d.getDate()} de ${meses[d.getMonth()]} ${d.getFullYear()}`;
}

function PagoExitosoContent() {
  const searchParams = useSearchParams();
  const chargeId = searchParams.get('charge_id');
  const reservacionId = searchParams.get('reservacion_id');
  const { t } = useI18n();
  const [pago, setPago] = useState<PagoInfo | null>(null);
  const [pase, setPase] = useState<PaseAbordar | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function verificar() {
      try {
        let resId = reservacionId;

        if (chargeId) {
          const data = await fetchAPI(`/api/pagos/verificar/${encodeURIComponent(chargeId)}`);
          setPago(data);
          resId = String(data.reservacion_id);
        } else if (reservacionId) {
          const data = await fetchAPI(`/api/pagos/reservacion/${encodeURIComponent(reservacionId)}`);
          if (data.length > 0) {
            setPago(data[0]);
            resId = String(data[0].reservacion_id);
          } else {
            setError(t('pase.error_no_pagos'));
            return;
          }
        } else {
          setError(t('pase.error_sin_referencia'));
          return;
        }

        // Intentar cargar el Pase de Abordar completo
        if (resId) {
          try {
            const paseData = await fetchAPI(`/api/pagos/pase-abordar/${encodeURIComponent(resId)}`);
            setPase(paseData);
          } catch {
            // Si falla el pase, mostramos los datos básicos
          }
        }
      } catch {
        setError(t('pase.error_verificar'));
      } finally {
        setLoading(false);
      }
    }
    verificar();
  }, [chargeId, reservacionId, t]);

  const horaSalida = pase?.hora_fin === '23:59'
    ? '11:00 AM (+1)'
    : `${pase?.hora_fin} hrs`;

  return (
    <div className="min-h-screen pb-20 bg-gradient-to-b from-[#f0faf7] to-[#e8f5f0]">
      <Header />

      <div className="px-4 pt-8 max-w-lg mx-auto space-y-6">
        {loading && (
          <div className="text-center space-y-4 pt-20">
            <div className="w-16 h-16 border-4 border-[#2D6A5E] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-gray-500">{t('pase.verificando')}</p>
          </div>
        )}

        {error && !loading && (
          <div className="text-center space-y-4 pt-10">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <span className="text-4xl">❌</span>
            </div>
            <h2 className="text-xl font-bold">{t('pase.error_titulo')}</h2>
            <p className="text-gray-500 text-sm">{error}</p>
            <Link href="/" className="inline-block bg-[#2D6A5E] text-white font-bold px-8 py-3 rounded-full">
              {t('pase.volver_inicio')}
            </Link>
          </div>
        )}

        {(pago || pase) && !loading && !error && (
          <>
            {/* Encabezado de confirmación */}
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
              </div>
              <h1 className="text-2xl font-extrabold text-[#2D6A5E]">{t('pase.titulo')}</h1>
              <p className="text-sm text-gray-500">{t('pase.subtitulo')}</p>
            </div>

            {/* ═══════════ PASE DE ABORDAR (Tarjeta Principal) ═══════════ */}
            <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-[#A7D8CC]/30">
              
              {/* Header del pase */}
              <div className="bg-gradient-to-r from-[#2D6A5E] to-[#3a8575] px-6 py-4 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-widest opacity-80">{t('pase.pase_de_abordar')}</p>
                    <p className="font-bold text-lg">La Quinta de Alí</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs opacity-80">{t('pase.reservacion_num')}</p>
                    <p className="font-bold text-lg">#{pase?.reservacion_id || pago?.reservacion_id}</p>
                  </div>
                </div>
              </div>

              {/* Datos del evento */}
              <div className="px-6 py-5 space-y-4">
                {/* Cliente y paquete */}
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-gray-400">{t('pase.pasajero')}</p>
                    <p className="font-bold text-gray-800">{pase?.cliente_nombre || pago?.cliente_nombre}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] uppercase tracking-wider text-gray-400">{t('pase.paquete')}</p>
                    <p className="font-bold text-[#2D6A5E]">{pase?.paquete_nombre || pago?.paquete_nombre}</p>
                  </div>
                </div>

                {/* Línea divisoria punteada con perforaciones */}
                <div className="relative">
                  <div className="absolute -left-6 top-1/2 -translate-y-1/2 w-5 h-5 bg-gradient-to-b from-[#f0faf7] to-[#e8f5f0] rounded-full" />
                  <div className="absolute -right-6 top-1/2 -translate-y-1/2 w-5 h-5 bg-gradient-to-b from-[#f0faf7] to-[#e8f5f0] rounded-full" />
                  <div className="border-t-2 border-dashed border-gray-200" />
                </div>

                {/* Fecha, Horario, Capacidad */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-gray-400">🗓 {t('pase.fecha')}</p>
                    <p className="font-semibold text-sm text-gray-800">
                      {pase ? formatearFecha(pase.fecha_evento) : pago?.fecha_evento}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-gray-400">🕒 {t('pase.horario')}</p>
                    <p className="font-semibold text-sm text-gray-800">
                      {pase ? `${pase.hora_inicio} — ${horaSalida}` : ''}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-gray-400">👥 {t('pase.capacidad')}</p>
                    <p className="font-semibold text-sm text-gray-800">
                      {pase ? `${t('pase.hasta')} ${pase.capacidad} ${t('pase.invitados')}` : ''}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-gray-400">💰 {t('pase.total')}</p>
                    <p className="font-semibold text-sm text-green-700">
                      ${Number(pase?.monto_total || pago?.monto || 0).toLocaleString('es-MX')} MXN
                    </p>
                  </div>
                </div>

                {/* Ubicación */}
                {pase?.google_maps_link && (
                  <a
                    href={pase.google_maps_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 bg-[#f0faf7] rounded-xl px-4 py-3 transition-colors hover:bg-[#e0f3ed]"
                  >
                    <span className="text-2xl">📍</span>
                    <div className="flex-1">
                      <p className="text-xs text-gray-500">{t('pase.ubicacion')}</p>
                      <p className="font-semibold text-sm text-[#2D6A5E]">{t('pase.ver_mapa')}</p>
                    </div>
                    <svg className="w-5 h-5 text-[#2D6A5E]" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                    </svg>
                  </a>
                )}
              </div>

              {/* ═══ ACCESO VIP (PIN) ═══ */}
              {pase?.codigo_pin && (
                <div className="mx-6 mb-5">
                  <div className="bg-gradient-to-r from-[#1a4a40] to-[#2D6A5E] rounded-2xl p-5 text-white text-center space-y-2">
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-lg">🔐</span>
                      <p className="text-xs uppercase tracking-widest font-semibold opacity-90">{t('pase.acceso_vip')}</p>
                    </div>
                    <div className="flex items-center justify-center gap-3">
                      {pase.codigo_pin.split('').map((digit, i) => (
                        <span key={i} className="w-12 h-14 bg-white/20 rounded-lg flex items-center justify-center text-2xl font-bold backdrop-blur-sm border border-white/10">
                          {digit}
                        </span>
                      ))}
                    </div>
                    <p className="text-[11px] opacity-70 leading-tight max-w-xs mx-auto">
                      {t('pase.pin_instrucciones')}
                    </p>
                  </div>
                </div>
              )}

              {/* Extras si los hay */}
              {pase?.extras && pase.extras.length > 0 && (
                <div className="px-6 pb-5">
                  <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-2">🎁 {t('pase.extras')}</p>
                  <div className="space-y-1">
                    {pase.extras.map((ex, i) => (
                      <div key={i} className="flex justify-between text-sm">
                        <span className="text-gray-600">{ex.emoji} {ex.nombre} ×{ex.cantidad}</span>
                        <span className="font-semibold text-gray-800">${Number(ex.subtotal).toLocaleString('es-MX')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Footer del pase — Estado */}
              <div className="bg-green-50 px-6 py-3 flex items-center justify-between border-t border-green-100">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-xs font-bold text-green-700 uppercase">{t('pase.estado_confirmado')}</span>
                </div>
                <span className="text-xs text-green-600">✓ {t('pase.pago_procesado')}</span>
              </div>
            </div>

            {/* Mensaje de WhatsApp */}
            <div className="bg-white/70 rounded-2xl border border-[#A7D8CC]/20 p-4 text-center space-y-2">
              <p className="text-sm text-gray-600">{t('pase.whatsapp_info')}</p>
              <p className="text-xs text-gray-400">{t('pase.extras_reminder')}</p>
            </div>

            {/* Botones de acción */}
            <div className="flex flex-col gap-3 pb-4">
              <a
                href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 bg-green-500 text-white font-bold py-4 rounded-full active:scale-95 transition-transform shadow-lg shadow-green-500/25"
              >
                💬 {t('pase.btn_whatsapp')}
              </a>
              <Link
                href="/"
                className="w-full inline-flex items-center justify-center bg-white text-gray-700 font-semibold py-3 rounded-full active:scale-95 transition-transform border border-gray-200"
              >
                {t('pase.volver_inicio')}
              </Link>
            </div>
          </>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
