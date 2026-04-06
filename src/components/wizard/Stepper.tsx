'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useWizard } from '@/hooks/useWizard'

const pasos = [
  { numero: 1, titulo: 'Nodo', href: '/wizard/nodo' },
  { numero: 2, titulo: 'Equipos', href: '/wizard/equipos' },
  { numero: 3, titulo: 'Respaldo', href: '/wizard/respaldo' },
  { numero: 4, titulo: 'Condiciones', href: '/wizard/condiciones' },
  { numero: 5, titulo: 'Resultados', href: '/wizard/resultados' },
  { numero: 6, titulo: 'Reporte', href: '/wizard/reporte' },
]

export default function Stepper() {
  const pathname = usePathname()
  const { maxStep } = useWizard()
  const pasoActual = pasos.findIndex((p) => pathname.startsWith(p.href)) + 1

  return (
    <nav className="mb-8">
      {/* Mobile: show only current step name */}
      <div className="sm:hidden flex items-center justify-center gap-2 py-3">
        <span className="flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-white text-xs font-bold shadow-md">
          {pasoActual || 1}
        </span>
        <span className="text-sm font-semibold text-surface-800">
          {pasos[pasoActual - 1]?.titulo || pasos[0].titulo}
        </span>
        <span className="text-xs text-surface-400">
          de {pasos.length}
        </span>
      </div>

      {/* Desktop: full horizontal stepper */}
      <ol className="hidden sm:flex items-center w-full">
        {pasos.map((paso, index) => {
          const numeroPaso = index + 1
          const esActual = numeroPaso === pasoActual
          const completado = numeroPaso < pasoActual
          const accesible = numeroPaso <= maxStep
          const bloqueado = !accesible && !esActual && !completado

          const contenido = (
            <>
              <span
                className={`flex items-center justify-center w-9 h-9 rounded-full text-sm font-bold transition-all duration-300 ${
                  esActual
                    ? 'bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-md shadow-brand-500/25'
                    : completado || (accesible && numeroPaso < pasoActual)
                      ? 'bg-emerald-500 text-white'
                      : bloqueado
                        ? 'border-2 border-surface-200 bg-surface-50 text-surface-300 cursor-not-allowed'
                        : 'border-2 border-surface-200 bg-white text-surface-400 group-hover:border-surface-300'
                }`}
              >
                {completado ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : bloqueado ? (
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                ) : (
                  paso.numero
                )}
              </span>
              <span className={`mt-1.5 text-xs font-medium transition-colors ${
                esActual
                  ? 'text-brand-700'
                  : completado
                    ? 'text-emerald-600'
                    : bloqueado
                      ? 'text-surface-300'
                      : 'text-surface-400'
              }`}>
                {paso.titulo}
              </span>
            </>
          )

          return (
            <li key={paso.numero} className={`flex items-center ${index < pasos.length - 1 ? 'flex-1' : ''}`}>
              {accesible ? (
                <Link href={paso.href} className="flex flex-col items-center group">
                  {contenido}
                </Link>
              ) : (
                <div
                  className="flex flex-col items-center cursor-not-allowed"
                  title={`Complete el paso ${numeroPaso - 1} primero`}
                >
                  {contenido}
                </div>
              )}
              {index < pasos.length - 1 && (
                <div className={`flex-1 h-0.5 mx-3 rounded-full transition-colors duration-300 ${
                  completado ? 'bg-emerald-500' : accesible && numeroPaso < maxStep ? 'bg-emerald-300' : 'bg-surface-200'
                }`} />
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
