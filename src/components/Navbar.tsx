'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { useState } from 'react'
import DarkModeToggle from '@/components/DarkModeToggle'
import LanguageToggle from '@/components/LanguageToggle'

export default function Navbar() {
  const { user, isGuest, signOut } = useAuth()
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const isLoggedIn = !!user
  const hasAccess = isLoggedIn || isGuest

  return (
    <header className="sticky top-0 z-50 glass-card-strong border-b border-surface-200/50">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
          </div>
          <span className="font-bold text-surface-900 text-sm tracking-tight">SET<span className="text-brand-500">.</span></span>
        </Link>

        {/* Nav links - desktop */}
        <nav className="hidden md:flex items-center gap-1">
          {hasAccess && (
            <>
              <NavLink href="/wizard" active={pathname.startsWith('/wizard')}>Nueva Evaluacion</NavLink>
              <NavLink href="/historial" active={pathname === '/historial'}>Historial</NavLink>
              <NavLink href="/dashboard" active={pathname === '/dashboard'}>Dashboard</NavLink>
            </>
          )}
        </nav>

        {/* Right side: toggles + auth */}
        <div className="flex items-center gap-2">
          {/* Dark mode & Language toggles */}
          <div className="hidden sm:flex items-center gap-1">
            <DarkModeToggle />
            <LanguageToggle />
          </div>

          {/* Mobile hamburger menu - visible on small screens */}
          {hasAccess && (
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-surface-100 transition-colors text-surface-500"
              aria-label="Menu de navegacion"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {mobileMenuOpen ? (
                  <>
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </>
                ) : (
                  <>
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <line x1="3" y1="12" x2="21" y2="12" />
                    <line x1="3" y1="18" x2="21" y2="18" />
                  </>
                )}
              </svg>
            </button>
          )}

          {/* Auth area */}
          {isLoggedIn ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-surface-100 transition-colors text-sm"
              >
                <div className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-bold">
                  {user.email?.[0].toUpperCase()}
                </div>
                <span className="text-surface-700 font-medium hidden sm:block">{user.user_metadata?.nombre || user.email?.split('@')[0]}</span>
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-full mt-1 w-48 glass-card-strong rounded-xl p-1 shadow-xl">
                  <p className="px-3 py-2 text-xs text-surface-400 truncate">{user.email}</p>
                  <hr className="border-surface-100 my-1" />
                  <button onClick={signOut} className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                    Cerrar sesion
                  </button>
                </div>
              )}
            </div>
          ) : isGuest ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-surface-400 hidden sm:block">Modo invitado</span>
              <Link href="/auth" className="btn-primary text-xs !py-1.5 !px-3">Crear cuenta</Link>
            </div>
          ) : (
            <Link href="/auth" className="btn-primary text-xs !py-1.5 !px-3">Ingresar</Link>
          )}
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {mobileMenuOpen && hasAccess && (
        <div className="md:hidden border-t border-surface-200/50 bg-white/80 backdrop-blur-lg">
          <nav className="max-w-6xl mx-auto px-4 py-3 flex flex-col gap-1">
            <Link
              href="/wizard"
              onClick={() => setMobileMenuOpen(false)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                pathname.startsWith('/wizard') ? 'bg-brand-50 text-brand-700' : 'text-surface-500 hover:text-surface-800 hover:bg-surface-100'
              }`}
            >
              Nueva Evaluacion
            </Link>
            <Link
              href="/historial"
              onClick={() => setMobileMenuOpen(false)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                pathname === '/historial' ? 'bg-brand-50 text-brand-700' : 'text-surface-500 hover:text-surface-800 hover:bg-surface-100'
              }`}
            >
              Historial
            </Link>
            <Link
              href="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                pathname === '/dashboard' ? 'bg-brand-50 text-brand-700' : 'text-surface-500 hover:text-surface-800 hover:bg-surface-100'
              }`}
            >
              Dashboard
            </Link>
            <div className="flex items-center gap-2 px-3 py-2 sm:hidden">
              <DarkModeToggle />
              <LanguageToggle />
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}

function NavLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
        active ? 'bg-brand-50 text-brand-700' : 'text-surface-500 hover:text-surface-800 hover:bg-surface-100'
      }`}
    >
      {children}
    </Link>
  )
}
