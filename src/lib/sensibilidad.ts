/**
 * Modulo de analisis de sensibilidad
 * Evalua como cambian los resultados al variar parametros clave
 */

import { dimensionarSistemaFV, ParametrosDimensionamiento, ResultadoDimensionamiento } from './dimensionamiento'
import { evaluarMigracion, ResultadoDecision, DatosDecision } from './motor-decision'

export interface ParametroSensibilidad {
  nombre: string
  unidad: string
  valorBase: number
  valorMin: number
  valorMax: number
  pasos: number
}

export interface PuntoSensibilidad {
  valorParametro: number
  inversionTotal: number
  costoMensualSolar: number
  autonomiaEstimada: number
  puntuacion: number
  recomendacion: string
}

export interface ResultadoSensibilidad {
  parametro: ParametroSensibilidad
  puntos: PuntoSensibilidad[]
}

/**
 * Ejecuta analisis de sensibilidad variando un parametro
 */
export function analizarSensibilidad(
  parametro: ParametroSensibilidad,
  baseParams: ParametrosDimensionamiento,
  baseDatosDecision: Omit<DatosDecision, 'dimensionamiento'>,
  campo: 'radiacion' | 'margen' | 'autonomia' | 'combustible'
): ResultadoSensibilidad {
  const step = (parametro.valorMax - parametro.valorMin) / parametro.pasos
  const puntos: PuntoSensibilidad[] = []

  for (let i = 0; i <= parametro.pasos; i++) {
    const valor = parametro.valorMin + step * i

    // Clonar parametros y modificar el campo variable
    const params = { ...baseParams }
    const datosDecision = { ...baseDatosDecision }

    switch (campo) {
      case 'radiacion':
        params.radiacionSolarKwhM2 = valor
        break
      case 'margen':
        params.consumoConMargenKwh = params.consumoDiarioKwh * (1 + valor / 100)
        break
      case 'autonomia':
        params.autonomiaDeseadaHoras = valor
        datosDecision.autonomiaDeseada = valor
        break
      case 'combustible':
        datosDecision.costoMensualActual = valor
        break
    }

    const dim = dimensionarSistemaFV(params)
    const decision = evaluarMigracion({ ...datosDecision, dimensionamiento: dim })

    puntos.push({
      valorParametro: Math.round(valor * 100) / 100,
      inversionTotal: dim.inversionTotal,
      costoMensualSolar: dim.costoMensualEstimado,
      autonomiaEstimada: dim.autonomiaEstimadaHoras,
      puntuacion: decision.puntuacion,
      recomendacion: decision.recomendacion,
    })
  }

  return { parametro, puntos }
}

/**
 * Genera los 4 analisis de sensibilidad principales
 */
export function generarAnalisisCompleto(
  baseParams: ParametrosDimensionamiento,
  baseDatosDecision: Omit<DatosDecision, 'dimensionamiento'>,
  margenCrecimiento: number
): ResultadoSensibilidad[] {
  const analisis: ResultadoSensibilidad[] = []

  // 1. Sensibilidad a radiacion solar
  analisis.push(
    analizarSensibilidad(
      {
        nombre: 'Radiacion Solar',
        unidad: 'kWh/m2/dia',
        valorBase: baseParams.radiacionSolarKwhM2,
        valorMin: Math.max(3.0, baseParams.radiacionSolarKwhM2 - 1.5),
        valorMax: Math.min(7.0, baseParams.radiacionSolarKwhM2 + 1.5),
        pasos: 8,
      },
      baseParams,
      baseDatosDecision,
      'radiacion'
    )
  )

  // 2. Sensibilidad a margen de crecimiento
  analisis.push(
    analizarSensibilidad(
      {
        nombre: 'Margen de Crecimiento',
        unidad: '%',
        valorBase: margenCrecimiento,
        valorMin: 0,
        valorMax: 50,
        pasos: 10,
      },
      baseParams,
      baseDatosDecision,
      'margen'
    )
  )

  // 3. Sensibilidad a autonomia deseada
  analisis.push(
    analizarSensibilidad(
      {
        nombre: 'Autonomia Deseada',
        unidad: 'horas',
        valorBase: baseParams.autonomiaDeseadaHoras,
        valorMin: 4,
        valorMax: 24,
        pasos: 10,
      },
      baseParams,
      baseDatosDecision,
      'autonomia'
    )
  )

  // 4. Sensibilidad a costo actual (solo si es diesel)
  if (baseDatosDecision.tipoRespaldoActual === 'planta_diesel') {
    analisis.push(
      analizarSensibilidad(
        {
          nombre: 'Costo Operativo Actual',
          unidad: '$/mes',
          valorBase: baseDatosDecision.costoMensualActual,
          valorMin: Math.max(50, baseDatosDecision.costoMensualActual * 0.5),
          valorMax: baseDatosDecision.costoMensualActual * 2,
          pasos: 10,
        },
        baseParams,
        baseDatosDecision,
        'combustible'
      )
    )
  }

  return analisis
}
