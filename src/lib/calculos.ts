import { Equipo } from '@/types'

/**
 * Calcula el consumo energético de un equipo individual (Wh/día)
 * Ei = Pi × Qi × Hi
 */
export function consumoEquipoWh(equipo: Equipo): number {
  return equipo.potencia_w * equipo.cantidad * equipo.horas_operacion
}

/**
 * Calcula la potencia total instalada del nodo (W)
 * Suma de (potencia × cantidad) de todos los equipos
 */
export function consumoTotalW(equipos: Equipo[]): number {
  return equipos.reduce((sum, eq) => sum + eq.potencia_w * eq.cantidad, 0)
}

/**
 * Calcula el consumo diario total del nodo (kWh/día)
 */
export function consumoDiarioKwh(equipos: Equipo[]): number {
  const totalWh = equipos.reduce((sum, eq) => sum + consumoEquipoWh(eq), 0)
  return totalWh / 1000
}

/**
 * Aplica el margen de crecimiento al consumo diario
 */
export function consumoConMargenKwh(consumoDiario: number, margenCrecimiento: number): number {
  return consumoDiario * (1 + margenCrecimiento / 100)
}

/**
 * Calcula el consumo por categoría
 */
export function consumoPorCategoria(equipos: Equipo[]): Record<string, number> {
  const categorias: Record<string, number> = {}
  for (const eq of equipos) {
    const cat = eq.categoria
    if (!categorias[cat]) categorias[cat] = 0
    categorias[cat] += eq.potencia_w * eq.cantidad
  }
  return categorias
}

/**
 * Calcula el costo operativo mensual del sistema actual
 * Para planta diésel: costo_combustible + mantenimiento
 * Para baterías: solo mantenimiento
 */
export function costoOperativoActualMensual(
  tipo: 'baterias' | 'planta_diesel',
  costoMantenimiento: number,
  consumoCombustibleLh: number | null,
  horasFallaPromedio: number,
  precioCombustibleLitro: number = 0.5 // precio referencia USD/L
): number {
  if (tipo === 'planta_diesel' && consumoCombustibleLh) {
    const horasMensuales = horasFallaPromedio * 30
    const costoCombustible = consumoCombustibleLh * horasMensuales * precioCombustibleLitro
    return costoCombustible + costoMantenimiento
  }
  return costoMantenimiento
}
