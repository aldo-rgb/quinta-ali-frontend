'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useI18n } from '@/lib/i18n';

export default function Header() {
  const { locale, setLocale } = useI18n();

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg shadow-[0_1px_8px_rgba(0,0,0,0.06)] border-b border-primary-light/30">
      <div className="flex items-center justify-between h-14 px-4 max-w-lg mx-auto">
        <div className="w-16" />
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.png" alt="La Quinta de Alí" width={120} height={40} className="h-10 w-auto" />
        </Link>
        <button
          onClick={() => setLocale(locale === 'es' ? 'en' : 'es')}
          className="w-16 flex items-center justify-end gap-1 text-gray-400 hover:text-primary text-xs font-medium transition-colors"
        >
          <span className="text-sm">🌐</span>
          <span>{locale === 'es' ? 'EN' : 'ES'}</span>
        </button>
      </div>
    </header>
  );
}
