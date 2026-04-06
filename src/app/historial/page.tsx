'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { useAuth } from '@/lib/auth'
import { useWizard } from '@/hooks/useWizard'
import { supabase } from '@/lib/supabase'

interface EvaluacionHistorial {
  id: string
  nombre: string
  ubicacion: string
  tipo_nodo: string
  created_at: string
  propuesta: {
    consumo_total_w: number
    inversion_estimada: number
    recomendacion: string
  } | null
}

export default function HistorialPage() {
  const router = useRouter()
  const { user, isGuest, loading: authLoading } = useAuth()
  const { setNodoId } = useWizard()
  const [evaluaciones, setEvaluaciones] = useState<EvaluacionHistorial[]>([])
  const [loading, setLoading] = useState(true)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      setLoading(false)
      return
    }
    cargarHistorial()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading])

  async function cargarHistorial() {
    const { data: nodos } = await supabase
      .from('nodos')
      .select('id, nombre, ubicacion, tipo_nodo, created_at')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false })

    if (!nodos || nodos.length === 0) {
      setEvaluaciones([])
      setLoading(false)
      return
    }

    const nodoIds = nodos.map(n => n.id)
    const { data: propuestas } = await supabase
      .from('propuestas_fv')
      .select('nodo_id, consumo_total_w, inversion_estimada, recomendacion')
      .in('nodo_id', nodoIds)

    const propuestaMap = new Map(
      (propuestas || []).map(p => [p.nodo_id, p])
    )

    const items: EvaluacionHistorial[] = nodos.map(n => ({
      id: n.id,
      nombre: n.nombre,
      ubicacion: n.ubicacion,
      tipo_nodo: n.tipo_nodo,
      created_at: n.created_at,
      propuesta: propuestaMap.get(n.id) || null,
    }))

    setEvaluaciones(items)
    setLoading(false)
  }

  function abrirEvaluacion(nodoId: string) {
    setNodoId(nodoId)
    router.push('/wizard/resultados')
  }

  async function eliminarEvaluacion(nodoId: string) {
    setDeleting(true)
    // Cascading deletes should handle equipos, condiciones, respaldo, propuestas via ON DELETE CASCADE
    await supabase.from('nodos').delete().eq('id', nodoId)
    setEvaluaciones(evaluaciones.filter(ev => ev.id !== nodoId))
    setConfirmDeleteId(null)
    setDeleting(false)
  }

  function exportarTodoCSV() {
    if (evaluaciones.length === 0) return

    const headers = ['Nombre', 'Ubicacion', 'Tipo Nodo', 'Fecha', 'Consumo (W)', 'Inversion ($)', 'Recomendacion']
    const rows = evaluaciones.map(ev => [
      `"${ev.nombre}"`,
      `"${ev.ubicacion}"`,
      ev.tipo_nodo,
      formatDate(ev.created_at),
      ev.propuesta ? ev.propuesta.consumo_total_w : '',
      ev.propuesta ? ev.propuesta.inversion_estimada : '',
      ev.propuesta ? `"${ev.propuesta.recomendacion}"` : '',
    ])

    const bom = '\uFEFF'
    const csv = bom + [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'Historial_Evaluaciones_SET.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
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

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('es-VE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface-50 via-white to-brand-50/20">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 py-10 animate-fade-in-up">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-surface-900">Historial de Evaluaciones</h1>
            <p className="text-surface-500 mt-1 text-sm">Revisa y accede a tus evaluaciones anteriores</p>
          </div>
          {user && !loading && evaluaciones.length > 0 && (
            <button
              onClick={exportarTodoCSV}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-surface-200 text-sm font-medium text-surface-600 hover:bg-surface-50 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Exportar Todo
            </button>
          )}
        </div>

        {/* Guest mode: no access */}
        {!authLoading && !user && (isGuest || !isGuest) && (
          <div className="glass-card p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-brand-50 flex items-center justify-center">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#3381ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </div>
            <h3 className="text-lg font-bold text-surface-800">Inicia sesion para ver tu historial</h3>
            <p className="text-surface-500 mt-2 text-sm max-w-md mx-auto">
              Inicia sesion para ver tu historial de evaluaciones. Las evaluaciones realizadas como invitado no se guardan en el historial.
            </p>
            <Link href="/auth" className="btn-primary inline-flex mt-6">
              Iniciar Sesion
            </Link>
          </div>
        )}

        {/* Loading state */}
        {user && loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="relative w-12 h-12">
              <div className="absolute inset-0 rounded-full border-4 border-surface-200"></div>
              <div className="absolute inset-0 rounded-full border-4 border-brand-500 border-t-transparent animate-spin"></div>
            </div>
            <p className="mt-4 text-surface-400 text-sm">Cargando historial...</p>
          </div>
        )}

        {/* Logged in: show evaluations */}
        {user && !loading && evaluaciones.length === 0 && (
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
            <p className="text-surface-500 mt-2 text-sm">Comienza tu primera evaluacion de un nodo de telecomunicaciones.</p>
            <Link href="/wizard/nodo" className="btn-solar inline-flex mt-6">
              Iniciar Evaluacion
            </Link>
          </div>
        )}

        {user && !loading && evaluaciones.length > 0 && (
          <div className="space-y-4 stagger-children">
            {evaluaciones.map((ev) => (
              <div
                key={ev.id}
                className="glass-card w-full text-left p-5 hover:shadow-lg transition-all duration-200 group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="font-bold text-surface-900">{ev.nombre}</h3>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-surface-100 text-surface-500 text-xs font-medium capitalize">{ev.tipo_nodo}</span>
                      {ev.propuesta && getRecBadge(ev.propuesta.recomendacion)}
                    </div>
                    <p className="text-sm text-surface-500 mt-1">{ev.ubicacion}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-surface-400">
                      <span>{formatDate(ev.created_at)}</span>
                      {ev.propuesta && (
                        <>
                          <span className="w-1 h-1 rounded-full bg-surface-300"></span>
                          <span>Consumo: {(ev.propuesta.consumo_total_w / 1000).toFixed(2)} kW</span>
                          <span className="w-1 h-1 rounded-full bg-surface-300"></span>
                          <span>Inversion: ${ev.propuesta.inversion_estimada.toLocaleString()}</span>
                        </>
                      )}
                    </div>
                  </div>
                  {/* Action buttons */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => abrirEvaluacion(ev.id)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-brand-50 text-brand-600 hover:bg-brand-100 transition-colors"
                    >
                      Abrir
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(ev.id)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Confirm delete dialog */}
        {confirmDeleteId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm glass-card-strong rounded-2xl p-6 animate-fade-in-up">
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    <line x1="10" y1="11" x2="10" y2="17"/>
                    <line x1="14" y1="11" x2="14" y2="17"/>
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-surface-900">Eliminar Evaluacion</h3>
                <p className="text-sm text-surface-500 mt-2">
                  Estas seguro? Se eliminaran todos los datos de esta evaluacion.
                </p>
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setConfirmDeleteId(null)}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-surface-200 text-sm font-medium text-surface-600 hover:bg-surface-50 transition-colors"
                    disabled={deleting}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => eliminarEvaluacion(confirmDeleteId)}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors"
                    disabled={deleting}
                  >
                    {deleting ? 'Eliminando...' : 'Eliminar'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
