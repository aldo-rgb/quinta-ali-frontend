'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

export default function RastreadorRef() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref && ref.trim()) {
      localStorage.setItem('promotor_quinta', ref.trim().substring(0, 50));
    }
  }, [searchParams]);

  return null;
}
