const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function fetchAPI(endpoint: string, options?: RequestInit) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };

  if (typeof window !== 'undefined') {
    const token = sessionStorage.getItem('admin_token');
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${endpoint}`, {
    headers,
    ...options,
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Error del servidor' }));
    throw new Error(error.message || 'Error del servidor');
  }
  return res.json();
}
