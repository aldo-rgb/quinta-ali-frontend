'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Copy, Check, MousePointerClick, CalendarCheck, DollarSign, LogOut, Calendar, Clock } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const FRONTEND_URL = process.env.NEXT_PUBLIC_FRONTEND_URL || 'https://quinta-ali-frontend.vercel.app';

interface Stats {
  clicks_semana: number;
  clicks_mes: number;
  reservas_pagadas: number;
  reservas_mes: number;
  comision_mes: number;
}

interface Evento {
  id: number;
  fecha_evento: string;
  hora_inicio: string;
  estado: string;
  monto_total: number;
  cliente_nombre: string;
  cliente_apellido: string;
  paquete_nombre: string;
}

const estadoColors: Record<string, string> = {
  pendiente: 'bg-yellow-100 text-yellow-700',
  confirmada: 'bg-blue-100 text-blue-700',
  pagada: 'bg-green-100 text-green-700',
  cancelada: 'bg-red-100 text-red-700',
  completada: 'bg-gray-100 text-gray-700',
};

function promotorHeaders(): Record<string, string> {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (typeof window !== 'undefined') {
    const token = sessionStorage.getItem('promotor_token');
    if (token) h['Authorization'] = `Bearer ${token}`;
  }
  return h;
}

export default function DashboardPromotor() {
  const router = useRouter();
  const [nombre, setNombre] = useState('');
  const [codigoRef, setCodigoRef] = useState('');
  const [stats, setStats] = useState<Stats | null>(null);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [cargando, setCargando] = useState(true);
  const [copiado, setCopiado] = useState(false);

  const linkVentas = `${FRONTEND_URL}?ref=${codigoRef}`;

  const cargarDatos = useCallback(async () => {
    try {
      const [statsRes, eventosRes] = await Promise.all([
        fetch(`${API_URL}/api/promotores/stats`, { headers: promotorHeaders() }),
        fetch(`${API_URL}/api/promotores/mis-eventos`, { headers: promotorHeaders() }),
      ]);

      if (statsRes.status === 401 || eventosRes.status === 401) {
        sessionStorage.removeItem('promotor_token');
        router.push('/promotor');
        return;
      }

      const [statsData, eventosData] = await Promise.all([statsRes.json(), eventosRes.json()]);
      setStats(statsData);
      setEventos(eventosData);
    } catch {
      // silently fail
    } finally {
      setCargando(false);
    }
  }, [router]);

  useEffect(() => {
    const token = sessionStorage.getItem('promotor_token');
    if (!token) {
      router.push('/promotor');
      return;
    }
    setNombre(sessionStorage.getItem('promotor_nombre') || '');
    setCodigoRef(sessionStorage.getItem('promotor_ref') || '');
    cargarDatos();
  }, [router, cargarDatos]);

  function copiarLink() {
    navigator.clipboard.writeText(linkVentas);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2500);
  }

  function cerrarSesion() {
    sessionStorage.removeItem('promotor_token');
    sessionStorage.removeItem('promotor_nombre');
    sessionStorage.removeItem('promotor_ref');
    router.push('/promotor');
  }

  const mesActual = new Date().toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });

  if (cargando) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="La Quinta de Alí" width={120} height={40} className="h-8 w-auto" />
          </div>
          <button onClick={cerrarSesion} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-red-500 transition-colors">
            <LogOut className="w-4 h-4" /> Salir
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8">
        {/* Saludo */}
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Hola, {nombre.split(' ')[0]} 👋</h1>

        {/* Tarjeta para copiar el link */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-8">
          <p className="text-sm text-gray-500 font-semibold uppercase tracking-wide mb-2">Tu Link Único de Ventas</p>
          <div className="flex items-center gap-3">
            <p className="flex-1 text-teal-600 font-medium text-sm truncate bg-gray-50 px-4 py-2.5 rounded-xl border border-gray-100">
              {linkVentas}
            </p>
            <button
              onClick={copiarLink}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold transition-all active:scale-95 ${
                copiado
                  ? 'bg-green-500 text-white'
                  : 'bg-black text-white hover:bg-gray-800'
              }`}
            >
              {copiado ? <><Check className="w-4 h-4" /> ¡Copiado!</> : <><Copy className="w-4 h-4" /> Copiar Link</>}
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2">Comparte este link en tus grupos de WhatsApp para generar ventas</p>
        </div>

        {/* Tarjetas de Métricas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                <MousePointerClick className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-gray-500 text-sm font-semibold">Clics en mi Link</p>
            </div>
            <p className="text-4xl font-bold text-gray-800">{stats?.clicks_semana ?? 0}</p>
            <p className="text-xs text-gray-400 mt-1">esta semana · {stats?.clicks_mes ?? 0} este mes</p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center">
                <CalendarCheck className="w-4 h-4 text-purple-600" />
              </div>
              <p className="text-gray-500 text-sm font-semibold">Eventos Cerrados</p>
            </div>
            <p className="text-4xl font-bold text-gray-800">{stats?.reservas_pagadas ?? 0}</p>
            <p className="text-xs text-gray-400 mt-1">{stats?.reservas_mes ?? 0} este mes</p>
          </div>

          <div className="bg-gradient-to-br from-teal-500 to-teal-700 p-6 rounded-2xl shadow-lg text-white">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-white" />
              </div>
              <p className="text-teal-100 text-sm font-semibold">Mi Comisión</p>
            </div>
            <p className="text-5xl font-extrabold">
              ${(stats?.comision_mes ?? 0).toLocaleString('es-MX')}
              <span className="text-xl font-medium ml-1">MXN</span>
            </p>
            <p className="text-xs text-teal-200 mt-1 capitalize">{mesActual}</p>
          </div>
        </div>

        {/* Tabla de eventos */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50">
            <h2 className="font-bold text-gray-800">Mis Eventos</h2>
            <p className="text-xs text-gray-400">Reservaciones generadas con tu link</p>
          </div>

          {eventos.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <CalendarCheck className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="font-semibold text-gray-400">Sin eventos aún</p>
              <p className="text-sm text-gray-300 mt-1">Comparte tu link para empezar a generar ventas</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {eventos.map((ev) => (
                <div key={ev.id} className="px-6 py-4 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-800">
                      {ev.cliente_nombre} {ev.cliente_apellido}
                    </p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(ev.fecha_evento).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {ev.hora_inicio?.slice(0, 5)}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${estadoColors[ev.estado] || 'bg-gray-100'}`}>
                      {ev.estado}
                    </span>
                    <p className="text-sm font-bold text-gray-600 mt-1">
                      ${Number(ev.monto_total).toLocaleString('es-MX')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
