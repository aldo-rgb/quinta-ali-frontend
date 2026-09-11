'use client';

import { useEffect, useState } from 'react';
import { fetchAPI } from '@/lib/api';
import { Star, MessageSquareWarning, Eye, EyeOff } from 'lucide-react';
import { CARD, formatFecha, mensajeError } from '@/components/rinoUi';

// Reseñas locales y quejas que llegan por el QR (/opina).

interface ResenaLocal {
  id: number;
  calificacion: number;
  comentario: string | null;
  nombre: string | null;
  contacto: string | null;
  publicada: boolean;
  ticket_id: number | null;
  queja_estado: string | null;
  creado_en: string;
  revisada_en: string | null;
}

type EstadoQueja = 'abierto' | 'enviado_rino' | 'resuelto' | 'descartado';

interface Queja {
  id: number;
  origen: string;
  categoria: string | null;
  descripcion: string;
  contacto: string | null;
  estado: EstadoQueja;
  creado_en: string;
}

const ETIQUETA_QUEJA: Record<EstadoQueja, { texto: string; clase: string }> = {
  abierto: { texto: 'Abierta', clase: 'bg-amber-100 text-amber-700' },
  enviado_rino: { texto: 'En Rino', clase: 'bg-blue-100 text-blue-700' },
  resuelto: { texto: 'Resuelta', clase: 'bg-green-100 text-green-700' },
  descartado: { texto: 'Descartada', clase: 'bg-gray-200 text-gray-600' },
};

function Estrellas({ n }: { n: number }) {
  const color = n >= 4 ? 'text-green-600' : n === 3 ? 'text-yellow-600' : 'text-red-600';
  return (
    <span className={`flex gap-0.5 ${color}`} aria-label={`${n} de 5 estrellas`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={`w-4 h-4 ${i < n ? 'fill-current' : 'opacity-25'}`} />
      ))}
    </span>
  );
}

export default function OpinionesAdmin() {
  const [resenas, setResenas] = useState<ResenaLocal[]>([]);
  const [quejas, setQuejas] = useState<Queja[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [ocupado, setOcupado] = useState<string | null>(null);

  useEffect(() => {
    let vigente = true;
    Promise.all([fetchAPI('/api/opiniones'), fetchAPI('/api/rino/tickets')])
      .then(([r, t]) => {
        if (!vigente) return;
        setResenas(r);
        setQuejas((t as Queja[]).filter((x) => x.origen === 'queja' || x.origen === 'resena'));
      })
      .catch((err) => { if (vigente) setError(mensajeError(err, 'No se pudieron cargar las opiniones')); })
      .finally(() => { if (vigente) setCargando(false); });
    return () => { vigente = false; };
  }, []);

  const publicar = async (r: ResenaLocal) => {
    setOcupado(`r${r.id}`);
    setError('');
    try {
      const act: ResenaLocal = await fetchAPI(`/api/opiniones/${r.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ publicada: !r.publicada }),
      });
      setResenas((prev) => prev.map((x) => (x.id === r.id ? { ...x, publicada: act.publicada, revisada_en: act.revisada_en } : x)));
    } catch (err) {
      setError(mensajeError(err, 'No se pudo actualizar la reseña'));
    }
    setOcupado(null);
  };

  const cambiarQueja = async (q: Queja, estado: EstadoQueja) => {
    setOcupado(`q${q.id}`);
    setError('');
    try {
      const act: Queja = await fetchAPI(`/api/rino/tickets/${q.id}`, { method: 'PATCH', body: JSON.stringify({ estado }) });
      setQuejas((prev) => prev.map((x) => (x.id === q.id ? { ...x, estado: act.estado } : x)));
      setResenas((prev) => prev.map((x) => (x.ticket_id === q.id ? { ...x, queja_estado: act.estado } : x)));
    } catch (err) {
      setError(mensajeError(err, 'No se pudo actualizar la queja'));
    }
    setOcupado(null);
  };

  if (cargando) {
    return <div className={`${CARD} text-sm text-gray-400 text-center`}>Cargando opiniones...</div>;
  }

  const promedio = resenas.length
    ? (resenas.reduce((s, r) => s + r.calificacion, 0) / resenas.length).toFixed(1)
    : null;
  const publicadas = resenas.filter((r) => r.publicada).length;
  const nuevas = resenas.filter((r) => !r.revisada_en).length;
  const abiertas = quejas.filter((q) => q.estado === 'abierto').length;

  return (
    <>
      {error && <div className="rounded-xl p-3 text-sm bg-red-50 text-red-700 border border-red-200">{error}</div>}

      {/* Reseñas locales */}
      <div className={CARD}>
        <h3 className="font-bold mb-1 flex items-center gap-2">
          <Star className="w-5 h-5 text-primary/60" /> Reseñas del QR ({resenas.length})
          {nuevas > 0 && <span className="bg-primary text-white text-[10px] font-bold rounded-full px-1.5">{nuevas} nuevas</span>}
        </h3>
        <p className="text-xs text-gray-400 mb-3">
          {promedio ? `Promedio ${promedio} ★ · ${publicadas} publicadas en la web. ` : ''}
          Solo se muestran en la web las que publiques.
        </p>
        {resenas.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">Todavía no hay reseñas. Imprime el QR en Config → QR de opiniones.</p>
        ) : (
          <div className="space-y-2">
            {resenas.map((r) => (
              <div key={r.id} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between gap-2">
                  <Estrellas n={r.calificacion} />
                  <span className="text-[11px] text-gray-400">{formatFecha(r.creado_en)}</span>
                </div>
                {r.comentario && <p className="text-sm mt-1.5 whitespace-pre-line break-words">{r.comentario}</p>}
                <p className="text-xs text-gray-500 mt-1">
                  {r.nombre || 'Sin nombre'}{r.contacto ? ` · ${r.contacto}` : ''}
                </p>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  {r.publicada
                    ? <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">Publicada</span>
                    : <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-gray-200 text-gray-600">{r.revisada_en ? 'Oculta' : 'Por revisar'}</span>}
                  {r.ticket_id && r.queja_estado && (
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${ETIQUETA_QUEJA[r.queja_estado as EstadoQueja]?.clase ?? 'bg-gray-200 text-gray-600'}`}>
                      Queja {ETIQUETA_QUEJA[r.queja_estado as EstadoQueja]?.texto.toLowerCase() ?? r.queja_estado}
                    </span>
                  )}
                  <button
                    onClick={() => publicar(r)}
                    disabled={ocupado === `r${r.id}`}
                    className="ml-auto text-xs font-semibold text-primary flex items-center gap-1 disabled:opacity-50"
                  >
                    {r.publicada ? <><EyeOff className="w-3.5 h-3.5" /> Ocultar</> : <><Eye className="w-3.5 h-3.5" /> Publicar</>}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quejas */}
      <div className={CARD}>
        <h3 className="font-bold mb-3 flex items-center gap-2">
          <MessageSquareWarning className="w-5 h-5 text-primary/60" /> Quejas ({quejas.length})
          {abiertas > 0 && <span className="bg-red-500 text-white text-[10px] font-bold rounded-full px-1.5">{abiertas} abiertas</span>}
        </h3>
        {quejas.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">Sin quejas</p>
        ) : (
          <div className="space-y-2">
            {quejas.map((q) => (
              <div key={q.id} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between gap-2 text-[11px] text-gray-400">
                  <span>#{q.id} · {q.origen === 'resena' ? 'Reseña baja' : 'Queja'}{q.categoria ? ` · ${q.categoria}` : ''}</span>
                  <span>{formatFecha(q.creado_en)}</span>
                </div>
                <p className="text-sm mt-1 whitespace-pre-line break-words">{q.descripcion}</p>
                {q.contacto && <p className="text-xs text-gray-500 mt-1">👤 {q.contacto}</p>}
                <div className="flex items-center gap-3 mt-2">
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${ETIQUETA_QUEJA[q.estado].clase}`}>
                    {ETIQUETA_QUEJA[q.estado].texto}
                  </span>
                  {q.estado === 'abierto' ? (
                    <>
                      <button onClick={() => cambiarQueja(q, 'resuelto')} disabled={ocupado === `q${q.id}`} className="text-xs font-semibold text-green-700 disabled:opacity-50">
                        Marcar resuelta
                      </button>
                      <button onClick={() => cambiarQueja(q, 'descartado')} disabled={ocupado === `q${q.id}`} className="text-xs text-gray-500 disabled:opacity-50">
                        Descartar
                      </button>
                    </>
                  ) : (
                    <button onClick={() => cambiarQueja(q, 'abierto')} disabled={ocupado === `q${q.id}`} className="text-xs font-semibold text-primary disabled:opacity-50">
                      Reabrir
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
