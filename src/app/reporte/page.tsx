'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function ReporteCliente() {
  const [area, setArea] = useState('');
  const [problema, setProblema] = useState('');
  const [enviado, setEnviado] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  // Enviar reporte a Rino
  const enviarReporte = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setCargando(true);
    setError('');

    try {
      // Llamar al endpoint API que se conecta a Rino
      const response = await fetch('/api/reporte', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ area, problema }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Error al enviar reporte');
        setCargando(false);
        return;
      }

      setEnviado(true);
      setCargando(false);
    } catch (err) {
      console.error('Error:', err);
      setError('Error al conectar con el servidor');
      setCargando(false);
    }
  };

  if (enviado) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="mb-6 text-7xl animate-bounce">✅</div>
          <h2 className="text-4xl font-bold mb-4">¡Reporte Recibido!</h2>
          <p className="text-gray-300 text-lg mb-8">
            Nuestro equipo de mantenimiento ya fue notificado y está revisando tu reporte.
          </p>
          <p className="text-sm text-gray-400 mb-8">
            Puedes cerrar esta ventana. Agradecemos tu ayuda para mantener La Quinta en perfectas condiciones.
          </p>

          <Link
            href="/"
            className="inline-block bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-xl transition"
          >
            ← Volver al Inicio
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6 flex flex-col justify-center items-center">
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-8 rounded-2xl shadow-2xl max-w-md w-full border border-gray-700">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-4xl mb-2">🆘</h1>
          <h2 className="text-3xl font-bold text-white mb-2">Ayuda y Soporte</h2>
          <p className="text-gray-400">
            ¿Algo no funciona bien en La Quinta? Repórtalo aquí y nuestro equipo se encargará.
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 p-3 bg-red-900/50 border border-red-600 rounded-lg">
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={enviarReporte} className="space-y-5">
          {/* Area */}
          <div>
            <label className="block text-sm font-bold text-gray-300 mb-2">
              ¿Dónde está el problema? *
            </label>
            <select
              className="w-full p-3 border-2 border-gray-600 rounded-xl bg-gray-700 text-white focus:outline-none focus:border-green-500 transition"
              value={area}
              onChange={(e) => setArea(e.target.value)}
              required
            >
              <option value="">Selecciona una opción...</option>
              <option value="Alberca / Palapa">Alberca / Palapa</option>
              <option value="Baños">Baños</option>
              <option value="Habitaciones">Habitaciones</option>
              <option value="Jardín / Asador">Jardín / Asador</option>
              <option value="Cocina">Cocina</option>
              <option value="Entrada">Entrada</option>
              <option value="Otras áreas">Otras áreas</option>
            </select>
          </div>

          {/* Problema */}
          <div>
            <label className="block text-sm font-bold text-gray-300 mb-2">
              Describe el problema *
            </label>
            <textarea
              className="w-full p-3 border-2 border-gray-600 rounded-xl bg-gray-700 text-white focus:outline-none focus:border-green-500 transition resize-none"
              rows={4}
              placeholder="Ej. No hay papel higiénico, la luz no enciende, falta toallas..."
              value={problema}
              onChange={(e) => setProblema(e.target.value)}
              required
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={cargando}
            className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2 text-lg"
          >
            <span>🚨</span>
            {cargando ? 'Enviando reporte...' : 'Enviar Reporte de Urgencia'}
          </button>

          {/* Info text */}
          <p className="text-xs text-center text-gray-500">
            Tu reporte llegará directamente al equipo de mantenimiento de La Quinta.
          </p>
        </form>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-gray-700">
          <Link
            href="/"
            className="text-sm text-gray-400 hover:text-gray-300 transition"
          >
            ← Volver al inicio
          </Link>
        </div>
      </div>

      {/* Watermark */}
      <div className="mt-12 text-center text-gray-600 text-xs">
        <p>🦏 La Quinta de Ali - Sistema de Reportes</p>
      </div>
    </div>
  );
}
