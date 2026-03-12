export interface Paquete {
  id: number;
  nombre: string;
  descripcion: string;
  tipo_duracion: 'horas' | 'noche';
  duracion_horas: number | null;
  precio: number;
  capacidad_max: number;
  emoji: string;
  imagen_url?: string;
  caracteristicas?: string[];
  slug?: string;
}

// Fallback estático (se usa si la API no responde)
export const paquetesFallback: Paquete[] = [
  {
    id: 1,
    nombre: 'Alí Party',
    descripcion: 'Sin estancia · De 3pm a 12am',
    tipo_duracion: 'horas',
    duracion_horas: 9,
    precio: 9000,
    capacidad_max: 100,
    emoji: '🎉',
    caracteristicas: ['🔥 Zona de asador', '🏊 Alberca', '🍹 Área de bar climatizada', '🤸 Área de brincolines', '⚽ Cancha de futbol', '🎠 Área de juegos para niños', '🌴 Palapa con mesas y sillas para 100 personas'],
  },
  {
    id: 2,
    nombre: 'Pijama Party',
    descripcion: 'Con estancia · Entrada de 3pm a 11am',
    tipo_duracion: 'noche',
    duracion_horas: null,
    precio: 12000,
    capacidad_max: 100,
    emoji: '🌙',
    caracteristicas: ['🔥 Zona de asador', '🏊 Alberca', '🍹 Área de bar climatizada', '🤸 Área de brincolines', '⚽ Cancha de futbol', '🎠 Área de juegos para niños', '🌴 Palapa con mesas y sillas para 100 personas', '🏠 Casa equipada con terraza, cocina y sala', '🛏️ 2 cuartos amueblados (cap. 20 personas)'],
  },
  {
    id: 3,
    nombre: 'Pijama Party Deluxe',
    descripcion: 'Con estancia y habitación suite · Entrada de 3pm a 11am',
    tipo_duracion: 'noche',
    duracion_horas: null,
    precio: 15000,
    capacidad_max: 100,
    emoji: '👑',
    caracteristicas: ['🔥 Zona de asador', '🏊 Alberca', '🍹 Área de bar climatizada', '🤸 Área de brincolines', '⚽ Cancha de futbol', '🎠 Área de juegos para niños', '🌴 Palapa con mesas y sillas para 100 personas', '🏠 Casa equipada con terraza, cocina y sala', '🛏️ 2 cuartos amueblados', '🛁 Suite con jacuzzi', '🪜 Litera (cap. 25 personas)'],
  },
];
