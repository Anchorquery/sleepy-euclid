'use client'

interface ValidacionAlertProps {
  errores: string[]
  advertencias: string[]
}

export default function ValidacionAlert({ errores, advertencias }: ValidacionAlertProps) {
  if (errores.length === 0 && advertencias.length === 0) return null

  return (
    <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
      {/* Errores */}
      {errores.length > 0 && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4">
          <div className="flex items-start gap-3">
            {/* X icon */}
            <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-500/20">
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-red-400"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-red-400">
                {errores.length === 1 ? 'Error' : `${errores.length} Errores`}
              </p>
              <ul className="mt-1.5 space-y-1">
                {errores.map((error, idx) => (
                  <li key={idx} className="text-sm text-red-300/90">
                    {error}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Advertencias */}
      {advertencias.length > 0 && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
          <div className="flex items-start gap-3">
            {/* Warning icon */}
            <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-amber-400"
              >
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-amber-400">
                {advertencias.length === 1 ? 'Advertencia' : `${advertencias.length} Advertencias`}
              </p>
              <ul className="mt-1.5 space-y-1">
                {advertencias.map((adv, idx) => (
                  <li key={idx} className="text-sm text-amber-300/90">
                    {adv}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
