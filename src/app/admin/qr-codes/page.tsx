'use client';

import { QRCodeSVG } from 'qrcode.react';

const TELEFONO = '528149060693';
const MENSAJE = 'Hola, estoy en La Quinta de Alí y quiero reportar un incidente.\n\nÁrea (Ej. Alberca, Baños, Palapa): \nDescripción del problema: ';
const LINK = `https://wa.me/${TELEFONO}?text=${encodeURIComponent(MENSAJE)}`;

const UBICACIONES = [
  '📍 Zona del asador / palapa principal',
  '📍 Puerta interior de los baños principales',
  '📍 Refrigerador de la cocina',
];

export default function QRCodesPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      {/* Header - no se imprime */}
      <div className="max-w-md mx-auto mb-8 print:hidden">
        <button
          onClick={() => window.history.back()}
          className="text-gray-500 mb-4 inline-flex items-center gap-1 hover:text-gray-700"
        >
          ← Volver al panel
        </button>
        <h1 className="text-2xl font-bold text-gray-900">
          🚨 QR de Soporte — La Quinta de Alí
        </h1>
        <p className="text-gray-500 mt-1 text-sm">
          Un solo código QR para reportes e incidentes. Imprímelo en acrílico y colócalo en puntos estratégicos.
        </p>
        <button
          onClick={() => window.print()}
          className="mt-4 bg-black text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-gray-800 active:scale-95 transition-all"
        >
          🖨️ Imprimir QR
        </button>
      </div>

      {/* QR Card - imprimible */}
      <div className="max-w-sm mx-auto print:max-w-[280px]">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col items-center print:shadow-none print:border-2 print:border-gray-200">
          {/* Top bar */}
          <div className="w-full py-4 text-center bg-gradient-to-r from-red-600 to-red-700">
            <span className="text-white font-bold text-lg tracking-wide">
              La Quinta de Alí
            </span>
          </div>

          {/* Content */}
          <div className="flex flex-col items-center px-8 py-8 w-full bg-red-50/50">
            <p className="text-red-700 font-bold text-xl mb-1 text-center">
              🚨 Soporte Inmediato
            </p>
            <p className="text-sm text-gray-500 mb-6 text-center">
              ¿Algo no funciona como debería?
            </p>

            {/* QR */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-red-100">
              <QRCodeSVG
                value={LINK}
                size={200}
                level="H"
                fgColor="#dc2626"
                imageSettings={{
                  src: '/logo.png',
                  height: 40,
                  width: 40,
                  excavate: true,
                }}
              />
            </div>

            <p className="mt-6 text-center">
              <span className="text-lg font-bold text-red-700">
                Escanea aquí 📱
              </span>
              <br />
              <span className="text-sm text-gray-500">
                Se abre WhatsApp con un reporte listo
              </span>
            </p>
          </div>

          {/* Footer */}
          <div className="w-full py-3 text-center bg-gray-50 border-t border-gray-100">
            <span className="text-xs text-gray-400">
              WhatsApp directo · Sin descargar apps
            </span>
          </div>
        </div>
      </div>

      {/* Info section - no se imprime */}
      <div className="max-w-md mx-auto mt-10 space-y-6 print:hidden">
        {/* Preview del mensaje */}
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <h3 className="font-bold text-gray-700 mb-3">
            💬 Vista previa del mensaje
          </h3>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm text-gray-700 whitespace-pre-line font-mono">
            {MENSAJE}
          </div>
        </div>

        {/* Probar enlace */}
        <a
          href={LINK}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full text-center py-3 rounded-xl font-semibold text-white bg-green-600 hover:bg-green-700 active:scale-95 transition-all shadow-sm"
        >
          ✅ Probar enlace en WhatsApp ↗
        </a>

        {/* Dónde colocarlo */}
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <h3 className="font-bold text-gray-700 mb-3">
            📍 Dónde colocar el acrílico
          </h3>
          <ul className="space-y-2">
            {UBICACIONES.map((u, i) => (
              <li key={i} className="text-sm text-gray-600 bg-gray-50 rounded-lg px-4 py-2.5">
                {u}
              </li>
            ))}
          </ul>
          <p className="text-xs text-gray-400 mt-3">
            Texto sugerido arriba del QR: &quot;¿Algo no funciona como debería? Escanea aquí para soporte inmediato.&quot;
          </p>
        </div>

        {/* Enlace crudo */}
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <h3 className="font-bold text-gray-700 mb-2">🔗 Enlace generado</h3>
          <p className="text-xs text-gray-400 break-all font-mono">{LINK}</p>
        </div>
      </div>
    </div>
  );
}
