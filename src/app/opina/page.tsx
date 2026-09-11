'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { fetchAPI } from '@/lib/api';

// A esta página llega el QR de La Quinta: reseña, queja o reportar algo que no funciona.

type Vista = 'inicio' | 'resena' | 'queja' | 'gracias';

const AREAS = [
  'Atención del personal',
  'Limpieza',
  'Alberca / Palapa',
  'Baños',
  'Habitaciones',
  'Jardín / Asador',
  'Cocina',
  'Entrada',
  'Otro',
];

const INPUT =
  'w-full p-3 border-2 border-gray-600 rounded-xl bg-gray-700 text-white focus:outline-none focus:border-green-500 transition';
const LABEL = 'block text-sm font-bold text-gray-300 mb-2';

export default function Opina() {
  const [vista, setVista] = useState<Vista>('inicio');
  const [estrellas, setEstrellas] = useState(0);
  const [comentario, setComentario] = useState('');
  const [nombre, setNombre] = useState('');
  const [contacto, setContacto] = useState('');
  const [area, setArea] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const [gracias, setGracias] = useState({ emoji: '', titulo: '', texto: '' });

  const irA = (v: Vista) => {
    setError('');
    setVista(v);
  };

  const enviarResena = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!estrellas) {
      setError('Elige de 1 a 5 estrellas');
      return;
    }
    setEnviando(true);
    setError('');
    try {
      await fetchAPI('/api/opiniones/resena', {
        method: 'POST',
        body: JSON.stringify({ calificacion: estrellas, comentario, nombre, contacto }),
      });
      setGracias(estrellas >= 4
        ? { emoji: '💚', titulo: '¡Gracias por tu reseña!', texto: 'Nos alegra muchísimo. La publicaremos en nuestra página después de revisarla.' }
        : {
            emoji: '🙏',
            titulo: 'Gracias por decírnoslo',
            texto: `Lamentamos que no haya sido perfecto. Ya avisamos al equipo para atenderlo${contacto ? ' y te buscaremos para resolverlo' : ''}.`,
          });
      irA('gracias');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al conectar con el servidor');
    } finally {
      setEnviando(false);
    }
  };

  const enviarQueja = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setEnviando(true);
    setError('');
    try {
      await fetchAPI('/api/opiniones/queja', {
        method: 'POST',
        body: JSON.stringify({ area, descripcion, contacto }),
      });
      setGracias({
        emoji: '📬',
        titulo: 'Recibimos tu queja',
        texto: `La va a revisar el equipo de La Quinta de Alí${contacto ? ' y te contactaremos' : ''}. Gracias por ayudarnos a mejorar.`,
      });
      irA('gracias');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al conectar con el servidor');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6 flex flex-col justify-center items-center">
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-8 rounded-2xl shadow-2xl max-w-md w-full border border-gray-700">
        {vista === 'inicio' && (
          <>
            <div className="mb-6">
              <Image
                src="/logo.png"
                alt="La Quinta de Alí"
                width={200}
                height={96}
                priority
                className="h-24 w-auto mx-auto mb-6 drop-shadow-2xl"
              />
              <h2 className="text-3xl font-bold text-white mb-2">¿Cómo te fue?</h2>
              <p className="text-gray-400">Tu opinión le llega directo al equipo de La Quinta de Alí.</p>
            </div>
            <div className="space-y-3">
              <button
                onClick={() => irA('resena')}
                className="w-full text-left p-4 rounded-xl bg-green-600 hover:bg-green-700 text-white transition active:scale-95"
              >
                <span className="text-2xl mr-2">⭐</span>
                <span className="font-bold text-lg">Dejar una reseña</span>
                <span className="block text-sm text-green-100 mt-1">Califica tu experiencia</span>
              </button>
              <button
                onClick={() => irA('queja')}
                className="w-full text-left p-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white transition active:scale-95"
              >
                <span className="text-2xl mr-2">😟</span>
                <span className="font-bold text-lg">Poner una queja</span>
                <span className="block text-sm text-amber-100 mt-1">Algo no estuvo bien con el servicio</span>
              </button>
              <Link
                href="/reporte"
                className="block w-full text-left p-4 rounded-xl bg-red-600 hover:bg-red-700 text-white transition active:scale-95"
              >
                <span className="text-2xl mr-2">🛠️</span>
                <span className="font-bold text-lg">Algo no funciona</span>
                <span className="block text-sm text-red-100 mt-1">Luz, agua, alberca, baños…</span>
              </Link>
            </div>
          </>
        )}

        {vista === 'resena' && (
          <form onSubmit={enviarResena} className="space-y-5">
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">⭐ Tu reseña</h2>
              <p className="text-gray-400">¿Qué calificación le das a tu experiencia?</p>
            </div>

            <div className="flex justify-between" role="radiogroup" aria-label="Calificación">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  role="radio"
                  aria-checked={estrellas === n}
                  aria-label={`${n} ${n === 1 ? 'estrella' : 'estrellas'}`}
                  onClick={() => setEstrellas(n)}
                  className={`text-5xl transition transform active:scale-90 ${n <= estrellas ? 'opacity-100' : 'opacity-30 grayscale'}`}
                >
                  ⭐
                </button>
              ))}
            </div>

            <div>
              <label className={LABEL}>Cuéntanos más <span className="font-normal text-gray-500">(opcional)</span></label>
              <textarea
                className={`${INPUT} resize-none`}
                rows={4}
                maxLength={2000}
                placeholder="¿Qué te gustó? ¿Qué podemos mejorar?"
                value={comentario}
                onChange={(e) => setComentario(e.target.value)}
              />
            </div>

            <div>
              <label className={LABEL}>Tu nombre <span className="font-normal text-gray-500">(opcional, se muestra con la reseña)</span></label>
              <input className={INPUT} maxLength={80} value={nombre} onChange={(e) => setNombre(e.target.value)} />
            </div>

            {estrellas > 0 && estrellas <= 3 && (
              <div>
                <label className={LABEL}>Teléfono o correo <span className="font-normal text-gray-500">(opcional, para contactarte)</span></label>
                <input className={INPUT} maxLength={160} value={contacto} onChange={(e) => setContacto(e.target.value)} />
              </div>
            )}

            {error && <p className="text-red-300 text-sm">{error}</p>}

            <button
              type="submit"
              disabled={enviando}
              className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-bold py-4 rounded-xl transition active:scale-95 text-lg"
            >
              {enviando ? 'Enviando…' : 'Enviar reseña'}
            </button>
            <button type="button" onClick={() => irA('inicio')} className="w-full text-sm text-gray-400 hover:text-gray-300">
              ← Regresar
            </button>
          </form>
        )}

        {vista === 'queja' && (
          <form onSubmit={enviarQueja} className="space-y-5">
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">😟 Tu queja</h2>
              <p className="text-gray-400">Lamentamos que algo no haya estado bien. Cuéntanos para resolverlo.</p>
            </div>

            <div>
              <label className={LABEL}>¿Sobre qué es? <span className="font-normal text-gray-500">(opcional)</span></label>
              <select className={INPUT} value={area} onChange={(e) => setArea(e.target.value)}>
                <option value="">Selecciona una opción...</option>
                {AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>

            <div>
              <label className={LABEL}>¿Qué pasó? *</label>
              <textarea
                className={`${INPUT} resize-none`}
                rows={5}
                maxLength={2000}
                required
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
              />
            </div>

            <div>
              <label className={LABEL}>Tu nombre y teléfono <span className="font-normal text-gray-500">(opcional, para contactarte)</span></label>
              <input className={INPUT} maxLength={160} value={contacto} onChange={(e) => setContacto(e.target.value)} />
            </div>

            {error && <p className="text-red-300 text-sm">{error}</p>}

            <button
              type="submit"
              disabled={enviando}
              className="w-full bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold py-4 rounded-xl transition active:scale-95 text-lg"
            >
              {enviando ? 'Enviando…' : 'Enviar queja'}
            </button>
            <button type="button" onClick={() => irA('inicio')} className="w-full text-sm text-gray-400 hover:text-gray-300">
              ← Regresar
            </button>
          </form>
        )}

        {vista === 'gracias' && (
          <div className="text-center">
            <div className="mb-6 text-7xl">{gracias.emoji}</div>
            <h2 className="text-3xl font-bold text-white mb-4">{gracias.titulo}</h2>
            <p className="text-gray-300 mb-8">{gracias.texto}</p>
            <Link href="/" className="inline-block bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-xl transition">
              Ir al inicio
            </Link>
          </div>
        )}
      </div>

      <div className="mt-12 text-center text-gray-600 text-xs">
        <p>🦏 La Quinta de Alí</p>
      </div>
    </div>
  );
}
