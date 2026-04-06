/**
 * Módulo de dimensionamiento del sistema fotovoltaico
 * Calcula los componentes necesarios basándose en el consumo del nodo
 */

import { calcularTIR, calcularVPN } from './indicadores'

export interface ParametrosDimensionamiento {
  consumoDiarioKwh: number
  consumoConMargenKwh: number
  consumoTotalW: number
  autonomiaDeseadaHoras: number
  radiacionSolarKwhM2: number // HSP - Horas Sol Pico
  costoMensualActual?: number // Para calcular TIR/VPN
}

export interface ResultadoDimensionamiento {
  // Paneles
  panelesRequeridos: number
  potenciaPanelesKw: number
  costoPaneles: number

  // Baterías
  capacidadBateriasKwh: number
  numeroBaterias: number
  costoBaterias: number

  // Inversor
  inversorKw: number
  costoInversor: number

  // Controlador
  controladorA: number
  costoControlador: number

  // Totales
  inversionTotal: number
  costoMensualEstimado: number
  autonomiaEstimadaHoras: number

  // Indicadores financieros (opcionales, requieren costoMensualActual)
  tir: number | null     // Tasa Interna de Retorno (%)
  vpn: number | null     // Valor Presente Neto (USD, tasa 12%)
}

// Constantes de diseño
const EFICIENCIA_SISTEMA = 0.80
const PROFUNDIDAD_DESCARGA = 0.80 // DoD para LiFePO4
const FACTOR_SEGURIDAD_INVERSOR = 1.25
const VOLTAJE_SISTEMA = 48 // V

// Precios de referencia (USD)
const PRECIO_PANEL_550W = 180
const POTENCIA_PANEL_W = 550
const PRECIO_BATERIA_5KWH = 1200
const CAPACIDAD_BATERIA_KWH = 5.12
const PRECIO_INVERSOR_5KW = 800
const PRECIO_INVERSOR_10KW = 1500
const PRECIO_CONTROLADOR_60A = 350
const PRECIO_CONTROLADOR_100A = 550

// Vida útil promedio para cálculo de costo mensual
const VIDA_UTIL_SISTEMA_MESES = 300 // ~25 años

export function dimensionarSistemaFV(params: ParametrosDimensionamiento): ResultadoDimensionamiento {
  const {
    consumoConMargenKwh,
    consumoTotalW,
    autonomiaDeseadaHoras,
    radiacionSolarKwhM2,
  } = params

  // 1. Energía requerida considerando eficiencia del sistema
  const energiaRequeridaKwh = consumoConMargenKwh / EFICIENCIA_SISTEMA

  // 2. Dimensionamiento de paneles
  const potenciaPanelKw = POTENCIA_PANEL_W / 1000
  const panelesRequeridos = Math.ceil(energiaRequeridaKwh / (potenciaPanelKw * radiacionSolarKwhM2))
  const potenciaPanelesKw = (panelesRequeridos * POTENCIA_PANEL_W) / 1000
  const costoPaneles = panelesRequeridos * PRECIO_PANEL_550W

  // 3. Dimensionamiento de baterías
  // Energía para autonomía deseada
  const energiaAutonomiaKwh = (consumoTotalW / 1000) * autonomiaDeseadaHoras
  const capacidadBateriasKwh = energiaAutonomiaKwh / PROFUNDIDAD_DESCARGA
  const numeroBaterias = Math.ceil(capacidadBateriasKwh / CAPACIDAD_BATERIA_KWH)
  const costoBaterias = numeroBaterias * PRECIO_BATERIA_5KWH

  // 4. Dimensionamiento del inversor
  const inversorKw = Math.ceil((consumoTotalW * FACTOR_SEGURIDAD_INVERSOR) / 1000)
  const costoInversor = inversorKw <= 5 ? PRECIO_INVERSOR_5KW : PRECIO_INVERSOR_10KW * Math.ceil(inversorKw / 10)

  // 5. Controlador de carga MPPT
  const corrientePaneles = (potenciaPanelesKw * 1000) / VOLTAJE_SISTEMA
  const controladorA = Math.ceil(corrientePaneles / 10) * 10 // Redondear a decenas
  const costoControlador = controladorA <= 60 ? PRECIO_CONTROLADOR_60A : PRECIO_CONTROLADOR_100A * Math.ceil(controladorA / 100)

  // 6. Inversión total
  const inversionTotal = costoPaneles + costoBaterias + costoInversor + costoControlador

  // 7. Costo mensual estimado (inversión / vida útil + mantenimiento mínimo)
  const costoMensualEstimado = inversionTotal / VIDA_UTIL_SISTEMA_MESES + (inversionTotal * 0.005) / 12

  // 8. Autonomía real estimada
  const autonomiaEstimadaHoras = (numeroBaterias * CAPACIDAD_BATERIA_KWH * PROFUNDIDAD_DESCARGA) / (consumoTotalW / 1000)

  // 9. Indicadores financieros (TIR y VPN)
  const costoActual = params.costoMensualActual ?? 0
  const tir = costoActual > 0
    ? calcularTIR(inversionTotal, costoActual, costoMensualEstimado)
    : null
  const vpn = costoActual > 0
    ? calcularVPN(inversionTotal, costoActual, costoMensualEstimado)
    : null

  return {
    panelesRequeridos,
    potenciaPanelesKw: Math.round(potenciaPanelesKw * 100) / 100,
    costoPaneles,
    capacidadBateriasKwh: Math.round(capacidadBateriasKwh * 100) / 100,
    numeroBaterias,
    costoBaterias,
    inversorKw,
    costoInversor,
    controladorA,
    costoControlador,
    inversionTotal,
    costoMensualEstimado: Math.round(costoMensualEstimado * 100) / 100,
    autonomiaEstimadaHoras: Math.round(autonomiaEstimadaHoras * 100) / 100,
    tir,
    vpn,
  }
}
