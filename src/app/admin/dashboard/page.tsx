'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  ClipboardList, CalendarDays, Gift, Package, KeyRound, Star, DollarSign,
  BarChart3, Camera, Settings, Calendar, Clock, Smartphone, Pencil, Trash2,
  Check, Save, Eye, Send, Rocket, Upload, Sparkles, Lightbulb, Home, Palette,
  MessageSquare, PenTool, Flame, Moon, Timer, Users, Sun, AlertTriangle,
  Waves, BedDouble, Droplets, TreePine, Gamepad2, Target, ListChecks, Heart,
  CreditCard, Loader2, XCircle, CheckCircle2, History, ChevronDown, Phone, Mail, Building2,
  UserPlus, Trophy
} from 'lucide-react';
import { fetchAPI } from '@/lib/api';
import { useTheme } from '@/lib/theme';
import ReportesTab from '@/components/ReportesTab';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

function adminHeaders(extra?: Record<string, string>): Record<string, string> {
  const h: Record<string, string> = { ...extra };
  if (typeof window !== 'undefined') {
    const token = sessionStorage.getItem('admin_token');
    if (token) h['Authorization'] = `Bearer ${token}`;
  }
  return h;
}

interface Reservacion {
  id: number;
  cliente_nombre: string;
  cliente_apellido: string;
  cliente_telefono: string;
  cliente_email: string;
  paquete_nombre: string;
  fecha_evento: string;
  hora_inicio: string;
  hora_fin: string;
  num_invitados: number;
  estado: string;
  monto_total: number;
  monto_pagado: number;
  notas: string;
  promotor: string | null;
  checkin_at: string | null;
  checkout_at: string | null;
}

interface Foto {
  id: number;
  area: string;
  url_foto: string;
  descripcion: string | null;
}

interface Extra {
  id: number;
  nombre: string;
  descripcion: string;
  precio: string;
  emoji: string;
  activo: boolean;
}

interface PaqueteAdmin {
  id: number;
  slug: string;
  nombre: string;
  emoji: string;
  imagen_url?: string;
  descripcion: string;
  tipo_duracion: string;
  duracion_horas: number | null;
  precio: string;
  capacidad_max: number;
  caracteristicas: string[];
  activo: boolean;
}

interface CodigoAcceso {
  id: number;
  reservacion_id: number;
  codigo_pin: string;
  activo: boolean;
  valido_desde: string;
  valido_hasta: string;
  fecha_evento: string;
  hora_inicio: string;
  hora_fin: string;
  cliente_nombre: string;
  cliente_apellido: string;
  telefono: string;
  paquete_nombre: string;
}

interface Firma {
  id: number;
  reservacion_id: number;
  firma_url: string;
  firmado_en: string;
  cliente_nombre: string;
  cliente_apellido: string;
  fecha_evento: string;
  paquete_nombre: string;
}

interface Resena {
  id: number;
  reservacion_id: number;
  calificacion: number | null;
  mensaje_enviado: boolean;
  link_enviado: boolean;
  alerta_enviada: boolean;
  respondido_en: string | null;
  creado_en: string;
  cliente_nombre: string;
  cliente_apellido: string;
  telefono: string;
  fecha_evento: string;
  paquete_nombre: string;
}

interface Stats {
  total_reservaciones: number;
  reservaciones_hoy: number;
  pendientes: number;
  ingresos_mes: number;
  ingresos_extras_mes: number;
  top_extras: { nombre: string; emoji: string; veces: string; ingreso: string }[];
}

const AREAS = [
  { key: 'alberca', label: 'Alberca', emoji: '🏊' },
  { key: 'asador', label: 'Asador', emoji: '🔥' },
  { key: 'hospedaje', label: 'Hospedaje', emoji: '🛏️' },
  { key: 'cancha', label: 'Cancha', emoji: '⚽' },
  { key: 'jacuzzi', label: 'Jacuzzi', emoji: '🫧' },
  { key: 'palapa', label: 'Palapa', emoji: '🌴' },
  { key: 'juegos', label: 'Área de Juegos', emoji: '🎠' },
];

function AreaIcon({ area, className = 'w-5 h-5' }: { area: string; className?: string }) {
  const icons = { alberca: Waves, asador: Flame, hospedaje: BedDouble, cancha: Target, jacuzzi: Droplets, palapa: TreePine, juegos: Gamepad2 };
  const Icon = icons[area as keyof typeof icons];
  return Icon ? <Icon className={className} /> : null;
}

const AMENIDADES_PREDEFINIDAS = [
  { id: 'asador', texto: 'Zona de asador', emoji: '🔥' },
  { id: 'alberca', texto: 'Alberca', emoji: '🏊' },
  { id: 'bar', texto: 'Área de bar climatizada', emoji: '🍹' },
  { id: 'brincolines', texto: 'Área de brincolines', emoji: '🤸' },
  { id: 'cancha', texto: 'Cancha de futbol', emoji: '⚽' },
  { id: 'juegos', texto: 'Área de juegos para niños', emoji: '🎠' },
  { id: 'palapa', texto: 'Palapa con mesas y sillas para 100 personas', emoji: '🌴' },
  { id: 'casa', texto: 'Casa equipada con terraza, cocina y sala', emoji: '🏠' },
  { id: 'cuartos', texto: '2 cuartos amueblados', emoji: '🛏️' },
  { id: 'suite', texto: 'Suite con jacuzzi', emoji: '🛁' },
  { id: 'litera', texto: 'Litera', emoji: '🪜' },
];

const estadoColors: Record<string, string> = {
  pendiente: 'bg-yellow-100 text-yellow-700',
  confirmada: 'bg-blue-100 text-blue-700',
  pagada: 'bg-green-100 text-green-700',
  cancelada: 'bg-red-100 text-red-700',
  completada: 'bg-gray-100 text-gray-700',
};

export default function AdminDashboard() {
  const router = useRouter();
  const { colors, updateColors, saving } = useTheme();
  const [activeTab, setActiveTab] = useState<'reservaciones' | 'hoy' | 'galeria' | 'extras' | 'paquetes' | 'accesos' | 'resenas' | 'precios' | 'reportes' | 'config' | 'terminal' | 'corporativo' | 'promotores'>('reservaciones');
  const [reservaciones, setReservaciones] = useState<Reservacion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [stats, setStats] = useState<Stats | null>(null);
  const [resExpandida, setResExpandida] = useState<number | null>(null);

  // Galería state
  const [fotos, setFotos] = useState<Foto[]>([]);
  const [areaSeleccionada, setAreaSeleccionada] = useState('alberca');
  const [subiendo, setSubiendo] = useState(false);
  const [descripcionFoto, setDescripcionFoto] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Extras state
  const [extras, setExtras] = useState<Extra[]>([]);
  const [editandoExtra, setEditandoExtra] = useState<Extra | null>(null);
  const [nuevoExtra, setNuevoExtra] = useState({ nombre: '', descripcion: '', precio: '', emoji: '🎁' });

  // Terminal MP state
  const [terminalMonto, setTerminalMonto] = useState('');
  const [terminalDescripcion, setTerminalDescripcion] = useState('Hora Extra');
  const [terminalDescCustom, setTerminalDescCustom] = useState('');
  const [terminalEstado, setTerminalEstado] = useState<'listo' | 'enviando' | 'esperando' | 'pagado' | 'error'>('listo');
  const [terminalIntentId, setTerminalIntentId] = useState('');
  const [terminalError, setTerminalError] = useState('');
  const [terminalHistorial, setTerminalHistorial] = useState<Array<{id:number; monto:string; descripcion:string; estado:string; creado_en:string}>>([]);
  const terminalPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Paquetes state
  const [paquetesAdmin, setPaquetesAdmin] = useState<PaqueteAdmin[]>([]);
  const [editandoPaquete, setEditandoPaquete] = useState<PaqueteAdmin | null>(null);
  const [nuevoPaquete, setNuevoPaquete] = useState({ nombre: '', descripcion: '', precio: '', emoji: '🎉', tipo_duracion: 'horas', duracion_horas: '', capacidad_max: '50', caracteristicas: [''], imagen_url: '' });
  const [subiendoImgPaq, setSubiendoImgPaq] = useState(false);

  // Accesos state
  const [codigos, setCodigos] = useState<CodigoAcceso[]>([]);

  // Firmas & Reseñas state
  const [firmas, setFirmas] = useState<Firma[]>([]);
  const [resenas, setResenas] = useState<Resena[]>([]);

  // Notificaciones state
  const [notifPreview, setNotifPreview] = useState<{ recordatorio_3dias: unknown[]; recordatorio_1dia: unknown[]; pin_dia_evento: unknown[] } | null>(null);
  const [notifResultado, setNotifResultado] = useState<{ recordatorio3: number; recordatorio1: number; pinDia: number } | null>(null);
  const [enviandoNotif, setEnviandoNotif] = useState(false);

  // Hero texts state
  const [heroTexts, setHeroTexts] = useState({
    hero_badge: '',
    hero_titulo: '',
    hero_subtitulo: '',
    hero_cta: '',
    hero_whatsapp: '',
  });
  const [heroLoaded, setHeroLoaded] = useState(false);
  const [heroSaving, setHeroSaving] = useState(false);
  const [heroSaved, setHeroSaved] = useState(false);

  // Precios dinámicos state
  interface ReglaPrecio {
    id: number;
    nombre_regla: string;
    tipo_regla: string;
    condicion: string;
    modificador_porcentaje: string;
    activo: boolean;
  }
  const [reglasPrecios, setReglasPrecios] = useState<ReglaPrecio[]>([]);
  const [editandoRegla, setEditandoRegla] = useState<ReglaPrecio | null>(null);
  const [nuevaRegla, setNuevaRegla] = useState({ nombre_regla: '', tipo_regla: 'dia_semana', condicion: '', modificador_porcentaje: '' });
  const [creandoRegla, setCreandoRegla] = useState(false);

  // Corporativo state
  interface LeadCorporativo {
    id: number; folio: string; empresa: string; contacto: string; email: string;
    telefono: string | null; num_empleados: string | null; rfc: string | null;
    razon_social: string | null; fecha_evento: string | null; paquete_base: string | null;
    num_asistentes: number; subtotal: string; iva: string; total: string;
    estado: string; creado_en: string;
  }
  const [leadsCorp, setLeadsCorp] = useState<LeadCorporativo[]>([]);
  const [corpCargando, setCorpCargando] = useState(false);

  // Promotores state
  interface Promotor {
    id: number; nombre: string; email: string; codigo_ref: string;
    comision_porcentaje: string; activo: boolean; creado_en: string;
  }
  interface PromotorStats {
    ingresos_brutos: number; total_comisiones: number; ingresos_netos: number;
    leaderboard: { id: number; nombre: string; codigo_ref: string; comision_porcentaje: string; reservas: number; ventas: number; comision: number }[];
  }
  const [promotores, setPromotores] = useState<Promotor[]>([]);
  const [promotorStats, setPromotorStats] = useState<PromotorStats | null>(null);
  const [promCargando, setPromCargando] = useState(false);
  const [nuevoPromotor, setNuevoPromotor] = useState({ nombre: '', email: '', password: '', codigo_ref: '', comision_porcentaje: '10' });
  const [promCreando, setPromCreando] = useState(false);
  const [promError, setPromError] = useState('');

  const cargarHeroTexts = useCallback(async () => {
    try {
      const data = await fetchAPI('/api/config');
      setHeroTexts({
        hero_badge: data.hero_badge || '',
        hero_titulo: data.hero_titulo || '',
        hero_subtitulo: data.hero_subtitulo || '',
        hero_cta: data.hero_cta || '',
        hero_whatsapp: data.hero_whatsapp || '',
      });
      setHeroLoaded(true);
    } catch { setHeroLoaded(true); }
  }, []);

  const guardarHeroTexts = async () => {
    setHeroSaving(true);
    setHeroSaved(false);
    try {
      await fetchAPI('/api/config', {
        method: 'PUT',
        body: JSON.stringify(heroTexts),
      });
      setHeroSaved(true);
      setTimeout(() => setHeroSaved(false), 3000);
    } catch { /* ignore */ }
    setHeroSaving(false);
  };

  // ── Precios dinámicos functions ──
  async function cargarReglasPrecios() {
    try {
      const data = await fetchAPI('/api/precios/reglas');
      setReglasPrecios(data);
    } catch { setReglasPrecios([]); }
  }

  async function crearRegla() {
    try {
      await fetchAPI('/api/precios/reglas', {
        method: 'POST',
        body: JSON.stringify({
          ...nuevaRegla,
          modificador_porcentaje: Number(nuevaRegla.modificador_porcentaje),
        }),
      });
      setNuevaRegla({ nombre_regla: '', tipo_regla: 'dia_semana', condicion: '', modificador_porcentaje: '' });
      setCreandoRegla(false);
      cargarReglasPrecios();
    } catch { /* ignore */ }
  }

  async function toggleRegla(id: number, activo: boolean) {
    try {
      await fetchAPI(`/api/precios/reglas/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ activo: !activo }),
      });
      cargarReglasPrecios();
    } catch { /* ignore */ }
  }

  async function guardarRegla() {
    if (!editandoRegla) return;
    try {
      await fetchAPI(`/api/precios/reglas/${editandoRegla.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          nombre_regla: editandoRegla.nombre_regla,
          tipo_regla: editandoRegla.tipo_regla,
          condicion: editandoRegla.condicion,
          modificador_porcentaje: Number(editandoRegla.modificador_porcentaje),
        }),
      });
      setEditandoRegla(null);
      cargarReglasPrecios();
    } catch { /* ignore */ }
  }

  async function eliminarRegla(id: number) {
    try {
      await fetchAPI(`/api/precios/reglas/${id}`, { method: 'DELETE' });
      cargarReglasPrecios();
    } catch { /* ignore */ }
  }

  const cargarReservaciones = useCallback(async () => {
    try {
      const [data, statsData] = await Promise.all([
        fetchAPI('/api/reservaciones'),
        fetchAPI('/api/reservaciones/stats'),
      ]);
      setReservaciones(data);
      setStats(statsData);
    } catch {
      setReservaciones([]);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    const auth = sessionStorage.getItem('admin_token');
    if (!auth) { router.replace('/admin'); return; }
    cargarReservaciones();
  }, [router, cargarReservaciones]);

  async function cambiarEstado(id: number, estado: string) {
    try {
      await fetchAPI(`/api/reservaciones/${id}/estado`, {
        method: 'PATCH',
        body: JSON.stringify({ estado }),
      });
      cargarReservaciones();
    } catch (err) {
      console.error('Error actualizando estado:', err);
    }
  }

  async function registrarCheckin(id: number) {
    try {
      await fetchAPI(`/api/reservaciones/${id}/checkin`, { method: 'PATCH' });
      cargarReservaciones();
    } catch (err) {
      console.error('Error registrando check-in:', err);
    }
  }

  async function registrarCheckout(id: number) {
    if (!confirm('¿Registrar check-out? La reservación se marcará como completada.')) return;
    try {
      await fetchAPI(`/api/reservaciones/${id}/checkout`, { method: 'PATCH' });
      cargarReservaciones();
    } catch (err) {
      console.error('Error registrando check-out:', err);
    }
  }

  function handleLogout() {
    sessionStorage.removeItem('admin_token');
    router.replace('/admin');
  }

  // ─── Galería functions ───
  const cargarFotos = useCallback(async () => {
    try {
      const data = await fetchAPI('/api/galeria');
      setFotos(data);
    } catch {
      setFotos([]);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'galeria') cargarFotos();
    if (activeTab === 'config') cargarHeroTexts();
    if (activeTab === 'precios') cargarReglasPrecios();
  }, [activeTab, cargarFotos, cargarHeroTexts]);

  async function subirFoto(file: File) {
    setSubiendo(true);
    try {
      const formData = new FormData();
      formData.append('foto', file);
      formData.append('area', areaSeleccionada);
      if (descripcionFoto.trim()) formData.append('descripcion', descripcionFoto.trim());

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const res = await fetch(`${API_URL}/api/galeria/subir`, {
        method: 'POST',
        headers: adminHeaders(),
        body: formData,
      });
      if (!res.ok) throw new Error('Error al subir');
      setDescripcionFoto('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      cargarFotos();
    } catch (err) {
      console.error('Error subiendo foto:', err);
      alert('Error al subir la foto. Verifica la configuración de Cloudinary.');
    } finally {
      setSubiendo(false);
    }
  }

  async function eliminarFoto(id: number) {
    if (!confirm('¿Eliminar esta foto?')) return;
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      await fetch(`${API_URL}/api/galeria/${id}`, { method: 'DELETE', headers: adminHeaders() });
      cargarFotos();
    } catch (err) {
      console.error('Error eliminando foto:', err);
    }
  }

  const fotosDelArea = fotos.filter((f) => f.area === areaSeleccionada);

  // ─── Extras functions ───
  const cargarExtras = useCallback(async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const res = await fetch(`${API_URL}/api/extras`);
      setExtras(await res.json());
    } catch { setExtras([]); }
  }, []);

  useEffect(() => {
    if (activeTab === 'extras') cargarExtras();
  }, [activeTab, cargarExtras]);

  async function crearExtra() {
    if (!nuevoExtra.nombre || !nuevoExtra.precio) return;
    await fetchAPI('/api/extras', {
      method: 'POST',
      body: JSON.stringify(nuevoExtra),
    });
    setNuevoExtra({ nombre: '', descripcion: '', precio: '', emoji: '🎁' });
    cargarExtras();
  }

  async function toggleExtra(id: number, activo: boolean) {
    await fetchAPI(`/api/extras/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ activo: !activo }),
    });
    cargarExtras();
  }

  async function guardarExtra() {
    if (!editandoExtra) return;
    await fetchAPI(`/api/extras/${editandoExtra.id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        nombre: editandoExtra.nombre,
        descripcion: editandoExtra.descripcion,
        precio: editandoExtra.precio,
        emoji: editandoExtra.emoji,
      }),
    });
    setEditandoExtra(null);
    cargarExtras();
  }

  // ─── Terminal MP functions ───
  const cargarHistorialTerminal = useCallback(async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const res = await fetch(`${API_URL}/api/terminal/historial`, { headers: adminHeaders() });
      setTerminalHistorial(await res.json());
    } catch { setTerminalHistorial([]); }
  }, []);

  useEffect(() => {
    if (activeTab === 'corporativo') {
      setCorpCargando(true);
      fetchAPI('/api/corporativo/leads').then(setLeadsCorp).catch(() => {}).finally(() => setCorpCargando(false));
    }
    if (activeTab === 'promotores') {
      setPromCargando(true);
      Promise.all([
        fetchAPI('/api/promotores').then(setPromotores).catch(() => {}),
        fetchAPI('/api/promotores/admin/stats').then(setPromotorStats).catch(() => {}),
      ]).finally(() => setPromCargando(false));
    }
    if (activeTab === 'terminal') {
      cargarExtras();
      cargarHistorialTerminal();
    }
    return () => {
      if (terminalPollRef.current) clearInterval(terminalPollRef.current);
    };
  }, [activeTab, cargarExtras, cargarHistorialTerminal]);

  // ─── Paquetes functions ───
  const cargarPaquetes = useCallback(async () => {
    try {
      const data = await fetchAPI('/api/paquetes/all');
      setPaquetesAdmin(data);
    } catch { setPaquetesAdmin([]); }
  }, []);

  useEffect(() => {
    if (activeTab === 'paquetes') cargarPaquetes();
  }, [activeTab, cargarPaquetes]);

  async function crearPaquete() {
    if (!nuevoPaquete.nombre || !nuevoPaquete.precio) return;
    const chars = nuevoPaquete.caracteristicas.filter((c) => c.trim() !== '');
    await fetchAPI('/api/paquetes', {
      method: 'POST',
      body: JSON.stringify({
        ...nuevoPaquete,
        precio: Number(nuevoPaquete.precio),
        duracion_horas: nuevoPaquete.duracion_horas ? Number(nuevoPaquete.duracion_horas) : null,
        capacidad_max: Number(nuevoPaquete.capacidad_max),
        caracteristicas: chars,
        imagen_url: nuevoPaquete.imagen_url || null,
      }),
    });
    setNuevoPaquete({ nombre: '', descripcion: '', precio: '', emoji: '🎉', tipo_duracion: 'horas', duracion_horas: '', capacidad_max: '50', caracteristicas: [''], imagen_url: '' });
    cargarPaquetes();
  }

  async function subirImagenPaquete(file: File, target: 'nuevo' | 'editar') {
    setSubiendoImgPaq(true);
    try {
      const formData = new FormData();
      formData.append('imagen', file);
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const res = await fetch(`${API_URL}/api/paquetes/subir-imagen`, { method: 'POST', headers: adminHeaders(), body: formData });
      if (!res.ok) throw new Error('Error al subir');
      const { url } = await res.json();
      if (target === 'nuevo') {
        setNuevoPaquete((prev) => ({ ...prev, imagen_url: url }));
      } else if (editandoPaquete) {
        setEditandoPaquete({ ...editandoPaquete, imagen_url: url });
      }
    } catch (err) {
      console.error('Error subiendo imagen:', err);
      alert('Error al subir la imagen');
    } finally {
      setSubiendoImgPaq(false);
    }
  }

  async function togglePaquete(id: number, activo: boolean) {
    await fetchAPI(`/api/paquetes/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ activo: !activo }),
    });
    cargarPaquetes();
  }

  async function guardarPaquete() {
    if (!editandoPaquete) return;
    const chars = editandoPaquete.caracteristicas.filter((c) => c.trim() !== '');
    await fetchAPI(`/api/paquetes/${editandoPaquete.id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        nombre: editandoPaquete.nombre,
        emoji: editandoPaquete.emoji,
        descripcion: editandoPaquete.descripcion,
        tipo_duracion: editandoPaquete.tipo_duracion,
        duracion_horas: editandoPaquete.duracion_horas,
        precio: Number(editandoPaquete.precio),
        capacidad_max: editandoPaquete.capacidad_max,
        caracteristicas: chars,
        imagen_url: editandoPaquete.imagen_url || null,
      }),
    });
    setEditandoPaquete(null);
    cargarPaquetes();
  }

  // ─── Accesos (PINs) functions ───
  const cargarCodigos = useCallback(async () => {
    try {
      const data = await fetchAPI('/api/cerraduras');
      setCodigos(data);
    } catch { setCodigos([]); }
  }, []);

  useEffect(() => {
    if (activeTab === 'accesos') cargarCodigos();
  }, [activeTab, cargarCodigos]);

  async function desactivarPin(reservacion_id: number) {
    if (!confirm('¿Desactivar este código PIN?')) return;
    await fetchAPI('/api/cerraduras/desactivar', {
      method: 'POST',
      body: JSON.stringify({ reservacion_id }),
    });
    cargarCodigos();
  }

  // ─── Reseñas & Firmas functions ───
  const cargarResenas = useCallback(async () => {
    try {
      const [firmasData, resenasData] = await Promise.all([
        fetchAPI('/api/firmas'),
        fetchAPI('/api/resenas'),
      ]);
      setFirmas(firmasData);
      setResenas(resenasData);
    } catch { setFirmas([]); setResenas([]); }
  }, []);

  useEffect(() => {
    if (activeTab === 'resenas') cargarResenas();
  }, [activeTab, cargarResenas]);

  // ─── Notificaciones functions ───
  async function enviarPinWhatsApp(reservacion_id: number) {
    try {
      await fetchAPI('/api/notificaciones/enviar-pin', {
        method: 'POST',
        body: JSON.stringify({ reservacion_id }),
      });
      alert('PIN enviado por WhatsApp');
    } catch {
      alert('Error al enviar PIN');
    }
  }

  async function previewNotificaciones() {
    try {
      const data = await fetchAPI('/api/notificaciones/preview');
      setNotifPreview(data);
    } catch {
      alert('Error al obtener preview');
    }
  }

  async function ejecutarNotificaciones() {
    if (!confirm('¿Enviar TODAS las notificaciones pendientes de hoy?')) return;
    setEnviandoNotif(true);
    try {
      const data = await fetchAPI('/api/notificaciones/cron', { method: 'POST' });
      setNotifResultado(data.enviados);
    } catch {
      alert('Error al enviar notificaciones');
    } finally {
      setEnviandoNotif(false);
    }
  }

  const hoy = new Date().toISOString().split('T')[0];
  const reservacionesHoy = reservaciones.filter((r) => r.fecha_evento?.split('T')[0] === hoy && r.estado !== 'cancelada');
  const pendientes = reservaciones.filter((r) => r.estado === 'pendiente');
  const ingresos = reservaciones.reduce((sum, r) => sum + Number(r.monto_total), 0);

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Admin Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-primary-light/20 shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
        <div className="flex items-center justify-between h-14 px-4 max-w-lg mx-auto">
          <div>
            <h1 className="font-bold text-base text-foreground">🏡 Administrador</h1>
            <p className="text-foreground/40 text-xs">La Quinta de Alí</p>
          </div>
          <button
            onClick={handleLogout}
            className="text-foreground/50 text-sm font-medium active:scale-95"
          >
            Cerrar sesión
          </button>
        </div>
      </header>

      {/* Stats cards */}
      <div className="px-4 pt-4 max-w-lg mx-auto grid grid-cols-2 gap-3">
        <div className="bg-white/70 rounded-xl p-4 border border-primary-light/15">
          <p className="text-xs text-gray-400">Reservaciones hoy</p>
          <p className="text-2xl font-extrabold text-primary mt-1">{stats?.reservaciones_hoy ?? reservacionesHoy.length}</p>
        </div>
        <div className="bg-white/70 rounded-xl p-4 border border-primary-light/15">
          <p className="text-xs text-gray-400">Total reservaciones</p>
          <p className="text-2xl font-extrabold text-foreground/70 mt-1">{stats?.total_reservaciones ?? reservaciones.length}</p>
        </div>
        <div className="bg-white/70 rounded-xl p-4 border border-primary-light/15">
          <p className="text-xs text-gray-400">Canceladas</p>
          <p className="text-2xl font-extrabold text-red-500 mt-1">
            {stats?.pendientes ?? pendientes.length}
          </p>
        </div>
        <div className="bg-white/70 rounded-xl p-4 border border-primary-light/15">
          <p className="text-xs text-gray-400">Ingresos del mes</p>
          <p className="text-2xl font-extrabold text-green-600 mt-1">
            ${(stats?.ingresos_mes ?? ingresos).toLocaleString('es-MX')}
          </p>
        </div>
        <div className="bg-white/70 rounded-xl p-4 border border-primary-light/15 col-span-2">
          <p className="text-xs text-gray-400">Extras del mes</p>
          <p className="text-2xl font-extrabold text-accent mt-1">
            ${(stats?.ingresos_extras_mes ?? 0).toLocaleString('es-MX')}
          </p>
        </div>
      </div>

      {/* Top extras */}
      {stats?.top_extras && stats.top_extras.length > 0 && (
        <div className="px-4 mt-3 max-w-lg mx-auto">
          <div className="bg-white/70 rounded-xl border border-primary-light/15 p-4">
            <p className="text-xs text-gray-400 mb-2">Extras más vendidos</p>
            <div className="flex gap-3 overflow-x-auto">
              {stats.top_extras.map((ex, i) => (
                <div key={i} className="flex items-center gap-1.5 flex-shrink-0 text-sm">
                  <span>{ex.emoji}</span>
                  <span className="font-semibold">{ex.nombre}</span>
                  <span className="text-xs text-gray-400">×{ex.veces}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Reservaciones tab */}
      {activeTab === 'reservaciones' && (
        <div className="px-4 mt-4 max-w-lg mx-auto space-y-3">
          {cargando ? (
            <div className="text-center py-8 text-gray-400">Cargando...</div>
          ) : reservaciones.length === 0 ? (
            <div className="bg-white/70 rounded-xl border border-primary-light/15 p-8 text-center">
              <ClipboardList className="w-10 h-10 text-primary/30 mx-auto" />
              <p className="font-bold mt-3">Sin reservaciones</p>
              <p className="text-sm text-gray-400 mt-1">Las nuevas reservaciones aparecerán aquí</p>
            </div>
          ) : (
            reservaciones.map((res) => (
            <div key={res.id} className="bg-white/70 rounded-xl border border-primary-light/15 p-4">
              <div className="flex items-start justify-between cursor-pointer" onClick={() => setResExpandida(resExpandida === res.id ? null : res.id)}>
                <div>
                  <p className="font-bold">{res.cliente_nombre} {res.cliente_apellido}</p>
                  <p className="text-sm text-gray-500">{res.paquete_nombre}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${estadoColors[res.estado] || 'bg-gray-100'}`}>
                    {res.estado}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${resExpandida === res.id ? 'rotate-180' : ''}`} />
                </div>
              </div>
              <div className="flex items-center justify-between mt-3 text-sm">
                <div className="flex items-center gap-3 text-gray-500">
                  <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {new Date(res.fecha_evento).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {res.hora_inicio?.slice(0,5)}</span>
                </div>
                <span className="font-bold text-primary">${Number(res.monto_total).toLocaleString('es-MX')}</span>
              </div>

              {/* Detalle expandible */}
              {resExpandida === res.id && (
                <div className="mt-3 pt-3 border-t border-gray-100 space-y-2 text-sm">
                  {res.cliente_telefono && (
                    <a href={`tel:${res.cliente_telefono}`} className="flex items-center gap-2 text-gray-600 hover:text-primary">
                      <Phone className="w-3.5 h-3.5" /> {res.cliente_telefono}
                    </a>
                  )}
                  {res.cliente_email && (
                    <a href={`mailto:${res.cliente_email}`} className="flex items-center gap-2 text-gray-600 hover:text-primary">
                      <Mail className="w-3.5 h-3.5" /> {res.cliente_email}
                    </a>
                  )}
                  {res.hora_fin && (
                    <p className="flex items-center gap-2 text-gray-500">
                      <Clock className="w-3.5 h-3.5" /> {res.hora_inicio?.slice(0,5)} — {res.hora_fin?.slice(0,5)}
                    </p>
                  )}
                  {res.num_invitados > 0 && (
                    <p className="flex items-center gap-2 text-gray-500">
                      <Users className="w-3.5 h-3.5" /> {res.num_invitados} invitados
                    </p>
                  )}
                  <div className="flex items-center justify-between">
                    <p className="text-gray-500">Pagado: <span className="font-semibold text-green-600">${Number(res.monto_pagado || 0).toLocaleString('es-MX')}</span> / ${Number(res.monto_total).toLocaleString('es-MX')}</p>
                  </div>
                  {res.notas && (
                    <p className="text-xs text-gray-400 italic">{res.notas}</p>
                  )}
                  {res.promotor && (
                    <p className="flex items-center gap-2 text-xs text-purple-600 font-semibold">
                      🤝 Promotor: {res.promotor}
                    </p>
                  )}
                  {res.cliente_telefono && (
                    <a
                      href={`https://wa.me/${res.cliente_telefono.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 bg-green-50 text-green-700 font-semibold text-xs px-3 py-1.5 rounded-lg"
                    >
                      <Smartphone className="w-3.5 h-3.5" /> WhatsApp
                    </a>
                  )}

                  {/* Check-in / Check-out */}
                  {(res.estado === 'confirmada' || res.estado === 'pagada') && (
                    <div className="flex gap-2 mt-2">
                      {!res.checkin_at ? (
                        <button onClick={() => registrarCheckin(res.id)} className="flex-1 bg-blue-50 text-blue-700 font-semibold py-2 rounded-lg text-sm active:scale-95 transition-transform">
                          📥 Check-in
                        </button>
                      ) : (
                        <span className="flex-1 text-center text-xs text-blue-600 bg-blue-50 py-2 rounded-lg font-medium">
                          ✅ Check-in: {new Date(res.checkin_at).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                      {res.checkin_at && !res.checkout_at ? (
                        <button onClick={() => registrarCheckout(res.id)} className="flex-1 bg-orange-50 text-orange-700 font-semibold py-2 rounded-lg text-sm active:scale-95 transition-transform">
                          📤 Check-out
                        </button>
                      ) : res.checkout_at ? (
                        <span className="flex-1 text-center text-xs text-orange-600 bg-orange-50 py-2 rounded-lg font-medium">
                          ✅ Check-out: {new Date(res.checkout_at).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      ) : null}
                    </div>
                  )}
                </div>
              )}
              {res.estado === 'pendiente' && (
              <div className="flex gap-2 mt-3">
                <button onClick={() => cambiarEstado(res.id, 'confirmada')} className="flex-1 bg-green-50 text-green-700 font-semibold py-2 rounded-lg text-sm active:scale-95 transition-transform">
                  ✓ Confirmar
                </button>
                <button onClick={() => { if (confirm('¿Cancelar esta reservación?')) cambiarEstado(res.id, 'cancelada'); }} className="flex-1 bg-red-50 text-red-600 font-semibold py-2 rounded-lg text-sm active:scale-95 transition-transform">
                  ✕ Cancelar
                </button>
              </div>
              )}
              {(res.estado === 'confirmada' || res.estado === 'pagada') && (
              <div className="mt-3">
                <button onClick={() => { if (confirm('¿Seguro que quieres cancelar esta reservación?')) cambiarEstado(res.id, 'cancelada'); }} className="w-full bg-red-50 text-red-600 font-semibold py-2 rounded-lg text-sm active:scale-95 transition-transform">
                  ✕ Cancelar reservación
                </button>
              </div>
              )}
            </div>
          ))
          )}
        </div>
      )}

      {/* Hoy tab */}
      {activeTab === 'hoy' && (
        <div className="px-4 mt-4 max-w-lg mx-auto">
          {reservacionesHoy.length === 0 ? (
            <div className="bg-white/70 rounded-xl border border-primary-light/15 p-8 text-center">
              <Sparkles className="w-10 h-10 text-primary/30 mx-auto" />
              <p className="font-bold mt-3">Sin eventos hoy</p>
              <p className="text-sm text-gray-400 mt-1">Disfruta el día libre</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reservacionesHoy.map((res) => (
                <div key={res.id} className="bg-white/70 rounded-xl border border-primary-light/15 p-4">
                  <p className="font-bold">{res.cliente_nombre} {res.cliente_apellido} — {res.paquete_nombre}</p>
                  <p className="text-sm text-gray-500">{res.hora_inicio?.slice(0,5)} hrs</p>
                  {res.cliente_telefono && (
                    <a href={`https://wa.me/${res.cliente_telefono.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-green-600 mt-1">
                      <Smartphone className="w-3 h-3" /> {res.cliente_telefono}
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Checklist de limpieza */}
          <div className="bg-white/70 rounded-xl border border-primary-light/15 p-4 mt-4">
            <h3 className="font-bold mb-3 flex items-center gap-2"><ListChecks className="w-5 h-5 text-primary/60" /> Checklist de limpieza</h3>
            <div className="space-y-2">
              {['Salón principal', 'Baños', 'Cocina', 'Área de jardín', 'Piscina / alberca'].map((area) => (
                <label key={area} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                  <input type="checkbox" className="w-5 h-5 rounded accent-primary" />
                  <span className="text-sm">{area}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══ EXTRAS TAB ═══ */}
      {activeTab === 'extras' && (
        <div className="px-4 mt-4 max-w-lg mx-auto space-y-4">
          {/* Formulario nuevo extra */}
          <div className="bg-white/70 rounded-xl border border-primary-light/15 p-4 space-y-3">
            <h3 className="font-bold text-sm">Agregar nuevo extra</h3>
            <div className="grid grid-cols-2 gap-2">
              <input
                placeholder="Nombre"
                value={nuevoExtra.nombre}
                onChange={(e) => setNuevoExtra({ ...nuevoExtra, nombre: e.target.value })}
                className="border border-gray-200 rounded-lg p-2 text-sm"
              />
              <input
                placeholder="Precio MXN"
                type="number"
                value={nuevoExtra.precio}
                onChange={(e) => setNuevoExtra({ ...nuevoExtra, precio: e.target.value })}
                className="border border-gray-200 rounded-lg p-2 text-sm"
              />
              <input
                placeholder="Descripción"
                value={nuevoExtra.descripcion}
                onChange={(e) => setNuevoExtra({ ...nuevoExtra, descripcion: e.target.value })}
                className="border border-gray-200 rounded-lg p-2 text-sm col-span-2"
              />
              <input
                placeholder="Emoji"
                value={nuevoExtra.emoji}
                onChange={(e) => setNuevoExtra({ ...nuevoExtra, emoji: e.target.value })}
                className="border border-gray-200 rounded-lg p-2 text-sm w-20"
              />
              <button
                onClick={crearExtra}
                className="bg-primary text-white font-semibold py-2 rounded-lg text-sm active:scale-95 transition-transform"
              >
                + Agregar
              </button>
            </div>
          </div>

          {/* Lista de extras */}
          {extras.map((ex) => (
            <div key={ex.id} className={`bg-white/70 rounded-xl border border-primary-light/15 p-4 ${!ex.activo ? 'opacity-50' : ''}`}>
              {editandoExtra?.id === ex.id ? (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <input value={editandoExtra.nombre} onChange={(e) => setEditandoExtra({ ...editandoExtra, nombre: e.target.value })} className="border border-gray-200 rounded-lg p-2 text-sm" />
                    <input value={editandoExtra.precio} onChange={(e) => setEditandoExtra({ ...editandoExtra, precio: e.target.value })} className="border border-gray-200 rounded-lg p-2 text-sm" type="number" />
                    <input value={editandoExtra.descripcion} onChange={(e) => setEditandoExtra({ ...editandoExtra, descripcion: e.target.value })} className="border border-gray-200 rounded-lg p-2 text-sm col-span-2" />
                    <input value={editandoExtra.emoji} onChange={(e) => setEditandoExtra({ ...editandoExtra, emoji: e.target.value })} className="border border-gray-200 rounded-lg p-2 text-sm w-20" />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={guardarExtra} className="bg-green-500 text-white font-semibold py-1.5 px-4 rounded-lg text-sm">Guardar</button>
                    <button onClick={() => setEditandoExtra(null)} className="bg-gray-200 font-semibold py-1.5 px-4 rounded-lg text-sm">Cancelar</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold">{ex.emoji} {ex.nombre}</p>
                    <p className="text-xs text-gray-400">{ex.descripcion}</p>
                    <p className="text-sm font-semibold text-primary mt-1">${Number(ex.precio).toLocaleString('es-MX')} MXN</p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button onClick={() => setEditandoExtra(ex)} className="text-xs bg-blue-50 text-blue-600 font-semibold px-3 py-1.5 rounded-lg">Editar</button>
                    <button onClick={() => toggleExtra(ex.id, ex.activo)} className={`text-xs font-semibold px-3 py-1.5 rounded-lg ${ex.activo ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                      {ex.activo ? 'Desactivar' : 'Activar'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
          {extras.length === 0 && (
            <div className="bg-white/70 rounded-xl border border-primary-light/15 p-8 text-center">
              <Gift className="w-10 h-10 text-primary/30 mx-auto" />
              <p className="font-bold mt-3">Sin extras</p>
              <p className="text-sm text-gray-400 mt-1">Agrega extras para upselling</p>
            </div>
          )}
        </div>
      )}

      {/* ═══ PAQUETES TAB ═══ */}
      {activeTab === 'paquetes' && (
        <div className="px-4 mt-4 max-w-lg mx-auto space-y-4">
          {/* Formulario nuevo paquete */}
          <div className="bg-white/70 rounded-xl border border-primary-light/15 p-4 space-y-3">
            <h3 className="font-bold text-sm">Agregar nuevo paquete</h3>
            <div className="grid grid-cols-2 gap-2">
              <input placeholder="Nombre" value={nuevoPaquete.nombre} onChange={(e) => setNuevoPaquete({ ...nuevoPaquete, nombre: e.target.value })} className="border border-gray-200 rounded-lg p-2 text-sm" />
              <input placeholder="Precio MXN" type="number" value={nuevoPaquete.precio} onChange={(e) => setNuevoPaquete({ ...nuevoPaquete, precio: e.target.value })} className="border border-gray-200 rounded-lg p-2 text-sm" />
              <input placeholder="Descripción" value={nuevoPaquete.descripcion} onChange={(e) => setNuevoPaquete({ ...nuevoPaquete, descripcion: e.target.value })} className="border border-gray-200 rounded-lg p-2 text-sm col-span-2" />
              <input placeholder="Emoji" value={nuevoPaquete.emoji} onChange={(e) => setNuevoPaquete({ ...nuevoPaquete, emoji: e.target.value })} className="border border-gray-200 rounded-lg p-2 text-sm w-20" />
              <select value={nuevoPaquete.tipo_duracion} onChange={(e) => setNuevoPaquete({ ...nuevoPaquete, tipo_duracion: e.target.value })} className="border border-gray-200 rounded-lg p-2 text-sm">
                <option value="horas">Por horas</option>
                <option value="noche">Por noche</option>
              </select>
              {nuevoPaquete.tipo_duracion === 'horas' && (
                <input placeholder="Horas" type="number" value={nuevoPaquete.duracion_horas} onChange={(e) => setNuevoPaquete({ ...nuevoPaquete, duracion_horas: e.target.value })} className="border border-gray-200 rounded-lg p-2 text-sm" />
              )}
              <input placeholder="Capacidad máx" type="number" value={nuevoPaquete.capacidad_max} onChange={(e) => setNuevoPaquete({ ...nuevoPaquete, capacidad_max: e.target.value })} className="border border-gray-200 rounded-lg p-2 text-sm" />
            </div>
            {/* Imagen del paquete */}
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-2">Imagen del paquete</p>
              <div className="flex items-center gap-3">
                {nuevoPaquete.imagen_url ? (
                  <div className="relative w-20 h-14 rounded-lg overflow-hidden border">
                    <img src={nuevoPaquete.imagen_url} alt="" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => setNuevoPaquete({ ...nuevoPaquete, imagen_url: '' })} className="absolute top-0.5 right-0.5 bg-red-500 text-white rounded-full w-4 h-4 text-[10px] flex items-center justify-center">✕</button>
                  </div>
                ) : (
                  <label className={`flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-gray-300 text-xs text-gray-500 cursor-pointer hover:bg-gray-50 ${subiendoImgPaq ? 'opacity-50 pointer-events-none' : ''}`}>
                    <span className="flex items-center gap-1.5">{subiendoImgPaq ? 'Subiendo...' : <><Camera className="w-4 h-4" /> Subir imagen</>}</span>
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => { if (e.target.files?.[0]) subirImagenPaquete(e.target.files[0], 'nuevo'); }} />
                  </label>
                )}
              </div>
            </div>
            {/* Características — Selector de etiquetas */}
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-2">¿Qué incluye este paquete?</p>
              <div className="flex flex-wrap gap-2">
                {AMENIDADES_PREDEFINIDAS.map((am) => {
                  const activa = nuevoPaquete.caracteristicas.some(c => c.includes(am.texto));
                  return (
                    <button key={am.id} type="button" onClick={() => {
                      if (activa) {
                        setNuevoPaquete({ ...nuevoPaquete, caracteristicas: nuevoPaquete.caracteristicas.filter(c => !c.includes(am.texto)) });
                      } else {
                        setNuevoPaquete({ ...nuevoPaquete, caracteristicas: [...nuevoPaquete.caracteristicas.filter(c => c.trim()), `${am.emoji} ${am.texto}`] });
                      }
                    }} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${activa ? 'bg-primary/10 border-primary/30 text-primary shadow-sm' : 'bg-gray-50 border-gray-200 text-gray-400 hover:bg-gray-100'}`}>
                      <span>{am.emoji}</span>{am.texto}
                    </button>
                  );
                })}
              </div>
            </div>
            <button onClick={crearPaquete} className="w-full bg-primary text-white font-semibold py-2 rounded-lg text-sm active:scale-95 transition-transform">+ Crear paquete</button>
          </div>

          {/* Lista de paquetes */}
          {paquetesAdmin.map((paq) => (
            <div key={paq.id} className={`bg-white/70 rounded-xl border border-primary-light/15 p-4 ${!paq.activo ? 'opacity-50' : ''}`}>
              {editandoPaquete?.id === paq.id ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <input value={editandoPaquete.nombre} onChange={(e) => setEditandoPaquete({ ...editandoPaquete, nombre: e.target.value })} className="border border-gray-200 rounded-lg p-2 text-sm" />
                    <input value={editandoPaquete.precio} onChange={(e) => setEditandoPaquete({ ...editandoPaquete, precio: e.target.value })} className="border border-gray-200 rounded-lg p-2 text-sm" type="number" />
                    <input value={editandoPaquete.descripcion} onChange={(e) => setEditandoPaquete({ ...editandoPaquete, descripcion: e.target.value })} className="border border-gray-200 rounded-lg p-2 text-sm col-span-2" />
                    <input value={editandoPaquete.emoji} onChange={(e) => setEditandoPaquete({ ...editandoPaquete, emoji: e.target.value })} className="border border-gray-200 rounded-lg p-2 text-sm w-20" />
                    <select value={editandoPaquete.tipo_duracion} onChange={(e) => setEditandoPaquete({ ...editandoPaquete, tipo_duracion: e.target.value })} className="border border-gray-200 rounded-lg p-2 text-sm">
                      <option value="horas">Por horas</option>
                      <option value="noche">Por noche</option>
                    </select>
                    {editandoPaquete.tipo_duracion === 'horas' && (
                      <input value={editandoPaquete.duracion_horas ?? ''} onChange={(e) => setEditandoPaquete({ ...editandoPaquete, duracion_horas: e.target.value ? Number(e.target.value) : null })} placeholder="Horas" type="number" className="border border-gray-200 rounded-lg p-2 text-sm" />
                    )}
                    <input value={editandoPaquete.capacidad_max} onChange={(e) => setEditandoPaquete({ ...editandoPaquete, capacidad_max: Number(e.target.value) })} placeholder="Capacidad" type="number" className="border border-gray-200 rounded-lg p-2 text-sm" />
                  </div>
                  {/* Imagen del paquete */}
                  <div>
                    <p className="text-xs font-semibold text-gray-500 mb-2">Imagen del paquete</p>
                    <div className="flex items-center gap-3">
                      {editandoPaquete.imagen_url ? (
                        <div className="relative w-20 h-14 rounded-lg overflow-hidden border">
                          <img src={editandoPaquete.imagen_url} alt="" className="w-full h-full object-cover" />
                          <button type="button" onClick={() => setEditandoPaquete({ ...editandoPaquete, imagen_url: '' })} className="absolute top-0.5 right-0.5 bg-red-500 text-white rounded-full w-4 h-4 text-[10px] flex items-center justify-center">✕</button>
                        </div>
                      ) : (
                        <label className={`flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-gray-300 text-xs text-gray-500 cursor-pointer hover:bg-gray-50 ${subiendoImgPaq ? 'opacity-50 pointer-events-none' : ''}`}>
                          <span className="flex items-center gap-1.5">{subiendoImgPaq ? 'Subiendo...' : <><Camera className="w-4 h-4" /> Subir imagen</>}</span>
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => { if (e.target.files?.[0]) subirImagenPaquete(e.target.files[0], 'editar'); }} />
                        </label>
                      )}
                    </div>
                  </div>
                  {/* Editar características — Selector de etiquetas */}
                  <div>
                    <p className="text-xs font-semibold text-gray-500 mb-2">¿Qué incluye este paquete?</p>
                    <div className="flex flex-wrap gap-2">
                      {AMENIDADES_PREDEFINIDAS.map((am) => {
                        const activa = editandoPaquete.caracteristicas.some(c => c.includes(am.texto));
                        return (
                          <button key={am.id} type="button" onClick={() => {
                            if (activa) {
                              setEditandoPaquete({ ...editandoPaquete, caracteristicas: editandoPaquete.caracteristicas.filter(c => !c.includes(am.texto)) });
                            } else {
                              setEditandoPaquete({ ...editandoPaquete, caracteristicas: [...editandoPaquete.caracteristicas, `${am.emoji} ${am.texto}`] });
                            }
                          }} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${activa ? 'bg-primary/10 border-primary/30 text-primary shadow-sm' : 'bg-gray-50 border-gray-200 text-gray-400 hover:bg-gray-100'}`}>
                            <span>{am.emoji}</span>{am.texto}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={guardarPaquete} className="bg-green-500 text-white font-semibold py-1.5 px-4 rounded-lg text-sm">Guardar</button>
                    <button onClick={() => setEditandoPaquete(null)} className="bg-gray-200 font-semibold py-1.5 px-4 rounded-lg text-sm">Cancelar</button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold">{paq.emoji} {paq.nombre}</p>
                      <p className="text-xs text-gray-400">{paq.descripcion}</p>
                      <p className="text-sm font-semibold text-primary mt-1">${Number(paq.precio).toLocaleString('es-MX')} MXN</p>
                      <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1 flex-wrap">
                        {paq.tipo_duracion === 'noche' ? <span className="flex items-center gap-0.5"><Moon className="w-3 h-3" /> Noche completa</span> : <span className="flex items-center gap-0.5"><Timer className="w-3 h-3" /> {paq.duracion_horas}h</span>}
                        <span>·</span>
                        <span className="flex items-center gap-0.5"><Users className="w-3 h-3" /> {paq.capacidad_max} personas</span>
                      </p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button onClick={() => setEditandoPaquete({ ...paq, caracteristicas: Array.isArray(paq.caracteristicas) ? paq.caracteristicas : [] })} className="text-xs bg-blue-50 text-blue-600 font-semibold px-3 py-1.5 rounded-lg">Editar</button>
                      <button onClick={() => togglePaquete(paq.id, paq.activo)} className={`text-xs font-semibold px-3 py-1.5 rounded-lg ${paq.activo ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                        {paq.activo ? 'Desactivar' : 'Activar'}
                      </button>
                    </div>
                  </div>
                  {Array.isArray(paq.caracteristicas) && paq.caracteristicas.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {paq.caracteristicas.map((c, i) => (
                        <span key={i} className="text-xs bg-primary-light/10 text-foreground/70 px-2 py-0.5 rounded-full">{c}</span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
          {paquetesAdmin.length === 0 && (
            <div className="bg-white/70 rounded-xl border border-primary-light/15 p-8 text-center">
              <Package className="w-10 h-10 text-primary/30 mx-auto" />
              <p className="font-bold mt-3">Sin paquetes</p>
              <p className="text-sm text-gray-400 mt-1">Agrega paquetes para que tus clientes puedan reservar</p>
            </div>
          )}
        </div>
      )}

      {/* ═══ ACCESOS (PINs) TAB ═══ */}
      {activeTab === 'accesos' && (
        <div className="px-4 mt-4 max-w-lg mx-auto space-y-3">
          {codigos.length === 0 ? (
            <div className="bg-white/70 rounded-xl border border-primary-light/15 p-8 text-center">
              <KeyRound className="w-10 h-10 text-primary/30 mx-auto" />
              <p className="font-bold mt-3">Sin códigos de acceso</p>
              <p className="text-sm text-gray-400 mt-1">Los PINs se generan al crear reservaciones</p>
            </div>
          ) : (
            codigos.map((c) => {
              const ahora = new Date();
              const desde = new Date(c.valido_desde);
              const hasta = new Date(c.valido_hasta);
              const estaActivo = c.activo && ahora >= desde && ahora <= hasta;
              const expiro = ahora > hasta;

              return (
                <div key={c.id} className="bg-white/70 rounded-xl border border-primary-light/15 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold">{c.cliente_nombre} {c.cliente_apellido}</p>
                      <p className="text-xs text-gray-400">{c.paquete_nombre} — {c.fecha_evento}</p>
                    </div>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                      estaActivo ? 'bg-green-100 text-green-700' : expiro ? 'bg-gray-100 text-gray-500' : c.activo ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-600'
                    }`}>
                      {estaActivo ? 'ACTIVO AHORA' : expiro ? 'EXPIRADO' : c.activo ? 'PRÓXIMO' : 'DESACTIVADO'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <div className="bg-gray-900 text-white rounded-xl px-4 py-2">
                      <p className="text-2xl font-mono font-extrabold tracking-[0.2em] text-accent">{c.codigo_pin}</p>
                    </div>
                    <div className="text-right text-xs text-gray-400">
                      <p>{c.hora_inicio} — {c.hora_fin}</p>
                      {c.telefono && <p className="flex items-center gap-1"><Smartphone className="w-3 h-3" /> {c.telefono}</p>}
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    {c.activo && c.telefono && (
                      <button
                        onClick={() => enviarPinWhatsApp(c.reservacion_id)}
                        className="flex-1 bg-green-50 text-green-700 font-semibold py-2 rounded-lg text-sm active:scale-95 transition-transform flex items-center justify-center gap-1.5"
                      >
                        <Send className="w-3.5 h-3.5" /> Enviar PIN
                      </button>
                    )}
                    {c.activo && (
                      <button
                        onClick={() => desactivarPin(c.reservacion_id)}
                        className="flex-1 bg-red-50 text-red-600 font-semibold py-2 rounded-lg text-sm active:scale-95 transition-transform"
                      >
                        Desactivar PIN
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ═══ RESEÑAS & FIRMAS TAB ═══ */}
      {activeTab === 'resenas' && (
        <div className="px-4 mt-4 max-w-lg mx-auto space-y-4">
          {/* Sección Firmas */}
          <div className="bg-white/70 rounded-xl border border-primary-light/15 p-4">
            <h3 className="font-bold mb-3 flex items-center gap-2"><PenTool className="w-5 h-5 text-primary/60" /> Firmas digitales ({firmas.length})</h3>
            {firmas.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">Sin firmas registradas</p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {firmas.map((f) => (
                  <div key={f.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm font-semibold">{f.cliente_nombre} {f.cliente_apellido}</p>
                      <p className="text-xs text-gray-400">{f.paquete_nombre} — {f.fecha_evento}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">{new Date(f.firmado_en).toLocaleDateString('es-MX')}</span>
                      <a href={f.firma_url} target="_blank" rel="noopener noreferrer" className="text-xs bg-primary/10 text-primary font-semibold px-2 py-1 rounded-lg">
                        Ver firma
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sección Reseñas */}
          <div className="bg-white/70 rounded-xl border border-primary-light/15 p-4">
            <h3 className="font-bold mb-3 flex items-center gap-2"><Star className="w-5 h-5 text-primary/60" /> Reseñas ({resenas.length})</h3>
            {resenas.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">Sin reseñas todavía</p>
            ) : (
              <div className="space-y-3">
                {resenas.map((r) => (
                  <div key={r.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold">{r.cliente_nombre} {r.cliente_apellido}</p>
                        <p className="text-xs text-gray-400">{r.paquete_nombre} — {r.fecha_evento}</p>
                      </div>
                      {r.calificacion ? (
                        <div className={`flex gap-0.5 ${r.calificacion >= 4 ? 'text-green-600' : r.calificacion >= 3 ? 'text-yellow-600' : 'text-red-600'}`}>
                          {Array.from({ length: r.calificacion }).map((_, i) => <Star key={i} className="w-4 h-4 fill-current" />)}
                        </div>
                      ) : (
                        <span className="text-xs bg-yellow-100 text-yellow-700 font-semibold px-2 py-1 rounded-full">
                          Pendiente
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2 mt-2">
                      {r.mensaje_enviado && <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">Enviado</span>}
                      {r.link_enviado && <span className="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded-full">Link enviado</span>}
                      {r.alerta_enviada && <span className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded-full">Alerta admin</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Galería tab */}
      {activeTab === 'galeria' && (
        <div className="px-4 mt-4 max-w-lg mx-auto space-y-4">
          {/* Selector de área */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
            {AREAS.map((a) => (
              <button
                key={a.key}
                onClick={() => setAreaSeleccionada(a.key)}
                className={`flex-shrink-0 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                  areaSeleccionada === a.key
                    ? 'bg-primary text-white'
                    : 'bg-white/70 text-foreground/60 border border-primary-light/20'
                }`}
              >
                <span className="flex items-center gap-1.5"><AreaIcon area={a.key} className="w-4 h-4" /> {a.label}</span>
              </button>
            ))}
          </div>

          {/* Formulario de subida */}
          <div className="bg-white/70 rounded-xl border border-primary-light/15 p-4 space-y-3">
            <h3 className="font-bold text-sm flex items-center gap-1.5"><Upload className="w-4 h-4 text-primary/60" /> Subir foto a {AREAS.find((a) => a.key === areaSeleccionada)?.label}</h3>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="w-full text-sm file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-primary/10 file:text-primary file:font-semibold"
              onChange={(e) => {
                if (e.target.files?.[0]) subirFoto(e.target.files[0]);
              }}
              disabled={subiendo}
            />
            <input
              type="text"
              placeholder="Descripción (opcional)"
              value={descripcionFoto}
              onChange={(e) => setDescripcionFoto(e.target.value)}
              className="w-full border border-gray-200 rounded-lg p-2 text-sm"
            />
            {subiendo && (
              <div className="flex items-center gap-2 text-sm text-primary">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                Subiendo...
              </div>
            )}
          </div>

          {/* Grid de fotos */}
          {fotosDelArea.length === 0 ? (
            <div className="bg-white/70 rounded-xl border border-primary-light/15 p-8 text-center">
              <Camera className="w-10 h-10 text-primary/30 mx-auto" />
              <p className="font-bold mt-3">Sin fotos en {AREAS.find((a) => a.key === areaSeleccionada)?.label}</p>
              <p className="text-sm text-gray-400 mt-1">Sube la primera foto usando el botón de arriba</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {fotosDelArea.map((foto) => (
                <div key={foto.id} className="relative group rounded-xl overflow-hidden aspect-square">
                  <Image
                    src={foto.url_foto}
                    alt={foto.descripcion || ''}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 45vw, 200px"
                  />
                  <button
                    onClick={() => eliminarFoto(foto.id)}
                    className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-red-500 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 active:opacity-100 transition-opacity shadow-lg"
                  >
                    ✕
                  </button>
                  {foto.descripcion && (
                    <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] px-2 py-1 truncate">
                      {foto.descripcion}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Resumen por área */}
          <div className="bg-white/70 rounded-xl border border-primary-light/15 p-4">
            <h3 className="font-bold text-sm mb-3 flex items-center gap-1.5"><BarChart3 className="w-4 h-4 text-primary/60" /> Resumen de fotos</h3>
            <div className="grid grid-cols-3 gap-2">
              {AREAS.map((a) => {
                const count = fotos.filter((f) => f.area === a.key).length;
                return (
                  <div key={a.key} className="text-center p-2 rounded-lg bg-gray-50 flex flex-col items-center">
                    <AreaIcon area={a.key} className="w-5 h-5 text-primary/50" />
                    <p className="text-xs font-semibold mt-1">{count}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Precios dinámicos tab */}
      {activeTab === 'precios' && (
        <div className="px-4 mt-4 max-w-lg mx-auto space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold flex items-center gap-2"><DollarSign className="w-5 h-5 text-primary/60" /> Precios Dinámicos</h2>
            <button
              onClick={() => setCreandoRegla(!creandoRegla)}
              className="bg-primary text-white text-sm font-semibold px-4 py-2 rounded-full active:scale-95 transition-transform"
            >
              {creandoRegla ? 'Cancelar' : '+ Nueva regla'}
            </button>
          </div>

          {/* Crear nueva regla */}
          {creandoRegla && (
            <div className="bg-white/70 rounded-xl border border-primary-light/15 p-4 space-y-3">
              <h3 className="font-bold text-sm">Nueva regla de precio</h3>
              <input
                type="text"
                placeholder="Nombre (ej: Sábados Premium)"
                value={nuevaRegla.nombre_regla}
                onChange={(e) => setNuevaRegla({ ...nuevaRegla, nombre_regla: e.target.value })}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary/30"
              />
              <select
                value={nuevaRegla.tipo_regla}
                onChange={(e) => setNuevaRegla({ ...nuevaRegla, tipo_regla: e.target.value, condicion: '' })}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="dia_semana">Día de la semana</option>
                <option value="rango_fechas">Temporada (rango de fechas)</option>
                <option value="dias_anticipacion">Último minuto (días de anticipación)</option>
              </select>

              {nuevaRegla.tipo_regla === 'dia_semana' && (
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Días que aplica</label>
                  <div className="flex gap-1 flex-wrap">
                    {['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá'].map((d, i) => {
                      const selected = nuevaRegla.condicion.split(',').includes(String(i));
                      return (
                        <button
                          key={i}
                          type="button"
                          onClick={() => {
                            const dias = nuevaRegla.condicion ? nuevaRegla.condicion.split(',') : [];
                            const idx = dias.indexOf(String(i));
                            if (idx >= 0) dias.splice(idx, 1); else dias.push(String(i));
                            setNuevaRegla({ ...nuevaRegla, condicion: dias.filter(Boolean).join(',') });
                          }}
                          className={`w-10 h-10 rounded-full text-xs font-bold transition-all ${selected ? 'bg-primary text-white' : 'bg-gray-100 text-gray-500'}`}
                        >
                          {d}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {nuevaRegla.tipo_regla === 'rango_fechas' && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Fecha inicio</label>
                    <input
                      type="date"
                      value={nuevaRegla.condicion.split(',')[0] || ''}
                      onChange={(e) => {
                        const fin = nuevaRegla.condicion.split(',')[1] || '';
                        setNuevaRegla({ ...nuevaRegla, condicion: `${e.target.value},${fin}` });
                      }}
                      className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Fecha fin</label>
                    <input
                      type="date"
                      value={nuevaRegla.condicion.split(',')[1] || ''}
                      onChange={(e) => {
                        const ini = nuevaRegla.condicion.split(',')[0] || '';
                        setNuevaRegla({ ...nuevaRegla, condicion: `${ini},${e.target.value}` });
                      }}
                      className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none"
                    />
                  </div>
                </div>
              )}

              {nuevaRegla.tipo_regla === 'dias_anticipacion' && (
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Si faltan estos días o menos</label>
                  <input
                    type="number"
                    placeholder="3"
                    value={nuevaRegla.condicion}
                    onChange={(e) => setNuevaRegla({ ...nuevaRegla, condicion: e.target.value })}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none"
                  />
                </div>
              )}

              <div>
                <label className="text-xs text-gray-500 mb-1 block">Modificador de precio (%)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    placeholder="20 o -15"
                    value={nuevaRegla.modificador_porcentaje}
                    onChange={(e) => setNuevaRegla({ ...nuevaRegla, modificador_porcentaje: e.target.value })}
                    className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none"
                  />
                  <span className="text-sm text-gray-500">%</span>
                </div>
                <p className="text-[10px] text-gray-400 mt-1">Positivo = sube precio, negativo = descuento</p>
              </div>

              <button
                onClick={crearRegla}
                disabled={!nuevaRegla.nombre_regla || !nuevaRegla.condicion || !nuevaRegla.modificador_porcentaje}
                className="w-full bg-primary text-white font-semibold py-2.5 rounded-lg text-sm active:scale-95 transition-transform disabled:bg-gray-300"
              >
                Crear regla
              </button>
            </div>
          )}

          {/* Lista de reglas existentes */}
          {reglasPrecios.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <BarChart3 className="w-10 h-10 text-primary/30 mx-auto" />
              <p className="mt-2 text-sm">No hay reglas de precio. Crea una para comenzar.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {reglasPrecios.map((regla) => {
                const isEditing = editandoRegla?.id === regla.id;
                const mod = Number(regla.modificador_porcentaje);
                const esDescuento = mod < 0;
                const IconoTipo = regla.tipo_regla === 'dia_semana' ? Calendar : regla.tipo_regla === 'rango_fechas' ? Sun : AlertTriangle;
                const diasNombres = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá'];

                let condicionTexto = regla.condicion;
                if (regla.tipo_regla === 'dia_semana') {
                  condicionTexto = regla.condicion.split(',').map(d => diasNombres[Number(d)] || d).join(', ');
                } else if (regla.tipo_regla === 'rango_fechas') {
                  const [ini, fin] = regla.condicion.split(',');
                  condicionTexto = `${ini} → ${fin}`;
                } else if (regla.tipo_regla === 'dias_anticipacion') {
                  condicionTexto = `≤ ${regla.condicion} días antes`;
                }

                if (isEditing && editandoRegla) {
                  return (
                    <div key={regla.id} className="bg-white/70 rounded-xl border-2 border-primary p-4 space-y-3">
                      <input
                        type="text"
                        value={editandoRegla.nombre_regla}
                        onChange={(e) => setEditandoRegla({ ...editandoRegla, nombre_regla: e.target.value })}
                        className="w-full text-sm font-semibold border border-gray-200 rounded-lg px-3 py-2 outline-none"
                      />
                      <select
                        value={editandoRegla.tipo_regla}
                        onChange={(e) => setEditandoRegla({ ...editandoRegla, tipo_regla: e.target.value, condicion: '' })}
                        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none"
                      >
                        <option value="dia_semana">Día de la semana</option>
                        <option value="rango_fechas">Temporada</option>
                        <option value="dias_anticipacion">Último minuto</option>
                      </select>

                      {editandoRegla.tipo_regla === 'dia_semana' && (
                        <div className="flex gap-1 flex-wrap">
                          {diasNombres.map((d, i) => {
                            const selected = editandoRegla.condicion.split(',').includes(String(i));
                            return (
                              <button key={i} type="button" onClick={() => {
                                const dias = editandoRegla.condicion ? editandoRegla.condicion.split(',') : [];
                                const idx = dias.indexOf(String(i));
                                if (idx >= 0) dias.splice(idx, 1); else dias.push(String(i));
                                setEditandoRegla({ ...editandoRegla, condicion: dias.filter(Boolean).join(',') });
                              }} className={`w-9 h-9 rounded-full text-xs font-bold ${selected ? 'bg-primary text-white' : 'bg-gray-100 text-gray-500'}`}>{d}</button>
                            );
                          })}
                        </div>
                      )}

                      {editandoRegla.tipo_regla === 'rango_fechas' && (
                        <div className="grid grid-cols-2 gap-2">
                          <input type="date" value={editandoRegla.condicion.split(',')[0] || ''} onChange={(e) => {
                            const fin = editandoRegla.condicion.split(',')[1] || '';
                            setEditandoRegla({ ...editandoRegla, condicion: `${e.target.value},${fin}` });
                          }} className="text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none" />
                          <input type="date" value={editandoRegla.condicion.split(',')[1] || ''} onChange={(e) => {
                            const ini = editandoRegla.condicion.split(',')[0] || '';
                            setEditandoRegla({ ...editandoRegla, condicion: `${ini},${e.target.value}` });
                          }} className="text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none" />
                        </div>
                      )}

                      {editandoRegla.tipo_regla === 'dias_anticipacion' && (
                        <input type="number" value={editandoRegla.condicion} onChange={(e) => setEditandoRegla({ ...editandoRegla, condicion: e.target.value })} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none" placeholder="Días" />
                      )}

                      <div className="flex items-center gap-2">
                        <input type="number" value={editandoRegla.modificador_porcentaje} onChange={(e) => setEditandoRegla({ ...editandoRegla, modificador_porcentaje: e.target.value })} className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none" />
                        <span className="text-sm text-gray-500">%</span>
                      </div>

                      <div className="flex gap-2">
                        <button onClick={() => setEditandoRegla(null)} className="flex-1 border border-gray-300 text-gray-700 font-semibold py-2 rounded-lg text-sm">Cancelar</button>
                        <button onClick={guardarRegla} className="flex-1 bg-primary text-white font-semibold py-2 rounded-lg text-sm">Guardar</button>
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={regla.id} className={`bg-white/70 rounded-xl border border-primary-light/15 p-4 transition-opacity ${!regla.activo ? 'opacity-50' : ''}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <IconoTipo className="w-5 h-5 text-primary/50" />
                          <h4 className="font-bold text-sm">{regla.nombre_regla}</h4>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">{condicionTexto}</p>
                        <p className={`text-sm font-extrabold mt-1 ${esDescuento ? 'text-green-600' : 'text-red-500'}`}>
                          {esDescuento ? '↓' : '↑'} {Math.abs(mod)}%
                          {esDescuento ? ' descuento' : ' incremento'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleRegla(regla.id, regla.activo)}
                          className={`w-12 h-6 rounded-full transition-colors ${regla.activo ? 'bg-primary' : 'bg-gray-300'}`}
                        >
                          <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${regla.activo ? 'translate-x-6' : 'translate-x-0.5'}`} />
                        </button>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button onClick={() => setEditandoRegla(regla)} className="text-xs text-primary font-semibold flex items-center gap-1"><Pencil className="w-3 h-3" /> Editar</button>
                      <button onClick={() => eliminarRegla(regla.id)} className="text-xs text-red-400 font-semibold flex items-center gap-1"><Trash2 className="w-3 h-3" /> Eliminar</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Explicación */}
          <div className="bg-blue-50 rounded-xl p-4 space-y-2">
            <h4 className="font-bold text-sm text-blue-800 flex items-center gap-1.5"><Lightbulb className="w-4 h-4" /> ¿Cómo funciona?</h4>
            <p className="text-xs text-blue-700">Las reglas se aplican sobre el precio base de cada paquete. Se pueden acumular varias reglas.</p>
            <div className="space-y-1 text-xs text-blue-600">
              <p className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 flex-shrink-0" /> <strong>Día de semana:</strong> sube precios en viernes/sábado</p>
              <p className="flex items-center gap-1.5"><Sun className="w-3.5 h-3.5 flex-shrink-0" /> <strong>Temporada:</strong> ajuste en un rango de fechas (ej. Semana Santa)</p>
              <p className="flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" /> <strong>Último minuto:</strong> descuento si falta poco y no se ha rentado</p>
            </div>
          </div>
        </div>
      )}

      {/* Reportes tab */}
      {activeTab === 'reportes' && <ReportesTab />}

      {/* Config tab */}
      {activeTab === 'config' && (
        <div className="px-4 mt-4 max-w-lg mx-auto space-y-3">
          {/* QR de Soporte */}
          <Link href="/admin/qr-codes" className="block bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl p-4 active:scale-[0.98] transition-transform shadow-sm">
            <div className="flex items-center gap-3">
              <Smartphone className="w-6 h-6" />
              <div>
                <p className="font-bold text-sm">🚨 QR — Botón de Pánico</p>
                <p className="text-xs text-white/80">Reportes e incidentes vía WhatsApp</p>
              </div>
              <span className="ml-auto text-lg">→</span>
            </div>
          </Link>
          {/* Textos del Hero */}
          <div className="bg-white/70 rounded-xl border border-primary-light/15 p-4">
            <h3 className="font-bold mb-3 flex items-center gap-2"><Home className="w-5 h-5 text-primary/60" /> Textos de la portada</h3>
            {!heroLoaded ? (
              <p className="text-sm text-gray-400">Cargando...</p>
            ) : (
              <div className="space-y-3">
                {[
                  { key: 'hero_badge' as const, label: 'Badge (ubicación)', placeholder: 'Santiago, Nuevo León' },
                  { key: 'hero_titulo' as const, label: 'Título principal', placeholder: 'El Escape Perfecto para tu Fin de Semana' },
                  { key: 'hero_subtitulo' as const, label: 'Subtítulo', placeholder: 'Desde una piñata inolvidable hasta...' },
                  { key: 'hero_cta' as const, label: 'Botón principal', placeholder: 'Ver Fechas y Paquetes' },
                  { key: 'hero_whatsapp' as const, label: 'Botón WhatsApp', placeholder: 'Escríbenos por WhatsApp' },
                ].map((field) => (
                  <div key={field.key}>
                    <label className="text-xs font-semibold text-gray-500 mb-1 block">{field.label}</label>
                    {field.key === 'hero_subtitulo' ? (
                      <textarea
                        value={heroTexts[field.key]}
                        onChange={(e) => setHeroTexts({ ...heroTexts, [field.key]: e.target.value })}
                        placeholder={field.placeholder}
                        rows={3}
                        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none resize-none"
                      />
                    ) : (
                      <input
                        type="text"
                        value={heroTexts[field.key]}
                        onChange={(e) => setHeroTexts({ ...heroTexts, [field.key]: e.target.value })}
                        placeholder={field.placeholder}
                        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
                      />
                    )}
                  </div>
                ))}
                <button
                  onClick={guardarHeroTexts}
                  disabled={heroSaving}
                  className="w-full bg-primary text-white font-semibold py-2.5 rounded-lg text-sm active:scale-95 transition-transform disabled:bg-gray-300"
                >
                  {heroSaving ? 'Guardando...' : heroSaved ? <span className="flex items-center justify-center gap-1.5"><Check className="w-4 h-4" /> Guardado</span> : <span className="flex items-center justify-center gap-1.5"><Save className="w-4 h-4" /> Guardar textos</span>}
                </button>
              </div>
            )}
          </div>

          {/* Colores del sitio */}
          <div className="bg-white/70 rounded-xl border border-primary-light/15 p-4">
            <h3 className="font-bold mb-4 flex items-center gap-2"><Palette className="w-5 h-5 text-primary/60" /> Colores del sitio</h3>
            <div className="space-y-4">
              {[
                { key: 'color_primary' as const, label: 'Color principal', desc: 'Botones, header, enlaces' },
                { key: 'color_primary_dark' as const, label: 'Principal oscuro', desc: 'Hover de botones' },
                { key: 'color_primary_light' as const, label: 'Principal claro', desc: 'Acentos suaves' },
                { key: 'color_accent' as const, label: 'Color acento', desc: 'CTAs especiales, urgencia' },
                { key: 'color_accent_light' as const, label: 'Acento claro', desc: 'Fondos de acento' },
                { key: 'color_background' as const, label: 'Fondo', desc: 'Color de fondo general' },
                { key: 'color_foreground' as const, label: 'Texto', desc: 'Color del texto principal' },
              ].map((item) => (
                <div key={item.key} className="flex items-center gap-3">
                  <label className="relative w-10 h-10 rounded-xl overflow-hidden border-2 border-gray-200 cursor-pointer flex-shrink-0 active:scale-95 transition-transform">
                    <input
                      type="color"
                      value={colors[item.key]}
                      onChange={(e) => updateColors({ [item.key]: e.target.value })}
                      className="absolute inset-0 w-full h-full cursor-pointer opacity-0"
                    />
                    <div className="w-full h-full" style={{ backgroundColor: colors[item.key] }} />
                  </label>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">{item.label}</p>
                    <p className="text-xs text-gray-400">{item.desc}</p>
                  </div>
                  <span className="text-xs text-gray-400 font-mono">{colors[item.key]}</span>
                </div>
              ))}
            </div>
            {saving && (
              <div className="flex items-center gap-2 mt-3 text-sm text-primary">
                <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                Guardando...
              </div>
            )}
          </div>

          {/* Presets rápidos */}
          <div className="bg-white/70 rounded-xl border border-primary-light/15 p-4">
            <h3 className="font-bold mb-3 flex items-center gap-2"><Sparkles className="w-5 h-5 text-primary/60" /> Temas rápidos</h3>
            <div className="grid grid-cols-3 gap-2">
              {[
                { name: 'Teal/Gold', colors: { color_primary: '#0d9488', color_primary_dark: '#0f766e', color_primary_light: '#5eead4', color_accent: '#d4a853', color_accent_light: '#f0deb4' } },
                { name: 'Azul/Rosa', colors: { color_primary: '#3b82f6', color_primary_dark: '#2563eb', color_primary_light: '#93c5fd', color_accent: '#ec4899', color_accent_light: '#fbcfe8' } },
                { name: 'Morado/Oro', colors: { color_primary: '#7c3aed', color_primary_dark: '#6d28d9', color_primary_light: '#c4b5fd', color_accent: '#f59e0b', color_accent_light: '#fde68a' } },
                { name: 'Verde/Coral', colors: { color_primary: '#059669', color_primary_dark: '#047857', color_primary_light: '#6ee7b7', color_accent: '#f97316', color_accent_light: '#fed7aa' } },
                { name: 'Negro/Rojo', colors: { color_primary: '#18181b', color_primary_dark: '#09090b', color_primary_light: '#71717a', color_accent: '#ef4444', color_accent_light: '#fecaca' } },
                { name: 'Rosa/Menta', colors: { color_primary: '#db2777', color_primary_dark: '#be185d', color_primary_light: '#f9a8d4', color_accent: '#14b8a6', color_accent_light: '#99f6e4' } },
              ].map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => updateColors(preset.colors)}
                  className="p-2 rounded-xl border border-gray-200 text-center active:scale-95 transition-transform hover:border-gray-300"
                >
                  <div className="flex justify-center gap-1 mb-1">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: preset.colors.color_primary }} />
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: preset.colors.color_accent }} />
                  </div>
                  <span className="text-[10px] font-medium text-gray-600">{preset.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white/70 rounded-xl border border-primary-light/15 p-4">
            <h3 className="font-bold mb-3 flex items-center gap-2"><MessageSquare className="w-5 h-5 text-primary/60" /> Notificaciones WhatsApp</h3>
            <p className="text-xs text-gray-400 mb-3">Envía recordatorios automáticos: 3 días antes, 1 día antes, y PIN el día del evento.</p>

            {/* Preview */}
            {notifPreview && (
              <div className="space-y-2 mb-3">
                <div className="flex items-center justify-between p-2 bg-blue-50 rounded-lg">
                  <span className="text-xs flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Recordatorio 3 días</span>
                  <span className="text-xs font-bold text-blue-700">{notifPreview.recordatorio_3dias.length} eventos</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-yellow-50 rounded-lg">
                  <span className="text-xs flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Recordatorio mañana</span>
                  <span className="text-xs font-bold text-yellow-700">{notifPreview.recordatorio_1dia.length} eventos</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-green-50 rounded-lg">
                  <span className="text-xs flex items-center gap-1"><KeyRound className="w-3.5 h-3.5" /> PIN del día</span>
                  <span className="text-xs font-bold text-green-700">{notifPreview.pin_dia_evento.length} eventos</span>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={previewNotificaciones}
                className="flex-1 bg-gray-100 text-gray-700 font-semibold py-2.5 rounded-lg text-sm active:scale-95 transition-transform"
              >
                <span className="flex items-center justify-center gap-1.5"><Eye className="w-4 h-4" /> Preview</span>
              </button>
              <button
                onClick={ejecutarNotificaciones}
                disabled={enviandoNotif}
                className="flex-1 bg-green-500 text-white font-semibold py-2.5 rounded-lg text-sm active:scale-95 transition-transform disabled:bg-gray-300"
              >
                {enviandoNotif ? 'Enviando...' : <span className="flex items-center justify-center gap-1.5"><Rocket className="w-4 h-4" /> Enviar ahora</span>}
              </button>
            </div>
            {notifResultado && (
              <div className="mt-3 p-3 bg-green-50 rounded-lg text-sm text-green-700 flex items-start gap-1.5">
                <Check className="w-4 h-4 flex-shrink-0 mt-0.5" /> Enviados: {notifResultado.recordatorio3} recordatorios (3d), {notifResultado.recordatorio1} recordatorios (1d), {notifResultado.pinDia} PINs
              </div>
            )}
          </div>

          <Link
            href="/"
            className="block bg-white/70 rounded-xl border border-primary-light/15 p-4 text-center text-primary font-semibold active:scale-95 transition-transform"
          >
            Ver sitio público →
          </Link>
        </div>
      )}

      {/* ═══ TERMINAL MP TAB ═══ */}
      {activeTab === 'terminal' && (
        <div className="px-4 mt-4 max-w-lg mx-auto space-y-4 pb-24">
          {/* Header */}
          <div className="bg-white/70 rounded-xl border border-primary-light/15 p-6 text-center">
            <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <CreditCard className="w-7 h-7" />
            </div>
            <h2 className="text-lg font-bold">Cobro Físico (Mercado Pago)</h2>
            <p className="text-xs text-gray-400 mt-1">Envía el cobro directo a la terminal Point</p>
          </div>

          {/* Formulario cobro */}
          <div className="bg-white/70 rounded-xl border border-primary-light/15 p-4 space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">¿Qué estamos cobrando?</label>
              <select
                value={terminalDescripcion}
                onChange={(e) => setTerminalDescripcion(e.target.value)}
                className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 text-sm focus:ring-2 focus:ring-primary/30 outline-none"
              >
                {extras.filter(e => e.activo).map(ex => (
                  <option key={ex.id} value={ex.nombre}>{ex.emoji} {ex.nombre} (${Number(ex.precio).toLocaleString('es-MX')})</option>
                ))}
                <option value="Otro">Otro (especificar)</option>
              </select>
            </div>

            {terminalDescripcion === 'Otro' && (
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Descripción</label>
                <input
                  type="text"
                  value={terminalDescCustom}
                  onChange={(e) => setTerminalDescCustom(e.target.value)}
                  className="w-full p-3 border border-gray-200 rounded-xl bg-white text-sm focus:ring-2 focus:ring-primary/30 outline-none"
                  placeholder="Ej. Servicio de meseros"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Monto (MXN)</label>
              <input
                type="number"
                value={terminalMonto}
                onChange={(e) => setTerminalMonto(e.target.value)}
                className="w-full p-3 border border-gray-200 rounded-xl bg-white text-2xl font-bold text-blue-600 focus:ring-2 focus:ring-primary/30 outline-none"
                placeholder="0.00"
              />
            </div>

            {/* Auto-fill amount when selecting an extra */}
            {terminalDescripcion !== 'Otro' && (() => {
              const matched = extras.find(e => e.nombre === terminalDescripcion);
              if (matched && terminalMonto !== String(matched.precio)) {
                return (
                  <button
                    onClick={() => setTerminalMonto(String(matched.precio))}
                    className="text-xs text-blue-500 underline"
                  >
                    Usar precio del extra: ${Number(matched.precio).toLocaleString('es-MX')}
                  </button>
                );
              }
              return null;
            })()}

            {terminalError && (
              <div className="p-3 bg-red-50 rounded-lg text-sm text-red-700 flex items-start gap-2">
                <XCircle className="w-4 h-4 flex-shrink-0 mt-0.5" /> {terminalError}
              </div>
            )}

            {terminalEstado === 'pagado' && (
              <div className="p-3 bg-green-50 rounded-lg text-sm text-green-700 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" /> ¡Pago aprobado! El cobro se procesó correctamente.
              </div>
            )}

            <button
              onClick={async () => {
                if (!terminalMonto || Number(terminalMonto) <= 0) {
                  setTerminalError('Ingresa un monto válido');
                  return;
                }
                setTerminalError('');
                setTerminalEstado('enviando');
                try {
                  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
                  const desc = terminalDescripcion === 'Otro' ? terminalDescCustom : terminalDescripcion;
                  const resp = await fetch(`${API_URL}/api/terminal/cobrar`, {
                    method: 'POST',
                    headers: adminHeaders({ 'Content-Type': 'application/json' }),
                    body: JSON.stringify({ monto: Number(terminalMonto), descripcion: desc }),
                  });
                  const data = await resp.json();
                  if (!resp.ok) throw new Error(data.message);
                  setTerminalIntentId(data.payment_intent_id);
                  setTerminalEstado('esperando');
                  // Poll cada 3s para verificar estado
                  if (terminalPollRef.current) clearInterval(terminalPollRef.current);
                  terminalPollRef.current = setInterval(async () => {
                    try {
                      const statusResp = await fetch(`${API_URL}/api/terminal/estado/${data.payment_intent_id}`, { headers: adminHeaders() });
                      const statusData = await statusResp.json();
                      if (statusData.estado === 'pagado') {
                        setTerminalEstado('pagado');
                        if (terminalPollRef.current) clearInterval(terminalPollRef.current);
                        cargarHistorialTerminal();
                      } else if (statusData.estado === 'cancelado' || statusData.estado === 'error') {
                        setTerminalEstado('error');
                        setTerminalError('El cobro fue cancelado o falló');
                        if (terminalPollRef.current) clearInterval(terminalPollRef.current);
                      }
                    } catch {}
                  }, 3000);
                } catch (err: unknown) {
                  setTerminalEstado('error');
                  setTerminalError(err instanceof Error ? err.message : 'Error al enviar cobro');
                }
              }}
              disabled={terminalEstado === 'enviando' || terminalEstado === 'esperando'}
              className={`w-full font-bold py-4 rounded-xl shadow-lg transition-all text-sm ${
                terminalEstado === 'esperando'
                  ? 'bg-amber-400 text-white animate-pulse'
                  : terminalEstado === 'enviando'
                  ? 'bg-gray-300 text-gray-500'
                  : terminalEstado === 'pagado'
                  ? 'bg-green-500 text-white'
                  : 'bg-blue-600 hover:bg-blue-500 text-white active:scale-[0.98]'
              }`}
            >
              {terminalEstado === 'enviando' ? (
                <span className="flex items-center justify-center gap-2"><Loader2 className="w-5 h-5 animate-spin" /> Enviando...</span>
              ) : terminalEstado === 'esperando' ? (
                <span className="flex items-center justify-center gap-2"><Loader2 className="w-5 h-5 animate-spin" /> Esperando que el cliente pase la tarjeta...</span>
              ) : terminalEstado === 'pagado' ? (
                <span className="flex items-center justify-center gap-2"><CheckCircle2 className="w-5 h-5" /> ¡Pagado!</span>
              ) : (
                <span className="flex items-center justify-center gap-2"><CreditCard className="w-5 h-5" /> Enviar cobro a la Terminal</span>
              )}
            </button>

            {terminalEstado === 'esperando' && (
              <button
                onClick={async () => {
                  try {
                    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
                    await fetch(`${API_URL}/api/terminal/cancelar/${terminalIntentId}`, { method: 'DELETE', headers: adminHeaders() });
                  } catch {}
                  if (terminalPollRef.current) clearInterval(terminalPollRef.current);
                  setTerminalEstado('listo');
                  setTerminalIntentId('');
                }}
                className="w-full text-sm text-red-500 font-semibold py-2"
              >
                Cancelar cobro
              </button>
            )}

            {terminalEstado === 'pagado' && (
              <button
                onClick={() => {
                  setTerminalEstado('listo');
                  setTerminalMonto('');
                  setTerminalIntentId('');
                }}
                className="w-full text-sm text-primary font-semibold py-2"
              >
                Nuevo cobro
              </button>
            )}
          </div>

          {/* Historial */}
          <div className="bg-white/70 rounded-xl border border-primary-light/15 p-4">
            <h3 className="font-bold text-sm mb-3 flex items-center gap-2"><History className="w-4 h-4 text-primary/60" /> Últimos cobros</h3>
            {terminalHistorial.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4">Sin cobros registrados</p>
            ) : (
              <div className="space-y-2">
                {terminalHistorial.map(p => (
                  <div key={p.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <div>
                      <p className="text-sm font-semibold">{p.descripcion}</p>
                      <p className="text-xs text-gray-400">{new Date(p.creado_en).toLocaleString('es-MX')}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">${Number(p.monto).toLocaleString('es-MX')}</p>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        p.estado === 'pagado' ? 'bg-green-100 text-green-700'
                        : p.estado === 'enviado' ? 'bg-amber-100 text-amber-700'
                        : p.estado === 'cancelado' ? 'bg-gray-100 text-gray-500'
                        : 'bg-red-100 text-red-700'
                      }`}>{p.estado}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ───────── CORPORATIVO TAB ───────── */}
      {activeTab === 'corporativo' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" /> Leads Corporativos
            </h2>
            <span className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full font-semibold">{leadsCorp.length} leads</span>
          </div>

          {corpCargando ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
          ) : leadsCorp.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">Aún no hay cotizaciones corporativas</p>
            </div>
          ) : (
            <div className="space-y-3">
              {leadsCorp.map(lead => (
                <div key={lead.id} className="bg-white/70 rounded-xl border border-primary-light/15 p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-bold text-sm">{lead.empresa}</p>
                      <p className="text-xs text-gray-500">{lead.contacto} · {lead.email}</p>
                    </div>
                    <select
                      value={lead.estado}
                      onChange={async (e) => {
                        const nuevoEstado = e.target.value;
                        try {
                          await fetchAPI(`/api/corporativo/leads/${lead.id}`, {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ estado: nuevoEstado }),
                          });
                          setLeadsCorp(prev => prev.map(l => l.id === lead.id ? { ...l, estado: nuevoEstado } : l));
                        } catch { /* ignore */ }
                      }}
                      className={`text-[11px] font-bold px-2 py-1 rounded-full border-0 cursor-pointer ${
                        lead.estado === 'pagado' ? 'bg-green-100 text-green-700'
                        : lead.estado === 'cotizado' ? 'bg-blue-100 text-blue-700'
                        : lead.estado === 'cancelado' ? 'bg-gray-100 text-gray-500'
                        : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      <option value="pendiente">Pendiente</option>
                      <option value="cotizado">Cotizado</option>
                      <option value="pagado">Pagado</option>
                      <option value="cancelado">Cancelado</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-[11px]">
                    <div className="bg-gray-50 rounded-lg p-2 text-center">
                      <p className="text-gray-400">Folio</p>
                      <p className="font-bold text-xs">{lead.folio}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2 text-center">
                      <p className="text-gray-400">Asistentes</p>
                      <p className="font-bold text-xs">{lead.num_asistentes}</p>
                    </div>
                    <div className="bg-primary/5 rounded-lg p-2 text-center">
                      <p className="text-gray-400">Total</p>
                      <p className="font-bold text-xs text-primary">${Number(lead.total).toLocaleString('es-MX')}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-gray-400">
                    <span>{lead.fecha_evento ? new Date(lead.fecha_evento + 'T12:00:00').toLocaleDateString('es-MX') : 'Sin fecha'} · {lead.paquete_base || 'Sin paq.'}</span>
                    <div className="flex gap-2">
                      {lead.telefono && (
                        <a href={`tel:${lead.telefono}`} className="text-primary font-semibold"><Phone className="w-3.5 h-3.5" /></a>
                      )}
                      <a href={`mailto:${lead.email}`} className="text-primary font-semibold"><Mail className="w-3.5 h-3.5" /></a>
                      <a href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/corporativo/pdf/${lead.folio}`} target="_blank" rel="noopener noreferrer" className="text-primary font-semibold flex items-center gap-1">
                        PDF ↓
                      </a>
                    </div>
                  </div>
                  {(lead.rfc || lead.razon_social) && (
                    <p className="text-[10px] text-gray-400">RFC: {lead.rfc || '—'} · {lead.razon_social || ''}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ───────── PROMOTORES TAB (Vista del Jefe) ───────── */}
      {activeTab === 'promotores' && (
        <div className="space-y-4">
          {promCargando ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
          ) : (
            <>
              {/* Métricas del negocio */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white/70 rounded-xl border border-primary-light/15 p-4 text-center">
                  <p className="text-[10px] text-gray-400 font-semibold uppercase">Ingresos Brutos</p>
                  <p className="text-xl font-extrabold text-gray-800 mt-1">${(promotorStats?.ingresos_brutos ?? 0).toLocaleString('es-MX')}</p>
                </div>
                <div className="bg-white/70 rounded-xl border border-red-100 p-4 text-center">
                  <p className="text-[10px] text-gray-400 font-semibold uppercase">Comisiones</p>
                  <p className="text-xl font-extrabold text-red-600 mt-1">-${(promotorStats?.total_comisiones ?? 0).toLocaleString('es-MX')}</p>
                </div>
                <div className="bg-gradient-to-br from-teal-500 to-teal-700 rounded-xl p-4 text-center text-white">
                  <p className="text-[10px] text-teal-100 font-semibold uppercase">Tu Ganancia</p>
                  <p className="text-xl font-extrabold mt-1">${(promotorStats?.ingresos_netos ?? 0).toLocaleString('es-MX')}</p>
                </div>
              </div>

              {/* Leaderboard */}
              {promotorStats?.leaderboard && promotorStats.leaderboard.length > 0 && (
                <div className="bg-white/70 rounded-xl border border-primary-light/15 p-4">
                  <h3 className="font-bold text-sm flex items-center gap-2 mb-4">
                    <Trophy className="w-4 h-4 text-yellow-500" /> Ranking de Vendedores — {new Date().toLocaleDateString('es-MX', { month: 'long' })}
                  </h3>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={promotorStats.leaderboard} layout="vertical" margin={{ left: 0, right: 8, top: 0, bottom: 0 }}>
                        <XAxis type="number" tickFormatter={(v: number) => `$${(v/1000).toFixed(0)}k`} fontSize={10} />
                        <YAxis dataKey="nombre" type="category" width={70} fontSize={11} tickLine={false} axisLine={false} />
                        <Tooltip
                          formatter={(value) => [`$${Number(value).toLocaleString('es-MX')}`, 'Ventas']}
                          contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '12px' }}
                        />
                        <Bar dataKey="ventas" radius={[0, 8, 8, 0]} barSize={24}>
                          {promotorStats.leaderboard.map((_, i) => (
                            <Cell key={i} fill={i === 0 ? '#0d9488' : i === 1 ? '#5eead4' : '#d1d5db'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  {/* Lista de detalle */}
                  <div className="mt-4 space-y-2">
                    {promotorStats.leaderboard.map((p, i) => (
                      <div key={p.id} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-yellow-100 text-yellow-700' : i === 1 ? 'bg-gray-100 text-gray-600' : 'bg-gray-50 text-gray-400'}`}>
                            {i + 1}
                          </span>
                          <span className="font-semibold">{p.nombre}</span>
                          <span className="text-xs text-gray-400">({p.codigo_ref})</span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-primary">{p.reservas} ventas</span>
                          <span className="text-xs text-gray-400 ml-2">${p.comision.toLocaleString('es-MX')} com.</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Lista de promotores */}
              <div className="bg-white/70 rounded-xl border border-primary-light/15 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-sm flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary" /> Promotores ({promotores.length})
                  </h3>
                </div>
                <div className="space-y-2">
                  {promotores.map((p) => (
                    <div key={p.id} className={`flex items-center justify-between p-3 rounded-lg ${p.activo ? 'bg-gray-50' : 'bg-red-50/50'}`}>
                      <div>
                        <p className="font-semibold text-sm">{p.nombre}</p>
                        <p className="text-xs text-gray-400">{p.email} · ref: <span className="font-mono text-primary">{p.codigo_ref}</span></p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className="text-xs font-bold text-teal-600">{p.comision_porcentaje}%</span>
                          <p className={`text-[10px] ${p.activo ? 'text-green-500' : 'text-red-400'}`}>{p.activo ? 'Activo' : 'Inactivo'}</p>
                        </div>
                        <button
                          onClick={async () => {
                            if (!confirm(`¿Eliminar a ${p.nombre}? Esta acción no se puede deshacer.`)) return;
                            try {
                              await fetchAPI(`/api/promotores/${p.id}`, { method: 'DELETE' });
                              setPromotores(promotores.filter(x => x.id !== p.id));
                            } catch { alert('Error al eliminar'); }
                          }}
                          className="p-1.5 rounded-lg bg-red-50 text-red-400 hover:text-red-600 hover:bg-red-100 active:scale-90 transition-all"
                          title="Eliminar promotor"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Crear nuevo promotor */}
              <div className="bg-white/70 rounded-xl border border-primary-light/15 p-4">
                <h3 className="font-bold text-sm flex items-center gap-2 mb-3">
                  <UserPlus className="w-4 h-4 text-primary" /> Registrar Promotor
                </h3>
                {promError && <p className="text-xs text-red-500 mb-2">{promError}</p>}
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Nombre completo"
                    value={nuevoPromotor.nombre}
                    onChange={(e) => setNuevoPromotor(p => ({ ...p, nombre: e.target.value }))}
                    className="w-full p-2.5 rounded-lg border border-gray-200 text-sm"
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    value={nuevoPromotor.email}
                    onChange={(e) => setNuevoPromotor(p => ({ ...p, email: e.target.value }))}
                    className="w-full p-2.5 rounded-lg border border-gray-200 text-sm"
                  />
                  <input
                    type="password"
                    placeholder="Contraseña"
                    value={nuevoPromotor.password}
                    onChange={(e) => setNuevoPromotor(p => ({ ...p, password: e.target.value }))}
                    className="w-full p-2.5 rounded-lg border border-gray-200 text-sm"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Código ref (ej: aldo)"
                      value={nuevoPromotor.codigo_ref}
                      onChange={(e) => setNuevoPromotor(p => ({ ...p, codigo_ref: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '') }))}
                      className="w-full p-2.5 rounded-lg border border-gray-200 text-sm font-mono"
                    />
                    <input
                      type="number"
                      placeholder="Comisión %"
                      value={nuevoPromotor.comision_porcentaje}
                      onChange={(e) => setNuevoPromotor(p => ({ ...p, comision_porcentaje: e.target.value }))}
                      className="w-full p-2.5 rounded-lg border border-gray-200 text-sm"
                    />
                  </div>
                  <button
                    disabled={promCreando || !nuevoPromotor.nombre || !nuevoPromotor.email || !nuevoPromotor.password || !nuevoPromotor.codigo_ref}
                    onClick={async () => {
                      setPromCreando(true);
                      setPromError('');
                      try {
                        await fetchAPI('/api/promotores', {
                          method: 'POST',
                          body: JSON.stringify({
                            nombre: nuevoPromotor.nombre,
                            email: nuevoPromotor.email,
                            password: nuevoPromotor.password,
                            codigo_ref: nuevoPromotor.codigo_ref,
                            comision_porcentaje: Number(nuevoPromotor.comision_porcentaje) || 10,
                          }),
                        });
                        setNuevoPromotor({ nombre: '', email: '', password: '', codigo_ref: '', comision_porcentaje: '10' });
                        const [pList, pStats] = await Promise.all([
                          fetchAPI('/api/promotores'),
                          fetchAPI('/api/promotores/admin/stats'),
                        ]);
                        setPromotores(pList);
                        setPromotorStats(pStats);
                      } catch (err) {
                        setPromError(err instanceof Error ? err.message : 'Error creando promotor');
                      } finally {
                        setPromCreando(false);
                      }
                    }}
                    className="w-full bg-primary text-white font-semibold py-2.5 rounded-lg text-sm disabled:bg-gray-300 active:scale-[0.98] transition-transform"
                  >
                    {promCreando ? 'Creando...' : 'Crear Promotor'}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Admin bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/85 backdrop-blur-lg border-t border-primary-light/20 shadow-[0_-2px_10px_rgba(0,0,0,0.04)]">
        <div className="flex justify-around items-center h-16 max-w-lg mx-auto overflow-x-auto">
          {[
            { key: 'reservaciones' as const, Icon: ClipboardList, label: 'Reservas' },
            { key: 'hoy' as const, Icon: CalendarDays, label: 'Hoy' },
            { key: 'extras' as const, Icon: Gift, label: 'Extras' },
            { key: 'paquetes' as const, Icon: Package, label: 'Paquetes' },
            { key: 'accesos' as const, Icon: KeyRound, label: 'Accesos' },
            { key: 'resenas' as const, Icon: Star, label: 'Reseñas' },
            { key: 'precios' as const, Icon: DollarSign, label: 'Precios' },
            { key: 'reportes' as const, Icon: BarChart3, label: 'Reportes' },
            { key: 'terminal' as const, Icon: CreditCard, label: 'Terminal' },
            { key: 'corporativo' as const, Icon: Building2, label: 'B2B' },
            { key: 'promotores' as const, Icon: Trophy, label: 'Promotores' },
            { key: 'galeria' as const, Icon: Camera, label: 'Galería' },
            { key: 'config' as const, Icon: Settings, label: 'Config' },
          ].map((tab) => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`flex flex-col items-center flex-shrink-0 px-1 ${activeTab === tab.key ? 'text-primary' : 'text-gray-400'}`}>
              <tab.Icon className="w-5 h-5" />
              <span className="text-[10px] mt-0.5">{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
