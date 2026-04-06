'use client'

import { useEffect, useState } from 'react'
import { setLocale, getLocale } from '@/lib/i18n'

export default function LanguageToggle() {
  const [locale, setLocaleState] = useState<'es' | 'en'>('es')

  useEffect(() => {
    setLocaleState(getLocale())
  }, [])

  const handleToggle = () => {
    const next = locale === 'es' ? 'en' : 'es'
    setLocale(next)
    setLocaleState(next)
    window.location.reload()
  }

  return (
    <button
      onClick={handleToggle}
      className="flex h-8 items-center justify-center rounded-full
                 border border-white/10 bg-white/5 px-3
                 text-xs font-semibold uppercase tracking-wider text-slate-400
                 transition-all duration-300 hover:bg-white/10 hover:text-white"
      aria-label={`Cambiar idioma a ${locale === 'es' ? 'English' : 'Espanol'}`}
      title={locale === 'es' ? 'Switch to English' : 'Cambiar a Espanol'}
    >
      {locale === 'es' ? 'EN' : 'ES'}
    </button>
  )
}
