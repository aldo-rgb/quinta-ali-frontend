import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { area, problema } = await request.json();

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL_RINO;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_RINO;

    console.log('🔍 API: supabaseUrl =', supabaseUrl ? '✅' : '❌');
    console.log('🔍 API: supabaseKey =', supabaseKey ? '✅' : '❌');

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: 'Variables de entorno no configuradas en el servidor' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Obtener el ID de la Quinta de Ali
    const { data: propiedades, error: propError } = await supabase
      .from('propiedades')
      .select('id')
      .eq('nombre', 'Quinta de Ali')
      .single();

    if (propError) {
      console.error('Error obteniendo propiedad:', propError);
      return NextResponse.json(
        { error: `No se pudo obtener la propiedad: ${propError.message}` },
        { status: 500 }
      );
    }

    const propiedadId = propiedades?.id || 'unknown-quinta';

// Insertar TRES tareas idénticas: una para Rochen, una para Ivan, otra para Sabino
      const equipoMantenimiento = ['Rochen', 'Ivan', 'Sabino'];
      
      const tareasParaCrear = equipoMantenimiento.map(nombre => ({
        propiedad_id: propiedadId,
        titulo: `🚨 CLIENTE REPORTA: ${area} - ${problema}`,
        estatus_columna: 'pendiente',
        prioridad: 'urgente',
        asignado_a: nombre,  // ← Uno para cada miembro del equipo
        fecha_creacion: new Date().toISOString(),
      }));

      const { error: insertError } = await supabase
        .from('tareas_kanban')
        .insert(tareasParaCrear);

    if (insertError) {
      console.error('Error insertando tarea:', insertError);
      return NextResponse.json(
        { error: `Error al reportar: ${insertError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error en API:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
