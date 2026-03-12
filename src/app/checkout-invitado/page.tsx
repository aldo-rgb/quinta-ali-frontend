'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { useI18n } from '@/lib/i18n';

export default function CheckoutInvitado() {
  const router = useRouter();
  const { t } = useI18n();
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');

  function continuar() {
    const params = new URLSearchParams({
      nombre,
      email,
      telefono,
      invitado: '1',
    });
    router.push(`/reservar?${params.toString()}`);
  }

  const valido = nombre.trim().length >= 2 && email.includes('@');

  return (
    <div className="min-h-screen bg-gradient-to-b from-section-cream/50 via-background to-background">
      <Header />

      <div className="flex flex-col items-center px-4 pt-10 pb-10">
        <div className="w-full max-w-md bg-white/80 backdrop-blur-lg rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.06)] border border-primary-light/20 p-8">
        <div className="flex flex-col items-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center shadow-md">
            <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" /></svg>
          </div>
          <h1 className="text-xl font-semibold text-center mt-4 text-foreground">{t('checkout.titulo')}</h1>
          <p className="text-gray-500 text-sm text-center mt-1.5">
            {t('checkout.subtitulo')}
          </p>
        </div>

        <div className="w-full space-y-4 mt-7">
          <div>
            <label className="block text-sm font-semibold mb-1">{t('checkout.nombre')} *</label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder={t('checkout.placeholder_nombre')}
              className="w-full p-3 rounded-xl border border-gray-200 text-base"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1">{t('checkout.email')} *</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('checkout.placeholder_email')}
              className="w-full p-3 rounded-xl border border-gray-200 text-base"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1">{t('checkout.telefono')}</label>
            <input
              type="tel"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              placeholder={t('checkout.placeholder_telefono')}
              className="w-full p-3 rounded-xl border border-gray-200 text-base"
            />
          </div>
        </div>

        <button
          onClick={continuar}
          disabled={!valido}
          className="w-full bg-primary text-white font-bold py-4 rounded-full text-base mt-7 active:scale-[0.98] transition-all disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {t('checkout.btn_continuar')}
        </button>

        <button
          onClick={() => router.push('/ingreso')}
          className="text-sm text-gray-500 mt-4 underline w-full text-center"
        >
          {t('checkout.btn_volver')}
        </button>
        </div>
      </div>
    </div>
  );
}
