'use client';

import { Suspense, useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSession, signIn, signOut } from 'next-auth/react';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import { Paquete, paquetesFallback } from '@/lib/paquetes';
import { fetchAPI } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import {
  Check, Flame, DollarSign, Gift, KeyRound, Clock, Copy, Lightbulb,
  Landmark, Store, CreditCard, Smartphone, Calendar
} from 'lucide-react';
import SignatureCanvas from 'react-signature-canvas';

interface Extra {
  id: number;
  nombre: string;
  descripcion: string;
  precio: number;
  emoji: string;
}

export default function ReservarPage() {
  return (
    <Suspense>
      <ReservarContent />
    </Suspense>
  );
}

function ReservarContent() {
  const searchParams = useSearchParams();
  const paqueteIdParam = searchParams.get('paquete');
  const { data: session } = useSession();
  const { t, locale } = useI18n();

  const esInvitado = searchParams.get('invitado') === '1';
  const nombreParam = searchParams.get('nombre') || '';
  const emailParam = searchParams.get('email') || '';
  const telefonoParam = searchParams.get('telefono') || '';

  const totalSteps = 6;
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    paquete_id: paqueteIdParam || '',
    nombre: '',
    telefono: '',
    email: '',
    fecha_inicio: '',
    fecha_fin: '',
    hora_inicio: '15:00',
    num_invitados: '',
    notas: '',
    promotor: '',
  });

  useEffect(() => {
    if (session?.user) {
      setForm((prev) => ({
        ...prev,
        nombre: prev.nombre || session.user?.name || '',
        email: prev.email || session.user?.email || '',
      }));
    } else if (esInvitado) {
      setForm((prev) => ({
        ...prev,
        nombre: prev.nombre || nombreParam,
        email: prev.email || emailParam,
        telefono: prev.telefono || telefonoParam,
      }));
    }
  }, [session, esInvitado, nombreParam, emailParam, telefonoParam]);

  // Leer promotor de localStorage (guardado por RastreadorRef con ?ref=)
  useEffect(() => {
    const promotorGuardado = localStorage.getItem('promotor_quinta');
    if (promotorGuardado) {
      setForm((prev) => ({ ...prev, promotor: prev.promotor || promotorGuardado }));
    }
  }, []);

  // Cargar paquetes disponibles
  useEffect(() => {
    fetchAPI('/api/paquetes')
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setPaquetes(data.map((p: Paquete) => ({ ...p, precio: Number(p.precio) })));
        }
      })
      .catch(() => {});
  }, []);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState(false);
  const [reservacionId, setReservacionId] = useState<number | null>(null);
  const [clienteId, setClienteId] = useState<number | null>(null);
  const [codigoPin, setCodigoPin] = useState<string | null>(null);
  const [pagando, setPagando] = useState(false);
  const [metodoPago, setMetodoPago] = useState<'credito' | 'debito' | 'spei' | 'mercadopago' | null>(null);

  // Openpay / Paynet / SPEI
  const [referenciaPaynet, setReferenciaPaynet] = useState<string | null>(null);
  const [barcodeUrl, setBarcodeUrl] = useState<string | null>(null);
  const [fechaVencimiento, setFechaVencimiento] = useState<string | null>(null);
  const [montoAnticipo, setMontoAnticipo] = useState<number | null>(null);
  const [mesesSinIntereses, setMesesSinIntereses] = useState(1);
  const [clabeSpei, setClabeSpei] = useState<string | null>(null);

  // Apple Pay
  const [applePayDisponible, setApplePayDisponible] = useState(false);
  const [applePayExito, setApplePayExito] = useState(false);

  // Extras (upselling)
  const [extrasDisponibles, setExtrasDisponibles] = useState<Extra[]>([]);
  const [extrasSeleccionados, setExtrasSeleccionados] = useState<Map<number, number>>(new Map());

  // Firma digital
  const sigCanvas = useRef<SignatureCanvas>(null);

  // INE / Identificación
  const [ineUrl, setIneUrl] = useState<string | null>(null);
  const [ineSubiendo, setIneSubiendo] = useState(false);
  const [ineNombre, setIneNombre] = useState<string | null>(null);

  // Disponibilidad del calendario
  const [calendario, setCalendario] = useState<Record<string, { reservaciones: number; disponible: boolean }>>({});
  const [horariosOcupados, setHorariosOcupados] = useState<{ hora_inicio: string; hora_fin: string; paquete_id: number }[]>([]);
  const [firmaGuardada, setFirmaGuardada] = useState(false);
  const [paquetes, setPaquetes] = useState<Paquete[]>(paquetesFallback);

  // Detectar tipo de paquete actual
  const paqueteActual = paquetes.find(p => String(p.id) === form.paquete_id);
  const esNoche = paqueteActual?.tipo_duracion === 'noche';

  // Precios dinámicos del mes
  const [preciosMes, setPreciosMes] = useState<Record<string, { precioBase: number; precioFinal: number; tieneDescuento: boolean; porcentajeDescuento: number }>>({});

  // Cargar extras y paquetes
  useEffect(() => {
    fetchAPI('/api/extras')
      .then(setExtrasDisponibles)
      .catch(() => {});
    fetchAPI('/api/paquetes').then((data) => {
      if (Array.isArray(data) && data.length > 0) {
        const parsed = data.map((p: Paquete) => ({ ...p, precio: Number(p.precio) }));
        setPaquetes(parsed);
        if (!paqueteIdParam && parsed.length > 0) {
          setForm((prev) => ({ ...prev, paquete_id: String(parsed[0].id) }));
        }
      }
    }).catch(() => {});
  }, [paqueteIdParam]);

  // Detectar Apple Pay
  useEffect(() => {
    if (typeof window !== 'undefined' && window.PaymentRequest) {
      const pr = new PaymentRequest(
        [{ supportedMethods: 'https://apple.com/apple-pay', data: { version: 3, merchantIdentifier: process.env.NEXT_PUBLIC_APPLE_PAY_MERCHANT_ID || 'merchant.com.quintadeali.openpay', merchantCapabilities: ['supports3DS'], supportedNetworks: ['visa', 'masterCard', 'amex'], countryCode: 'MX' } }],
        { total: { label: 'Test', amount: { currency: 'MXN', value: '1.00' } } }
      );
      pr.canMakePayment().then((ok) => setApplePayDisponible(!!ok)).catch(() => {});
    }
  }, []);

  const paqueteSeleccionado = paquetes.find((p) => String(p.id) === form.paquete_id);

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  // Bug 4 fix: Manejar cambio de paquete con validación de fechas
  function handleChangePaquete(newPaqueteId: string) {
    const oldPaquete = paquetes.find(p => String(p.id) === form.paquete_id);
    const newPaquete = paquetes.find(p => String(p.id) === newPaqueteId);
    
    // Bug 5 fix: Si el tipo de paquete cambia, pedir confirmación
    if (oldPaquete && newPaquete && oldPaquete.tipo_duracion !== newPaquete.tipo_duracion) {
      const confirmed = window.confirm(`⚠️ Cambiar de ${oldPaquete.nombre} a ${newPaquete.nombre} borrará las fechas seleccionadas. ¿Continuar?`);
      if (confirmed) {
        setForm((prev) => ({
          ...prev,
          paquete_id: newPaqueteId,
          fecha_inicio: '',
          fecha_fin: '',
        }));
      }
    } else {
      updateField('paquete_id', newPaqueteId);
    }
  }

  function toggleExtra(extraId: number) {
    setExtrasSeleccionados((prev) => {
      const next = new Map(prev);
      if (next.has(extraId)) {
        next.delete(extraId);
      } else {
        next.set(extraId, 1);
      }
      return next;
    });
  }

  function getMontoExtras() {
    let total = 0;
    extrasSeleccionados.forEach((cant, id) => {
      const extra = extrasDisponibles.find((e) => e.id === id);
      if (extra) total += extra.precio * cant;
    });
    return total;
  }

  // Parse date string in local timezone (not UTC)
  function parseLocalDate(dateStr: string): Date {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  // Format date to YYYY-MM-DD in local timezone
  function formatDateLocal(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Precio dinámico del día seleccionado o rango de noches
  function calcularPrecioPaquete(): number {
    if (esNoche && form.fecha_inicio && form.fecha_fin) {
      // Para paquetes de noche: sumar precios de cada día en el rango
      let totalPrecio = 0;
      const inicio = parseLocalDate(form.fecha_inicio);
      const fin = parseLocalDate(form.fecha_fin);
      let fechaActual = new Date(inicio);
      
      while (fechaActual <= fin) {
        const dateStr = formatDateLocal(fechaActual);
        const precioDelDia = preciosMes[dateStr];
        totalPrecio += precioDelDia ? precioDelDia.precioFinal : (paqueteSeleccionado?.precio || 0);
        fechaActual.setDate(fechaActual.getDate() + 1);
      }
      return totalPrecio;
    } else if (form.fecha_inicio) {
      // Para paquetes de horas: precio del día único
      const precioDelDia = preciosMes[form.fecha_inicio];
      return precioDelDia ? precioDelDia.precioFinal : (paqueteSeleccionado?.precio || 0);
    }
    return paqueteSeleccionado?.precio || 0;
  }

  const precioPaquete = calcularPrecioPaquete();

  function getMontoTotal() {
    return precioPaquete + getMontoExtras();
  }

  function limpiarFirma() {
    sigCanvas.current?.clear();
    setFirmaGuardada(false);
  }

  async function subirINE(file: File) {
    setIneSubiendo(true);
    try {
      const MAX_SIZE = 5 * 1024 * 1024;
      if (file.size > MAX_SIZE) {
        throw new Error(`Archivo muy grande. Máximo: 5MB. Actual: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
      }
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Solo JPG, PNG, WebP o PDF');
      }
      const formData = new FormData();
      formData.append('ine', file);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/reservaciones/subir-ine`, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error('Error al subir el archivo');
      const data = await res.json();
      setIneUrl(data.url);
      setIneNombre(file.name);
    } catch (err) {
      const message = err instanceof Error ? err.message : t('reservar.ine_error');
      setError(message);
    } finally {
      setIneSubiendo(false);
    }
  }

  async function enviarReservacion() {
    setLoading(true);
    setError('');
    
    // Bug 11 + Bug 7 fix: Validar que teléfono esté presente (requerido para PIN)
    if (!form.telefono || form.telefono.trim() === '') {
      setError('El teléfono es requerido para recibir el código PIN por WhatsApp');
      setLoading(false);
      return;
    }
    
    try {
      const partes = form.nombre.trim().split(' ');
      const nombre = partes[0];
      const apellido = partes.slice(1).join(' ');
      const googleId = (session?.user as Record<string, unknown>)?.google_id as string | undefined;

      // Preparar extras
      const extrasArray = Array.from(extrasSeleccionados.entries()).map(([id, cantidad]) => {
        const extra = extrasDisponibles.find((e) => e.id === id);
        return { id, cantidad, precio: extra?.precio || 0 };
      });

      const data = await fetchAPI('/api/reservaciones/completa', {
        method: 'POST',
        body: JSON.stringify({
          nombre,
          apellido,
          telefono: form.telefono || undefined,
          email: form.email,
          google_id: googleId || undefined,
          es_invitado: esInvitado || !session,
          paquete_id: Number(form.paquete_id),
          fecha_evento: form.fecha_inicio,
          fecha_fin: form.fecha_fin || undefined,
          hora_inicio: form.hora_inicio,
          num_invitados: form.num_invitados ? Number(form.num_invitados) : undefined,
          notas: form.notas || undefined,
          ine_url: ineUrl || undefined,
          extras: extrasArray,
          promotor: form.promotor || undefined,
        }),
      });

      const resId = data.reservacion.id;
      const cliId = data.cliente_id;
      setReservacionId(resId);
      setClienteId(cliId);

      // Guardar firma digital si existe
      if (sigCanvas.current && !sigCanvas.current.isEmpty()) {
        const firmaBase64 = sigCanvas.current.toDataURL('image/png');
        try {
          await fetchAPI('/api/firmas', {
            method: 'POST',
            body: JSON.stringify({
              reservacion_id: resId,
              cliente_id: cliId,
              firma_base64: firmaBase64,
            }),
          });
        } catch {
          // No bloquear la reservación si falla la firma
        }
      }

      // PIN se generará automáticamente después del pago (webhook)

      setExito(true);
      setStep(6);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al crear la reservación';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  async function pagarAnticipo() {
    if (!reservacionId) return;
    setPagando(true);
    setError('');
    try {
      const data = await fetchAPI('/api/pagos/generar-referencia', {
        method: 'POST',
        body: JSON.stringify({ reservacion_id: reservacionId }),
      });
      setReferenciaPaynet(data.referencia);
      setBarcodeUrl(data.barcode_url);
      setFechaVencimiento(data.fecha_vencimiento);
      setMontoAnticipo(data.monto);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al generar referencia de pago';
      setError(msg);
    } finally {
      setPagando(false);
    }
  }

  async function pagarConTarjeta(tipoTarjeta: 'credito' | 'debito', meses: number = 1) {
    if (!reservacionId) return;
    setPagando(true);
    setError('');
    try {
      const data = await fetchAPI('/api/pagos/generar-cargo-tarjeta', {
        method: 'POST',
        body: JSON.stringify({ 
          reservacion_id: reservacionId,
          tipo_tarjeta: tipoTarjeta,
          meses: tipoTarjeta === 'credito' ? meses : 1,
        }),
      });
      if (data.payment_url) {
        window.location.href = data.payment_url;
      } else {
        setError('No se pudo generar el enlace de pago');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al generar cargo con tarjeta';
      setError(msg);
    } finally {
      setPagando(false);
    }
  }

  async function pagarConSpei() {
    if (!reservacionId) return;
    setPagando(true);
    setError('');
    try {
      const data = await fetchAPI('/api/pagos/generar-spei', {
        method: 'POST',
        body: JSON.stringify({ reservacion_id: reservacionId }),
      });
      setClabeSpei(data.clabe);
      setMontoAnticipo(data.monto);
      setFechaVencimiento(data.fecha_vencimiento);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al generar transferencia SPEI';
      setError(msg);
    } finally {
      setPagando(false);
    }
  }

  async function pagarConMercadoPago() {
    if (!reservacionId) return;
    setPagando(true);
    setError('');
    try {
      const data = await fetchAPI('/api/mercadopago/crear-preferencia', {
        method: 'POST',
        body: JSON.stringify({ reservacion_id: reservacionId }),
      });
      // Redirigir a MercadoPago Checkout
      if (data.init_point) {
        window.location.href = data.init_point;
      } else if (data.sandbox_init_point) {
        window.location.href = data.sandbox_init_point;
      } else {
        setError('No se pudo obtener el enlace de pago');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al conectar con MercadoPago';
      setError(msg);
      setPagando(false);
    }
  }

  // Calendario
  const today = new Date();
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [viewYear, setViewYear] = useState(today.getFullYear());

  // Cargar disponibilidad al cambiar de mes
  useEffect(() => {
    const mes = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}`;
    fetchAPI(`/api/reservaciones/calendario?mes=${mes}`)
      .then((data) => setCalendario(data))
      .catch(() => setCalendario({}));
  }, [viewMonth, viewYear]);

  // Cargar precios dinámicos del mes
  useEffect(() => {
    if (!form.paquete_id) return;
    const mes = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}`;
    fetchAPI(`/api/precios/calendario?paquete_id=${form.paquete_id}&mes=${mes}`)
      .then((data) => setPreciosMes(data))
      .catch(() => setPreciosMes({}));
  }, [viewMonth, viewYear, form.paquete_id]);

  // Cargar horarios ocupados al seleccionar fecha - Bug 8: Debounce para evitar múltiples llamadas
  useEffect(() => {
    if (!form.fecha_inicio) { setHorariosOcupados([]); return; }
    const timer = setTimeout(() => {
      fetchAPI(`/api/reservaciones/disponibilidad?fecha=${form.fecha_inicio}`)
        .then((data) => setHorariosOcupados(data))
        .catch(() => setHorariosOcupados([]));
    }, 500);
    return () => clearTimeout(timer);
  }, [form.fecha_inicio]);

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();
  const monthNames = locale === 'en'
    ? ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
    : ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); }
    else setViewMonth(viewMonth - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); }
    else setViewMonth(viewMonth + 1);
  }
  function selectDate(day: number) {
    const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    if (esNoche) {
      // Para paquetes de noche: permitir rango
      if (!form.fecha_inicio) {
        updateField('fecha_inicio', dateStr);
        updateField('fecha_fin', '');
      } else if (!form.fecha_fin) {
        if (dateStr > form.fecha_inicio) {
          updateField('fecha_fin', dateStr);
        } else if (dateStr < form.fecha_inicio) {
          updateField('fecha_fin', form.fecha_inicio);
          updateField('fecha_inicio', dateStr);
        } else {
          updateField('fecha_inicio', '');
          updateField('fecha_fin', '');
        }
      } else {
        updateField('fecha_inicio', dateStr);
        updateField('fecha_fin', '');
      }
    } else {
      // Para paquetes de horas: solo un día
      updateField('fecha_inicio', dateStr);
      updateField('fecha_fin', '');
    }
  }

  // Función para verificar si una fecha está dentro del rango
  function isInRange(day: number): boolean {
    if (!form.fecha_inicio || !form.fecha_fin) return false;
    const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return dateStr >= form.fecha_inicio && dateStr <= form.fecha_fin;
  }

  // Función para calcular número de noches
  function calcularNoches(): number {
    if (!form.fecha_inicio || !form.fecha_fin) return 0;
    const inicio = parseLocalDate(form.fecha_inicio);
    const fin = parseLocalDate(form.fecha_fin);
    const diferencia = fin.getTime() - inicio.getTime();
    // Si es el mismo día (diferencia 0), cuenta como 1 noche
    return Math.max(1, Math.ceil(diferencia / (1000 * 60 * 60 * 24)));
  }
  function isDatePast(day: number) {
    const date = new Date(viewYear, viewMonth, day);
    const todayNoTime = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return date < todayNoTime;
  }

  return (
    <div className="min-h-screen pb-20 bg-background">
      <Header />

      <div className="px-6 pt-6 max-w-lg mx-auto">
        <h1 className="text-2xl font-extrabold text-foreground">{t('reservar.titulo')}</h1>

        {/* Progress bar */}
        <div className="flex gap-2 mt-4">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                i + 1 <= step ? 'bg-primary' : 'bg-primary-light/30'
              }`}
            />
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-2">
          {t('reservar.paso')} {step} {t('reservar.de')} {totalSteps} — {step === 1 ? t('reservar.step1') : step === 2 ? t('reservar.step2') : step === 3 ? t('reservar.step3') : step === 4 ? t('reservar.step4') : step === 5 ? t('reservar.step5') : t('reservar.step6')}
        </p>
      </div>

      {/* Step 1: Paquete + Calendario */}
      {step === 1 && (
        <div className="px-6 mt-6 max-w-lg mx-auto space-y-6">
          {/* Selector de paquete */}
          <div>
            <label className="block text-sm font-semibold mb-2">{t('reservar.paquete')}</label>
            <div className="grid grid-cols-2 gap-2">
              {paquetes.map((paq) => (
                <button
                  key={paq.id}
                  type="button"
                  onClick={() => handleChangePaquete(String(paq.id))}
                  className={`p-3 rounded-xl border-2 text-left transition-all active:scale-95 ${
                    form.paquete_id === String(paq.id)
                      ? 'border-primary bg-primary/5'
                      : 'border-primary-light/30 bg-white/70'
                  }`}
                >
                  <span className="text-xl">{paq.emoji}</span>
                  <p className="font-semibold text-sm mt-1">{paq.nombre}</p>
                  <p className="text-xs text-gray-400">
                    ${paq.precio.toLocaleString('es-MX')}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Mini calendario táctil */}
          <div>
            <label className="block text-sm font-semibold mb-2">{t('reservar.fecha_evento')}</label>
            <div className="bg-white/70 rounded-2xl border border-primary-light/20 p-4 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-4">
                <button type="button" onClick={prevMonth} className="p-2 rounded-full hover:bg-primary-light/20 active:scale-90">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                </button>
                <span className="font-bold">{monthNames[viewMonth]} {viewYear}</span>
                <button type="button" onClick={nextMonth} className="p-2 rounded-full hover:bg-primary-light/20 active:scale-90">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                </button>
              </div>

              <div className="grid grid-cols-7 text-center text-xs text-gray-400 mb-2">
                {['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa'].map((d) => (
                  <span key={d}>{d}</span>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1 text-center">
                {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                  <div key={`empty-${i}`} />
                ))}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const isInicio = form.fecha_inicio === dateStr;
                  const isFin = form.fecha_fin === dateStr;
                  const esRango = isInRange(day);
                  const isPast = isDatePast(day);
                  const info = calendario[dateStr];
                  const noDisponible = info && !info.disponible;
                  const precioDay = preciosMes[dateStr];
                  const precioChanged = precioDay && precioDay.precioFinal !== precioDay.precioBase;

                  return (
                    <button
                      key={day}
                      type="button"
                      disabled={isPast || noDisponible}
                      onClick={() => selectDate(day)}
                      className={`w-full aspect-square mx-auto rounded-xl text-sm font-medium transition-all active:scale-90 relative flex flex-col items-center justify-center ${
                        isInicio || isFin
                          ? 'bg-primary text-white'
                          : esRango
                          ? 'bg-primary/20 text-gray-700'
                          : isPast
                          ? 'text-gray-200 cursor-not-allowed'
                          : noDisponible
                          ? 'bg-red-200 text-red-700 cursor-not-allowed font-bold'
                          : 'hover:bg-primary/10 text-gray-700'
                      }`}
                    >
                      <span>{day}</span>
                      {precioDay && !isPast && !noDisponible && form.paquete_id && (
                        <span className={`text-[7px] leading-tight font-bold ${
                          isInicio || isFin ? 'text-white' :
                          esRango ? 'text-primary' :
                          precioDay.tieneDescuento ? 'text-green-600' :
                          precioChanged ? 'text-orange-500' : 'text-gray-400'
                        }`}>
                          ${precioDay.precioFinal.toLocaleString('es-MX')}
                        </span>
                      )}
                      {noDisponible && !isPast && (
                        <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-red-400" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Leyenda */}
              <div className="flex items-center gap-4 mt-3 pt-2 border-t border-gray-100">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-primary" />
                  <span className="text-[10px] text-gray-400">{t('reservar.seleccionado')}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-red-500" />
                  <span className="text-[10px] text-gray-400">Bloqueado</span>
                </div>
              </div>
            </div>
          </div>

          {/* Resumen de fechas seleccionadas */}
          {form.fecha_inicio && (
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                <div className="flex-1">
                  {esNoche && form.fecha_fin ? (
                    <>
                      <p className="text-sm font-semibold text-gray-700">
                        {parseLocalDate(form.fecha_inicio).toLocaleDateString('es-MX', { month: 'short', day: 'numeric' })} — {parseLocalDate(form.fecha_fin).toLocaleDateString('es-MX', { month: 'short', day: 'numeric' })}
                      </p>
                      <p className="text-xs text-primary font-bold">{calcularNoches()} {calcularNoches() === 1 ? 'noche' : 'noches'}</p>
                    </>
                  ) : (
                    <p className="text-sm font-semibold text-gray-700">
                      {parseLocalDate(form.fecha_inicio).toLocaleDateString('es-MX', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Precio dinámico del día/rango */}
          {form.fecha_inicio && paqueteSeleccionado && (
            <div className={`rounded-xl border p-3 flex items-center gap-3 ${
              esNoche && form.fecha_fin && calcularNoches() > 1
                ? 'bg-blue-50 border-blue-200'
                : precioPaquete > (paqueteSeleccionado?.precio || 0)
                ? 'bg-orange-50 border-orange-200'
                : 'bg-white/70 border-primary-light/20'
            }`}>
              <DollarSign className={`w-5 h-5 ${
                esNoche && form.fecha_fin && calcularNoches() > 1
                  ? 'text-blue-600'
                  : 'text-primary'
              }`} />
              <div className="flex-1">
                {esNoche && form.fecha_fin && calcularNoches() > 1 ? (
                  <>
                    <p className="text-sm font-semibold text-gray-700">Total por {calcularNoches()} noches</p>
                    <p className="text-xs font-bold text-blue-600">${precioPaquete.toLocaleString('es-MX')} MXN</p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-semibold text-gray-700">Precio</p>
                    <p className="text-xs font-bold text-primary">${precioPaquete.toLocaleString('es-MX')} MXN</p>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Hora de inicio */}
          <div className="bg-white/70 rounded-xl border border-primary-light/20 p-3 flex items-center gap-3">
            <span className="text-lg">🕒</span>
            <div>
              <p className="text-sm font-semibold">{t('reservar.hora_inicio')}</p>
              <p className="text-xs text-gray-400">{t('reservar.hora_fija')}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setStep(2)}
            disabled={!form.paquete_id || !form.fecha_inicio}
            className="w-full bg-primary text-white font-bold py-4 rounded-full text-base active:scale-95 transition-transform disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {t('reservar.continuar')}
          </button>
        </div>
      )}

      {/* Step 2: Datos del cliente */}
      {step === 2 && (
        <div className="px-6 mt-6 max-w-lg mx-auto space-y-4">
          {paqueteSeleccionado && (
            <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 flex items-center gap-3">
              <span className="text-2xl">{paqueteSeleccionado.emoji}</span>
              <div>
                <p className="font-bold text-sm">{paqueteSeleccionado.nombre}</p>
                <p className="text-xs text-gray-500">{form.fecha_inicio} a las {form.hora_inicio}</p>
              </div>
            </div>
          )}

          {/* Botón Google / Banner de sesión activa */}
          {!session ? (
            <button
              type="button"
              onClick={() => signIn('google')}
              className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-200 text-gray-700 font-bold py-3.5 rounded-xl shadow-sm hover:bg-gray-50 hover:border-primary transition-all active:scale-[0.98]"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {t('reservar.google_autocompletar')}
            </button>
          ) : (
            <div className="bg-primary/5 border border-primary/20 p-4 rounded-xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center text-primary font-bold">
                {form.nombre.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-foreground">{t('reservar.google_sesion_activa')} {form.nombre.split(' ')[0]}</p>
                <p className="text-xs text-gray-500">{t('reservar.google_datos_auto')}</p>
              </div>
              <button
                type="button"
                onClick={() => signOut({ redirect: false })}
                className="text-xs text-gray-400 hover:text-red-500 font-semibold transition-colors px-2 py-1"
              >
                {t('reservar.cerrar_sesion')}
              </button>
            </div>
          )}

          {/* Separador cuando no hay sesión */}
          {!session && (
            <div className="flex items-center text-gray-400 text-sm">
              <div className="flex-1 border-b border-gray-200" />
              <span className="px-3">{t('reservar.google_separador')}</span>
              <div className="flex-1 border-b border-gray-200" />
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold mb-1">{t('reservar.nombre_completo')}</label>
            <input
              type="text"
              value={form.nombre}
              onChange={(e) => updateField('nombre', e.target.value.trim())}
              placeholder={t('reservar.placeholder_nombre')}
              readOnly={!!session?.user?.name}
              className={`w-full p-3 rounded-xl border border-gray-200 text-base ${session?.user?.name ? 'bg-gray-50 text-gray-600' : ''}`}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1">{t('reservar.email')}</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => {
                const email = e.target.value;
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (email === '' || emailRegex.test(email)) {
                  updateField('email', email);
                }
              }}
              placeholder="tu@email.com"
              readOnly={!!session?.user?.email}
              className={`w-full p-3 rounded-xl border border-gray-200 text-base ${session?.user?.email ? 'bg-gray-50 text-gray-600' : ''}`}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1">🔴 {t('reservar.whatsapp_tel')}</label>
            <input
              type="tel"
              value={form.telefono}
              onChange={(e) => {
                const tel = e.target.value.replace(/[^0-9\s\-\+\(\)]/g, '');
                updateField('telefono', tel);
              }}
              placeholder="81 1234 5678"
              required
              className="w-full p-3 rounded-xl border border-gray-200 text-base"
            />
            <p className="text-xs text-gray-400 mt-1">Requerido para recibir el código PIN por WhatsApp</p>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1">{t('reservar.num_invitados')}</label>
            <input
              type="number"
              value={form.num_invitados}
              onChange={(e) => {
                const num = Number(e.target.value);
                const maxCapacity = paqueteSeleccionado?.capacidad_max || 100;
                if (e.target.value === '' || (num >= 0 && num <= maxCapacity)) {
                  updateField('num_invitados', e.target.value);
                }
              }}
              min="0"
              max={paqueteSeleccionado?.capacidad_max || 100}
              placeholder={paqueteSeleccionado ? `${t('reservar.maximo')} ${paqueteSeleccionado.capacidad_max}` : t('reservar.num_invitados')}
              className="w-full p-3 rounded-xl border border-gray-200 text-base"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1">{t('reservar.notas')}</label>
            <textarea
              value={form.notas}
              onChange={(e) => {
                if (e.target.value.length <= 500) {
                  updateField('notas', e.target.value);
                }
              }}
              placeholder={t('reservar.placeholder_notas')}
              rows={3}
              maxLength={500}
              className="w-full p-3 rounded-xl border border-gray-200 text-base resize-none"
            />
            <p className="text-xs text-gray-400 mt-1">{form.notas.length}/500</p>
          </div>

          {/* Promotor / Referido */}
          <div>
            <label className="block text-sm font-semibold mb-1">{t('reservar.promotor_label')}</label>
            <input
              type="text"
              value={form.promotor}
              onChange={(e) => {
                const sanitized = e.target.value.replace(/[<>"'&]/g, '');
                updateField('promotor', sanitized);
              }}
              placeholder={t('reservar.promotor_placeholder')}
              className="w-full p-3 rounded-xl border border-gray-200 text-base"
            />
            <p className="text-xs text-gray-400 mt-1">{t('reservar.promotor_hint')}</p>
          </div>

          {/* Subir INE / Identificación */}
          <div>
            <label className="block text-sm font-semibold mb-1">{t('reservar.ine_label')}</label>
            <p className="text-xs text-gray-500 mb-2">{t('reservar.ine_descripcion')}</p>

            {!ineUrl ? (
              <label
                className={`relative flex flex-col items-center justify-center w-full h-36 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
                  ineSubiendo ? 'border-primary/40 bg-primary/5' : 'border-gray-300 hover:border-primary hover:bg-primary/5'
                }`}
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const file = e.dataTransfer.files?.[0];
                  if (file) subirINE(file);
                }}
              >
                <input
                  type="file"
                  accept="image/*,.pdf"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) subirINE(file);
                  }}
                />
                {ineSubiendo ? (
                  <div className="flex flex-col items-center gap-2 text-primary">
                    <svg className="w-8 h-8 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <span className="text-sm font-medium">{t('reservar.ine_subiendo')}</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-gray-400">
                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 16.5V18a2.25 2.25 0 002.25 2.25h13.5A2.25 2.25 0 0021 18v-1.5m-18 0V5.25A2.25 2.25 0 005.25 3h13.5A2.25 2.25 0 0021 5.25v11.25m-18 0h18M8.25 8.25h.008v.008H8.25V8.25zm0 3h.008v.008H8.25v-.008zm0 3h.008v.008H8.25v-.008z" />
                    </svg>
                    <span className="text-sm font-medium">{t('reservar.ine_arrastra')}</span>
                    <span className="text-xs">{t('reservar.ine_formatos')}</span>
                  </div>
                )}
              </label>
            ) : (
              <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-xl">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center text-green-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-green-800">{t('reservar.ine_subida')}</p>
                  <p className="text-xs text-green-600 truncate">{ineNombre}</p>
                </div>
                <button
                  type="button"
                  onClick={() => { setIneUrl(null); setIneNombre(null); }}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="flex-1 border border-gray-300 text-gray-700 font-semibold py-4 rounded-full active:scale-95 transition-transform"
            >
              {t('reservar.atras')}
            </button>
            <button
              type="button"
              onClick={() => setStep(3)}
              disabled={!form.nombre || !form.email}
              className="flex-[2] bg-primary text-white font-bold py-4 rounded-full active:scale-95 transition-transform disabled:bg-gray-300"
            >
              {t('reservar.siguiente')}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Extras / Upselling 💰 */}
      {step === 3 && (
        <div className="px-6 mt-6 max-w-lg mx-auto space-y-4">
          <div className="text-center mb-2">
            <Gift className="w-8 h-8 text-primary/60 mx-auto" />
            <h2 className="text-lg font-bold mt-1">{t('reservar.mejora_experiencia')}</h2>
            <p className="text-sm text-gray-500">{t('reservar.agrega_extras')}</p>
          </div>

          {extrasDisponibles.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-4">{t('reservar.cargando_extras')}</p>
          ) : (
            <div className="space-y-3">
              {extrasDisponibles.map((extra) => {
                const seleccionado = extrasSeleccionados.has(extra.id);
                return (
                  <button
                    key={extra.id}
                    type="button"
                    onClick={() => toggleExtra(extra.id)}
                    className={`w-full p-4 rounded-xl border-2 text-left transition-all active:scale-[0.98] flex items-center gap-3 ${
                      seleccionado
                        ? 'border-primary bg-primary/5 shadow-sm'
                        : 'border-primary-light/30 bg-white/70'
                    }`}
                  >
                    <span className="text-2xl">{extra.emoji}</span>
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{extra.nombre}</p>
                      <p className="text-xs text-gray-400">{extra.descripcion}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-extrabold text-primary">${extra.precio.toLocaleString('es-MX')}</p>
                      {seleccionado && (
                        <span className="text-xs text-primary font-medium">{t('reservar.agregado')}</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Resumen de total */}
          <div className="bg-section-cream rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">{t('reservar.paquete')}</span>
              <span className="font-semibold">${precioPaquete.toLocaleString('es-MX')}</span>
            </div>
            {getMontoExtras() > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">{t('reservar.extras')} ({extrasSeleccionados.size})</span>
                <span className="font-semibold text-primary">+${getMontoExtras().toLocaleString('es-MX')}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-extrabold border-t pt-2">
              <span>{t('reservar.total')}</span>
              <span className="text-primary">${getMontoTotal().toLocaleString('es-MX')} MXN</span>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => {
              localStorage.setItem('reservar_form_backup', JSON.stringify(form));
              localStorage.setItem('reservar_extras_backup', JSON.stringify(Array.from(extrasSeleccionados.entries())));
              setStep(2);
            }}
              className="flex-1 border border-gray-300 text-gray-700 font-semibold py-4 rounded-full active:scale-95 transition-transform">
              {t('reservar.atras')}
            </button>
            <button type="button" onClick={() => setStep(4)}
              className="flex-[2] bg-primary text-white font-bold py-4 rounded-full active:scale-95 transition-transform">
              {t('reservar.siguiente')}
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Firma Digital del Reglamento 📝 */}
      {step === 4 && (
        <div className="px-6 mt-6 max-w-lg mx-auto space-y-4">
          <div className="text-center mb-2">
            <span className="text-3xl">📝</span>
            <h2 className="text-lg font-bold mt-1">{t('reservar.reglamento_titulo')}</h2>
            <p className="text-sm text-gray-500">{t('reservar.reglamento_subtitulo')}</p>
          </div>

          {/* Reglamento scroll */}
          <div className="bg-white/70 border border-primary-light/20 rounded-xl p-4 max-h-48 overflow-y-auto text-xs text-gray-600 space-y-2">
            <p className="font-bold text-sm text-gray-800">REGLAMENTO DE USO — La Quinta de Alí</p>
            <p>1. El horario de uso es estrictamente el contratado. La hora de entrada es a las 3:00 PM y la hora de salida según el paquete elegido.</p>
            <p>2. La capacidad máxima debe respetarse. No se permite exceder el número de invitados contratado.</p>
            <p>3. Queda prohibido el uso de fuegos artificiales, pirotecnia o cualquier elemento inflamable sin autorización.</p>
            <p>4. El cliente es responsable de cualquier daño causado a las instalaciones, mobiliario o equipo durante el evento.</p>
            <p>5. No se permite subir al techo, brincar bardas o acceder a áreas restringidas.</p>
            <p>6. El volumen de la música debe reducirse después de las 10:00 PM por respeto a los vecinos.</p>
            <p>7. Las mascotas están permitidas únicamente en áreas exteriores y bajo supervisión del dueño.</p>
            <p>8. El uso de la alberca es bajo responsabilidad del cliente. No se permite nadar bajo efectos del alcohol.</p>
            <p>9. Se cobrará una penalización por limpieza extraordinaria en caso de desorden excesivo.</p>
            <p>10. La cancelación con menos de 48 horas de anticipación no es reembolsable.</p>
          </div>

          {/* Canvas de firma */}
          <div>
            <p className="text-sm font-semibold mb-2">{t('reservar.tu_firma')}</p>
            <div className="border-2 border-dashed border-gray-300 rounded-xl overflow-hidden bg-white">
              <SignatureCanvas
                ref={sigCanvas}
                penColor="#0d9488"
                canvasProps={{
                  className: 'w-full',
                  style: { width: '100%', height: '150px' },
                }}
                onEnd={() => setFirmaGuardada(true)}
              />
            </div>
            <div className="flex justify-between mt-2">
              <button type="button" onClick={limpiarFirma}
                className="text-xs text-gray-400 underline">
                {t('reservar.limpiar_firma')}
              </button>
              {firmaGuardada && sigCanvas.current && !sigCanvas.current.isEmpty() && (
                <span className="text-xs text-green-600 font-medium">{t('reservar.firma_capturada')}</span>
              )}
            </div>
          </div>

          <p className="text-xs text-gray-400 text-center">
            {t('reservar.firma_legal')}
          </p>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setStep(3)}
              className="flex-1 border border-gray-300 text-gray-700 font-semibold py-4 rounded-full active:scale-95 transition-transform">
              {t('reservar.atras')}
            </button>
            <button type="button" onClick={() => setStep(5)}
              disabled={!firmaGuardada || (sigCanvas.current && sigCanvas.current.isEmpty())}
              className="flex-[2] bg-primary text-white font-bold py-4 rounded-full active:scale-95 transition-transform disabled:bg-gray-300 disabled:cursor-not-allowed">
              {t('reservar.revisar_confirmar')}
            </button>
          </div>
        </div>
      )}

      {/* Step 5: Confirmación */}
      {step === 5 && !exito && (
        <div className="px-6 mt-6 max-w-lg mx-auto space-y-4">
          <div className="bg-white/70 rounded-2xl border border-primary-light/20 p-5 space-y-3 backdrop-blur-sm">
            <h3 className="font-bold text-lg">{t('reservar.resumen')}</h3>

            {paqueteSeleccionado && (
              <div className="flex items-center gap-3 bg-primary/5 rounded-xl p-3">
                <span className="text-3xl">{paqueteSeleccionado.emoji}</span>
                <div>
                  <p className="font-bold">{paqueteSeleccionado.nombre}</p>
                  <p className="text-sm text-gray-500">
                    {paqueteSeleccionado.tipo_duracion === 'horas'
                      ? `${paqueteSeleccionado.duracion_horas} ${t('paquetes.horas')}`
                      : t('paquetes.noche_completa')}
                  </p>
                </div>
                <span className="ml-auto font-extrabold text-primary">
                  ${precioPaquete.toLocaleString('es-MX')}
                </span>
              </div>
            )}

            {/* Extras seleccionados */}
            {extrasSeleccionados.size > 0 && (
              <div className="border-t pt-2 space-y-1">
                <p className="text-xs text-gray-400 font-semibold">EXTRAS</p>
                {Array.from(extrasSeleccionados.entries()).map(([id, cant]) => {
                  const extra = extrasDisponibles.find((e) => e.id === id);
                  if (!extra) return null;
                  return (
                    <div key={id} className="flex justify-between text-sm">
                      <span>{extra.emoji} {extra.nombre} x{cant}</span>
                      <span className="font-semibold">+${(extra.precio * cant).toLocaleString('es-MX')}</span>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">{t('reservar.fecha')}</span>
                <span className="font-semibold">
                  {esNoche && form.fecha_fin ? `${form.fecha_inicio} → ${form.fecha_fin}` : form.fecha_inicio}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">{t('reservar.hora')}</span>
                <span className="font-semibold">{form.hora_inicio} hrs</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">{t('reservar.cliente')}</span>
                <span className="font-semibold">{form.nombre}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">{t('reservar.telefono')}</span>
                <span className="font-semibold">{form.telefono}</span>
              </div>
              {form.num_invitados && (
                <div className="flex justify-between">
                  <span className="text-gray-500">{t('reservar.invitados')}</span>
                  <span className="font-semibold">{form.num_invitados}</span>
                </div>
              )}
              {form.notas && (
                <div className="pt-2 border-t">
                  <span className="text-gray-500">{t('reservar.notas_label')}</span>
                  <p className="font-medium mt-1">{form.notas}</p>
                </div>
              )}
            </div>

            {/* Total prominente */}
            <div className="border-t pt-3">
              <div className="flex justify-between items-center">
                <span className="font-bold text-lg">{t('reservar.total')}</span>
                <span className="font-extrabold text-xl text-primary">${getMontoTotal().toLocaleString('es-MX')} MXN</span>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 text-sm p-4 rounded-xl text-center font-medium">
              {error}
            </div>
          )}

          {/* Botón de confirmar */}
          <button
            type="button"
            onClick={enviarReservacion}
            disabled={loading || !form.telefono?.trim()}
            className="w-full bg-accent text-gray-900 font-bold py-4 rounded-full text-base active:scale-95 transition-transform flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span>{t('reservar.procesando')}</span>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                {t('reservar.confirmar_reservacion')}
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => setStep(4)}
            disabled={loading}
            className="w-full border border-gray-300 text-gray-700 font-semibold py-3 rounded-full active:scale-95 transition-transform"
          >
            {t('reservar.modificar_datos')}
          </button>
        </div>
      )}

      {/* Step 6: Pago — Wizard de métodos de pago */}
      {step === 6 && exito && (
        <div className="px-6 mt-6 max-w-lg mx-auto space-y-4">
          {/* Éxito banner */}
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-center">
            <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-lg font-extrabold text-green-800">{t('reservar.exito_titulo')}</h2>
            <p className="text-sm text-green-600 mt-1">
              {t('reservar.exito_mensaje')} <span className="font-bold">#{reservacionId}</span>
            </p>
          </div>

          {/* Código PIN de acceso - Se recibirá por WhatsApp después del pago */}
          <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-200 rounded-2xl p-4 space-y-2">
            <div className="flex items-center justify-center gap-2">
              <KeyRound className="w-5 h-5 text-orange-600" />
              <p className="font-bold text-sm text-orange-900">{t('reservar.codigo_acceso')}</p>
            </div>
            <p className="text-sm text-orange-700 text-center leading-relaxed">
              🔒 Recibirás tu <strong>código PIN de acceso</strong> por WhatsApp inmediatamente después de completar el pago.
            </p>
            <p className="text-xs text-orange-600 text-center italic">
              Este PIN desbloqueará la entrada el día de tu evento.
            </p>
          </div>

          {/* Pago Único Card */}
          <div className="bg-orange-50 border border-orange-100 p-8 rounded-2xl text-center mb-2 shadow-sm">
            <p className="text-gray-500 text-sm font-medium uppercase tracking-wider mb-2">
              {t('reservar.pago_anticipo_label')}
            </p>
            <h3 className="text-5xl font-extrabold text-orange-500 mb-3">
              ${getMontoTotal().toLocaleString('es-MX')} MXN
            </h3>
            <p className="text-sm text-gray-500 font-medium">
              {t('reservar.pago_anticipo_nota')}
            </p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl text-center font-medium">
              {error}
            </div>
          )}

          {/* Si ya se generó referencia Paynet */}
          {referenciaPaynet ? (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 text-center space-y-3">
                <p className="text-sm font-semibold text-blue-800">{t('reservar.pago_referencia_titulo')}</p>
                <p className="text-3xl font-mono font-extrabold tracking-widest text-blue-900">
                  {referenciaPaynet}
                </p>
                <p className="text-xs text-blue-600">{t('reservar.pago_referencia_instruccion')}</p>
              </div>

              {barcodeUrl && (
                <div className="text-center">
                  <p className="text-xs text-gray-500 mb-2">{t('reservar.pago_codigo_barras')}</p>
                  <img src={barcodeUrl} alt="Código de barras Paynet" className="mx-auto max-w-full rounded-lg border" />
                </div>
              )}

              {fechaVencimiento && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-center">
                  <p className="text-sm text-yellow-800">
                    <Clock className="w-4 h-4 inline" /> {t('reservar.pago_vencimiento')}: <span className="font-bold">{new Date(fechaVencimiento).toLocaleString(locale === 'en' ? 'en-US' : 'es-MX', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                  </p>
                </div>
              )}

              {montoAnticipo && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center">
                  <p className="text-sm text-green-800">
                    <DollarSign className="w-4 h-4 inline" /> {t('reservar.pago_monto_pagar')}: <span className="font-extrabold">${montoAnticipo.toLocaleString('es-MX')} MXN</span>
                  </p>
                </div>
              )}

              <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-xs text-gray-600">
                <p className="font-semibold text-sm text-gray-800">{t('reservar.pago_donde_pagar')}</p>
                <p><Store className="w-3.5 h-3.5 inline" /> 7-Eleven, OXXO, Farmacias del Ahorro, Walmart</p>
                <p className="flex items-center gap-1"><Lightbulb className="w-3.5 h-3.5 flex-shrink-0" /> {t('reservar.pago_instrucciones')}</p>
              </div>
            </div>
          ) : clabeSpei ? (
            /* Resultado SPEI — CLABE generada */
            <div className="space-y-4">
              <div className="border border-primary/20 p-6 rounded-xl bg-white space-y-4 text-center">
                <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-2"><Landmark className="w-7 h-7" /></div>
                <h3 className="font-bold text-foreground">{t('reservar.spei_clabe_titulo')}</h3>
                <div className="bg-gray-900 rounded-xl p-4">
                  <p className="text-xs text-gray-400 mb-1">CLABE</p>
                  <p className="text-2xl font-mono font-extrabold tracking-widest text-white">
                    {clabeSpei}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => { navigator.clipboard.writeText(clabeSpei); }}
                  className="text-sm text-primary font-semibold underline"
                >
                  <Copy className="w-4 h-4 inline" /> {t('reservar.spei_copiar')}
                </button>
                {montoAnticipo && (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-3">
                    <p className="text-sm text-green-800">
                      <DollarSign className="w-4 h-4 inline" /> {t('reservar.pago_monto_pagar')}: <span className="font-extrabold">${montoAnticipo.toLocaleString('es-MX')} MXN</span>
                    </p>
                  </div>
                )}
                {fechaVencimiento && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3">
                    <p className="text-sm text-yellow-800">
                      <Clock className="w-4 h-4 inline" /> {t('reservar.pago_vencimiento')}: <span className="font-bold">{new Date(fechaVencimiento).toLocaleString(locale === 'en' ? 'en-US' : 'es-MX', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                    </p>
                  </div>
                )}
                <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-xs text-gray-600 text-left">
                  <p className="font-semibold text-sm text-gray-800">{t('reservar.spei_instrucciones_titulo')}</p>
                  <p>1. {t('reservar.spei_paso_1')}</p>
                  <p>2. {t('reservar.spei_paso_2')}</p>
                  <p>3. {t('reservar.spei_paso_3')}</p>
                </div>
              </div>
            </div>
          ) : (
            /* Selector de método de pago — Apple Pay + 3 opciones */
            <div className="space-y-4">

              {/* Apple Pay — solo aparece si el dispositivo lo soporta */}
              {applePayDisponible && !applePayExito && (
                <div className="mb-2">
                  <div className="flex items-center text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-3">
                    <div className="flex-1 border-b border-gray-200"></div>
                    <span className="px-3 text-gray-500">{t('reservar.pago_express')}</span>
                    <div className="flex-1 border-b border-gray-200"></div>
                  </div>
                  <button
                    type="button"
                    disabled={pagando}
                    onClick={async () => {
                      if (!reservacionId || !window.PaymentRequest) return;
                      setPagando(true);
                      setError('');
                      try {
                        const metodosSoportados = [{
                          supportedMethods: 'https://apple.com/apple-pay',
                          data: {
                            version: 3,
                            merchantIdentifier: process.env.NEXT_PUBLIC_APPLE_PAY_MERCHANT_ID || 'merchant.com.quintadeali.openpay',
                            merchantCapabilities: ['supports3DS'],
                            supportedNetworks: ['visa', 'masterCard', 'amex'],
                            countryCode: 'MX',
                          },
                        }];
                        const detalles = {
                          total: {
                            label: 'La Quinta de Alí',
                            amount: { currency: 'MXN', value: getMontoTotal().toString() },
                          },
                          displayItems: [{
                            label: paqueteSeleccionado?.nombre || 'Reservación',
                            amount: { currency: 'MXN', value: getMontoTotal().toString() },
                          }],
                        };
                        const request = new PaymentRequest(metodosSoportados, detalles);
                        const response = await request.show();
                        const tokenData = response.details;

                        // Enviar token al backend
                        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
                        const result = await fetch(`${API_URL}/api/pagos/apple-pay`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            reservacion_id: reservacionId,
                            token_id: tokenData.token || tokenData.paymentData || JSON.stringify(tokenData),
                          }),
                        }).then(r => r.json());

                        if (result.ok && result.status === 'completed') {
                          await response.complete('success');
                          setApplePayExito(true);
                        } else {
                          await response.complete('fail');
                          setError(result.message || 'Error procesando Apple Pay');
                        }
                      } catch (err: unknown) {
                        if (err instanceof Error && err.name !== 'AbortError') {
                          setError(err.message || 'Error con Apple Pay');
                        }
                      } finally {
                        setPagando(false);
                      }
                    }}
                    className="w-full bg-black text-white font-semibold py-4 rounded-xl shadow-lg flex justify-center items-center gap-2.5 transition-all active:scale-[0.98] hover:bg-gray-900 disabled:opacity-60"
                  >
                    {pagando ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.19 2.31-.88 3.5-.8 1.53.05 2.53.56 3.32 1.45-2.88 1.62-2.38 5.61.35 6.78-1.05 2.1-2.18 3.8-2.25 4.74zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>
                        Pay
                      </>
                    )}
                  </button>
                </div>
              )}

              {applePayExito && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center space-y-2">
                  <Check className="w-8 h-8 text-green-600 mx-auto" />
                  <p className="font-bold text-green-800">{t('reservar.apple_pay_exito')}</p>
                  <p className="text-sm text-green-600">{t('reservar.apple_pay_exito_desc')}</p>
                </div>
              )}

              {!applePayExito && (
              <>
              {applePayDisponible && (
                <div className="flex items-center text-gray-400 text-[10px] font-bold uppercase tracking-wider">
                  <div className="flex-1 border-b border-gray-200"></div>
                  <span className="px-3 text-gray-500">{t('reservar.pago_o_metodos')}</span>
                  <div className="flex-1 border-b border-gray-200"></div>
                </div>
              )}

              <h3 className="font-bold text-center">{t('reservar.pago_elige_metodo')}</h3>

              {/* 4 botones de método - 2x2 grid */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => { setMetodoPago('credito'); setError(''); }}
                  className={`p-3 border-2 rounded-xl font-bold transition-all text-xs text-center ${
                    metodoPago === 'credito'
                      ? 'border-primary bg-primary/5 text-primary-dark'
                      : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  <CreditCard className="w-5 h-5 mx-auto" /><br/>{t('reservar.pago_credito')}
                </button>
                <button
                  type="button"
                  onClick={() => { setMetodoPago('debito'); setError(''); }}
                  className={`p-3 border-2 rounded-xl font-bold transition-all text-xs text-center ${
                    metodoPago === 'debito'
                      ? 'border-primary bg-primary/5 text-primary-dark'
                      : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  <CreditCard className="w-5 h-5 mx-auto" /><br/>{t('reservar.pago_debito')}
                </button>
                <button
                  type="button"
                  onClick={() => { setMetodoPago('spei'); setError(''); }}
                  className={`p-3 border-2 rounded-xl font-bold transition-all text-xs text-center ${
                    metodoPago === 'spei'
                      ? 'border-primary bg-primary/5 text-primary-dark'
                      : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  <Landmark className="w-5 h-5 mx-auto" /><br/>{t('reservar.pago_spei')}
                </button>
                <button
                  type="button"
                  onClick={() => { setMetodoPago('mercadopago'); setError(''); }}
                  className={`p-3 border-2 rounded-xl font-bold transition-all text-xs text-center ${
                    metodoPago === 'mercadopago'
                      ? 'border-[#009ee3] bg-[#009ee3]/10 text-[#009ee3]'
                      : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  <Smartphone className="w-5 h-5 mx-auto" /><br/>Mercado Pago
                </button>
              </div>

              {/* Formulario: Tarjeta de Crédito (con MSI) */}
              {metodoPago === 'credito' && (
                <div className="border border-gray-200 p-5 rounded-xl bg-white space-y-4 animate-fade-in">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">{t('reservar.pago_msi_label')}</label>
                    <select
                      value={mesesSinIntereses}
                      onChange={(e) => setMesesSinIntereses(Number(e.target.value))}
                      className="w-full p-3 border border-primary/30 rounded-lg bg-primary/5 text-foreground font-bold focus:ring-primary focus:border-primary"
                    >
                      <option value={1}>{t('reservar.pago_unico')} — ${getMontoTotal().toLocaleString('es-MX')} MXN</option>
                      <option value={3}>3 {t('reservar.pago_msi')}</option>
                      <option value={6}>6 {t('reservar.pago_msi')}</option>
                      <option value={12}>12 {t('reservar.pago_msi')}</option>
                    </select>
                  </div>
                    {mesesSinIntereses > 1 && (
                    <p className="text-xs text-gray-500 text-center">
                      {mesesSinIntereses} {t('reservar.pago_msi_de')} ${Math.round(getMontoTotal() / mesesSinIntereses).toLocaleString('es-MX')} MXN
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={() => pagarConTarjeta('credito', mesesSinIntereses)}
                    disabled={pagando}
                    className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-4 rounded-xl shadow-lg transition-all active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {pagando ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>{t('reservar.pago_btn_credito')}</>
                    )}
                  </button>
                </div>
              )}

              {/* Formulario: Tarjeta de Débito (sin MSI) */}
              {metodoPago === 'debito' && (
                <div className="border border-gray-200 p-5 rounded-xl bg-white space-y-4 animate-fade-in">
                  <p className="text-sm text-gray-500 text-center">{t('reservar.pago_debito_nota')}</p>
                  <button
                    type="button"
                    onClick={() => pagarConTarjeta('debito', 1)}
                    disabled={pagando}
                    className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-4 rounded-xl shadow-lg transition-all active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {pagando ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>{t('reservar.pago_btn_debito')}</>
                    )}
                  </button>
                </div>
              )}

              {/* Formulario: SPEI (Transferencia) */}
              {metodoPago === 'spei' && (
                <div className="border border-gray-200 p-5 rounded-xl bg-white space-y-4 text-center animate-fade-in">
                  <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-2"><Landmark className="w-7 h-7" /></div>
                  <h3 className="font-bold text-foreground">{t('reservar.spei_titulo')}</h3>
                  <p className="text-sm text-gray-500">
                    {t('reservar.spei_descripcion')}
                  </p>
                  <button
                    type="button"
                    onClick={pagarConSpei}
                    disabled={pagando}
                    className="w-full bg-gray-900 hover:bg-black text-white font-bold py-4 rounded-xl shadow-lg transition-all active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {pagando ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <><Landmark className="w-5 h-5" /> {t('reservar.pago_btn_spei')}</>
                    )}
                  </button>
                </div>
              )}

              {/* Formulario: MercadoPago */}
              {metodoPago === 'mercadopago' && (
                <div className="border border-[#009ee3]/30 p-5 rounded-xl bg-[#009ee3]/5 space-y-4 text-center animate-fade-in">
                  <div className="w-16 h-16 bg-[#009ee3]/20 rounded-full flex items-center justify-center mx-auto mb-2">
                    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="#009ee3">
                      <path d="M11.5 2C6.81 2 3 5.81 3 10.5S6.81 19 11.5 19h.5v3l4.23-3.18C19.44 16.83 21 13.91 21 10.5 21 5.81 17.19 2 12.5 2h-1zm.5 14h-1c-3.59 0-6.5-2.91-6.5-6.5S7.41 3 11 3h1c3.59 0 6.5 2.91 6.5 6.5 0 2.63-1.23 4.93-3.19 6.32L12 18.5V16z"/>
                    </svg>
                  </div>
                  <h3 className="font-bold text-[#009ee3]">Pagar con Mercado Pago</h3>
                  <p className="text-sm text-gray-500">
                    Serás redirigido a Mercado Pago para completar tu pago de forma segura. Acepta tarjetas, transferencia y más.
                  </p>
                  <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
                    <span>✓ Tarjetas</span>
                    <span>✓ OXXO</span>
                    <span>✓ Transferencia</span>
                    <span>✓ MSI</span>
                  </div>
                  <button
                    type="button"
                    onClick={pagarConMercadoPago}
                    disabled={pagando}
                    className="w-full bg-[#009ee3] hover:bg-[#007eb5] text-white font-bold py-4 rounded-xl shadow-lg transition-all active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {pagando ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Smartphone className="w-5 h-5" /> Ir a Mercado Pago
                      </>
                    )}
                  </button>
                </div>
              )}
              </>
              )}
            </div>
          )}

          <p className="text-[11px] text-gray-400 text-center">{t('reservar.pago_seguro')}</p>
          <p className="text-xs text-gray-400 text-center">{t('reservar.guardar_pin')}</p>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
