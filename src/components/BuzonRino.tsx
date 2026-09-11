'use client';

import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { fetchAPI } from '@/lib/api';
import {
  MessagesSquare, Send, RotateCcw, Loader2, ArrowUpRight, ArrowDownLeft,
  CheckCircle2, AlertTriangle, XCircle, Link2,
} from 'lucide-react';
import { CARD, INPUT, formatFecha, mensajeError } from '@/components/rinoUi';

type EnvioEstado = 'pendiente' | 'enviada' | 'rechazada' | 'error';

interface Pendiente {
  id: number;
  direccion: 'enviado' | 'recibido';
  ref: string;
  peticion: string;
  detalle: string | null;
  area: string | null;
  quien_pide: string | null;
  estado: 'abierto' | 'cerrado';
  motivo_cierre: string | null;
  cerrado_en: string | null;
  envio_estado: EnvioEstado | null;
  envio_detalle: string | null;
  creado_en: string;
}

const AREAS = [
  { valor: 'reservas', texto: 'Reservas' },
  { valor: 'ingresos', texto: 'Ingresos' },
  { valor: 'tareas', texto: 'Tareas' },
  { valor: 'conexion', texto: 'Conexión' },
  { valor: 'otro', texto: 'Otro' },
];

const ETIQUETA_ENVIO: Record<EnvioEstado, string> = {
  pendiente: 'Por enviar',
  enviada: 'Enviado',
  rechazada: 'Rino lo rechazó',
  error: 'No llegó a Rino',
};

const FORM_VACIO = { peticion: '', detalle: '', area: '', quien_pide: '' };

/**
 * Buzón de pendientes con Rino: lo que hay que construir en uno de los dos
 * sistemas. No es mantenimiento — eso va en "Nueva tarea".
 */
export default function BuzonRino({ urlEventos, conectado }: { urlEventos: string | null; conectado: boolean }) {
  const [pendientes, setPendientes] = useState<Pendiente[]>([]);
  const [cargando, setCargando] = useState(true);
  const [soloAbiertos, setSoloAbiertos] = useState(true);
  const [form, setForm] = useState(FORM_VACIO);
  const [enviando, setEnviando] = useState(false);
  const [ocupado, setOcupado] = useState<number | 'url' | null>(null);
  const [aviso, setAviso] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);

  const recargar = useCallback(async () => {
    setPendientes(await fetchAPI('/api/rino/pendientes'));
  }, []);

  useEffect(() => {
    let vigente = true;
    fetchAPI('/api/rino/pendientes')
      .then((p) => { if (vigente) setPendientes(p); })
      .catch((err) => {
        if (vigente) setAviso({ tipo: 'error', texto: mensajeError(err, 'No se pudo cargar el buzón') });
      })
      .finally(() => { if (vigente) setCargando(false); });
    return () => { vigente = false; };
  }, []);

  const avisarEnvio = (p: Pendiente, textoOk: string) => {
    setAviso(p.envio_estado === 'enviada'
      ? { tipo: 'ok', texto: textoOk }
      : { tipo: 'error', texto: `Guardado, pero no llegó a Rino: ${p.envio_detalle ?? 'sin detalle'}` });
  };

  const mandar = async (e: FormEvent) => {
    e.preventDefault();
    setEnviando(true);
    setAviso(null);
    try {
      const p: Pendiente = await fetchAPI('/api/rino/pendientes', { method: 'POST', body: JSON.stringify(form) });
      setForm(FORM_VACIO);
      await recargar();
      avisarEnvio(p, 'Pendiente enviado a Rino');
    } catch (err) {
      setAviso({ tipo: 'error', texto: mensajeError(err, 'No se pudo mandar el pendiente') });
    }
    setEnviando(false);
  };

  const mandarUrl = async () => {
    if (!urlEventos || !window.confirm(`¿Mandarle a Rino nuestra URL de eventos?\n\n${urlEventos}`)) return;
    setOcupado('url');
    setAviso(null);
    try {
      const p: Pendiente = await fetchAPI('/api/rino/pendientes/url-eventos', { method: 'POST' });
      await recargar();
      avisarEnvio(p, 'URL de eventos enviada a Rino');
    } catch (err) {
      setAviso({ tipo: 'error', texto: mensajeError(err, 'No se pudo mandar la URL') });
    }
    setOcupado(null);
  };

  const reenviar = async (p: Pendiente) => {
    setOcupado(p.id);
    setAviso(null);
    try {
      const r: Pendiente = await fetchAPI(`/api/rino/pendientes/${p.id}/reenviar`, { method: 'POST' });
      await recargar();
      avisarEnvio(r, 'Pendiente enviado a Rino');
    } catch (err) {
      setAviso({ tipo: 'error', texto: mensajeError(err, 'No se pudo reenviar') });
    }
    setOcupado(null);
  };

  const marcarAtendido = async (p: Pendiente) => {
    const motivo = window.prompt('¿Cómo se resolvió? Queda como motivo de cierre.');
    if (!motivo?.trim()) return;
    setOcupado(p.id);
    setAviso(null);
    try {
      await fetchAPI(`/api/rino/pendientes/${p.id}`, { method: 'PATCH', body: JSON.stringify({ motivo }) });
      await recargar();
    } catch (err) {
      setAviso({ tipo: 'error', texto: mensajeError(err, 'No se pudo cerrar el pendiente') });
    }
    setOcupado(null);
  };

  const abiertos = pendientes.filter((p) => p.estado === 'abierto');
  const visibles = soloAbiertos ? abiertos : pendientes;

  return (
    <div className={CARD}>
      <div className="flex items-center justify-between mb-1">
        <h3 className="font-bold text-sm flex items-center gap-1.5">
          <MessagesSquare className="w-4 h-4 text-primary/60" /> Buzón de pendientes
          {abiertos.length > 0 && (
            <span className="bg-primary text-white text-[10px] font-bold rounded-full px-1.5">{abiertos.length}</span>
          )}
        </h3>
        <div className="flex text-[11px] bg-gray-100 rounded-lg p-0.5">
          {[true, false].map((v) => (
            <button
              key={String(v)}
              onClick={() => setSoloAbiertos(v)}
              className={`px-2 py-1 rounded-md ${soloAbiertos === v ? 'bg-white shadow-sm font-semibold' : 'text-gray-500'}`}
            >
              {v ? 'Abiertos' : 'Todos'}
            </button>
          ))}
        </div>
      </div>
      <p className="text-xs text-gray-500 mb-3">
        Lo que hay que construir en uno de los dos sistemas. No es mantenimiento y no le suena el teléfono a nadie.
      </p>

      {aviso && (
        <div className={`rounded-lg p-2.5 mb-3 text-xs flex items-start gap-2 border ${aviso.tipo === 'ok' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
          {aviso.tipo === 'ok'
            ? <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
            : <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />}
          <span className="flex-1 break-words">{aviso.texto}</span>
          <button onClick={() => setAviso(null)} aria-label="Cerrar aviso">
            <XCircle className="w-3.5 h-3.5 opacity-60" />
          </button>
        </div>
      )}

      {urlEventos && (
        <div className="flex items-center justify-between gap-2 text-xs bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 mb-3">
          <span className="min-w-0 flex items-center gap-1 text-gray-600">
            <Link2 className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate" title={urlEventos}>{urlEventos}</span>
          </span>
          <button
            onClick={mandarUrl}
            disabled={!conectado || ocupado === 'url'}
            className="font-semibold text-primary whitespace-nowrap disabled:opacity-40"
          >
            Mandarla a Rino
          </button>
        </div>
      )}

      {cargando ? (
        <div className="flex justify-center py-4"><Loader2 className="w-4 h-4 animate-spin text-gray-400" /></div>
      ) : visibles.length === 0 ? (
        <p className="text-xs text-gray-400 text-center py-4">
          {soloAbiertos ? 'No hay pendientes abiertos' : 'El buzón está vacío'}
        </p>
      ) : (
        <div className="space-y-2">
          {visibles.map((p) => (
            <div key={p.id} className="border border-gray-100 rounded-lg p-3 bg-white">
              <div className="flex items-center justify-between gap-2 text-[11px] text-gray-400">
                <span className="flex items-center gap-1 min-w-0">
                  {p.direccion === 'enviado'
                    ? <><ArrowUpRight className="w-3 h-3 flex-shrink-0" /> Quinta pide</>
                    : <><ArrowDownLeft className="w-3 h-3 flex-shrink-0" /> Rino pide</>}
                  <span className="truncate">
                    {p.area ? ` · ${p.area}` : ''}{p.quien_pide ? ` · ${p.quien_pide}` : ''}
                  </span>
                </span>
                <span className="whitespace-nowrap">{formatFecha(p.creado_en)}</span>
              </div>
              <p className="text-sm font-semibold mt-1 break-words">{p.peticion}</p>
              {p.detalle && <p className="text-xs text-gray-600 mt-1 whitespace-pre-line break-words">{p.detalle}</p>}

              {p.estado === 'cerrado' && (
                <p className="text-xs text-green-700 bg-green-50 rounded-md px-2 py-1 mt-2 break-words">
                  Cerrado {formatFecha(p.cerrado_en)}{p.motivo_cierre ? `: ${p.motivo_cierre}` : ''}
                </p>
              )}

              {p.direccion === 'enviado' && p.envio_estado && p.envio_estado !== 'enviada' && (
                <div className="flex items-start justify-between gap-2 mt-2">
                  <p className="text-[11px] text-red-600 break-words">
                    {ETIQUETA_ENVIO[p.envio_estado]}{p.envio_detalle ? `: ${p.envio_detalle}` : ''}
                  </p>
                  <button
                    onClick={() => reenviar(p)}
                    disabled={ocupado === p.id}
                    className="text-xs font-semibold text-primary flex items-center gap-1 whitespace-nowrap disabled:opacity-50"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Reintentar
                  </button>
                </div>
              )}

              {p.direccion === 'recibido' && p.estado === 'abierto' && (
                <button
                  onClick={() => marcarAtendido(p)}
                  disabled={ocupado === p.id}
                  className="text-xs font-semibold text-primary mt-2 disabled:opacity-50"
                >
                  Marcar atendido
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <form onSubmit={mandar} className="space-y-2.5 mt-3 pt-3 border-t border-gray-100">
        <p className="text-xs font-semibold text-gray-500">Pedirle algo a Rino</p>
        <input
          className={INPUT}
          placeholder="Qué hace falta, en una frase que se entienda sola *"
          maxLength={500}
          value={form.peticion}
          onChange={(e) => setForm({ ...form, peticion: e.target.value })}
          required
        />
        <textarea
          className={`${INPUT} resize-none`}
          rows={2}
          placeholder="Por qué, y qué se intentó (opcional)"
          maxLength={4000}
          value={form.detalle}
          onChange={(e) => setForm({ ...form, detalle: e.target.value })}
        />
        <div className="grid grid-cols-2 gap-2">
          <select className={INPUT} value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })}>
            <option value="">Área (opcional)</option>
            {AREAS.map((a) => <option key={a.valor} value={a.valor}>{a.texto}</option>)}
          </select>
          <input
            className={INPUT}
            placeholder="Quién pide"
            maxLength={120}
            value={form.quien_pide}
            onChange={(e) => setForm({ ...form, quien_pide: e.target.value })}
          />
        </div>
        <button
          type="submit"
          disabled={enviando || !form.peticion.trim()}
          className="w-full bg-primary text-white font-semibold py-2.5 rounded-lg text-sm disabled:bg-gray-300 active:scale-[0.98] transition-transform flex items-center justify-center gap-1.5"
        >
          {enviando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          {enviando ? 'Enviando…' : 'Mandar pendiente'}
        </button>
      </form>
    </div>
  );
}
