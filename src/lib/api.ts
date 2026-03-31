const API_URL = process.env.NEXT_PUBLIC_API_URL || (
  typeof window !== 'undefined' && window.location.hostname !== 'localhost'
    ? 'https://web-production-bdf66.up.railway.app'
    : 'http://localhost:3001'
);

// Endpoints que deben usar proxy local en producción
const PROXY_ENDPOINTS = ['/api/galeria', '/api/google-reviews'];

export async function fetchAPI(endpoint: string, options?: RequestInit) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };

  if (typeof window !== 'undefined') {
    const token = sessionStorage.getItem('admin_token');
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  // Merge headers from options if present
  if (options?.headers) {
    Object.assign(headers, options.headers);
  }

  // Si es un endpoint que necesita proxy, usa la ruta local
  const useProxy = typeof window !== 'undefined' && 
                   window.location.hostname !== 'localhost' &&
                   PROXY_ENDPOINTS.some(ep => endpoint.startsWith(ep));

  const url = useProxy ? endpoint : `${API_URL}${endpoint}`;

  const res = await fetch(url, {
    ...options,
    headers,
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Error del servidor' }));
    throw new Error(error.message || 'Error del servidor');
  }
  return res.json();
}
