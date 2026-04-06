'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useWizard } from '@/hooks/useWizard'
import { useAuth } from '@/lib/auth'
import { TipoNodo } from '@/types'
import { validarNodo } from '@/lib/validacion'
import ValidacionAlert from '@/components/wizard/ValidacionAlert'

export default function NodoPage() {
  const router = useRouter()
  const { setNodoId, completarPaso } = useWizard()
  const { user } = useAuth()
  const [nombre, setNombre] = useState('')
  const [ubicacion, setUbicacion] = useState('')
  const [tipoNodo, setTipoNodo] = useState<TipoNodo>('acceso')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [validacionErrores, setValidacionErrores] = useState<string[]>([])
  const [validacionAdvertencias, setValidacionAdvertencias] = useState<string[]>([])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    // Run validation
    const resultado = validarNodo(nombre, ubicacion)
    setValidacionErrores(resultado.errores)
    setValidacionAdvertencias(resultado.advertencias)

    if (!resultado.valido) {
      return
    }

    setLoading(true)
    setError('')

    const { data, error: dbError } = await supabase
      .from('nodos')
      .insert({
        nombre: nombre.trim(),
        ubicacion: ubicacion.trim(),
        tipo_nodo: tipoNodo,
        user_id: user?.id || null,
      })
      .select()
      .single()

    if (dbError) {
      setError('Error al guardar: ' + dbError.message)
      setLoading(false)
      return
    }

    setNodoId(data.id)
    completarPaso(1)
    router.push('/wizard/equipos')
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="glass-card gradient-border rounded-2xl p-8">
        <div className="flex items-center justify-center gap-3 mb-6">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-solar-500">
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
          <h2 className="text-2xl font-bold text-surface-900">
            Registrar Nodo de Telecomunicaciones
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
            <label className="block text-sm font-semibold text-surface-700 mb-1.5">Nombre</label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Copey Arriba"
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-surface-700 mb-1.5">Ubicacion</label>
            <input
              type="text"
              value={ubicacion}
              onChange={(e) => setUbicacion(e.target.value)}
              placeholder="Ej: Valencia, Carabobo"
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-surface-700 mb-1.5">Tipo de Nodo</label>
            <select
              value={tipoNodo}
              onChange={(e) => setTipoNodo(e.target.value as TipoNodo)}
              className="select-field"
            >
              <option value="acceso">Acceso</option>
              <option value="distribucion">Distribucion</option>
              <option value="core">Core</option>
            </select>
            <div className="mt-2 space-y-1">
              <p className="text-xs text-surface-400">
                <span className="font-semibold text-surface-500">Acceso:</span> Nodo de ultimo tramo, conecta usuarios finales.
              </p>
              <p className="text-xs text-surface-400">
                <span className="font-semibold text-surface-500">Distribucion:</span> Nodo intermedio que agrega trafico de nodos de acceso.
              </p>
              <p className="text-xs text-surface-400">
                <span className="font-semibold text-surface-500">Core:</span> Nodo central de alta capacidad y criticidad.
              </p>
            </div>
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
