'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useWizard } from '@/hooks/useWizard'
import { useAuth } from '@/lib/auth'
import { TipoRespaldo } from '@/types'
import { validarRespaldo } from '@/lib/validacion'
import ValidacionAlert from '@/components/wizard/ValidacionAlert'
import { calcularAutonomiaBaterias } from '@/lib/indicadores'

export default function RespaldoPage() {
  const router = useRouter()
  const { nodoId, loaded, completarPaso } = useWizard()
  const { user } = useAuth()
  const [tipo, setTipo] = useState<TipoRespaldo>('baterias')
  const [autonomia, setAutonomia] = useState('')
  const [consumoCombustible, setConsumoCombustible] = useState('')
  const [costoMantenimiento, setCostoMantenimiento] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [validacionErrores, setValidacionErrores] = useState<string[]>([])
  const [validacionAdvertencias, setValidacionAdvertencias] = useState<string[]>([])

  // Calculadora de autonomía para baterías
  const [calcCapacidadAh, setCalcCapacidadAh] = useState('')
  const [calcVoltajeV, setCalcVoltajeV] = useState('48')
  const [calcConsumoW, setCalcConsumoW] = useState('')
  const [calcDod, setCalcDod] = useState('50') // % DoD, 50% para plomo-ácido por defecto
  const [calcMostrar, setCalcMostrar] = useState(false)

  const autonomiaCalculada = calcCapacidadAh && calcVoltajeV && calcConsumoW
    ? calcularAutonomiaBaterias(
        Number(calcCapacidadAh),
        Number(calcVoltajeV),
        Number(calcConsumoW),
        Number(calcDod) / 100
      )
    : null

  useEffect(() => {
    if (loaded && !nodoId) router.push('/wizard/nodo')
  }, [loaded, nodoId, router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    // Run validation
    const resultado = validarRespaldo(
      tipo,
      Number(autonomia) || 0,
      tipo === 'planta_diesel' ? Number(consumoCombustible) || 0 : null,
      Number(costoMantenimiento) || 0
    )

    setValidacionErrores(resultado.errores)
    setValidacionAdvertencias(resultado.advertencias)

    if (!resultado.valido) {
      return
    }

    if (!autonomia || !costoMantenimiento) {
      setError('Todos los campos son obligatorios')
      return
    }
    if (tipo === 'planta_diesel' && !consumoCombustible) {
      setError('Indique el consumo de combustible')
      return
    }

    setLoading(true)
    setError('')

    await supabase.from('respaldo_actual').delete().eq('nodo_id', nodoId!)

    const { error: dbError } = await supabase.from('respaldo_actual').insert({
      nodo_id: nodoId,
      tipo,
      autonomia_horas: Number(autonomia),
      consumo_combustible_lh: tipo === 'planta_diesel' ? Number(consumoCombustible) : null,
      costo_mantenimiento_mensual: Number(costoMantenimiento),
    })

    if (dbError) {
      setError('Error: ' + dbError.message)
      setLoading(false)
      return
    }

    completarPaso(3)
    router.push('/wizard/condiciones')
  }

  if (!loaded || !nodoId) return null

  return (
    <div className="max-w-2xl mx-auto">
      <div className="glass-card gradient-border rounded-2xl p-8">
        <div className="flex items-center justify-center gap-3 mb-6">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
          </svg>
          <h2 className="text-2xl font-bold text-surface-900">
            Sistema de Respaldo Actual
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 stagger-children">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          <ValidacionAlert errores={validacionErrores} advertencias={validacionAdvertencias} />

          {/* Toggle cards for tipo */}
          <div>
            <label className="block text-sm font-semibold text-surface-700 mb-3">Tipo de sistema</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setTipo('baterias')}
                className={`relative p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                  tipo === 'baterias'
                    ? 'border-brand-500 bg-brand-50 shadow-md shadow-brand-500/10'
                    : 'border-surface-200 bg-white hover:border-surface-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    tipo === 'baterias' ? 'bg-brand-100' : 'bg-surface-100'
                  }`}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={tipo === 'baterias' ? 'text-brand-600' : 'text-surface-400'}>
                      <rect x="1" y="6" width="18" height="12" rx="2" ry="2"/>
                      <line x1="23" y1="13" x2="23" y2="11"/>
                    </svg>
                  </div>
                  <div>
                    <p className={`font-semibold text-sm ${tipo === 'baterias' ? 'text-brand-800' : 'text-surface-700'}`}>Baterias</p>
                    <p className="text-xs text-surface-400 mt-0.5">Banco de baterias</p>
                  </div>
                </div>
                {tipo === 'baterias' && (
                  <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-brand-500 flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </button>

              <button
                type="button"
                onClick={() => setTipo('planta_diesel')}
                className={`relative p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                  tipo === 'planta_diesel'
                    ? 'border-brand-500 bg-brand-50 shadow-md shadow-brand-500/10'
                    : 'border-surface-200 bg-white hover:border-surface-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    tipo === 'planta_diesel' ? 'bg-brand-100' : 'bg-surface-100'
                  }`}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={tipo === 'planta_diesel' ? 'text-brand-600' : 'text-surface-400'}>
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                      <line x1="12" y1="18" x2="12" y2="12"/>
                      <line x1="9" y1="15" x2="15" y2="15"/>
                    </svg>
                  </div>
                  <div>
                    <p className={`font-semibold text-sm ${tipo === 'planta_diesel' ? 'text-brand-800' : 'text-surface-700'}`}>Planta Diesel</p>
                    <p className="text-xs text-surface-400 mt-0.5">Generador electrico</p>
                  </div>
                </div>
                {tipo === 'planta_diesel' && (
                  <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-brand-500 flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-surface-700 mb-1.5">Autonomia (horas)</label>
            <input
              type="number"
              value={autonomia}
              onChange={(e) => setAutonomia(e.target.value)}
              min="0"
              step="0.5"
              placeholder="Ej: 4"
              className="input-field"
            />
          </div>

          {/* Calculadora de autonomía para baterías */}
          {tipo === 'baterias' && (
            <div className="animate-fade-in-up">
              <button
                type="button"
                onClick={() => setCalcMostrar(!calcMostrar)}
                className="flex items-center gap-2 text-xs text-brand-500 hover:text-brand-700 font-medium transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/>
                  <line x1="8" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="12" y2="14"/>
                </svg>
                {calcMostrar ? 'Ocultar calculadora' : 'Calcular autonomia desde especificaciones tecnicas'}
              </button>

              {calcMostrar && (
                <div className="mt-3 p-4 rounded-xl bg-brand-50/60 border border-brand-200/50 space-y-3 animate-fade-in-up">
                  <p className="text-xs text-brand-700 font-semibold">
                    Calculadora — Formula: A = (C × V × DoD) / P
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-surface-500 font-medium">Capacidad total (Ah)</label>
                      <input type="number" value={calcCapacidadAh} onChange={(e) => setCalcCapacidadAh(e.target.value)}
                        placeholder="Ej: 200" className="input-field !py-2 !text-sm mt-1" min="0" />
                    </div>
                    <div>
                      <label className="text-xs text-surface-500 font-medium">Voltaje sistema (V)</label>
                      <select value={calcVoltajeV} onChange={(e) => setCalcVoltajeV(e.target.value)}
                        className="input-field !py-2 !text-sm mt-1">
                        <option value="12">12 V</option>
                        <option value="24">24 V</option>
                        <option value="48">48 V</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-surface-500 font-medium">Consumo del nodo (W)</label>
                      <input type="number" value={calcConsumoW} onChange={(e) => setCalcConsumoW(e.target.value)}
                        placeholder="Ej: 1500" className="input-field !py-2 !text-sm mt-1" min="0" />
                    </div>
                    <div>
                      <label className="text-xs text-surface-500 font-medium">Prof. descarga DoD (%)</label>
                      <select value={calcDod} onChange={(e) => setCalcDod(e.target.value)}
                        className="input-field !py-2 !text-sm mt-1">
                        <option value="50">50% (Plomo-acido)</option>
                        <option value="70">70% (AGM/GEL)</option>
                        <option value="80">80% (LiFePO4)</option>
                      </select>
                    </div>
                  </div>
                  {autonomiaCalculada !== null && autonomiaCalculada > 0 && (
                    <div className="flex items-center justify-between bg-white rounded-lg p-3 border border-brand-200">
                      <span className="text-sm text-surface-600">Autonomia calculada:</span>
                      <div className="flex items-center gap-3">
                        <span className="text-xl font-bold text-brand-700">{autonomiaCalculada} h</span>
                        <button
                          type="button"
                          onClick={() => setAutonomia(String(autonomiaCalculada))}
                          className="text-xs bg-brand-500 text-white px-3 py-1.5 rounded-lg hover:bg-brand-600 transition-colors font-medium"
                        >
                          Usar este valor
                        </button>
                      </div>
                    </div>
                  )}
                  <p className="text-xs text-surface-400 italic">
                    Fuente: IEC 62109 / IEEE 1562 — Dimensionamiento de sistemas de almacenamiento de energia.
                  </p>
                </div>
              )}
            </div>
          )}

          {tipo === 'planta_diesel' && (
            <div className="animate-fade-in-up">
              <label className="block text-sm font-semibold text-surface-700 mb-1.5">Consumo combustible (L/h)</label>
              <input
                type="number"
                value={consumoCombustible}
                onChange={(e) => setConsumoCombustible(e.target.value)}
                min="0"
                step="0.1"
                placeholder="Ej: 3.5"
                className="input-field"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-surface-700 mb-1.5">Costo mantenimiento ($/mes)</label>
            <input
              type="number"
              value={costoMantenimiento}
              onChange={(e) => setCostoMantenimiento(e.target.value)}
              min="0"
              step="0.01"
              placeholder="Ej: 250"
              className="input-field"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full !py-3"
          >
            {loading ? 'Guardando...' : 'Guardar y Continuar'}
          </button>
        </form>
      </div>
    </div>
  )
}
