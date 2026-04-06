'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useWizard } from '@/hooks/useWizard'
import { generarPDF } from '@/lib/generar-pdf'
import { costoOperativoActualMensual } from '@/lib/calculos'

interface ReporteDatos {
  nodo: { nombre: string; ubicacion: string; tipo_nodo: string }
  equipos: { nombre: string; categoria: string; potencia_w: number; cantidad: number; horas_operacion: number }[]
  respaldo: { tipo: 'baterias' | 'planta_diesel'; autonomia_horas: number; consumo_combustible_lh: number | null; costo_mantenimiento_mensual: number }
  condiciones: { horas_falla_promedio: number; margen_crecimiento: number; autonomia_deseada: number; radiacion_solar_kwh_m2: number }
  propuesta: {
    consumo_total_w: number; consumo_diario_kwh: number; consumo_con_margen_kwh: number
    paneles_requeridos: number; potencia_paneles_kw: number; capacidad_baterias_kwh: number
    inversor_kw: number; controlador_a: number; inversion_estimada: number; costo_mensual_estimado: number
    autonomia_estimada: number; recomendacion: string; detalles_json: Record<string, unknown>
  }
  costoActual: number
}

export default function ReportePage() {
  const router = useRouter()
  const { nodoId, loaded, reset } = useWizard()
  const [loading, setLoading] = useState(true)
  const [datos, setDatos] = useState<ReporteDatos | null>(null)

  useEffect(() => {
    if (loaded && !nodoId) { router.push('/wizard/nodo'); return }
    if (!nodoId) return
    cargarDatos()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, nodoId])

  async function cargarDatos() {
    const [nodoRes, eqRes, respRes, condRes, propRes] = await Promise.all([
      supabase.from('nodos').select('*').eq('id', nodoId!).single(),
      supabase.from('equipos').select('*').eq('nodo_id', nodoId!),
      supabase.from('respaldo_actual').select('*').eq('nodo_id', nodoId!).single(),
      supabase.from('condiciones_operativas').select('*').eq('nodo_id', nodoId!).single(),
      supabase.from('propuestas_fv').select('*').eq('nodo_id', nodoId!).single(),
    ])

    if (!nodoRes.data || !respRes.data || !condRes.data || !propRes.data) {
      setLoading(false)
      return
    }

    const costoActual = costoOperativoActualMensual(
      respRes.data.tipo,
      respRes.data.costo_mantenimiento_mensual,
      respRes.data.consumo_combustible_lh,
      condRes.data.horas_falla_promedio
    )

    setDatos({
      nodo: nodoRes.data,
      equipos: eqRes.data || [],
      respaldo: respRes.data,
      condiciones: condRes.data,
      propuesta: propRes.data,
      costoActual,
    })
    setLoading(false)
  }

  function descargarPDF() {
    if (!datos) return
    generarPDF(datos)
  }

  function nuevaEvaluacion() {
    reset()
    router.push('/wizard/nodo')
  }

  if (!loaded || !nodoId) return null

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-fade-in-up">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-surface-200"></div>
          <div className="absolute inset-0 rounded-full border-4 border-brand-500 border-t-transparent animate-spin"></div>
        </div>
        <p className="mt-6 text-surface-500 font-medium">Cargando reporte...</p>
      </div>
    )
  }

  if (!datos) {
    return (
      <div className="max-w-lg mx-auto text-center py-16 animate-fade-in-up">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-50 flex items-center justify-center">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
        </div>
        <p className="text-red-600 font-semibold">No se encontraron datos del reporte.</p>
        <p className="text-surface-400 mt-2 text-sm">Calcule los resultados antes de ver el reporte.</p>
        <button onClick={() => router.push('/wizard/resultados')} className="btn-secondary mt-6">Ir a Resultados</button>
      </div>
    )
  }

  const recColor =
    datos.propuesta.recomendacion === 'Migración recomendada'
      ? 'green'
      : datos.propuesta.recomendacion === 'Migración parcialmente viable'
        ? 'yellow'
        : 'red'

  const badgeClasses: Record<string, string> = {
    green: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    yellow: 'bg-amber-100 text-amber-700 border-amber-200',
    red: 'bg-red-100 text-red-700 border-red-200',
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in-up">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-surface-900">Reporte Final</h2>
        <p className="text-surface-500 mt-1 text-sm">Vista previa del informe de evaluacion</p>
      </div>

      {/* Print-ready report preview */}
      <div className="glass-card divide-y divide-surface-200/50">
        {/* Section 1: Nodo info */}
        <div className="p-6">
          <h3 className="text-sm font-bold text-brand-600 uppercase tracking-wide mb-3">1. Nodo de Telecomunicaciones</h3>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-surface-400 text-xs">Nombre</span>
              <p className="font-semibold text-surface-800">{datos.nodo.nombre}</p>
            </div>
            <div>
              <span className="text-surface-400 text-xs">Ubicacion</span>
              <p className="font-semibold text-surface-800">{datos.nodo.ubicacion}</p>
            </div>
            <div>
              <span className="text-surface-400 text-xs">Tipo</span>
              <p className="font-semibold text-surface-800 capitalize">{datos.nodo.tipo_nodo}</p>
            </div>
          </div>
        </div>

        {/* Section 2: Equipment list */}
        <div className="p-6">
          <h3 className="text-sm font-bold text-brand-600 uppercase tracking-wide mb-3">2. Inventario de Equipos</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-surface-400 uppercase tracking-wide">
                  <th className="pb-2">Equipo</th>
                  <th className="pb-2">Categoria</th>
                  <th className="pb-2 text-right">Potencia</th>
                  <th className="pb-2 text-right">Cant.</th>
                  <th className="pb-2 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100">
                {datos.equipos.map((eq, i) => (
                  <tr key={i}>
                    <td className="py-2 font-medium text-surface-700">{eq.nombre}</td>
                    <td className="py-2 text-surface-500 capitalize">{eq.categoria}</td>
                    <td className="py-2 text-right text-surface-600">{eq.potencia_w}W</td>
                    <td className="py-2 text-right text-surface-600">{eq.cantidad}</td>
                    <td className="py-2 text-right font-medium text-surface-800">{eq.potencia_w * eq.cantidad}W</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 3: Energy consumption */}
        <div className="p-6">
          <h3 className="text-sm font-bold text-brand-600 uppercase tracking-wide mb-3">3. Consumo Energetico</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-surface-50 rounded-lg p-3 text-center">
              <p className="text-xs text-surface-400">Consumo Total</p>
              <p className="text-lg font-bold text-surface-900">{(datos.propuesta.consumo_total_w / 1000).toFixed(2)} kW</p>
            </div>
            <div className="bg-surface-50 rounded-lg p-3 text-center">
              <p className="text-xs text-surface-400">Diario</p>
              <p className="text-lg font-bold text-surface-900">{datos.propuesta.consumo_diario_kwh.toFixed(2)} kWh</p>
            </div>
            <div className="bg-surface-50 rounded-lg p-3 text-center">
              <p className="text-xs text-surface-400">Con Margen</p>
              <p className="text-lg font-bold text-surface-900">{datos.propuesta.consumo_con_margen_kwh.toFixed(2)} kWh</p>
            </div>
          </div>
        </div>

        {/* Section 4: Current backup */}
        <div className="p-6">
          <h3 className="text-sm font-bold text-brand-600 uppercase tracking-wide mb-3">4. Sistema de Respaldo Actual</h3>
          <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-surface-400">Tipo:</span>
              <span className="font-semibold text-surface-800">{datos.respaldo.tipo === 'planta_diesel' ? 'Planta Diesel' : 'Baterias'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-surface-400">Autonomia:</span>
              <span className="font-semibold text-surface-800">{datos.respaldo.autonomia_horas} h</span>
            </div>
            <div className="flex justify-between">
              <span className="text-surface-400">Costo operativo:</span>
              <span className="font-semibold text-surface-800">${datos.costoActual.toFixed(2)}/mes</span>
            </div>
            {datos.respaldo.consumo_combustible_lh && (
              <div className="flex justify-between">
                <span className="text-surface-400">Combustible:</span>
                <span className="font-semibold text-surface-800">{datos.respaldo.consumo_combustible_lh} L/h</span>
              </div>
            )}
          </div>
        </div>

        {/* Section 5: Solar proposal */}
        <div className="p-6">
          <h3 className="text-sm font-bold text-brand-600 uppercase tracking-wide mb-3">5. Propuesta Fotovoltaica</h3>
          <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-surface-400">Paneles:</span>
              <span className="font-semibold text-surface-800">{datos.propuesta.paneles_requeridos} x 550W ({datos.propuesta.potencia_paneles_kw} kWp)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-surface-400">Baterias:</span>
              <span className="font-semibold text-surface-800">{datos.propuesta.capacidad_baterias_kwh.toFixed(1)} kWh</span>
            </div>
            <div className="flex justify-between">
              <span className="text-surface-400">Inversor:</span>
              <span className="font-semibold text-surface-800">{datos.propuesta.inversor_kw} kW</span>
            </div>
            <div className="flex justify-between">
              <span className="text-surface-400">Controlador:</span>
              <span className="font-semibold text-surface-800">{datos.propuesta.controlador_a} A MPPT</span>
            </div>
            <div className="flex justify-between">
              <span className="text-surface-400">Autonomia:</span>
              <span className="font-semibold text-surface-800">{datos.propuesta.autonomia_estimada} h</span>
            </div>
            <div className="flex justify-between">
              <span className="text-surface-400">Costo mensual:</span>
              <span className="font-semibold text-surface-800">${datos.propuesta.costo_mensual_estimado.toFixed(2)}/mes</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-surface-100 flex justify-between text-sm">
            <span className="text-surface-500 font-medium">Inversion total estimada:</span>
            <span className="text-lg font-bold text-surface-900">${datos.propuesta.inversion_estimada.toLocaleString()}</span>
          </div>
        </div>

        {/* Section 6: Comparison summary */}
        <div className="p-6">
          <h3 className="text-sm font-bold text-brand-600 uppercase tracking-wide mb-3">6. Comparacion</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-surface-400 uppercase tracking-wide">
                  <th className="pb-2">Criterio</th>
                  <th className="pb-2 text-center">Actual</th>
                  <th className="pb-2 text-center">Solar FV</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100">
                <tr>
                  <td className="py-2 text-surface-600">Autonomia</td>
                  <td className="py-2 text-center text-surface-700">{datos.respaldo.autonomia_horas} h</td>
                  <td className="py-2 text-center font-semibold text-brand-600">{datos.propuesta.autonomia_estimada} h</td>
                </tr>
                <tr>
                  <td className="py-2 text-surface-600">Costo mensual</td>
                  <td className="py-2 text-center text-surface-700">${datos.costoActual.toFixed(2)}</td>
                  <td className="py-2 text-center font-semibold text-brand-600">${datos.propuesta.costo_mensual_estimado.toFixed(2)}</td>
                </tr>
                <tr>
                  <td className="py-2 text-surface-600">Combustible</td>
                  <td className="py-2 text-center text-surface-700">{datos.respaldo.tipo === 'planta_diesel' ? 'Si' : 'No'}</td>
                  <td className="py-2 text-center font-semibold text-emerald-600">No</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 7: Recommendation */}
        <div className="p-6">
          <h3 className="text-sm font-bold text-brand-600 uppercase tracking-wide mb-3">7. Recomendacion</h3>
          <div className={`inline-flex items-center px-4 py-2 rounded-full border text-sm font-bold ${badgeClasses[recColor]}`}>
            {datos.propuesta.recomendacion}
          </div>
          {datos.propuesta.detalles_json?.decision != null && (
            <p className="mt-3 text-sm text-surface-600 leading-relaxed">
              {String((datos.propuesta.detalles_json.decision as { justificacion?: string }).justificacion ?? '')}
            </p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={descargarPDF}
          className="btn-primary flex-1 py-3 flex items-center justify-center gap-2"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Descargar PDF
        </button>
        <button
          onClick={nuevaEvaluacion}
          className="btn-secondary flex-1 py-3"
        >
          Nueva Evaluacion
        </button>
      </div>

      <div className="text-center">
        <Link href="/wizard/resultados" className="text-sm text-brand-500 hover:text-brand-600 font-medium transition-colors">
          Volver a Resultados
        </Link>
      </div>
    </div>
  )
}
