'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useWizard } from '@/hooks/useWizard'
import { useAuth } from '@/lib/auth'
import { ZONAS_SOLARES, buscarRadiacionPorCiudad, ZonaSolar } from '@/lib/radiacion-solar'
import { validarCondiciones } from '@/lib/validacion'
import ValidacionAlert from '@/components/wizard/ValidacionAlert'

export default function CondicionesPage() {
  const router = useRouter()
  const { nodoId, loaded, completarPaso } = useWizard()
  const { user } = useAuth()
  const [horasFalla, setHorasFalla] = useState('')
  const [margenCrecimiento, setMargenCrecimiento] = useState('20')
  const [autonomiaDeseada, setAutonomiaDeseada] = useState('')
  const [radiacionSolar, setRadiacionSolar] = useState('5.0')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [busquedaZona, setBusquedaZona] = useState('')
  const [zonaSeleccionada, setZonaSeleccionada] = useState<ZonaSolar | null>(null)
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false)
  const [validacionErrores, setValidacionErrores] = useState<string[]>([])
  const [validacionAdvertencias, setValidacionAdvertencias] = useState<string[]>([])

  useEffect(() => {
    if (loaded && !nodoId) router.push('/wizard/nodo')
  }, [loaded, nodoId, router])

  const zonasFiltradas = useMemo(() => {
    if (!busquedaZona.trim()) return ZONAS_SOLARES.slice(0, 8)
    const q = busquedaZona.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    return ZONAS_SOLARES.filter(z => {
      const ciudad = z.ciudad.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      const estado = z.estado.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      return ciudad.includes(q) || estado.includes(q)
    }).slice(0, 8)
  }, [busquedaZona])

  function seleccionarZona(zona: ZonaSolar) {
    setZonaSeleccionada(zona)
    setRadiacionSolar(String(zona.radiacion))
    setBusquedaZona(zona.ciudad + ', ' + zona.estado)
    setMostrarSugerencias(false)
  }

  function getClasificacionBadge(clasificacion: 'alta' | 'media' | 'baja') {
    switch (clasificacion) {
      case 'alta':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">Alta</span>
      case 'media':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">Media</span>
      case 'baja':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">Baja</span>
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    // Run validation
    const resultado = validarCondiciones(
      Number(horasFalla) || 0,
      Number(margenCrecimiento) || 0,
      Number(autonomiaDeseada) || 0,
      Number(radiacionSolar) || 0
    )

    setValidacionErrores(resultado.errores)
    setValidacionAdvertencias(resultado.advertencias)

    if (!resultado.valido) {
      return
    }

    if (!horasFalla || !autonomiaDeseada) {
      setError('Todos los campos son obligatorios')
      return
    }

    setLoading(true)
    setError('')

    await supabase.from('condiciones_operativas').delete().eq('nodo_id', nodoId!)

    const { error: dbError } = await supabase.from('condiciones_operativas').insert({
      nodo_id: nodoId,
      horas_falla_promedio: Number(horasFalla),
      margen_crecimiento: Number(margenCrecimiento),
      autonomia_deseada: Number(autonomiaDeseada),
      radiacion_solar_kwh_m2: Number(radiacionSolar),
    })

    if (dbError) {
      setError('Error: ' + dbError.message)
      setLoading(false)
      return
    }

    completarPaso(4)
    router.push('/wizard/resultados')
  }

  if (!loaded || !nodoId) return null

  return (
    <div className="max-w-2xl mx-auto">
      <div className="glass-card gradient-border rounded-2xl p-8">
        <div className="flex items-center justify-center gap-3 mb-6">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand-500">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
          <h2 className="text-2xl font-bold text-surface-900">
            Condiciones Operativas
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 stagger-children">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          <ValidacionAlert errores={validacionErrores} advertencias={validacionAdvertencias} />

          <div>
            <label className="block text-sm font-semibold text-surface-700 mb-1.5">
              Horas promedio de fallas electricas (h/dia)
            </label>
            <input
              type="number"
              value={horasFalla}
              onChange={(e) => setHorasFalla(e.target.value)}
              min="0"
              max="24"
              step="0.5"
              placeholder="Ej: 6"
              className="input-field"
            />
            <p className="text-xs text-surface-400 mt-1.5">
              Cantidad de horas diarias promedio que el nodo experimenta cortes del servicio electrico.
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-surface-700 mb-1.5">
              Margen de crecimiento (%)
            </label>
            <input
              type="number"
              value={margenCrecimiento}
              onChange={(e) => setMargenCrecimiento(e.target.value)}
              min="0"
              max="100"
              className="input-field"
            />
            <p className="text-xs text-surface-400 mt-1.5">
              Porcentaje adicional de capacidad para absorber crecimiento futuro de carga sin redimensionar el sistema.
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-surface-700 mb-1.5">
              Autonomia deseada (horas)
            </label>
            <input
              type="number"
              value={autonomiaDeseada}
              onChange={(e) => setAutonomiaDeseada(e.target.value)}
              min="1"
              step="0.5"
              placeholder="Ej: 12"
              className="input-field"
            />
            <p className="text-xs text-surface-400 mt-1.5">
              Tiempo minimo que el sistema fotovoltaico debe mantener operativo el nodo sin recarga solar.
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-surface-700 mb-1.5">
              Radiacion solar estimada (kWh/m2/dia)
            </label>
            <input
              type="number"
              value={radiacionSolar}
              onChange={(e) => setRadiacionSolar(e.target.value)}
              min="1"
              max="8"
              step="0.1"
              className="input-field"
            />
            <p className="text-xs text-surface-400 mt-1.5">
              Irradiacion solar horizontal promedio de la zona. En Venezuela oscila entre 4.5 y 5.5 kWh/m2/dia.
            </p>
          </div>

          {/* Solar radiation lookup by city */}
          <div className="relative">
            <label className="block text-sm font-semibold text-surface-700 mb-1.5">
              Buscar radiacion por ciudad
            </label>
            <input
              type="text"
              value={busquedaZona}
              onChange={(e) => {
                setBusquedaZona(e.target.value)
                setMostrarSugerencias(true)
                setZonaSeleccionada(null)
              }}
              onFocus={() => setMostrarSugerencias(true)}
              placeholder="Ej: Valencia, Maracaibo, Caracas..."
              className="input-field"
            />

            {/* Zone badge */}
            {zonaSeleccionada && (
              <div className="mt-2 flex items-center gap-2 text-sm">
                <span className="text-surface-600">{zonaSeleccionada.ciudad}, {zonaSeleccionada.estado}</span>
                <span className="text-surface-400">-</span>
                <span className="font-semibold text-surface-800">{zonaSeleccionada.radiacion} kWh/m2/dia</span>
                {getClasificacionBadge(zonaSeleccionada.clasificacion)}
              </div>
            )}

            {/* Suggestions dropdown */}
            {mostrarSugerencias && zonasFiltradas.length > 0 && !zonaSeleccionada && (
              <div className="absolute z-30 left-0 right-0 mt-1 glass-card-strong rounded-xl shadow-lg max-h-60 overflow-y-auto border border-surface-200">
                {zonasFiltradas.map((zona, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => seleccionarZona(zona)}
                    className="w-full text-left px-4 py-2.5 hover:bg-brand-50 transition-colors text-sm flex items-center justify-between"
                  >
                    <span>
                      <span className="font-medium text-surface-800">{zona.ciudad}</span>
                      <span className="text-surface-400 ml-1">- {zona.estado}</span>
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="text-surface-600 font-medium">{zona.radiacion}</span>
                      {getClasificacionBadge(zona.clasificacion)}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-solar w-full !py-3 text-base"
          >
            {loading ? (
              'Procesando...'
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5"/>
                  <line x1="12" y1="1" x2="12" y2="3"/>
                  <line x1="12" y1="21" x2="12" y2="23"/>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                  <line x1="1" y1="12" x2="3" y2="12"/>
                  <line x1="21" y1="12" x2="23" y2="12"/>
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                </svg>
                Calcular Propuesta Fotovoltaica
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
