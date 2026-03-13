'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function RastreadorRef() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref && ref.trim()) {
      const codigo = ref.trim().substring(0, 50);
      localStorage.setItem('promotor_quinta', codigo);

      // Registrar click en el backend
      fetch(`${API_URL}/api/promotores/click`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codigo_ref: codigo }),
      }).catch(() => {});
    }
  }, [searchParams]);

  return null;
}
