'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useWizard } from '@/hooks/useWizard'
import { useAuth } from '@/lib/auth'
import { CASO_ESTUDIO_DEMO, getCasoEstudioResumen } from '@/lib/caso-estudio'

/**
 * Página de carga del Caso de Estudio Precargado
 * Inserta todos los datos del caso demo en la BD y redirige a resultados.
 * Propósito: validar el modelo con datos reales (Sección 4.9 de la tesis).
 */
export default function DemoPage() {
  const router = useRouter()
  const { setNodoId, completarPaso, reset } = useWizard()
  const { enterGuestMode } = useAuth()
  const [estado, setEstado] = useState<'cargando' | 'listo' | 'error'>('cargando')
  const [paso, setPaso] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    cargarCasoEstudio()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function cargarCasoEstudio() {
    try {
      const demo = CASO_ESTUDIO_DEMO

      // Asegurar modo invitado si no hay sesión
      enterGuestMode()
      reset()

      // 1. Crear nodo
      setPaso('Creando nodo de telecomunicaciones...')
      const { data: nodoData, error: nodoErr } = await supabase
        .from('nodos')
        .insert({
          nombre: demo.nodo.nombre,
          ubicacion: demo.nodo.ubicacion,
          tipo_nodo: demo.nodo.tipo_nodo,
        })
        .select('id')
        .single()

      if (nodoErr || !nodoData) throw new Error(`Error creando nodo: ${nodoErr?.message}`)
      const nodoId = nodoData.id
      setNodoId(nodoId)

      // 2. Insertar equipos
      setPaso('Registrando inventario de equipos...')
      const equiposPayload = demo.equipos.map((eq) => ({
        nodo_id: nodoId,
        nombre: eq.nombre,
        categoria: eq.categoria,
        potencia_w: eq.potencia_w,
        cantidad: eq.cantidad,
        horas_operacion: eq.horas_operacion,
      }))
      const { error: eqErr } = await supabase.from('equipos').insert(equiposPayload)
      if (eqErr) throw new Error(`Error equipos: ${eqErr.message}`)
      completarPaso(2)

      // 3. Insertar respaldo actual
      setPaso('Registrando sistema de respaldo actual...')
      const { error: respErr } = await supabase.from('respaldo_actual').insert({
        nodo_id: nodoId,
        tipo: demo.respaldo.tipo,
        autonomia_horas: demo.respaldo.autonomia_horas,
        consumo_combustible_lh: demo.respaldo.consumo_combustible_lh,
        costo_mantenimiento_mensual: demo.respaldo.costo_mantenimiento_mensual,
      })
      if (respErr) throw new Error(`Error respaldo: ${respErr.message}`)
      completarPaso(3)

      // 4. Insertar condiciones operativas
      setPaso('Registrando condiciones operativas...')
      const { error: condErr } = await supabase.from('condiciones_operativas').insert({
        nodo_id: nodoId,
        horas_falla_promedio: demo.condiciones.horas_falla_promedio,
        margen_crecimiento: demo.condiciones.margen_crecimiento,
        autonomia_deseada: demo.condiciones.autonomia_deseada,
        radiacion_solar_kwh_m2: demo.condiciones.radiacion_solar_kwh_m2,
      })
      if (condErr) throw new Error(`Error condiciones: ${condErr.message}`)
      completarPaso(4)

      setPaso('Redirigiendo a resultados...')
      setEstado('listo')

      setTimeout(() => {
        router.push('/wizard/resultados')
      }, 1200)

    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : 'Error inesperado')
      setEstado('error')
    }
  }

  const resumen = getCasoEstudioResumen(CASO_ESTUDIO_DEMO)

  return (
    <div className="max-w-lg mx-auto py-16 text-center animate-fade-in-up">
      {/* Icono */}
      <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center shadow-lg">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
        </svg>
      </div>

      <h2 className="text-2xl font-bold text-surface-900 mb-2">
        Cargando Caso de Estudio
      </h2>
      <p className="text-surface-500 text-sm mb-6 max-w-sm mx-auto">
        {CASO_ESTUDIO_DEMO.meta.titulo}
      </p>

      {/* Resumen del nodo */}
      <div className="glass-card p-4 text-left mb-6 text-xs text-surface-500 leading-relaxed">
        <p className="font-semibold text-surface-700 mb-1">Descripción del caso:</p>
        <p>{CASO_ESTUDIO_DEMO.meta.descripcion}</p>
        <p className="mt-2 text-surface-400 italic">Fuente: {CASO_ESTUDIO_DEMO.meta.fuente}</p>
        <p className="mt-1 font-mono text-brand-600">{resumen}</p>
      </div>

      {/* Estado */}
      {estado === 'cargando' && (
        <div className="space-y-4">
          <div className="relative w-12 h-12 mx-auto">
            <div className="absolute inset-0 rounded-full border-4 border-surface-200" />
            <div className="absolute inset-0 rounded-full border-4 border-brand-500 border-t-transparent animate-spin" />
          </div>
          <p className="text-sm text-brand-600 font-medium">{paso}</p>
        </div>
      )}

      {estado === 'listo' && (
        <div className="space-y-3">
          <div className="w-12 h-12 mx-auto rounded-full bg-emerald-100 flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <p className="text-emerald-700 font-semibold">Datos cargados correctamente</p>
          <p className="text-sm text-surface-400">Redirigiendo a resultados...</p>
        </div>
      )}

      {estado === 'error' && (
        <div className="space-y-4">
          <div className="w-12 h-12 mx-auto rounded-full bg-red-50 flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
          </div>
          <p className="text-red-600 font-semibold">Error al cargar el caso de estudio</p>
          <p className="text-xs text-red-400">{error}</p>
          <button onClick={() => router.push('/')} className="btn-secondary mt-2">
            Volver al inicio
          </button>
        </div>
      )}
    </div>
  )
}
