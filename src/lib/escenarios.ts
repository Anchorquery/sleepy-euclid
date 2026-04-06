/**
 * Modulo de comparacion multi-escenario
 * Genera 3 escenarios: actual, solar basico, solar con expansion
 */

import { ResultadoDimensionamiento, dimensionarSistemaFV, ParametrosDimensionamiento } from './dimensionamiento'

export interface Escenario {
  id: string
  nombre: string
  descripcion: string
  color: string
  bgColor: string
  autonomiaHoras: number
  costoMensual: number
  inversionInicial: number
  dependeCombustible: boolean
  costoAnual: number
  costo5Anos: number
  costo10Anos: number
  costo15Anos: number
  dimensionamiento?: ResultadoDimensionamiento
}

export interface ProyeccionCostos {
  anio: number
  costoActual: number
  costoSolarBasico: number
  costoSolarExpansion: number
}

/**
 * Genera 3 escenarios de comparacion
 */
export function generarEscenarios(
  params: ParametrosDimensionamiento,
  costoMensualActual: number,
  autonomiaActual: number,
  dependeCombustibleActual: boolean,
  margenCrecimiento: number
): Escenario[] {
  // Escenario 1: Sistema actual
  const actual: Escenario = {
    id: 'actual',
    nombre: 'Sistema Actual',
    descripcion: 'Mantener el sistema de respaldo actual sin modificaciones',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    autonomiaHoras: autonomiaActual,
    costoMensual: costoMensualActual,
    inversionInicial: 0,
    dependeCombustible: dependeCombustibleActual,
    costoAnual: costoMensualActual * 12,
    costo5Anos: costoMensualActual * 60,
    costo10Anos: costoMensualActual * 120,
    costo15Anos: costoMensualActual * 180,
  }

  // Escenario 2: Solar basico (sin expansion)
  const dimBasico = dimensionarSistemaFV(params)
  const solarBasico: Escenario = {
    id: 'solar_basico',
    nombre: 'Solar Basico',
    descripcion: 'Sistema fotovoltaico dimensionado para la carga actual con margen de crecimiento',
    color: 'text-brand-600',
    bgColor: 'bg-brand-50',
    autonomiaHoras: dimBasico.autonomiaEstimadaHoras,
    costoMensual: dimBasico.costoMensualEstimado,
    inversionInicial: dimBasico.inversionTotal,
    dependeCombustible: false,
    costoAnual: dimBasico.costoMensualEstimado * 12,
    costo5Anos: dimBasico.inversionTotal + dimBasico.costoMensualEstimado * 60,
    costo10Anos: dimBasico.inversionTotal + dimBasico.costoMensualEstimado * 120,
    costo15Anos: dimBasico.inversionTotal + dimBasico.costoMensualEstimado * 180,
    dimensionamiento: dimBasico,
  }

  // Escenario 3: Solar con expansion (+50% capacidad extra)
  const paramsExpansion: ParametrosDimensionamiento = {
    ...params,
    consumoConMargenKwh: params.consumoConMargenKwh * 1.5,
    autonomiaDeseadaHoras: params.autonomiaDeseadaHoras * 1.25,
  }
  const dimExpansion = dimensionarSistemaFV(paramsExpansion)
  const solarExpansion: Escenario = {
    id: 'solar_expansion',
    nombre: 'Solar + Expansion',
    descripcion: `Sistema fotovoltaico sobredimensionado (+50% capacidad, +25% autonomia) para expansion futura`,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    autonomiaHoras: dimExpansion.autonomiaEstimadaHoras,
    costoMensual: dimExpansion.costoMensualEstimado,
    inversionInicial: dimExpansion.inversionTotal,
    dependeCombustible: false,
    costoAnual: dimExpansion.costoMensualEstimado * 12,
    costo5Anos: dimExpansion.inversionTotal + dimExpansion.costoMensualEstimado * 60,
    costo10Anos: dimExpansion.inversionTotal + dimExpansion.costoMensualEstimado * 120,
    costo15Anos: dimExpansion.inversionTotal + dimExpansion.costoMensualEstimado * 180,
    dimensionamiento: dimExpansion,
  }

  return [actual, solarBasico, solarExpansion]
}

/**
 * Genera proyeccion de costos acumulados por año (para grafico de breakeven)
 */
export function generarProyeccionCostos(escenarios: Escenario[], anosMax: number = 25): ProyeccionCostos[] {
  const proyeccion: ProyeccionCostos[] = []

  for (let anio = 0; anio <= anosMax; anio++) {
    const meses = anio * 12
    proyeccion.push({
      anio,
      costoActual: escenarios[0].costoMensual * meses,
      costoSolarBasico: escenarios[1].inversionInicial + escenarios[1].costoMensual * meses,
      costoSolarExpansion: escenarios[2].inversionInicial + escenarios[2].costoMensual * meses,
    })
  }

  return proyeccion
}

/**
 * Calcula el punto de equilibrio (breakeven) en meses
 */
export function calcularBreakeven(costoMensualActual: number, inversionSolar: number, costoMensualSolar: number): number | null {
  const ahorroMensual = costoMensualActual - costoMensualSolar
  if (ahorroMensual <= 0) return null
  return Math.ceil(inversionSolar / ahorroMensual)
}
