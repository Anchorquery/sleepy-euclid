/**
 * Módulo de Indicadores Ambientales, Operativos y Financieros
 * Complementa el análisis del motor de decisión con métricas adicionales
 * requeridas por el marco teórico de la investigación.
 *
 * Referencias:
 * - IPCC (2006). Guidelines for National Greenhouse Gas Inventories, Vol. 2
 * - NREL (2021). Life Cycle Greenhouse Gas Emissions from Solar Photovoltaics
 * - IEA (2022). CO2 Emissions from Fuel Combustion - Venezuela Grid Factor
 * - UIT-T E.800 (2008). Definiciones de disponibilidad y calidad de servicio
 */

// ─────────────────────────────────────────────────────────────────────────────
// Factores de emisión
// ─────────────────────────────────────────────────────────────────────────────

/** kg CO₂ por litro de diésel quemado (IPCC 2006, Vol. 2, Tabla 2.2) */
export const FACTOR_CO2_DIESEL_KG_L = 2.68

/** kg CO₂ por kWh de la red eléctrica venezolana (estimado IEA/CORPOELEC) */
export const FACTOR_CO2_RED_KG_KWH = 0.29

/** kg CO₂ por kWh generado por sistema FV (ciclo de vida — NREL 2021) */
export const FACTOR_CO2_FV_KG_KWH = 0.048

// ─────────────────────────────────────────────────────────────────────────────
// Emisiones CO₂
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calcula las emisiones CO₂ mensuales del sistema de respaldo actual (kg/mes).
 * Para planta diésel: emisiones directas por combustión.
 * Para baterías: no hay emisión directa en el punto de uso.
 */
export function calcularEmisionesCO2Actual(
  tipo: 'baterias' | 'planta_diesel',
  consumoCombustibleLh: number | null,
  horasFallaPromedio: number
): number {
  if (tipo === 'planta_diesel' && consumoCombustibleLh && consumoCombustibleLh > 0) {
    const horasMensuales = horasFallaPromedio * 30
    const litrosMensuales = consumoCombustibleLh * horasMensuales
    return Math.round(litrosMensuales * FACTOR_CO2_DIESEL_KG_L * 10) / 10
  }
  return 0
}

/**
 * Calcula las emisiones CO₂ mensuales del sistema fotovoltaico en ciclo de vida (kg/mes).
 * Representa el impacto ambiental amortizado de la fabricación de los paneles.
 */
export function calcularEmisionesCO2Solar(consumoDiarioKwh: number): number {
  const consumoMensualKwh = consumoDiarioKwh * 30
  return Math.round(consumoMensualKwh * FACTOR_CO2_FV_KG_KWH * 10) / 10
}

/**
 * Calcula la reducción neta de CO₂ mensual al migrar al sistema solar (kg/mes).
 */
export function calcularReduccionCO2(
  emisionesActualKg: number,
  emisionesSolarKg: number
): number {
  return Math.max(0, Math.round((emisionesActualKg - emisionesSolarKg) * 10) / 10)
}

// ─────────────────────────────────────────────────────────────────────────────
// Disponibilidad / SLA (UIT-T E.800)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calcula la disponibilidad del servicio (% uptime) basada en
 * horas de falla por día y autonomía del sistema de respaldo.
 *
 * Fórmula: D = (1 - horasDescubiertas/24) × 100
 */
export function calcularDisponibilidad(
  horasFallaPromedio: number,
  autonomiaHoras: number
): number {
  const horasDescubiertas = Math.max(0, horasFallaPromedio - autonomiaHoras)
  const disponibilidad = ((24 - horasDescubiertas) / 24) * 100
  return Math.min(100, Math.round(disponibilidad * 1000) / 1000)
}

/**
 * Convierte disponibilidad en clasificación "nines" (UIT-T E.800).
 */
export function clasificarSLA(disponibilidadPct: number): string {
  if (disponibilidadPct >= 99.999) return '5 nueves (99.999%)'
  if (disponibilidadPct >= 99.99) return '4 nueves (99.99%)'
  if (disponibilidadPct >= 99.9) return '3 nueves (99.9%)'
  if (disponibilidadPct >= 99.0) return '2 nueves (99%)'
  return `Sin clasificación SLA (${disponibilidadPct.toFixed(2)}%)`
}

/**
 * Calcula el tiempo de indisponibilidad anual estimado (horas/año).
 */
export function calcularIndisponibilidadAnual(horasFallaPromedio: number, autonomiaHoras: number): number {
  const horasDescubiertas = Math.max(0, horasFallaPromedio - autonomiaHoras)
  return Math.round(horasDescubiertas * 365 * 10) / 10
}

// ─────────────────────────────────────────────────────────────────────────────
// TIR — Tasa Interna de Retorno
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calcula la TIR (Tasa Interna de Retorno) para la inversión solar.
 * Utiliza el método de Newton-Raphson sobre el flujo de caja a 25 años.
 *
 * Flujo de caja:
 *   Año 0: −InversiónTotal
 *   Años 1…N: AhorroAnual = (costoActual − costoSolar) × 12
 *
 * @returns TIR en porcentaje (ej: 18.5 = 18.5%), o null si no aplica
 */
export function calcularTIR(
  inversionInicial: number,
  costoMensualActual: number,
  costoMensualSolar: number,
  vidaUtilAnos: number = 25
): number | null {
  const ahorroAnual = (costoMensualActual - costoMensualSolar) * 12

  if (ahorroAnual <= 0 || inversionInicial <= 0) return null

  // Construir flujos de caja
  const flujos = [-inversionInicial, ...Array<number>(vidaUtilAnos).fill(ahorroAnual)]

  // VPN(r) = Σ flujo[i] / (1+r)^i
  const vpn = (r: number): number =>
    flujos.reduce((acc, f, i) => acc + f / Math.pow(1 + r, i), 0)

  // Derivada dVPN/dr
  const dvpn = (r: number): number =>
    flujos.reduce((acc, f, i) => acc + (-i * f) / Math.pow(1 + r, i + 1), 0)

  // Newton-Raphson
  let r = 0.10 // Estimación inicial: 10%
  for (let iter = 0; iter < 1000; iter++) {
    const fVal = vpn(r)
    const fDer = dvpn(r)
    if (Math.abs(fDer) < 1e-12) break
    const rNew = r - fVal / fDer
    if (Math.abs(rNew - r) < 1e-9) {
      r = rNew
      break
    }
    r = rNew
    // Mantener dentro de rango razonable
    if (r < -0.99) r = -0.99
    if (r > 10) r = 10
  }

  // Verificar que converge a una TIR válida
  if (r <= -0.99 || r >= 10 || !isFinite(r)) return null

  return Math.round(r * 10000) / 100 // Retornar como porcentaje con 2 decimales
}

/**
 * Calcula el Valor Presente Neto (VPN) de la inversión solar.
 *
 * @param tasaDescuento - Tasa de descuento anual (ej: 0.12 para 12%)
 */
export function calcularVPN(
  inversionInicial: number,
  costoMensualActual: number,
  costoMensualSolar: number,
  tasaDescuento: number = 0.12,
  vidaUtilAnos: number = 25
): number {
  const ahorroAnual = (costoMensualActual - costoMensualSolar) * 12
  let vpn = -inversionInicial
  for (let i = 1; i <= vidaUtilAnos; i++) {
    vpn += ahorroAnual / Math.pow(1 + tasaDescuento, i)
  }
  return Math.round(vpn)
}

// ─────────────────────────────────────────────────────────────────────────────
// Autonomía calculada para bancos de baterías
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calcula la autonomía teórica de un banco de baterías convencional.
 *
 * Fórmula: A = (C × V × DoD) / P
 * Donde:
 *   C = Capacidad total del banco (Ah)
 *   V = Voltaje del sistema (V)
 *   DoD = Profundidad de descarga (0.5 para plomo-ácido, 0.8 para LiFePO4)
 *   P = Potencia consumida (W)
 *
 * @returns Autonomía en horas
 */
export function calcularAutonomiaBaterias(
  capacidadAh: number,
  voltajeV: number,
  consumoW: number,
  profundidadDescarga: number = 0.5 // Plomo-ácido por defecto
): number {
  if (consumoW <= 0 || capacidadAh <= 0 || voltajeV <= 0) return 0
  const energiaUtil = capacidadAh * voltajeV * profundidadDescarga
  return Math.round((energiaUtil / consumoW) * 100) / 100
}
