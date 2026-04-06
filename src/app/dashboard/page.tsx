'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

interface NodoDashboard {
  id: string
  nombre: string
  ubicacion: string
  tipo_nodo: string
  created_at: string
  propuesta: {
    consumo_total_w: number
    consumo_diario_kwh: number
    inversion_estimada: number
    recomendacion: string
    autonomia_estimada: number
    paneles_requeridos: number
    capacidad_baterias_kwh: number
  } | null
}

const REC_PRIORITY: Record<string, number> = {
  'Migración recomendada': 1,
  'Migración parcialmente viable': 2,
  'Migración no recomendable': 3,
}

export default function DashboardPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [nodos, setNodos] = useState<NodoDashboard[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      setLoading(false)
      return
    }
    cargarNodos()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading])

  async function cargarNodos() {
    const { data: nodosData } = await supabase
      .from('nodos')
      .select('id, nombre, ubicacion, tipo_nodo, created_at')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false })

    if (!nodosData || nodosData.length === 0) {
      setNodos([])
      setLoading(false)
      return
    }

    const nodoIds = nodosData.map(n => n.id)
    const { data: propuestas } = await supabase
      .from('propuestas_fv')
      .select('nodo_id, consumo_total_w, consumo_diario_kwh, inversion_estimada, recomendacion, autonomia_estimada, paneles_requeridos, capacidad_baterias_kwh')
      .in('nodo_id', nodoIds)

    const propuestaMap = new Map(
      (propuestas || []).map(p => [p.nodo_id, p])
    )

    const items: NodoDashboard[] = nodosData.map(n => ({
      id: n.id,
      nombre: n.nombre,
      ubicacion: n.ubicacion,
      tipo_nodo: n.tipo_nodo,
      created_at: n.created_at,
      propuesta: propuestaMap.get(n.id) || null,
    }))

    // Sort by recommendation priority (recommended first)
    items.sort((a, b) => {
      const pa = a.propuesta ? (REC_PRIORITY[a.propuesta.recomendacion] || 99) : 99
      const pb = b.propuesta ? (REC_PRIORITY[b.propuesta.recomendacion] || 99) : 99
      return pa - pb
    })

    setNodos(items)
    setLoading(false)
  }

  function getRecBadge(recomendacion: string) {
    if (recomendacion === 'Migración recomendada') {
      return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">Recomendada</span>
    }
    if (recomendacion === 'Migración parcialmente viable') {
      return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">Parcial</span>
    }
    return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">No recomendable</span>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface-50 via-white to-brand-50/20">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 py-10 animate-fade-in-up">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-surface-900">Dashboard de Nodos</h1>
          <p className="text-surface-500 mt-1 text-sm">Comparacion general de todos tus nodos evaluados</p>
        </div>

        {/* Not logged in */}
        {!authLoading && !user && (
          <div className="glass-card p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-brand-50 flex items-center justify-center">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#3381ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </div>
            <h3 className="text-lg font-bold text-surface-800">Inicia sesion para ver el dashboard</h3>
            <p className="text-surface-500 mt-2 text-sm max-w-md mx-auto">
              Necesitas una cuenta para acceder al dashboard de nodos.
            </p>
            <Link href="/auth" className="btn-primary inline-flex mt-6">
              Iniciar Sesion
            </Link>
          </div>
        )}

        {/* Loading */}
        {user && loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="relative w-12 h-12">
              <div className="absolute inset-0 rounded-full border-4 border-surface-200"></div>
              <div className="absolute inset-0 rounded-full border-4 border-brand-500 border-t-transparent animate-spin"></div>
            </div>
            <p className="mt-4 text-surface-400 text-sm">Cargando nodos...</p>
          </div>
        )}

        {/* Empty state */}
        {user && !loading && nodos.length === 0 && (
          <div className="glass-card p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-surface-100 flex items-center justify-center">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="12" y1="18" x2="12" y2="12"/>
                <line x1="9" y1="15" x2="15" y2="15"/>
              </svg>
            </div>
            <h3 className="text-lg font-bold text-surface-800">No tienes evaluaciones aun</h3>
            <p className="text-surface-500 mt-2 text-sm">Comienza tu primera evaluacion para ver el dashboard.</p>
            <Link href="/wizard/nodo" className="btn-solar inline-flex mt-6">
              Iniciar Evaluacion
            </Link>
          </div>
        )}

        {/* Dashboard table/grid */}
        {user && !loading && nodos.length > 0 && (
          <>
            {/* Summary stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="glass-card p-4 text-center">
                <p className="text-xs text-surface-500 font-medium mb-1">Total Nodos</p>
                <p className="text-2xl font-bold text-surface-900">{nodos.length}</p>
              </div>
              <div className="glass-card p-4 text-center">
                <p className="text-xs text-surface-500 font-medium mb-1">Recomendados</p>
                <p className="text-2xl font-bold text-emerald-600">
                  {nodos.filter(n => n.propuesta?.recomendacion === 'Migración recomendada').length}
                </p>
              </div>
              <div className="glass-card p-4 text-center">
                <p className="text-xs text-surface-500 font-medium mb-1">Consumo Total</p>
                <p className="text-2xl font-bold text-brand-600">
                  {(nodos.reduce((s, n) => s + (n.propuesta?.consumo_total_w || 0), 0) / 1000).toFixed(1)} kW
                </p>
              </div>
              <div className="glass-card p-4 text-center">
                <p className="text-xs text-surface-500 font-medium mb-1">Inversion Total</p>
                <p className="text-2xl font-bold text-surface-900">
                  ${nodos.reduce((s, n) => s + (n.propuesta?.inversion_estimada || 0), 0).toLocaleString()}
                </p>
              </div>
            </div>

            {/* Nodes table */}
            <div className="glass-card rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-surface-200 bg-surface-50/50">
                      <th className="text-left py-3 px-4 text-xs font-semibold text-surface-500 uppercase tracking-wide">Nodo</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-surface-500 uppercase tracking-wide">Tipo</th>
                      <th className="text-right py-3 px-4 text-xs font-semibold text-surface-500 uppercase tracking-wide">Consumo</th>
                      <th className="text-right py-3 px-4 text-xs font-semibold text-surface-500 uppercase tracking-wide">Inversion</th>
                      <th className="text-center py-3 px-4 text-xs font-semibold text-surface-500 uppercase tracking-wide">Recomendacion</th>
                      <th className="py-3 px-4"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {nodos.map((nodo) => (
                      <tr key={nodo.id} className="border-b border-surface-100 hover:bg-surface-50/50 transition-colors">
                        <td className="py-3 px-4">
                          <p className="font-medium text-surface-800">{nodo.nombre}</p>
                          <p className="text-xs text-surface-400 mt-0.5">{nodo.ubicacion}</p>
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-surface-100 text-surface-500 text-xs font-medium capitalize">
                            {nodo.tipo_nodo}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          {nodo.propuesta ? (
                            <span className="font-medium text-surface-800">
                              {(nodo.propuesta.consumo_total_w / 1000).toFixed(2)} kW
                            </span>
                          ) : (
                            <span className="text-surface-400">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {nodo.propuesta ? (
                            <span className="font-medium text-surface-800">
                              ${nodo.propuesta.inversion_estimada.toLocaleString()}
                            </span>
                          ) : (
                            <span className="text-surface-400">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {nodo.propuesta ? (
                            getRecBadge(nodo.propuesta.recomendacion)
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-surface-100 text-surface-500">Pendiente</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Link
                            href="/wizard/resultados"
                            className="text-brand-500 hover:text-brand-700 text-xs font-medium transition-colors"
                          >
                            Ver
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
