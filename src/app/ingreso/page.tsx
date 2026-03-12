'use client';

import { signIn } from 'next-auth/react';
import Header from '@/components/Header';
import LogoPremium from '@/components/LogoPremium';
import { useI18n } from '@/lib/i18n';

export default function PantallaIngreso() {
  const { t } = useI18n();

  return (
    <div className="min-h-screen bg-gradient-to-b from-section-green/50 via-background to-background">
      <Header />

      <div className="flex flex-col items-center px-4 pt-10 pb-10">
        {/* Card principal */}
        <div className="w-full max-w-md bg-white/80 backdrop-blur-lg rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.06)] border border-primary-light/20 p-8 space-y-7">
          {/* Logo */}
          <div className="flex flex-col items-center">
            <LogoPremium size="lg" showSlogan={true} className="h-24 w-auto" />
            <h1 className="text-xl font-semibold text-center mt-4 text-foreground">{t('login.titulo')}</h1>
            <p className="text-gray-500 text-sm text-center mt-1.5">
              {t('login.subtitulo')}
            </p>
          </div>

          {/* Botones de auth */}
          <div className="flex flex-col gap-3.5">
            {/* Botón de Google — principal */}
            <button
              onClick={() => signIn('google', { callbackUrl: '/reservar' })}
              className="flex items-center justify-center gap-3 bg-white border-2 border-gray-200 text-gray-700 py-3.5 px-4 rounded-xl font-semibold shadow-sm hover:border-gray-300 active:scale-[0.98] transition-all"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              {t('login.btn_google')}
            </button>

            {/* Separador */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-gray-400 text-xs">{t('login.separador')}</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            {/* Botón de Invitado — secundario con borde */}
            <button
              onClick={() => (window.location.href = '/checkout-invitado')}
              className="border-2 border-primary text-primary py-3.5 px-4 rounded-xl font-semibold active:scale-[0.98] transition-all hover:bg-primary/5"
            >
              {t('login.btn_invitado')}
            </button>
          </div>

          {/* Beneficios de Google */}
          <div className="border-t border-gray-100 pt-6 space-y-4">
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-widest">{t('login.beneficios_titulo')}</p>
            <div className="flex items-center gap-3.5">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <svg className="w-4.5 h-4.5 text-primary" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              </div>
              <span className="text-sm text-gray-600">{t('login.beneficio_1')}</span>
            </div>
            <div className="flex items-center gap-3.5">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <svg className="w-4.5 h-4.5 text-primary" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25Z" /></svg>
              </div>
              <span className="text-sm text-gray-600">{t('login.beneficio_2')}</span>
            </div>
            <div className="flex items-center gap-3.5">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <svg className="w-4.5 h-4.5 text-primary" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" /></svg>
              </div>
              <span className="text-sm text-gray-600">{t('login.beneficio_3')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
