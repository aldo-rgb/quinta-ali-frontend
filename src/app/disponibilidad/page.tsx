'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { fetchAPI } from '@/lib/api';

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];
const DAY_NAMES = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa'];

export default function DisponibilidadPage() {
  const today = new Date();
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [calendario, setCalendario] = useState<Record<string, { reservaciones: number; disponible: boolean }>>({});
  const [loading, setLoading] = useState(true);

  const mes = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}`;
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  useEffect(() => {
    setLoading(true);
    fetchAPI(`/api/reservaciones/calendario?mes=${mes}`)
      .then((data) => setCalendario(data))
      .catch(() => setCalendario({}))
      .finally(() => setLoading(false));
  }, [mes]);

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); }
    else setViewMonth(viewMonth - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); }
    else setViewMonth(viewMonth + 1);
  }

  function isDatePast(day: number) {
    const d = new Date(viewYear, viewMonth, day);
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return d < todayStart;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#faf8f5] to-white">
      {/* Header */}
      <header className="py-6 px-4 text-center">
        <Link href="/">
          <Image src="/logo.png" alt="La Quinta de Alí" width={60} height={60} className="mx-auto mb-3" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Disponibilidad</h1>
        <p className="text-sm text-gray-500 mt-1">Consulta las fechas disponibles para tu evento</p>
      </header>

      {/* Calendar */}
      <div className="max-w-md mx-auto px-4 pb-10">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-5">
          {/* Month navigation */}
          <div className="flex items-center justify-between mb-5">
            <button onClick={prevMonth} className="p-2 rounded-full hover:bg-gray-100 active:scale-90 transition-all">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            </button>
            <span className="font-bold text-lg text-gray-800">{MONTH_NAMES[viewMonth]} {viewYear}</span>
            <button onClick={nextMonth} className="p-2 rounded-full hover:bg-gray-100 active:scale-90 transition-all">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 text-center text-xs font-semibold text-gray-400 mb-2">
            {DAY_NAMES.map((d) => <span key={d}>{d}</span>)}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 gap-1.5 text-center">
            {Array.from({ length: firstDayOfWeek }).map((_, i) => <div key={`e-${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const isPast = isDatePast(day);
              const info = calendario[dateStr];
              const noDisponible = info && !info.disponible;
              const parcial = info && info.disponible && info.reservaciones > 0;

              return (
                <div
                  key={day}
                  className={`aspect-square rounded-xl flex flex-col items-center justify-center text-sm font-medium transition-all ${
                    noDisponible
                      ? 'bg-red-100 text-red-400'
                      : isPast
                      ? 'text-gray-200'
                      : parcial
                      ? 'bg-yellow-50 text-gray-700 ring-2 ring-yellow-300'
                      : 'text-gray-700 bg-green-50/50'
                  }`}
                >
                  <span>{day}</span>
                  {!isPast && !loading && (
                    <span className={`text-[8px] mt-0.5 font-semibold ${
                      noDisponible ? 'text-red-400' : parcial ? 'text-yellow-600' : 'text-green-600'
                    }`}>
                      {noDisponible ? 'Lleno' : parcial ? 'Parcial' : 'Libre'}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-5 mt-5 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-green-400" />
              <span className="text-xs text-gray-500">Disponible</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-yellow-400" />
              <span className="text-xs text-gray-500">Parcial</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-red-400" />
              <span className="text-xs text-gray-500">Lleno</span>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-6 text-center space-y-3">
          <Link
            href="/reservar"
            className="block w-full bg-gradient-to-r from-amber-600 to-amber-700 text-white font-bold py-3.5 rounded-xl shadow-lg hover:shadow-xl active:scale-[0.98] transition-all text-center"
          >
            🎉 Reservar ahora
          </Link>
          <p className="text-xs text-gray-400">
            Las fechas parciales aún tienen horarios libres
          </p>
        </div>
      </div>
    </div>
  );
}
