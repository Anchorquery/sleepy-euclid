'use client'

import { useState, useMemo } from 'react'
import { CATALOGO_EQUIPOS, type EquipoPreset } from '@/lib/catalogo-equipos'

interface CatalogoEquiposProps {
  onSelect: (equipo: EquipoPreset) => void
  open: boolean
  onClose: () => void
}

const GRUPOS = Object.keys(CATALOGO_EQUIPOS)

export default function CatalogoEquipos({ onSelect, open, onClose }: CatalogoEquiposProps) {
  const [grupoActivo, setGrupoActivo] = useState(GRUPOS[0] || '')
  const [busqueda, setBusqueda] = useState('')

  const equiposFiltrados = useMemo(() => {
    const lista = CATALOGO_EQUIPOS[grupoActivo] || []
    if (!busqueda.trim()) return lista
    const q = busqueda.toLowerCase()
    return lista.filter(
      (e) =>
        e.nombre.toLowerCase().includes(q) ||
        e.descripcion.toLowerCase().includes(q)
    )
  }, [grupoActivo, busqueda])

  if (!open) return null

  const handleSelect = (equipo: EquipoPreset) => {
    onSelect(equipo)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="relative z-10 w-full max-w-2xl animate-in fade-in zoom-in-95 duration-200
                    rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/95 to-slate-800/95
                    shadow-2xl shadow-blue-500/5 backdrop-blur-xl"
      >
        {/* Gradient border effect */}
        <div className="absolute -inset-px -z-10 rounded-2xl bg-gradient-to-br from-blue-500/20 via-purple-500/10 to-transparent" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <h3 className="text-lg font-semibold text-white">Catalogo de Equipos</h3>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg
                       text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Cerrar"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Search */}
        <div className="border-b border-white/10 px-6 py-3">
          <input
            type="text"
            placeholder="Buscar equipo..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2
                       text-sm text-white placeholder-slate-500 outline-none
                       transition-colors focus:border-blue-500/50 focus:bg-white/10"
            autoFocus
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 overflow-x-auto border-b border-white/10 px-6 py-2">
          {GRUPOS.map((grupo) => (
            <button
              key={grupo}
              onClick={() => {
                setGrupoActivo(grupo)
                setBusqueda('')
              }}
              className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                grupoActivo === grupo
                  ? 'bg-blue-500/20 text-blue-400'
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              {grupo}
            </button>
          ))}
        </div>

        {/* Items list */}
        <div className="max-h-[360px] overflow-y-auto px-6 py-3">
          {equiposFiltrados.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">
              No se encontraron equipos
            </p>
          ) : (
            <div className="space-y-2">
              {equiposFiltrados.map((equipo, idx) => (
                <button
                  key={`${equipo.nombre}-${idx}`}
                  onClick={() => handleSelect(equipo)}
                  className="flex w-full items-start gap-4 rounded-xl border border-white/5 p-3
                             text-left transition-all hover:border-blue-500/30 hover:bg-white/5"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {equipo.nombre}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-400 line-clamp-1">
                      {equipo.descripcion}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-blue-500/10 px-2.5 py-1 text-xs font-semibold text-blue-400">
                    {equipo.potencia_w} W
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
