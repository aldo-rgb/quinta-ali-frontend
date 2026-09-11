// Piezas compartidas de la pestaña Rino del admin (RinoTab y BuzonRino).

export const CARD = 'bg-white/70 rounded-xl border border-primary-light/15 p-4';

export const INPUT =
  'w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary/30 bg-white';

export function formatFecha(s: string | null) {
  if (!s) return '';
  return new Date(s).toLocaleString('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export function mensajeError(err: unknown, porDefecto: string) {
  return err instanceof Error ? err.message : porDefecto;
}
