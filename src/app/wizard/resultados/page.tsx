'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useWizard } from '@/hooks/useWizard'
import { Equipo, RespaldoActual, CondicionesOperativas } from '@/types'
import {
  consumoTotalW,
  consumoDiarioKwh,
  consumoConMargenKwh,
  costoOperativoActualMensual,
  consumoPorCategoria,
} from '@/lib/calculos'
import { dimensionarSistemaFV, ResultadoDimensionamiento } from '@/lib/dimensionamiento'
import { evaluarMigracion, ResultadoDecision } from '@/lib/motor-decision'
import { generarEscenarios, generarProyeccionCostos, calcularBreakeven, Escenario } from '@/lib/escenarios'
import { generarAnalisisCompleto, ResultadoSensibilidad } from '@/lib/sensibilidad'
import { exportarResultadosCSV } from '@/lib/exportar'
import CostosChart from '@/components/charts/CostosChart'
import AutonomiaChart from '@/components/charts/AutonomiaChart'
import ConsumoPieChart from '@/components/charts/ConsumoPieChart'
import ProyeccionCostosChart from '@/components/charts/ProyeccionCostosChart'
import SensibilidadChart from '@/components/charts/SensibilidadChart'
import { IndicadoresAmbientalesOperativos } from '@/lib/motor-decision'

type TabId = 'comparacion' | 'dimensionamiento' | 'escenarios' | 'sensibilidad'

interface DatosComparacion {
  costoActual: number
  costoSolar: number
  autonomiaActual: number
  autonomiaSolar: number
  inversionTotal: number
  tipoActual: string
  paneles: number
  baterias: number
  inversorKw: number
  controladorA: number
  consumoTotalW: number
  consumoDiarioKwh: number
  consumoConMargenKwh: number
  potenciaPanelesKw: number
  capacidadBateriasKwh: number
  dependeCombustible: boolean
  costoPaneles: number
  costoBaterias: number
  costoInversor: number
  costoControlador: number
}

export default function ResultadosPage() {
  const router = useRouter()
  const { nodoId, loaded, completarPaso } = useWizard()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabId>('comparacion')
  const [decision, setDecision] = useState<ResultadoDecision | null>(null)
  const [dim, setDim] = useState<ResultadoDimensionamiento | null>(null)
  const [datosComparacion, setDatosComparacion] = useState<DatosComparacion | null>(null)
  const [escenarios, setEscenarios] = useState<Escenario[]>([])
  const [proyeccion, setProyeccion] = useState<{ anio: number; costoActual: number; costoSolarBasico: number; costoSolarExpansion: number }[]>([])
  const [breakeven, setBreakeven] = useState<number | null>(null)
  const [sensibilidad, setSensibilidad] = useState<ResultadoSensibilidad[]>([])
  const [categoriasConsumo, setCategoriasConsumo] = useState<Record<string, number>>({})
  const [nodoInfo, setNodoInfo] = useState<{ nombre: string; ubicacion: string; tipo_nodo: string } | null>(null)
  const [indicadores, setIndicadores] = useState<IndicadoresAmbientalesOperativos | null>(null)

  useEffect(() => {
    if (loaded && !nodoId) {
      router.push('/wizard/nodo')
      return
    }
    if (!nodoId) return
    calcular()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, nodoId])

  async function calcular() {
    try {
      const [eqRes, respRes, condRes, nodoRes] = await Promise.all([
        supabase.from('equipos').select('*').eq('nodo_id', nodoId!),
        supabase.from('respaldo_actual').select('*').eq('nodo_id', nodoId!).single(),
        supabase.from('condiciones_operativas').select('*').eq('nodo_id', nodoId!).single(),
        supabase.from('nodos').select('nombre, ubicacion, tipo_nodo').eq('id', nodoId!).single(),
      ])

      const equipos: Equipo[] = eqRes.data || []
      const respaldo: RespaldoActual = respRes.data
      const condiciones: CondicionesOperativas = condRes.data

      if (!respaldo || !condiciones || equipos.length === 0) {
        setError('Faltan datos para realizar el calculo. Complete los pasos anteriores.')
        setLoading(false)
        return
      }

      if (nodoRes.data) setNodoInfo(nodoRes.data)

      const totalW = consumoTotalW(equipos)
      const diarioKwh = consumoDiarioKwh(equipos)
      const conMargenKwh = consumoConMargenKwh(diarioKwh, condiciones.margen_crecimiento)
      const categorias = consumoPorCategoria(equipos)
      setCategoriasConsumo(categorias)

      const costoActual = costoOperativoActualMensual(
        respaldo.tipo,
        respaldo.costo_mantenimiento_mensual,
        respaldo.consumo_combustible_lh,
        condiciones.horas_falla_promedio
      )

      const paramsDim = {
        consumoDiarioKwh: diarioKwh,
        consumoConMargenKwh: conMargenKwh,
        consumoTotalW: totalW,
        autonomiaDeseadaHoras: condiciones.autonomia_deseada,
        radiacionSolarKwhM2: condiciones.radiacion_solar_kwh_m2,
        costoMensualActual: costoActual,
      }

      const dimensionamiento = dimensionarSistemaFV(paramsDim)

      const resultado = evaluarMigracion({
        tipoRespaldoActual: respaldo.tipo,
        autonomiaActualHoras: respaldo.autonomia_horas,
        costoMensualActual: costoActual,
        consumoCombustibleLh: respaldo.consumo_combustible_lh,
        consumoDiarioKwh: diarioKwh,
        dimensionamiento,
        horasFallaPromedio: condiciones.horas_falla_promedio,
        autonomiaDeseada: condiciones.autonomia_deseada,
      })

      setIndicadores(resultado.indicadores)

      // Escenarios y proyeccion
      const escenariosCalc = generarEscenarios(
        paramsDim,
        costoActual,
        respaldo.autonomia_horas,
        respaldo.tipo === 'planta_diesel',
        condiciones.margen_crecimiento
      )
      const proyeccionCalc = generarProyeccionCostos(escenariosCalc, 25)
      const breakevenCalc = calcularBreakeven(
        costoActual,
        dimensionamiento.inversionTotal,
        dimensionamiento.costoMensualEstimado
      )
      setEscenarios(escenariosCalc)
      setProyeccion(proyeccionCalc)
      setBreakeven(breakevenCalc)

      // Sensibilidad
      const baseDatosDecision = {
        tipoRespaldoActual: respaldo.tipo,
        autonomiaActualHoras: respaldo.autonomia_horas,
        costoMensualActual: costoActual,
        horasFallaPromedio: condiciones.horas_falla_promedio,
        autonomiaDeseada: condiciones.autonomia_deseada,
      }
      const sensibilidadCalc = generarAnalisisCompleto(
        paramsDim,
        baseDatosDecision,
        condiciones.margen_crecimiento
      )
      setSensibilidad(sensibilidadCalc)

      // Guardar propuesta en supabase
      await supabase.from('propuestas_fv').delete().eq('nodo_id', nodoId!)
      await supabase.from('propuestas_fv').insert({
        nodo_id: nodoId,
        consumo_total_w: totalW,
        consumo_diario_kwh: diarioKwh,
        consumo_con_margen_kwh: conMargenKwh,
        paneles_requeridos: dimensionamiento.panelesRequeridos,
        potencia_paneles_kw: dimensionamiento.potenciaPanelesKw,
        capacidad_baterias_kwh: dimensionamiento.capacidadBateriasKwh,
        inversor_kw: dimensionamiento.inversorKw,
        controlador_a: dimensionamiento.controladorA,
        inversion_estimada: dimensionamiento.inversionTotal,
        costo_mensual_estimado: dimensionamiento.costoMensualEstimado,
        autonomia_estimada: dimensionamiento.autonomiaEstimadaHoras,
        recomendacion: resultado.recomendacion,
        detalles_json: { dimensionamiento, decision: resultado, costoActual, escenarios: escenariosCalc },
      })

      setDim(dimensionamiento)
      setDecision(resultado)
      setDatosComparacion({
        costoActual,
        costoSolar: dimensionamiento.costoMensualEstimado,
        autonomiaActual: respaldo.autonomia_horas,
        autonomiaSolar: dimensionamiento.autonomiaEstimadaHoras,
        inversionTotal: dimensionamiento.inversionTotal,
        tipoActual: respaldo.tipo === 'planta_diesel' ? 'Planta Diesel' : 'Baterias',
        paneles: dimensionamiento.panelesRequeridos,
        baterias: dimensionamiento.numeroBaterias,
        inversorKw: dimensionamiento.inversorKw,
        controladorA: dimensionamiento.controladorA,
        consumoTotalW: totalW,
        consumoDiarioKwh: diarioKwh,
        consumoConMargenKwh: conMargenKwh,
        potenciaPanelesKw: dimensionamiento.potenciaPanelesKw,
        capacidadBateriasKwh: dimensionamiento.capacidadBateriasKwh,
        dependeCombustible: respaldo.tipo === 'planta_diesel',
        costoPaneles: dimensionamiento.costoPaneles,
        costoBaterias: dimensionamiento.costoBaterias,
        costoInversor: dimensionamiento.costoInversor,
        costoControlador: dimensionamiento.costoControlador,
      })

      completarPaso(5)
      setLoading(false)
    } catch {
      setError('Ocurrio un error al calcular los resultados.')
      setLoading(false)
    }
  }

  function handleExportCSV() {
    if (!datosComparacion || !decision || !nodoInfo) return
    exportarResultadosCSV({
      nodoNombre: nodoInfo.nombre,
      nodoUbicacion: nodoInfo.ubicacion,
      nodoTipo: nodoInfo.tipo_nodo,
      consumoTotalW: datosComparacion.consumoTotalW,
      consumoDiarioKwh: datosComparacion.consumoDiarioKwh,
      consumoConMargenKwh: datosComparacion.consumoConMargenKwh,
      tipoActual: datosComparacion.tipoActual,
      autonomiaActual: datosComparacion.autonomiaActual,
      costoActual: datosComparacion.costoActual,
      panelesRequeridos: datosComparacion.paneles,
      potenciaPanelesKw: datosComparacion.potenciaPanelesKw,
      capacidadBateriasKwh: datosComparacion.capacidadBateriasKwh,
      inversorKw: datosComparacion.inversorKw,
      autonomiaSolar: datosComparacion.autonomiaSolar,
      inversionTotal: datosComparacion.inversionTotal,
      costoMensualSolar: datosComparacion.costoSolar,
      recomendacion: decision.recomendacion,
      puntuacion: decision.puntuacion,
    })
  }

  // --- RENDER ---

  if (!loaded || !nodoId) return null

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-fade-in-up">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-surface-200"></div>
          <div className="absolute inset-0 rounded-full border-4 border-brand-500 border-t-transparent animate-spin"></div>
        </div>
        <p className="mt-6 text-surface-500 font-medium">Calculando propuesta fotovoltaica...</p>
        <p className="mt-1 text-surface-400 text-sm">Dimensionando componentes y evaluando viabilidad</p>
      </div>
    )
  }

  if (error || !decision || !datosComparacion || !dim) {
    return (
      <div className="max-w-lg mx-auto text-center py-16 animate-fade-in-up">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-50 flex items-center justify-center">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
        </div>
        <p className="text-red-600 font-semibold text-lg">{error || 'Faltan datos para el calculo'}</p>
        <p className="text-surface-400 mt-2 text-sm">Asegurese de completar todos los pasos previos del asistente.</p>
        <button onClick={() => router.push('/wizard/nodo')} className="btn-secondary mt-6">
          Volver al inicio
        </button>
      </div>
    )
  }

  const recColor =
    decision.recomendacion === 'Migración recomendada'
      ? 'green'
      : decision.recomendacion === 'Migración parcialmente viable'
        ? 'yellow'
        : 'red'

  const recBannerClasses: Record<string, string> = {
    green: 'from-emerald-500/10 to-emerald-600/5 border-emerald-400',
    yellow: 'from-amber-500/10 to-amber-600/5 border-amber-400',
    red: 'from-red-500/10 to-red-600/5 border-red-400',
  }

  const recTextClasses: Record<string, string> = {
    green: 'text-emerald-700',
    yellow: 'text-amber-700',
    red: 'text-red-700',
  }

  const recSubtextClasses: Record<string, string> = {
    green: 'text-emerald-600/80',
    yellow: 'text-amber-600/80',
    red: 'text-red-600/80',
  }

  const scoreBarColor: Record<string, string> = {
    green: 'bg-emerald-500',
    yellow: 'bg-amber-500',
    red: 'bg-red-500',
  }

  const breakevenLabel = breakeven
    ? breakeven < 12
      ? `${breakeven} meses`
      : `${(breakeven / 12).toFixed(1)} anos`
    : 'N/A'

  const tabs: { id: TabId; label: string }[] = [
    { id: 'comparacion', label: 'Comparacion' },
    { id: 'dimensionamiento', label: 'Dimensionamiento' },
    { id: 'escenarios', label: 'Escenarios' },
    { id: 'sensibilidad', label: 'Sensibilidad' },
  ]

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in-up">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-surface-900">Analisis Integral de Resultados</h2>
        <p className="text-surface-500 mt-1 text-sm">Evaluacion tecnico-economica completa del sistema propuesto</p>
      </div>

      {/* ============================================= */}
      {/* SECTION 1: Summary Cards                      */}
      {/* ============================================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
        <div className="glass-card p-5 border-l-4 border-l-brand-500">
          <p className="text-xs text-surface-400 uppercase tracking-wide font-medium">Consumo Total</p>
          <p className="text-2xl font-bold text-surface-900 mt-1">
            {(datosComparacion.consumoTotalW / 1000).toFixed(2)}{' '}
            <span className="text-base font-normal text-surface-500">kW</span>
          </p>
        </div>
        <div className="glass-card p-5 border-l-4 border-l-amber-500">
          <p className="text-xs text-surface-400 uppercase tracking-wide font-medium">Consumo Diario</p>
          <p className="text-2xl font-bold text-surface-900 mt-1">
            {datosComparacion.consumoDiarioKwh.toFixed(2)}{' '}
            <span className="text-base font-normal text-surface-500">kWh</span>
          </p>
        </div>
        <div className="glass-card p-5 border-l-4 border-l-emerald-500">
          <p className="text-xs text-surface-400 uppercase tracking-wide font-medium">Inversion Estimada</p>
          <p className="text-2xl font-bold text-surface-900 mt-1">${datosComparacion.inversionTotal.toLocaleString()}</p>
        </div>
        <div className="glass-card p-5 border-l-4 border-l-purple-500">
          <p className="text-xs text-surface-400 uppercase tracking-wide font-medium">Breakeven</p>
          <p className="text-2xl font-bold text-surface-900 mt-1">{breakevenLabel}</p>
        </div>
      </div>

      {/* ============================================= */}
      {/* SECTION 1b: Indicadores Ambientales / SLA     */}
      {/* ============================================= */}
      {indicadores && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
          {/* Disponibilidad actual */}
          <div className="glass-card p-5 border-l-4 border-l-red-400">
            <p className="text-xs text-surface-400 uppercase tracking-wide font-medium">Disponibilidad Actual</p>
            <p className="text-2xl font-bold text-surface-900 mt-1">
              {indicadores.disponibilidadActualPct.toFixed(2)}
              <span className="text-base font-normal text-surface-500">%</span>
            </p>
            <p className="text-xs text-surface-400 mt-1">{indicadores.slaActual}</p>
          </div>
          {/* Disponibilidad solar */}
          <div className="glass-card p-5 border-l-4 border-l-emerald-400">
            <p className="text-xs text-surface-400 uppercase tracking-wide font-medium">Disponibilidad Solar</p>
            <p className="text-2xl font-bold text-emerald-700 mt-1">
              {indicadores.disponibilidadSolarPct.toFixed(2)}
              <span className="text-base font-normal text-surface-500">%</span>
            </p>
            <p className="text-xs text-emerald-600 mt-1">{indicadores.slaSolar}</p>
          </div>
          {/* CO2 evitado */}
          <div className="glass-card p-5 border-l-4 border-l-green-500">
            <p className="text-xs text-surface-400 uppercase tracking-wide font-medium">CO₂ Evitado/año</p>
            <p className="text-2xl font-bold text-green-700 mt-1">
              {indicadores.reduccionCO2KgAnio.toLocaleString()}
              <span className="text-base font-normal text-surface-500"> kg</span>
            </p>
            <p className="text-xs text-surface-400 mt-1">≈ {(indicadores.reduccionCO2KgAnio / 1000).toFixed(2)} toneladas CO₂</p>
          </div>
          {/* TIR */}
          <div className="glass-card p-5 border-l-4 border-l-violet-500">
            <p className="text-xs text-surface-400 uppercase tracking-wide font-medium">TIR del Proyecto</p>
            {dim?.tir != null ? (
              <>
                <p className="text-2xl font-bold text-violet-700 mt-1">
                  {dim.tir.toFixed(1)}
                  <span className="text-base font-normal text-surface-500">%</span>
                </p>
                <p className="text-xs text-surface-400 mt-1">
                  VPN: ${dim.vpn != null ? dim.vpn.toLocaleString() : 'N/A'}
                </p>
              </>
            ) : (
              <p className="text-base font-medium text-surface-500 mt-2">Sin ahorro proyectado</p>
            )}
          </div>
        </div>
      )}

      {/* ============================================= */}
      {/* SECTION 2: Tab Navigation + Content           */}
      {/* ============================================= */}
      <div className="glass-card-strong overflow-hidden">
        {/* Tab bar */}
        <div className="flex gap-1 p-2 bg-surface-100/50 rounded-t-xl">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-brand-500 text-white shadow-sm'
                  : 'text-surface-500 hover:text-surface-800 hover:bg-surface-200/50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="p-6">
          {/* --- TAB: Comparacion --- */}
          {activeTab === 'comparacion' && (
            <div className="space-y-6 animate-fade-in-up">
              {/* Comparison table */}
              <div className="overflow-hidden rounded-xl border border-surface-200/50">
                <table className="w-full">
                  <thead>
                    <tr className="bg-surface-50/50">
                      <th className="p-4 text-left text-sm font-semibold text-surface-600">Criterio</th>
                      <th className="p-4 text-center text-sm font-semibold text-surface-600">
                        Sistema Actual
                        <span className="block text-xs font-normal text-surface-400">({datosComparacion.tipoActual})</span>
                      </th>
                      <th className="p-4 text-center text-sm font-semibold text-brand-600">Sistema Solar FV</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t border-surface-100">
                      <td className="p-4 font-medium text-surface-700">Autonomia</td>
                      <td className="p-4 text-center text-surface-600">{datosComparacion.autonomiaActual} h</td>
                      <td className="p-4 text-center font-semibold text-brand-600">{datosComparacion.autonomiaSolar} h</td>
                    </tr>
                    <tr className="border-t border-surface-100 bg-surface-50/30">
                      <td className="p-4 font-medium text-surface-700">Costo Mensual</td>
                      <td className="p-4 text-center text-surface-600">${datosComparacion.costoActual.toFixed(2)}</td>
                      <td className="p-4 text-center font-semibold text-brand-600">${datosComparacion.costoSolar.toFixed(2)}</td>
                    </tr>
                    <tr className="border-t border-surface-100">
                      <td className="p-4 font-medium text-surface-700">Dependencia Combustible</td>
                      <td className="p-4 text-center">
                        {datosComparacion.dependeCombustible ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-50 text-red-600 text-xs font-medium">Si</span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-100 text-surface-500 text-xs font-medium">No</span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 text-xs font-medium">No</span>
                      </td>
                    </tr>
                    <tr className="border-t border-surface-100 bg-surface-50/30">
                      <td className="p-4 font-medium text-surface-700">Emisión CO₂ (kg/mes)</td>
                      <td className="p-4 text-center">
                        {indicadores ? (
                          <span className={`text-sm font-medium ${indicadores.emisionesCO2ActualKgMes > 0 ? 'text-red-500' : 'text-surface-400'}`}>
                            {indicadores.emisionesCO2ActualKgMes > 0
                              ? `${indicadores.emisionesCO2ActualKgMes.toLocaleString()} kg`
                              : 'Sin emisión directa'}
                          </span>
                        ) : (
                          <span className="text-surface-400 text-sm">—</span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        <span className="inline-flex items-center gap-1 text-emerald-600 text-sm font-medium">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                          </svg>
                          {indicadores ? `${indicadores.emisionesCO2SolarKgMes} kg` : '~0 kg'}
                        </span>
                      </td>
                    </tr>
                    <tr className="border-t border-surface-100">
                      <td className="p-4 font-medium text-surface-700">Disponibilidad SLA</td>
                      <td className="p-4 text-center">
                        {indicadores ? (
                          <span className="text-sm text-surface-600">{indicadores.disponibilidadActualPct.toFixed(3)}%</span>
                        ) : (
                          <span className="text-surface-400">—</span>
                        )}
                      </td>
                      <td className="p-4 text-center font-semibold text-brand-600">
                        {indicadores ? `${indicadores.disponibilidadSolarPct.toFixed(3)}%` : '—'}
                      </td>
                    </tr>
                    <tr className="border-t border-surface-100 bg-surface-50/30">
                      <td className="p-4 font-medium text-surface-700">TIR del Proyecto</td>
                      <td className="p-4 text-center text-surface-400">—</td>
                      <td className="p-4 text-center font-semibold text-violet-600">
                        {dim?.tir != null ? `${dim.tir.toFixed(1)}%` : 'N/A'}
                      </td>
                    </tr>
                    <tr className="border-t border-surface-100">
                      <td className="p-4 font-medium text-surface-700">Breakeven</td>
                      <td className="p-4 text-center text-surface-400">-</td>
                      <td className="p-4 text-center font-semibold text-brand-600">{breakevenLabel}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Charts grid */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="glass-card p-6">
                  <h4 className="text-sm font-bold text-surface-700 mb-4 text-center">Costos Mensuales ($)</h4>
                  <CostosChart costoActual={datosComparacion.costoActual} costoSolar={datosComparacion.costoSolar} />
                </div>
                <div className="glass-card p-6">
                  <h4 className="text-sm font-bold text-surface-700 mb-4 text-center">Autonomia (horas)</h4>
                  <AutonomiaChart autonomiaActual={datosComparacion.autonomiaActual} autonomiaSolar={datosComparacion.autonomiaSolar} />
                </div>
              </div>

              {/* Consumo pie chart */}
              {Object.keys(categoriasConsumo).length > 0 && (
                <div className="glass-card p-6">
                  <h4 className="text-sm font-bold text-surface-700 mb-4 text-center">Distribucion de Consumo por Categoria</h4>
                  <ConsumoPieChart consumoPorCategoria={categoriasConsumo} />
                </div>
              )}
            </div>
          )}

          {/* --- TAB: Dimensionamiento --- */}
          {activeTab === 'dimensionamiento' && (
            <div className="space-y-6 animate-fade-in-up">
              <p className="text-surface-500 text-sm">
                Componentes requeridos para el sistema fotovoltaico dimensionado con un consumo diario de{' '}
                <strong className="text-surface-700">{datosComparacion.consumoDiarioKwh.toFixed(2)} kWh</strong> y margen de{' '}
                <strong className="text-surface-700">{datosComparacion.consumoConMargenKwh.toFixed(2)} kWh</strong>.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Paneles */}
                <div className="rounded-xl bg-gradient-to-br from-blue-50 to-blue-100/50 p-4 text-center border border-blue-200/50">
                  <div className="w-10 h-10 mx-auto mb-2 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="3" width="20" height="14" rx="2" />
                      <line x1="8" y1="21" x2="16" y2="21" />
                      <line x1="12" y1="17" x2="12" y2="21" />
                    </svg>
                  </div>
                  <p className="text-2xl font-bold text-blue-700">{datosComparacion.paneles}</p>
                  <p className="text-xs text-blue-600/70 font-medium">Paneles 550W</p>
                  <p className="text-xs text-surface-400 mt-0.5">{datosComparacion.potenciaPanelesKw} kWp</p>
                  <p className="text-xs text-surface-500 mt-1 font-semibold">${datosComparacion.costoPaneles.toLocaleString()}</p>
                </div>
                {/* Baterias */}
                <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100/50 p-4 text-center border border-emerald-200/50">
                  <div className="w-10 h-10 mx-auto mb-2 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="1" y="6" width="18" height="12" rx="2" />
                      <line x1="23" y1="13" x2="23" y2="11" />
                    </svg>
                  </div>
                  <p className="text-2xl font-bold text-emerald-700">{datosComparacion.baterias}</p>
                  <p className="text-xs text-emerald-600/70 font-medium">Baterias LiFePO4</p>
                  <p className="text-xs text-surface-400 mt-0.5">{datosComparacion.capacidadBateriasKwh.toFixed(1)} kWh</p>
                  <p className="text-xs text-surface-500 mt-1 font-semibold">${datosComparacion.costoBaterias.toLocaleString()}</p>
                </div>
                {/* Inversor */}
                <div className="rounded-xl bg-gradient-to-br from-amber-50 to-amber-100/50 p-4 text-center border border-amber-200/50">
                  <div className="w-10 h-10 mx-auto mb-2 rounded-lg bg-amber-500/10 flex items-center justify-center">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                    </svg>
                  </div>
                  <p className="text-2xl font-bold text-amber-700">{datosComparacion.inversorKw}</p>
                  <p className="text-xs text-amber-600/70 font-medium">Inversor (kW)</p>
                  <p className="text-xs text-surface-400 mt-0.5">Onda pura</p>
                  <p className="text-xs text-surface-500 mt-1 font-semibold">${datosComparacion.costoInversor.toLocaleString()}</p>
                </div>
                {/* Controlador */}
                <div className="rounded-xl bg-gradient-to-br from-purple-50 to-purple-100/50 p-4 text-center border border-purple-200/50">
                  <div className="w-10 h-10 mx-auto mb-2 rounded-lg bg-purple-500/10 flex items-center justify-center">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" />
                    </svg>
                  </div>
                  <p className="text-2xl font-bold text-purple-700">{datosComparacion.controladorA}</p>
                  <p className="text-xs text-purple-600/70 font-medium">Controlador (A)</p>
                  <p className="text-xs text-surface-400 mt-0.5">MPPT</p>
                  <p className="text-xs text-surface-500 mt-1 font-semibold">${datosComparacion.costoControlador.toLocaleString()}</p>
                </div>
              </div>

              {/* Cost breakdown summary */}
              <div className="glass-card p-5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-surface-600">Inversion Total del Sistema</span>
                  <span className="text-xl font-bold text-surface-900">${datosComparacion.inversionTotal.toLocaleString()}</span>
                </div>
                <div className="mt-3 grid grid-cols-4 gap-2 text-xs text-surface-500">
                  <div className="flex flex-col items-center">
                    <div className="w-full h-2 rounded-full bg-blue-400" style={{ opacity: datosComparacion.costoPaneles / datosComparacion.inversionTotal }} />
                    <span className="mt-1">Paneles {((datosComparacion.costoPaneles / datosComparacion.inversionTotal) * 100).toFixed(0)}%</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="w-full h-2 rounded-full bg-emerald-400" style={{ opacity: datosComparacion.costoBaterias / datosComparacion.inversionTotal }} />
                    <span className="mt-1">Baterias {((datosComparacion.costoBaterias / datosComparacion.inversionTotal) * 100).toFixed(0)}%</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="w-full h-2 rounded-full bg-amber-400" style={{ opacity: datosComparacion.costoInversor / datosComparacion.inversionTotal }} />
                    <span className="mt-1">Inversor {((datosComparacion.costoInversor / datosComparacion.inversionTotal) * 100).toFixed(0)}%</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="w-full h-2 rounded-full bg-purple-400" style={{ opacity: datosComparacion.costoControlador / datosComparacion.inversionTotal }} />
                    <span className="mt-1">Controlador {((datosComparacion.costoControlador / datosComparacion.inversionTotal) * 100).toFixed(0)}%</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* --- TAB: Escenarios --- */}
          {activeTab === 'escenarios' && (
            <div className="space-y-6 animate-fade-in-up">
              {/* Scenario comparison table */}
              {escenarios.length > 0 && (
                <div className="overflow-x-auto rounded-xl border border-surface-200/50">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-surface-50/50">
                        <th className="p-4 text-left text-sm font-semibold text-surface-600">Caracteristica</th>
                        {escenarios.map((esc) => (
                          <th key={esc.id} className={`p-4 text-center text-sm font-semibold ${esc.color}`}>
                            {esc.nombre}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-t border-surface-100">
                        <td className="p-4 font-medium text-surface-700">Inversion Inicial</td>
                        {escenarios.map((esc) => (
                          <td key={esc.id} className="p-4 text-center text-surface-700">
                            ${esc.inversionInicial.toLocaleString()}
                          </td>
                        ))}
                      </tr>
                      <tr className="border-t border-surface-100 bg-surface-50/30">
                        <td className="p-4 font-medium text-surface-700">Costo Mensual</td>
                        {escenarios.map((esc) => (
                          <td key={esc.id} className="p-4 text-center text-surface-700">
                            ${esc.costoMensual.toFixed(2)}
                          </td>
                        ))}
                      </tr>
                      <tr className="border-t border-surface-100">
                        <td className="p-4 font-medium text-surface-700">Autonomia</td>
                        {escenarios.map((esc) => (
                          <td key={esc.id} className="p-4 text-center text-surface-700">
                            {esc.autonomiaHoras.toFixed(1)} h
                          </td>
                        ))}
                      </tr>
                      <tr className="border-t border-surface-100 bg-surface-50/30">
                        <td className="p-4 font-medium text-surface-700">Combustible</td>
                        {escenarios.map((esc) => (
                          <td key={esc.id} className="p-4 text-center">
                            <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${esc.dependeCombustible ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                              {esc.dependeCombustible ? 'Si' : 'No'}
                            </span>
                          </td>
                        ))}
                      </tr>
                      <tr className="border-t border-surface-100">
                        <td className="p-4 font-medium text-surface-700">Costo a 5 anos</td>
                        {escenarios.map((esc) => (
                          <td key={esc.id} className="p-4 text-center text-surface-700">
                            ${esc.costo5Anos.toLocaleString()}
                          </td>
                        ))}
                      </tr>
                      <tr className="border-t border-surface-100 bg-surface-50/30">
                        <td className="p-4 font-medium text-surface-700">Costo a 10 anos</td>
                        {escenarios.map((esc) => (
                          <td key={esc.id} className="p-4 text-center text-surface-700">
                            ${esc.costo10Anos.toLocaleString()}
                          </td>
                        ))}
                      </tr>
                      <tr className="border-t border-surface-100">
                        <td className="p-4 font-medium text-surface-700">Costo a 15 anos</td>
                        {escenarios.map((esc) => (
                          <td key={esc.id} className="p-4 text-center text-surface-700">
                            ${esc.costo15Anos.toLocaleString()}
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              {/* Scenario descriptions */}
              <div className="grid md:grid-cols-3 gap-4">
                {escenarios.map((esc) => (
                  <div key={esc.id} className={`glass-card p-4 ${esc.bgColor} border border-surface-200/50`}>
                    <h5 className={`font-semibold text-sm ${esc.color}`}>{esc.nombre}</h5>
                    <p className="text-xs text-surface-500 mt-1">{esc.descripcion}</p>
                  </div>
                ))}
              </div>

              {/* 25-year projection chart */}
              {proyeccion.length > 0 && (
                <div className="glass-card p-6">
                  <h4 className="text-sm font-bold text-surface-700 mb-4 text-center">Proyeccion de Costos Acumulados (25 anos)</h4>
                  <ProyeccionCostosChart proyeccion={proyeccion} />
                </div>
              )}
            </div>
          )}

          {/* --- TAB: Sensibilidad --- */}
          {activeTab === 'sensibilidad' && (
            <div className="space-y-6 animate-fade-in-up">
              <p className="text-surface-500 text-sm">
                Analisis de como varian los resultados al modificar parametros clave. El punto marcado indica el valor base utilizado.
              </p>
              {sensibilidad.length > 0 ? (
                <div className="grid md:grid-cols-2 gap-6">
                  {sensibilidad.map((res, idx) => (
                    <div key={idx} className="glass-card p-5">
                      <h4 className="text-sm font-bold text-surface-700 mb-3 text-center">
                        {res.parametro.nombre}
                      </h4>
                      <SensibilidadChart datos={res} />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-surface-400 py-8">No hay datos de sensibilidad disponibles.</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ============================================= */}
      {/* SECTION 3: Decision Engine                    */}
      {/* ============================================= */}
      <div className="glass-card p-6">
        <h3 className="font-bold text-surface-900 mb-5">Evaluacion del Motor de Decision</h3>
        <div className="space-y-3">
          {decision.reglas.map((regla) => (
            <div
              key={regla.nombre}
              className={`flex items-start gap-3 p-4 rounded-xl transition-colors ${
                regla.cumple ? 'bg-emerald-50/70 border border-emerald-200/50' : 'bg-red-50/70 border border-red-200/50'
              }`}
            >
              <div
                className={`mt-0.5 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                  regla.cumple ? 'bg-emerald-500 text-white' : 'bg-red-400 text-white'
                }`}
              >
                {regla.cumple ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-surface-800">{regla.nombre}</p>
                <p className="text-xs text-surface-500 mt-0.5">{regla.detalle}</p>
              </div>
              <span
                className={`text-xs font-bold px-2 py-1 rounded-md flex-shrink-0 ${
                  regla.cumple ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'
                }`}
              >
                {regla.cumple ? '+' : ''}{regla.peso} pts
              </span>
            </div>
          ))}
        </div>

        {/* Score progress bar */}
        <div className="mt-6 pt-5 border-t border-surface-200/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-surface-600">Puntuacion Total</span>
            <span className="text-xl font-bold text-surface-900">
              {decision.puntuacion}
              <span className="text-sm text-surface-400 font-normal">/100</span>
            </span>
          </div>
          <div className="w-full h-3 bg-surface-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ease-out ${scoreBarColor[recColor]}`}
              style={{ width: `${decision.puntuacion}%` }}
            />
          </div>
        </div>
      </div>

      {/* Final recommendation banner */}
      <div className={`gradient-border rounded-2xl bg-gradient-to-r ${recBannerClasses[recColor]} p-8 text-center`}>
        <div className="mb-3">
          {recColor === 'green' && (
            <div className="w-14 h-14 mx-auto rounded-full bg-emerald-100 flex items-center justify-center">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
          )}
          {recColor === 'yellow' && (
            <div className="w-14 h-14 mx-auto rounded-full bg-amber-100 flex items-center justify-center">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
          )}
          {recColor === 'red' && (
            <div className="w-14 h-14 mx-auto rounded-full bg-red-100 flex items-center justify-center">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            </div>
          )}
        </div>
        <h3 className={`text-2xl font-bold ${recTextClasses[recColor]}`}>{decision.recomendacion}</h3>
        <p className={`mt-3 text-sm max-w-2xl mx-auto leading-relaxed ${recSubtextClasses[recColor]}`}>
          {decision.justificacion}
        </p>
      </div>

      {/* ============================================= */}
      {/* SECTION 4: Actions                            */}
      {/* ============================================= */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Link href="/wizard/reporte" className="btn-primary flex-1 py-3.5 text-base text-center">
          Ver Reporte Final
        </Link>
        <button onClick={handleExportCSV} className="btn-secondary flex-1 py-3.5 text-base">
          Exportar CSV
        </button>
      </div>
    </div>
  )
}
