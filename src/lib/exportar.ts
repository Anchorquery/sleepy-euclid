/**
 * Modulo de exportacion de datos a CSV
 */

import { Equipo } from '@/types'

function escapeCsv(val: string | number | null | undefined): string {
  if (val === null || val === undefined) return ''
  const str = String(val)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

function descargarArchivo(contenido: string, nombre: string, tipo: string) {
  const bom = '\uFEFF' // UTF-8 BOM for Excel compatibility
  const blob = new Blob([bom + contenido], { type: `${tipo};charset=utf-8` })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nombre
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Exportar lista de equipos a CSV
 */
export function exportarEquiposCSV(equipos: Equipo[], nombreNodo: string) {
  const headers = ['Equipo', 'Categoria', 'Potencia (W)', 'Cantidad', 'Horas/dia', 'Subtotal (W)', 'Consumo diario (Wh)']
  const rows = equipos.map((eq) => [
    escapeCsv(eq.nombre),
    escapeCsv(eq.categoria),
    eq.potencia_w,
    eq.cantidad,
    eq.horas_operacion,
    eq.potencia_w * eq.cantidad,
    eq.potencia_w * eq.cantidad * eq.horas_operacion,
  ])

  const totalW = equipos.reduce((s, e) => s + e.potencia_w * e.cantidad, 0)
  const totalWh = equipos.reduce((s, e) => s + e.potencia_w * e.cantidad * e.horas_operacion, 0)
  rows.push(['TOTAL', '', '', '', '', totalW, totalWh])

  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
  descargarArchivo(csv, `Equipos_${nombreNodo.replace(/\s+/g, '_')}.csv`, 'text/csv')
}

/**
 * Exportar resultados comparativos a CSV
 */
export function exportarResultadosCSV(
  datos: {
    nodoNombre: string
    nodoUbicacion: string
    nodoTipo: string
    consumoTotalW: number
    consumoDiarioKwh: number
    consumoConMargenKwh: number
    tipoActual: string
    autonomiaActual: number
    costoActual: number
    panelesRequeridos: number
    potenciaPanelesKw: number
    capacidadBateriasKwh: number
    inversorKw: number
    autonomiaSolar: number
    inversionTotal: number
    costoMensualSolar: number
    recomendacion: string
    puntuacion: number
  }
) {
  const lineas = [
    'REPORTE DE EVALUACION ENERGETICA',
    `Nodo,${escapeCsv(datos.nodoNombre)}`,
    `Ubicacion,${escapeCsv(datos.nodoUbicacion)}`,
    `Tipo,${escapeCsv(datos.nodoTipo)}`,
    '',
    'CONSUMO ENERGETICO',
    `Consumo Total (W),${datos.consumoTotalW}`,
    `Consumo Diario (kWh),${datos.consumoDiarioKwh.toFixed(2)}`,
    `Con Margen (kWh),${datos.consumoConMargenKwh.toFixed(2)}`,
    '',
    'COMPARACION',
    'Criterio,Sistema Actual,Sistema Solar',
    `Autonomia (h),${datos.autonomiaActual},${datos.autonomiaSolar}`,
    `Costo Mensual ($),${datos.costoActual.toFixed(2)},${datos.costoMensualSolar.toFixed(2)}`,
    `Dependencia combustible,${datos.tipoActual === 'Planta Diesel' ? 'Si' : 'No'},No`,
    '',
    'PROPUESTA FOTOVOLTAICA',
    `Paneles,${datos.panelesRequeridos} x 550W (${datos.potenciaPanelesKw} kWp)`,
    `Baterias,${datos.capacidadBateriasKwh.toFixed(1)} kWh`,
    `Inversor,${datos.inversorKw} kW`,
    `Inversion Total,$${datos.inversionTotal.toLocaleString()}`,
    '',
    'DECISION',
    `Puntuacion,${datos.puntuacion}/100`,
    `Recomendacion,${escapeCsv(datos.recomendacion)}`,
  ]

  const csv = lineas.join('\n')
  descargarArchivo(csv, `Resultado_SET_${datos.nodoNombre.replace(/\s+/g, '_')}.csv`, 'text/csv')
}

/**
 * Exportar proyeccion de costos a CSV
 */
export function exportarProyeccionCSV(
  proyeccion: { anio: number; costoActual: number; costoSolarBasico: number; costoSolarExpansion: number }[],
  nombreNodo: string
) {
  const headers = ['Ano', 'Costo Actual ($)', 'Solar Basico ($)', 'Solar + Expansion ($)']
  const rows = proyeccion.map((p) => [
    p.anio,
    p.costoActual.toFixed(2),
    p.costoSolarBasico.toFixed(2),
    p.costoSolarExpansion.toFixed(2),
  ])
  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
  descargarArchivo(csv, `Proyeccion_Costos_${nombreNodo.replace(/\s+/g, '_')}.csv`, 'text/csv')
}
