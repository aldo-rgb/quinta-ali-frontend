'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { fetchAPI } from '@/lib/api';
import {
  Wrench, RefreshCw, Send, XCircle, AlertTriangle, CheckCircle2, Loader2,
  ImageIcon, Inbox, Flame, RotateCcw, Link2,
} from 'lucide-react';
import BuzonRino from '@/components/BuzonRino';
import { CARD, INPUT, formatFecha, mensajeError } from '@/components/rinoUi';

interface UsuarioRino {
  email: string;
  nombre: string;
  puesto: string | null;
}

type EstadoTicket = 'abierto' | 'enviado_rino' | 'resuelto' | 'descartado';

interface Ticket {
  id: number;
  origen: string;
  categoria: string | null;
  descripcion: string;
  contacto: string | null;
  estado: EstadoTicket;
  creado_en: string;
  tarea_id: string | null;
}

interface TareaRino {
  id: string;
  titulo: string;
  descripcion: string | null;
  area: string | null;
  prioridad: 'fuego' | 'estrella';
  responsable_email: string | null;
  responsable_nombre: string | null;
  fecha_limite: string | null;
  ticket_id: number | null;
  cancelada: boolean;
  envio_estado: 'pendiente' | 'enviada' | 'rechazada' | 'error';
  envio_detalle: string | null;
  envio_intentos: number;
  estado_rino: string | null;
  responsable_rino: string | null;
  completada_en: string | null;
  creado_en: string;
}

interface EstadoPuente {
  configurado: boolean;
  peer: string;
  url: string;
  url_eventos: string;
  sonda: { ok?: boolean; conocido?: boolean; activo?: boolean; detalle?: string } | null;
}

const AREAS = ['Alberca / Palapa', 'Baños', 'Habitaciones', 'Jardín / Asador', 'Cocina', 'Entrada', 'Otras áreas'];

const FORM_VACIO = {
  titulo: '',
  descripcion: '',
  area: '',
  prioridad: 'estrella' as 'estrella' | 'fuego',
  responsable_email: '',
  fecha_limite: '',
  ticket_id: null as number | null,
};

const ETIQUETA_TICKET: Record<EstadoTicket, { texto: string; clase: string }> = {
  abierto: { texto: 'Abierto', clase: 'bg-amber-100 text-amber-700' },
  enviado_rino: { texto: 'En Rino', clase: 'bg-blue-100 text-blue-700' },
  resuelto: { texto: 'Resuelto', clase: 'bg-green-100 text-green-700' },
  descartado: { texto: 'Descartado', clase: 'bg-gray-200 text-gray-600' },
};

function estadoTarea(t: TareaRino): { texto: string; clase: string } {
  if (t.envio_estado === 'error') return { texto: 'No llegó a Rino', clase: 'bg-red-100 text-red-700' };
  if (t.envio_estado === 'rechazada') return { texto: 'Rino la rechazó', clase: 'bg-red-100 text-red-700' };
  if (t.envio_estado === 'pendiente') {
    return { texto: t.cancelada ? 'Cancelando…' : 'Por enviar', clase: 'bg-amber-100 text-amber-700' };
  }
  switch (t.estado_rino) {
    case 'completed': return { texto: 'Terminada', clase: 'bg-green-100 text-green-700' };
    case 'cancelled': return { texto: 'Cancelada', clase: 'bg-gray-200 text-gray-600' };
    case 'awaiting_confirmation': return { texto: 'Por confirmar', clase: 'bg-blue-100 text-blue-700' };
    case 'open': return { texto: 'Abierta en Rino', clase: 'bg-blue-100 text-blue-700' };
    default: return t.cancelada
      ? { texto: 'Cancelada', clase: 'bg-gray-200 text-gray-600' }
      : { texto: 'Enviada', clase: 'bg-blue-100 text-blue-700' };
  }
}

function estadoPuente(e: EstadoPuente | null): { texto: string; clase: string; detalle: string } {
  if (!e) return { texto: 'Consultando…', clase: 'bg-gray-100 text-gray-500', detalle: '' };
  if (!e.configurado) {
    return {
      texto: 'Sin conectar',
      clase: 'bg-amber-100 text-amber-700',
      detalle: 'Falta la llave de Rino en el backend. Las tareas se guardan y se envían en cuanto se conecte.',
    };
  }
  if (e.sonda?.ok) return { texto: 'Conectado', clase: 'bg-green-100 text-green-700', detalle: '' };
  if (e.sonda?.conocido === false) {
    return { texto: 'Rino no reconoce a Quinta', clase: 'bg-red-100 text-red-700', detalle: `Falta dar de alta el socio "${e.peer}" en Rino.` };
  }
  if (e.sonda?.activo === false) {
    return { texto: 'Socio inactivo en Rino', clase: 'bg-red-100 text-red-700', detalle: `El socio "${e.peer}" existe en Rino pero está desactivado.` };
  }
  return { texto: 'Sin respuesta de Rino', clase: 'bg-red-100 text-red-700', detalle: e.sonda?.detalle ?? '' };
}

export default function RinoTab() {
  const [puente, setPuente] = useState<EstadoPuente | null>(null);
  const [usuarios, setUsuarios] = useState<UsuarioRino[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [tareas, setTareas] = useState<TareaRino[]>([]);
  const [soloAbiertos, setSoloAbiertos] = useState(true);
  const [form, setForm] = useState(FORM_VACIO);
  const [cargando, setCargando] = useState(true);
  const [sincronizando, setSincronizando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [ocupada, setOcupada] = useState<string | null>(null);
  const [aviso, setAviso] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);
  const [evidencias, setEvidencias] = useState<Record<string, string[]>>({});
  const formRef = useRef<HTMLDivElement>(null);

  const cargarListas = useCallback(async () => {
    const [tks, trs] = await Promise.all([
      fetchAPI('/api/rino/tickets'),
      fetchAPI('/api/rino/tareas'),
    ]);
    setTickets(tks);
    setTareas(trs);
  }, []);

  // Carga inicial. `cargando` ya empieza en true.
  useEffect(() => {
    let vigente = true;
    Promise.all([fetchAPI('/api/rino/estado'), fetchAPI('/api/rino/tickets'), fetchAPI('/api/rino/tareas')])
      .then(([estado, tks, trs]) => {
        if (!vigente) return;
        setPuente(estado);
        setTickets(tks);
        setTareas(trs);
        if (estado.configurado) {
          fetchAPI('/api/rino/usuarios')
            .then((u) => { if (vigente) setUsuarios(u); })
            .catch(() => {});
        }
      })
      .catch((err) => {
        if (vigente) setAviso({ tipo: 'error', texto: mensajeError(err, 'Error cargando Rino') });
      })
      .finally(() => {
        if (vigente) setCargando(false);
      });
    return () => { vigente = false; };
  }, []);

  const sincronizar = async () => {
    setSincronizando(true);
    setAviso(null);
    try {
      const r = await fetchAPI('/api/rino/sincronizar', { method: 'POST' });
      await cargarListas();
      setAviso(r.omitido
        ? { tipo: 'error', texto: 'El puente con Rino aún no está configurado' }
        : { tipo: 'ok', texto: `Listo: ${r.actualizadas ?? 0} actualizadas, ${r.reintentadas ?? 0} reenviadas` });
    } catch (err) {
      setAviso({ tipo: 'error', texto: mensajeError(err, 'No se pudo sincronizar') });
    }
    setSincronizando(false);
  };

  const mandarTicket = (t: Ticket) => {
    setForm({
      ...FORM_VACIO,
      titulo: `${t.categoria ? `${t.categoria}: ` : ''}${t.descripcion}`.slice(0, 120),
      descripcion: [t.descripcion, t.contacto ? `Contacto del cliente: ${t.contacto}` : '']
        .filter(Boolean).join('\n\n'),
      area: t.categoria && AREAS.includes(t.categoria) ? t.categoria : '',
      prioridad: 'fuego',
      ticket_id: t.id,
    });
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const cambiarTicket = async (t: Ticket, estado: EstadoTicket) => {
    setOcupada(`ticket-${t.id}`);
    try {
      await fetchAPI(`/api/rino/tickets/${t.id}`, { method: 'PATCH', body: JSON.stringify({ estado }) });
      await cargarListas();
    } catch (err) {
      setAviso({ tipo: 'error', texto: mensajeError(err, 'No se pudo actualizar el reporte') });
    }
    setOcupada(null);
  };

  const crearTarea = async (e: FormEvent) => {
    e.preventDefault();
    setEnviando(true);
    setAviso(null);
    try {
      const tarea: TareaRino = await fetchAPI('/api/rino/tareas', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          fecha_limite: form.fecha_limite ? new Date(form.fecha_limite).toISOString() : null,
        }),
      });
      setForm(FORM_VACIO);
      await cargarListas();
      setAviso(tarea.envio_estado === 'enviada'
        ? { tipo: 'ok', texto: 'Tarea enviada a mantenimiento de Rino' }
        : { tipo: 'error', texto: `Tarea guardada, pero no llegó a Rino: ${tarea.envio_detalle ?? 'sin detalle'}` });
    } catch (err) {
      setAviso({ tipo: 'error', texto: mensajeError(err, 'No se pudo crear la tarea') });
    }
    setEnviando(false);
  };

  const accionTarea = async (t: TareaRino, accion: 'reenviar' | 'cancelar') => {
    if (accion === 'cancelar' && !window.confirm(`¿Cancelar "${t.titulo}" en Rino?`)) return;
    setOcupada(t.id);
    setAviso(null);
    try {
      const r: TareaRino = await fetchAPI(`/api/rino/tareas/${t.id}/${accion}`, { method: 'POST' });
      await cargarListas();
      if (r.envio_estado !== 'enviada') {
        setAviso({ tipo: 'error', texto: `No llegó a Rino: ${r.envio_detalle ?? 'sin detalle'}` });
      }
    } catch (err) {
      setAviso({ tipo: 'error', texto: mensajeError(err, 'No se pudo completar la acción') });
    }
    setOcupada(null);
  };

  const verEvidencia = async (t: TareaRino) => {
    setOcupada(t.id);
    try {
      const { comprobantes } = await fetchAPI(`/api/rino/tareas/${t.id}/comprobantes`);
      setEvidencias((prev) => ({ ...prev, [t.id]: comprobantes }));
    } catch (err) {
      setAviso({ tipo: 'error', texto: mensajeError(err, 'No se pudieron consultar las fotos') });
    }
    setOcupada(null);
  };

  if (cargando) {
    return (
      <div className="px-4 mt-4 max-w-lg mx-auto">
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="ml-3 text-sm text-gray-400">Cargando Rino...</span>
        </div>
      </div>
    );
  }

  const infoPuente = estadoPuente(puente);
  const abiertos = tickets.filter((t) => t.estado === 'abierto').length;
  const ticketsVisibles = soloAbiertos ? tickets.filter((t) => t.estado === 'abierto') : tickets;

  return (
    <div className="px-4 mt-4 max-w-lg mx-auto space-y-3 pb-24">
      {/* Estado del puente */}
      <div className={CARD}>
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-bold text-sm flex items-center gap-1.5">
              <Wrench className="w-4 h-4 text-primary/60" /> Mantenimiento · Rino Living
            </h3>
            <span className={`inline-block mt-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${infoPuente.clase}`}>
              {infoPuente.texto}
            </span>
          </div>
          <button
            onClick={sincronizar}
            disabled={sincronizando}
            className="flex items-center gap-1 text-xs font-semibold text-primary border border-primary/20 rounded-lg px-2.5 py-1.5 disabled:opacity-50 active:scale-95 transition-transform"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${sincronizando ? 'animate-spin' : ''}`} /> Sincronizar
          </button>
        </div>
        {infoPuente.detalle && <p className="text-xs text-gray-500 mt-2">{infoPuente.detalle}</p>}
      </div>

      {aviso && (
        <div className={`rounded-xl p-3 text-sm flex items-start gap-2 border ${aviso.tipo === 'ok' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
          {aviso.tipo === 'ok'
            ? <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
            : <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />}
          <span className="flex-1 break-words">{aviso.texto}</span>
          <button onClick={() => setAviso(null)} aria-label="Cerrar aviso">
            <XCircle className="w-4 h-4 opacity-60" />
          </button>
        </div>
      )}

      {/* Reportes de clientes */}
      <div className={CARD}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-sm flex items-center gap-1.5">
            <Inbox className="w-4 h-4 text-primary/60" /> Reportes de clientes
            {abiertos > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-bold rounded-full px-1.5">{abiertos}</span>
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

        {ticketsVisibles.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-4">
            {soloAbiertos ? 'No hay reportes abiertos' : 'Aún no hay reportes'}
          </p>
        ) : (
          <div className="space-y-2">
            {ticketsVisibles.map((t) => (
              <div key={t.id} className="border border-gray-100 rounded-lg p-3 bg-white">
                <div className="flex items-center justify-between text-[11px] text-gray-400">
                  <span>#{t.id} · {t.categoria ?? 'Sin área'}</span>
                  <span>{formatFecha(t.creado_en)}</span>
                </div>
                <p className="text-sm mt-1 whitespace-pre-line break-words">{t.descripcion}</p>
                {t.contacto && <p className="text-xs text-gray-500 mt-1">👤 {t.contacto}</p>}
                <div className="flex items-center gap-2 mt-2">
                  {t.estado === 'abierto' ? (
                    <>
                      <button
                        onClick={() => mandarTicket(t)}
                        className="flex-1 text-xs font-semibold bg-primary text-white rounded-lg py-1.5 active:scale-95 transition-transform"
                      >
                        Mandar a mantenimiento
                      </button>
                      <button
                        onClick={() => cambiarTicket(t, 'descartado')}
                        disabled={ocupada === `ticket-${t.id}`}
                        className="text-xs text-gray-500 border border-gray-200 rounded-lg px-2.5 py-1.5 disabled:opacity-50"
                      >
                        Descartar
                      </button>
                    </>
                  ) : (
                    <>
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${ETIQUETA_TICKET[t.estado].clase}`}>
                        {ETIQUETA_TICKET[t.estado].texto}
                      </span>
                      {t.estado === 'descartado' && (
                        <button
                          onClick={() => cambiarTicket(t, 'abierto')}
                          disabled={ocupada === `ticket-${t.id}`}
                          className="text-xs text-primary font-semibold disabled:opacity-50"
                        >
                          Reabrir
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Nueva tarea */}
      <div ref={formRef} className={CARD}>
        <h3 className="font-bold text-sm mb-3 flex items-center gap-1.5">
          <Send className="w-4 h-4 text-primary/60" /> Nueva tarea para mantenimiento
        </h3>

        {form.ticket_id && (
          <div className="flex items-center justify-between text-xs bg-blue-50 text-blue-700 rounded-lg px-3 py-2 mb-3">
            <span className="flex items-center gap-1">
              <Link2 className="w-3.5 h-3.5" /> Ligada al reporte #{form.ticket_id}
            </span>
            <button type="button" onClick={() => setForm({ ...form, ticket_id: null })} className="font-semibold">
              Quitar
            </button>
          </div>
        )}

        <form onSubmit={crearTarea} className="space-y-2.5">
          <input
            className={INPUT}
            placeholder="¿Qué hay que hacer? *"
            maxLength={200}
            value={form.titulo}
            onChange={(e) => setForm({ ...form, titulo: e.target.value })}
            required
          />
          <textarea
            className={`${INPUT} resize-none`}
            rows={3}
            placeholder="Detalles (opcional)"
            maxLength={4000}
            value={form.descripcion}
            onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-2">
            <select className={INPUT} value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })}>
              <option value="">Área (opcional)</option>
              {AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
            <div className="flex bg-gray-100 rounded-lg p-0.5 text-xs">
              {(['estrella', 'fuego'] as const).map((p) => (
                <button
                  type="button"
                  key={p}
                  onClick={() => setForm({ ...form, prioridad: p })}
                  className={`flex-1 rounded-md flex items-center justify-center gap-1 ${
                    form.prioridad === p
                      ? p === 'fuego' ? 'bg-red-500 text-white font-semibold' : 'bg-white shadow-sm font-semibold'
                      : 'text-gray-500'
                  }`}
                >
                  {p === 'fuego' && <Flame className="w-3.5 h-3.5" />}
                  {p === 'fuego' ? 'Urgente' : 'Normal'}
                </button>
              ))}
            </div>
          </div>
          <select
            className={INPUT}
            value={form.responsable_email}
            onChange={(e) => setForm({ ...form, responsable_email: e.target.value })}
          >
            <option value="">Sin responsable (lo asigna Dirección de Rino)</option>
            {usuarios.map((u) => (
              <option key={u.email} value={u.email}>
                {u.nombre}{u.puesto ? ` · ${u.puesto}` : ''}
              </option>
            ))}
          </select>
          <label className="block">
            <span className="text-[11px] text-gray-400">Fecha límite (opcional)</span>
            <input
              type="datetime-local"
              className={INPUT}
              value={form.fecha_limite}
              onChange={(e) => setForm({ ...form, fecha_limite: e.target.value })}
            />
          </label>
          <button
            type="submit"
            disabled={enviando || !form.titulo.trim()}
            className="w-full bg-primary text-white font-semibold py-2.5 rounded-lg text-sm disabled:bg-gray-300 active:scale-[0.98] transition-transform flex items-center justify-center gap-1.5"
          >
            {enviando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {enviando ? 'Enviando…' : 'Mandar a Rino'}
          </button>
        </form>
      </div>

      {/* Tareas enviadas */}
      <div className={CARD}>
        <h3 className="font-bold text-sm mb-3 flex items-center gap-1.5">
          <Wrench className="w-4 h-4 text-primary/60" /> Tareas enviadas
        </h3>

        {tareas.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-4">Aún no se ha mandado ninguna tarea</p>
        ) : (
          <div className="space-y-2">
            {tareas.map((t) => {
              const estado = estadoTarea(t);
              const quien = t.responsable_rino ?? t.responsable_nombre ?? t.responsable_email;
              const cerrada = t.cancelada || t.estado_rino === 'completed' || t.estado_rino === 'cancelled';
              const sinLlegar = t.envio_estado !== 'enviada';
              const fotos = evidencias[t.id];
              return (
                <div key={t.id} className="border border-gray-100 rounded-lg p-3 bg-white">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold flex items-start gap-1 min-w-0 break-words">
                      {t.prioridad === 'fuego' && <Flame className="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5" />}
                      {t.titulo}
                    </p>
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${estado.clase}`}>
                      {estado.texto}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    👷 {quien ?? 'Sin responsable'} · {formatFecha(t.creado_en)}{t.area ? ` · ${t.area}` : ''}
                  </p>
                  {t.completada_en && (
                    <p className="text-xs text-green-600 mt-0.5">Terminada {formatFecha(t.completada_en)}</p>
                  )}
                  {(t.envio_estado === 'error' || t.envio_estado === 'rechazada') && t.envio_detalle && (
                    <p className="text-[11px] text-red-600 mt-1 break-words">{t.envio_detalle}</p>
                  )}
                  {fotos && (fotos.length > 0 ? (
                    <div className="flex flex-wrap gap-3 mt-2">
                      {fotos.map((url, i) => (
                        <a key={url} href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary underline flex items-center gap-1">
                          <ImageIcon className="w-3.5 h-3.5" /> Foto {i + 1}
                        </a>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-gray-400 mt-1">Rino no tiene fotos de esta tarea</p>
                  ))}
                  <div className="flex gap-3 mt-2">
                    {sinLlegar && (
                      <button
                        onClick={() => accionTarea(t, 'reenviar')}
                        disabled={ocupada === t.id}
                        className="text-xs font-semibold text-primary flex items-center gap-1 disabled:opacity-50"
                      >
                        <RotateCcw className="w-3.5 h-3.5" /> Reintentar
                      </button>
                    )}
                    {t.estado_rino === 'completed' && (
                      <button
                        onClick={() => verEvidencia(t)}
                        disabled={ocupada === t.id}
                        className="text-xs font-semibold text-primary flex items-center gap-1 disabled:opacity-50"
                      >
                        <ImageIcon className="w-3.5 h-3.5" /> Ver evidencia
                      </button>
                    )}
                    {!cerrada && (
                      <button
                        onClick={() => accionTarea(t, 'cancelar')}
                        disabled={ocupada === t.id}
                        className="text-xs text-red-600 disabled:opacity-50"
                      >
                        Cancelar
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Buzón de pendientes */}
      <BuzonRino urlEventos={puente?.url_eventos ?? null} conectado={Boolean(puente?.sonda?.ok)} />
    </div>
  );
}
