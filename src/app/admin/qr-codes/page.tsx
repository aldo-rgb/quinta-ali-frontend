'use client';

import { QRCodeSVG } from 'qrcode.react';
import { useRef } from 'react';

const TELEFONO = '528149060693';

const qrConfigs = [
  {
    id: 'compras',
    titulo: '🧊 Compras y Extras',
    ubicacion: 'Refrigerador / Área de Asador',
    color: '#2563eb',
    bgColor: '#eff6ff',
    mensaje:
      'Hola, estoy en la Quinta. Me gustaría comprar más bolsas de hielo/carbón/leña. Mi pedido es: ',
  },
  {
    id: 'mantenimiento',
    titulo: '🔧 Mantenimiento Urgente',
    ubicacion: 'Baños y Cuartos',
    color: '#dc2626',
    bgColor: '#fef2f2',
    mensaje:
      'Hola, tenemos un incidente de mantenimiento o limpieza en la Quinta. El problema es: ',
  },
  {
    id: 'soporte',
    titulo: '💬 Dudas y Soporte',
    ubicacion: 'Puerta de Entrada / Bocinas',
    color: '#7c3aed',
    bgColor: '#f5f3ff',
    mensaje:
      'Hola, tengo una duda rápida sobre el funcionamiento de las instalaciones (Bocina, Luces, Alberca): ',
  },
];

function buildLink(mensaje: string) {
  return `https://wa.me/${TELEFONO}?text=${encodeURIComponent(mensaje)}`;
}

export default function QRCodesPage() {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      {/* Header - no se imprime */}
      <div className="max-w-5xl mx-auto mb-8 print:hidden">
        <button
          onClick={() => window.history.back()}
          className="text-gray-500 mb-4 inline-flex items-center gap-1 hover:text-gray-700"
        >
          ← Volver al panel
        </button>
        <h1 className="text-3xl font-bold text-gray-900">
          QR Codes — La Quinta de Alí
        </h1>
        <p className="text-gray-500 mt-1">
          3 códigos QR para imprimir en acrílicos y colocar en la quinta.
        </p>
        <button
          onClick={handlePrint}
          className="mt-4 bg-black text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-gray-800 active:scale-95 transition-all"
        >
          🖨️ Imprimir todos
        </button>
      </div>

      {/* QR Cards */}
      <div
        ref={printRef}
        className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 print:grid-cols-3 print:gap-4"
      >
        {qrConfigs.map((qr) => {
          const link = buildLink(qr.mensaje);
          return (
            <div
              key={qr.id}
              className="bg-white rounded-2xl shadow-lg overflow-hidden flex flex-col items-center print:shadow-none print:border print:border-gray-200 print:break-inside-avoid"
            >
              {/* Top color bar */}
              <div
                className="w-full py-3 text-center"
                style={{ backgroundColor: qr.color }}
              >
                <span className="text-white font-bold text-lg tracking-wide">
                  La Quinta de Alí
                </span>
              </div>

              {/* Content */}
              <div
                className="flex-1 flex flex-col items-center justify-center px-6 py-6 w-full"
                style={{ backgroundColor: qr.bgColor }}
              >
                <p className="text-sm font-semibold text-gray-500 mb-1 uppercase tracking-wider">
                  {qr.ubicacion}
                </p>
                <h2
                  className="text-xl font-bold mb-4 text-center"
                  style={{ color: qr.color }}
                >
                  {qr.titulo}
                </h2>

                {/* QR */}
                <div className="bg-white p-4 rounded-xl shadow-sm">
                  <QRCodeSVG
                    value={link}
                    size={180}
                    level="H"
                    fgColor={qr.color}
                    imageSettings={{
                      src: '/logo.png',
                      height: 36,
                      width: 36,
                      excavate: true,
                    }}
                  />
                </div>

                <p className="mt-4 text-sm text-gray-600 font-medium text-center">
                  ¿Necesitas algo?
                  <br />
                  <span className="text-base font-bold" style={{ color: qr.color }}>
                    Escanea aquí 📱
                  </span>
                </p>
              </div>

              {/* Footer */}
              <div className="w-full py-2 text-center bg-gray-50 border-t border-gray-100">
                <span className="text-xs text-gray-400">
                  WhatsApp directo · Sin descargar apps
                </span>
              </div>

              {/* Download button - no se imprime */}
              <div className="w-full px-4 pb-4 pt-2 print:hidden">
                <a
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full text-center py-2 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95"
                  style={{ backgroundColor: qr.color }}
                >
                  Probar enlace ↗
                </a>
              </div>
            </div>
          );
        })}
      </div>

      {/* Links reference - no se imprime */}
      <div className="max-w-5xl mx-auto mt-10 print:hidden">
        <h3 className="text-lg font-bold text-gray-700 mb-3">
          Enlaces generados
        </h3>
        <div className="space-y-3">
          {qrConfigs.map((qr) => {
            const link = buildLink(qr.mensaje);
            return (
              <div
                key={qr.id}
                className="bg-white rounded-xl p-4 flex items-start gap-3"
              >
                <span
                  className="w-3 h-3 rounded-full mt-1.5 shrink-0"
                  style={{ backgroundColor: qr.color }}
                />
                <div className="min-w-0">
                  <p className="font-semibold text-gray-800">{qr.titulo}</p>
                  <p className="text-xs text-gray-400 break-all mt-1 font-mono">
                    {link}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
