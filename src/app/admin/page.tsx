'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const res = await fetch(`${API_URL}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Credenciales incorrectas');
        return;
      }

      sessionStorage.setItem('admin_token', data.token);
      router.push('/admin/dashboard');
    } catch {
      setError('Error de conexión con el servidor');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-section-green via-background to-section-cream flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Image
            src="/logo.png"
            alt="La Quinta de Alí"
            width={140}
            height={56}
            className="h-14 w-auto object-contain mx-auto mb-4"
            priority
          />
          <h1 className="text-foreground text-2xl font-extrabold">Conserje Digital</h1>
          <p className="text-foreground/50 text-sm mt-1">Panel de Administración</p>
        </div>

        <form onSubmit={handleLogin} className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-[0_4px_24px_rgba(0,0,0,0.06)] border border-primary-light/20 space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl text-center font-medium">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@quintadeali.com"
              className="w-full p-3 rounded-xl border border-gray-200 text-base"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full p-3 rounded-xl border border-gray-200 text-base"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white font-bold py-3.5 rounded-full active:scale-95 transition-transform disabled:bg-gray-300"
          >
            {loading ? 'Entrando...' : 'Iniciar sesión'}
          </button>
        </form>
      </div>
    </div>
  );
}
