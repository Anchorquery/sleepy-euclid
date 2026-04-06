'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useWizard } from '@/hooks/useWizard'
import { useAuth } from '@/lib/auth'
import { CategoriaEquipo, Equipo } from '@/types'
import CatalogoEquipos from '@/components/wizard/CatalogoEquipos'
import ValidacionAlert from '@/components/wizard/ValidacionAlert'
import { validarEquipo } from '@/lib/validacion'
import { exportarEquiposCSV } from '@/lib/exportar'

const categoriaBadge: Record<CategoriaEquipo, { bg: string; text: string; label: string }> = {
  red: { bg: 'bg-blue-50', text: 'text-blue-700', label: 'Red' },
  climatizacion: { bg: 'bg-orange-50', text: 'text-orange-700', label: 'Climatizacion' },
  iluminacion: { bg: 'bg-yellow-50', text: 'text-yellow-700', label: 'Iluminacion' },
  otros: { bg: 'bg-surface-100', text: 'text-surface-600', label: 'Otros' },
}

export default function EquiposPage() {
  const router = useRouter()
  const { nodoId, loaded, completarPaso } = useWizard()
  const { user } = useAuth()
  const [equipos, setEquipos] = useState<Equipo[]>([])
  const [nombre, setNombre] = useState('')
  const [categoria, setCategoria] = useState<CategoriaEquipo>('red')
  const [potencia, setPotencia] = useState('')
  const [cantidad, setCantidad] = useState('1')
  const [horasOp, setHorasOp] = useState('24')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [catalogoAbierto, setCatalogoAbierto] = useState(false)
  const [validacionErrores, setValidacionErrores] = useState<string[]>([])
  const [validacionAdvertencias, setValidacionAdvertencias] = useState<string[]>([])

  useEffect(() => {
    if (loaded && !nodoId) router.push('/wizard/nodo')
  }, [loaded, nodoId, router])

  useEffect(() => {
    if (!nodoId) return
    supabase
      .from('equipos')
      .select('*')
      .eq('nodo_id', nodoId)
      .then(({ data }) => {
        if (data) setEquipos(data)
      })
  }, [nodoId])

  const consumoTotalW = equipos.reduce((s, e) => s + e.potencia_w * e.cantidad, 0)
  const consumoDiarioKwh = equipos.reduce((s, e) => s + e.potencia_w * e.cantidad * e.horas_operacion, 0) / 1000

  function handleSeleccionCatalogo(preset: { nombre: string; categoria: CategoriaEquipo; potencia_w: number; horas_operacion: number }) {
    setNombre(preset.nombre)
    setCategoria(preset.categoria)
    setPotencia(String(preset.potencia_w))
    setHorasOp(String(preset.horas_operacion))
    setCantidad('1')
    setValidacionErrores([])
    setValidacionAdvertencias([])
  }

  async function agregarEquipo(e: React.FormEvent) {
    e.preventDefault()

    // Run validation
    const resultado = validarEquipo(
      nombre,
      categoria,
      Number(potencia) || 0,
      Number(cantidad) || 0,
      Number(horasOp) || 0
    )

    setValidacionErrores(resultado.errores)
    setValidacionAdvertencias(resultado.advertencias)

    if (!resultado.valido) {
      return
    }

    setLoading(true)
    setError('')

    const { data, error: dbError } = await supabase
      .from('equipos')
      .insert({
        nodo_id: nodoId,
        nombre: nombre.trim(),
        categoria,
        potencia_w: Number(potencia),
        cantidad: Number(cantidad),
        horas_operacion: Number(horasOp),
      })
      .select()
      .single()

    if (dbError) {
      setError('Error: ' + dbError.message)
      setLoading(false)
      return
    }

    setEquipos([...equipos, data])
    setNombre('')
    setPotencia('')
    setCantidad('1')
    setHorasOp('24')
    setValidacionErrores([])
    setValidacionAdvertencias([])
    setLoading(false)
  }

  async function eliminarEquipo(id: string) {
    await supabase.from('equipos').delete().eq('id', id)
    setEquipos(equipos.filter((e) => e.id !== id))
  }

  if (!loaded || !nodoId) return null

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-surface-900 mb-6 text-center">
        Registrar Equipos del Nodo
      </h2>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Form */}
        <div className="lg:col-span-2">
          {/* Catalog button */}
          <button
            onClick={() => setCatalogoAbierto(true)}
            className="w-full mb-4 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-brand-300 text-brand-600 hover:bg-brand-50 transition-colors text-sm font-medium"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
            </svg>
            Seleccionar del Catalogo
          </button>

          <form onSubmit={agregarEquipo} className="glass-card rounded-2xl p-6 space-y-4 stagger-children">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            <ValidacionAlert errores={validacionErrores} advertencias={validacionAdvertencias} />

            <div>
              <label className="block text-sm font-semibold text-surface-700 mb-1.5">Nombre del Equipo</label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: MK 870 Router Core"
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-surface-700 mb-1.5">Categoria</label>
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value as CategoriaEquipo)}
                className="select-field"
              >
                <option value="red">Red</option>
                <option value="climatizacion">Climatizacion</option>
                <option value="iluminacion">Iluminacion</option>
                <option value="otros">Otros</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-surface-700 mb-1.5">Potencia (W)</label>
              <input
                type="number"
                value={potencia}
                onChange={(e) => setPotencia(e.target.value)}
                min="0"
                step="0.1"
                placeholder="Ej: 150"
                className="input-field"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold text-surface-700 mb-1.5">Cantidad</label>
                <input
                  type="number"
                  value={cantidad}
                  onChange={(e) => setCantidad(e.target.value)}
                  min="1"
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-surface-700 mb-1.5">Horas/dia</label>
                <input
                  type="number"
                  value={horasOp}
                  onChange={(e) => setHorasOp(e.target.value)}
                  min="1"
                  max="24"
                  className="input-field"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-success w-full !py-2.5"
            >
              {loading ? 'Agregando...' : 'Agregar Equipo'}
            </button>
          </form>
        </div>

        {/* Equipment list */}
        <div className="lg:col-span-3">
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-surface-800">Lista de Equipos</h3>
              {equipos.length > 0 && (
                <button
                  onClick={() => exportarEquiposCSV(equipos, 'Nodo')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-surface-500 hover:text-surface-700 hover:bg-surface-100 transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  Exportar CSV
                </button>
              )}
            </div>

            {equipos.length === 0 ? (
              <p className="text-surface-400 text-center py-8 text-sm">No se han registrado equipos aun</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-surface-200">
                      <th className="text-left py-2.5 px-2 text-xs font-semibold text-surface-500 uppercase tracking-wide">Equipo</th>
                      <th className="text-left py-2.5 px-2 text-xs font-semibold text-surface-500 uppercase tracking-wide">Categoria</th>
                      <th className="text-right py-2.5 px-2 text-xs font-semibold text-surface-500 uppercase tracking-wide">Potencia</th>
                      <th className="text-right py-2.5 px-2 text-xs font-semibold text-surface-500 uppercase tracking-wide">Cant.</th>
                      <th className="text-right py-2.5 px-2 text-xs font-semibold text-surface-500 uppercase tracking-wide">Subtotal</th>
                      <th className="py-2.5 px-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {equipos.map((eq) => {
                      const badge = categoriaBadge[eq.categoria]
                      return (
                        <tr key={eq.id} className="border-b border-surface-100 hover:bg-surface-50/50 transition-colors">
                          <td className="py-2.5 px-2 font-medium text-surface-800">{eq.nombre}</td>
                          <td className="py-2.5 px-2">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${badge.bg} ${badge.text}`}>
                              {badge.label}
                            </span>
                          </td>
                          <td className="py-2.5 px-2 text-right text-surface-600">{eq.potencia_w} W</td>
                          <td className="py-2.5 px-2 text-right text-surface-600">x{eq.cantidad}</td>
                          <td className="py-2.5 px-2 text-right font-semibold text-surface-800">{eq.potencia_w * eq.cantidad} W</td>
                          <td className="py-2.5 px-2 text-center">
                            <button
                              onClick={() => eliminarEquipo(eq.id)}
                              className="text-red-400 hover:text-red-600 transition-colors p-1"
                              title="Eliminar"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Summary cards */}
            <div className="grid grid-cols-2 gap-3 mt-5">
              <div className="bg-brand-50 rounded-xl p-3 text-center">
                <p className="text-xs text-brand-600 font-medium mb-0.5">Consumo Total</p>
                <p className="text-lg font-bold text-brand-800">{(consumoTotalW / 1000).toFixed(2)} kW</p>
              </div>
              <div className="bg-brand-50 rounded-xl p-3 text-center">
                <p className="text-xs text-brand-600 font-medium mb-0.5">Consumo Diario</p>
                <p className="text-lg font-bold text-brand-800">{consumoDiarioKwh.toFixed(2)} kWh</p>
              </div>
            </div>
          </div>

          {equipos.length > 0 && (
            <button
              onClick={() => { completarPaso(2); router.push('/wizard/respaldo') }}
              className="btn-primary w-full !py-3 mt-4"
            >
              Guardar y Continuar
            </button>
          )}
        </div>
      </div>

      {/* Catalog modal */}
      <CatalogoEquipos
        open={catalogoAbierto}
        onClose={() => setCatalogoAbierto(false)}
        onSelect={handleSeleccionCatalogo}
      />
    </div>
  )
}
