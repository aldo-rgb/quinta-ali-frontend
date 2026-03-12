'use client';

import { useEffect, useState, useCallback } from 'react';
import { fetchAPI } from '@/lib/api';
import { BarChart3, ClipboardList, Calendar, Gift } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend,
} from 'recharts';

const COLORES = ['#0d9488', '#d4a853', '#3b82f6', '#ec4899', '#f59e0b', '#8b5cf6', '#ef4444', '#10b981'];

const estadoColores: Record<string, string> = {
  pendiente: '#f59e0b',
  confirmada: '#3b82f6',
  pagada: '#10b981',
  cancelada: '#ef4444',
  completada: '#6b7280',
};

interface Resumen {
  total_reservaciones: number;
  ingresos_totales: number;
  ticket_promedio: number;
  ingresos_mes_actual: number;
  ingresos_mes_anterior: number;
  variacion_mensual: number | null;
  total_clientes: number;
  tasa_cancelacion: number;
}

function formatMoney(n: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n);
}

export default function ReportesTab() {
  const [resumen, setResumen] = useState<Resumen | null>(null);
  const [ingresosMensuales, setIngresosMensuales] = useState<{ mes: string; ingresos_reservaciones: number; ingresos_extras: number }[]>([]);
  const [paquetesPopulares, setPaquetesPopulares] = useState<{ nombre: string; emoji: string; total_reservaciones: number; ingresos: number }[]>([]);
  const [estados, setEstados] = useState<{ estado: string; cantidad: number }[]>([]);
  const [ocupacionSemanal, setOcupacionSemanal] = useState<{ dia: string; total: number }[]>([]);
  const [extrasPopulares, setExtrasPopulares] = useState<{ nombre: string; emoji: string; veces: number; ingresos: number }[]>([]);
  const [cargando, setCargando] = useState(true);

  const cargarDatos = useCallback(async () => {
    setCargando(true);
    try {
      const [res, ing, paq, est, ocu, ext] = await Promise.all([
        fetchAPI('/api/reportes/resumen'),
        fetchAPI('/api/reportes/ingresos-mensuales?meses=6'),
        fetchAPI('/api/reportes/paquetes-populares'),
        fetchAPI('/api/reportes/estados'),
        fetchAPI('/api/reportes/ocupacion-semanal'),
        fetchAPI('/api/reportes/extras-populares'),
      ]);
      setResumen(res);
      setIngresosMensuales(ing.map((r: { mes: string; ingresos_reservaciones: string; ingresos_extras: string }) => ({
        mes: r.mes,
        ingresos_reservaciones: Number(r.ingresos_reservaciones),
        ingresos_extras: Number(r.ingresos_extras),
      })));
      setPaquetesPopulares(paq.map((r: { nombre: string; emoji: string; total_reservaciones: string; ingresos: string }) => ({
        ...r, total_reservaciones: Number(r.total_reservaciones), ingresos: Number(r.ingresos),
      })));
      setEstados(est.map((r: { estado: string; cantidad: string }) => ({
        estado: r.estado, cantidad: Number(r.cantidad),
      })));
      setOcupacionSemanal(ocu);
      setExtrasPopulares(ext.map((r: { nombre: string; emoji: string; veces: string; ingresos: string }) => ({
        ...r, veces: Number(r.veces), ingresos: Number(r.ingresos),
      })));
    } catch (err) {
      console.error('Error cargando reportes:', err);
    }
    setCargando(false);
  }, []);

  useEffect(() => { cargarDatos(); }, [cargarDatos]);

  if (cargando) {
    return (
      <div className="px-4 mt-4 max-w-lg mx-auto">
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="ml-3 text-sm text-gray-400">Cargando reportes...</span>
        </div>
      </div>
    );
  }

  const mesNombres: Record<string, string> = {
    '01': 'Ene', '02': 'Feb', '03': 'Mar', '04': 'Abr', '05': 'May', '06': 'Jun',
    '07': 'Jul', '08': 'Ago', '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Dic',
  };

  return (
    <div className="px-4 mt-4 max-w-lg mx-auto space-y-3 pb-24">
      {/* KPIs Cards */}
      {resumen && (
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-white/70 rounded-xl border border-primary-light/15 p-3">
            <p className="text-xs text-gray-400">Ingresos totales</p>
            <p className="text-lg font-bold text-primary">{formatMoney(resumen.ingresos_totales)}</p>
          </div>
          <div className="bg-white/70 rounded-xl border border-primary-light/15 p-3">
            <p className="text-xs text-gray-400">Este mes</p>
            <p className="text-lg font-bold text-primary">{formatMoney(resumen.ingresos_mes_actual)}</p>
            {resumen.variacion_mensual !== null && (
              <span className={`text-xs font-semibold ${resumen.variacion_mensual >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                {resumen.variacion_mensual >= 0 ? '↑' : '↓'} {Math.abs(resumen.variacion_mensual)}% vs mes ant.
              </span>
            )}
          </div>
          <div className="bg-white/70 rounded-xl border border-primary-light/15 p-3">
            <p className="text-xs text-gray-400">Reservaciones</p>
            <p className="text-lg font-bold">{resumen.total_reservaciones}</p>
          </div>
          <div className="bg-white/70 rounded-xl border border-primary-light/15 p-3">
            <p className="text-xs text-gray-400">Ticket promedio</p>
            <p className="text-lg font-bold">{formatMoney(resumen.ticket_promedio)}</p>
          </div>
          <div className="bg-white/70 rounded-xl border border-primary-light/15 p-3">
            <p className="text-xs text-gray-400">Clientes únicos</p>
            <p className="text-lg font-bold">{resumen.total_clientes}</p>
          </div>
          <div className="bg-white/70 rounded-xl border border-primary-light/15 p-3">
            <p className="text-xs text-gray-400">Tasa cancelación</p>
            <p className={`text-lg font-bold ${resumen.tasa_cancelacion > 20 ? 'text-red-500' : 'text-green-600'}`}>{resumen.tasa_cancelacion}%</p>
          </div>
        </div>
      )}

      {/* Ingresos Mensuales — Gráfica de barras apiladas */}
      {ingresosMensuales.length > 0 && (
        <div className="bg-white/70 rounded-xl border border-primary-light/15 p-4">
          <h3 className="font-bold text-sm mb-3 flex items-center gap-1.5"><BarChart3 className="w-4 h-4 text-primary/60" /> Ingresos mensuales</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={ingresosMensuales.map(d => ({
              ...d,
              label: mesNombres[d.mes.split('-')[1]] || d.mes,
            }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(value) => formatMoney(Number(value))} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="ingresos_reservaciones" name="Reservas" stackId="a" fill="#0d9488" radius={[0, 0, 0, 0]} />
              <Bar dataKey="ingresos_extras" name="Extras" stackId="a" fill="#d4a853" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Paquetes más populares */}
      {paquetesPopulares.length > 0 && (
        <div className="bg-white/70 rounded-xl border border-primary-light/15 p-4">
          <h3 className="font-bold text-sm mb-3">🏆 Paquetes más vendidos</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={paquetesPopulares} layout="vertical">
              <XAxis type="number" tick={{ fontSize: 10 }} />
              <YAxis type="category" dataKey="nombre" tick={{ fontSize: 11 }} width={100} />
              <Tooltip formatter={(value, name) => name === 'ingresos' ? formatMoney(Number(value)) : value} />
              <Bar dataKey="total_reservaciones" name="Reservaciones" fill="#3b82f6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-2 space-y-1">
            {paquetesPopulares.map((p, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <span>{p.emoji} {p.nombre}</span>
                <span className="font-semibold text-primary">{formatMoney(p.ingresos)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Distribución por estado — Pie Chart */}
      {estados.length > 0 && (
        <div className="bg-white/70 rounded-xl border border-primary-light/15 p-4">
          <h3 className="font-bold text-sm mb-3 flex items-center gap-1.5"><ClipboardList className="w-4 h-4 text-primary/60" /> Estado de reservaciones</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={estados}
                dataKey="cantidad"
                nameKey="estado"
                cx="50%"
                cy="50%"
                outerRadius={75}
                label={({ name, value }: { name?: string; value?: number }) => `${name} (${value})`}
                labelLine={false}
              >
                {estados.map((entry, i) => (
                  <Cell key={i} fill={estadoColores[entry.estado] || COLORES[i % COLORES.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Ocupación por día de la semana */}
      {ocupacionSemanal.length > 0 && (
        <div className="bg-white/70 rounded-xl border border-primary-light/15 p-4">
          <h3 className="font-bold text-sm mb-3 flex items-center gap-1.5"><Calendar className="w-4 h-4 text-primary/60" /> Ocupación por día</h3>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={ocupacionSemanal}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="dia" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="total" stroke="#0d9488" strokeWidth={2} dot={{ fill: '#0d9488', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Extras más populares */}
      {extrasPopulares.length > 0 && (
        <div className="bg-white/70 rounded-xl border border-primary-light/15 p-4">
          <h3 className="font-bold text-sm mb-3 flex items-center gap-1.5"><Gift className="w-4 h-4 text-primary/60" /> Extras más solicitados</h3>
          <div className="space-y-2">
            {extrasPopulares.map((ex, i) => {
              const maxVeces = extrasPopulares[0]?.veces || 1;
              const pct = (ex.veces / maxVeces) * 100;
              return (
                <div key={i}>
                  <div className="flex items-center justify-between text-xs mb-0.5">
                    <span>{ex.emoji} {ex.nombre}</span>
                    <span className="text-gray-500">{ex.veces}× · {formatMoney(Number(ex.ingresos))}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-amber-400 h-2 rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Botón refrescar */}
      <button
        onClick={cargarDatos}
        className="w-full bg-white/70 rounded-xl border border-primary-light/15 p-3 text-center text-sm font-semibold text-primary active:scale-95 transition-transform"
      >
        🔄 Actualizar reportes
      </button>
    </div>
  );
}
