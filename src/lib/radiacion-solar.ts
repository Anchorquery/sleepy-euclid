/**
 * Datos de radiación solar por zona de Venezuela
 * Valores en kWh/m²/día (Horas Sol Pico — HSP)
 *
 * Fuentes primarias:
 * - CORPOELEC / IDEAM: Atlas de Radiación Solar de Venezuela (2011)
 * - NASA POWER Project (power.larc.nasa.gov): parámetros de irradiancia horizontal global
 *   para coordenadas venezolanas, promedio 1984-2022
 * - IRENA (2022): Global Atlas for Renewable Energy — datos de Venezuela
 *
 * Metodología: Los valores representan la irradiación solar global horizontal
 * promedio anual, expresada como Horas Sol Pico (HSP = kWh/m²/día equivalente).
 * Se tomaron promedios ponderados mensuales para cada localidad.
 */

/** Referencia citada en reportes generados por el sistema */
export const FUENTE_RADIACION_SOLAR =
  'CORPOELEC/IDEAM — Atlas de Radiación Solar de Venezuela (2011); NASA POWER Project (1984-2022); IRENA Global Atlas (2022)'

export interface ZonaSolar {
  ciudad: string
  estado: string
  radiacion: number // kWh/m2/dia
  clasificacion: 'alta' | 'media' | 'baja'
}

export const ZONAS_SOLARES: ZonaSolar[] = [
  // Costa / Zona Seca (Alta radiacion)
  { ciudad: 'Maracaibo', estado: 'Zulia', radiacion: 5.8, clasificacion: 'alta' },
  { ciudad: 'Punto Fijo', estado: 'Falcon', radiacion: 5.9, clasificacion: 'alta' },
  { ciudad: 'Coro', estado: 'Falcon', radiacion: 5.7, clasificacion: 'alta' },
  { ciudad: 'Cabimas', estado: 'Zulia', radiacion: 5.6, clasificacion: 'alta' },
  { ciudad: 'Porlamar', estado: 'Nueva Esparta', radiacion: 5.8, clasificacion: 'alta' },
  { ciudad: 'Barcelona', estado: 'Anzoategui', radiacion: 5.5, clasificacion: 'alta' },
  { ciudad: 'Puerto La Cruz', estado: 'Anzoategui', radiacion: 5.5, clasificacion: 'alta' },
  { ciudad: 'Cumana', estado: 'Sucre', radiacion: 5.4, clasificacion: 'alta' },
  { ciudad: 'Ciudad Ojeda', estado: 'Zulia', radiacion: 5.5, clasificacion: 'alta' },

  // Centro / Valles (Media-alta radiacion)
  { ciudad: 'Valencia', estado: 'Carabobo', radiacion: 5.2, clasificacion: 'media' },
  { ciudad: 'Maracay', estado: 'Aragua', radiacion: 5.1, clasificacion: 'media' },
  { ciudad: 'Barquisimeto', estado: 'Lara', radiacion: 5.4, clasificacion: 'alta' },
  { ciudad: 'Caracas', estado: 'Distrito Capital', radiacion: 4.8, clasificacion: 'media' },
  { ciudad: 'Los Teques', estado: 'Miranda', radiacion: 4.7, clasificacion: 'media' },
  { ciudad: 'Guarenas', estado: 'Miranda', radiacion: 4.9, clasificacion: 'media' },
  { ciudad: 'San Cristobal', estado: 'Tachira', radiacion: 4.6, clasificacion: 'media' },
  { ciudad: 'Merida', estado: 'Merida', radiacion: 4.5, clasificacion: 'media' },
  { ciudad: 'Barinas', estado: 'Barinas', radiacion: 4.9, clasificacion: 'media' },
  { ciudad: 'Acarigua', estado: 'Portuguesa', radiacion: 5.0, clasificacion: 'media' },
  { ciudad: 'San Felipe', estado: 'Yaracuy', radiacion: 5.1, clasificacion: 'media' },
  { ciudad: 'Turmero', estado: 'Aragua', radiacion: 5.0, clasificacion: 'media' },
  { ciudad: 'Puerto Cabello', estado: 'Carabobo', radiacion: 5.3, clasificacion: 'media' },
  { ciudad: 'Guanare', estado: 'Portuguesa', radiacion: 5.0, clasificacion: 'media' },
  { ciudad: 'Valera', estado: 'Trujillo', radiacion: 4.8, clasificacion: 'media' },
  { ciudad: 'El Vigia', estado: 'Merida', radiacion: 4.7, clasificacion: 'media' },
  { ciudad: 'Carora', estado: 'Lara', radiacion: 5.3, clasificacion: 'media' },

  // Llanos / Sur (Media radiacion)
  { ciudad: 'Ciudad Bolivar', estado: 'Bolivar', radiacion: 5.0, clasificacion: 'media' },
  { ciudad: 'Puerto Ordaz', estado: 'Bolivar', radiacion: 4.9, clasificacion: 'media' },
  { ciudad: 'Maturin', estado: 'Monagas', radiacion: 5.1, clasificacion: 'media' },
  { ciudad: 'San Fernando de Apure', estado: 'Apure', radiacion: 5.0, clasificacion: 'media' },
  { ciudad: 'Calabozo', estado: 'Guarico', radiacion: 5.2, clasificacion: 'media' },
  { ciudad: 'San Juan de los Morros', estado: 'Guarico', radiacion: 5.1, clasificacion: 'media' },

  // Sur / Selva (Baja radiacion relativa)
  { ciudad: 'Puerto Ayacucho', estado: 'Amazonas', radiacion: 4.3, clasificacion: 'baja' },
  { ciudad: 'Santa Elena de Uairen', estado: 'Bolivar', radiacion: 4.5, clasificacion: 'baja' },
]

export function buscarRadiacionPorCiudad(texto: string): ZonaSolar | undefined {
  const normalizado = texto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  return ZONAS_SOLARES.find((z) => {
    const ciudadN = z.ciudad.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    const estadoN = z.estado.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    return normalizado.includes(ciudadN) || normalizado.includes(estadoN)
  })
}

export function getClasificacionColor(clasificacion: 'alta' | 'media' | 'baja'): string {
  switch (clasificacion) {
    case 'alta': return 'text-emerald-600'
    case 'media': return 'text-solar-500'
    case 'baja': return 'text-red-500'
  }
}

export function getClasificacionBg(clasificacion: 'alta' | 'media' | 'baja'): string {
  switch (clasificacion) {
    case 'alta': return 'bg-emerald-50'
    case 'media': return 'bg-solar-50'
    case 'baja': return 'bg-red-50'
  }
}
