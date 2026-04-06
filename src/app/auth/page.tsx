'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

export default function AuthPage() {
  const { user, isGuest, signIn, signUp, enterGuestMode, loading } = useAuth()
  const router = useRouter()

  const [tab, setTab] = useState<'login' | 'register' | 'forgot'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nombre, setNombre] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const redirecting = useRef(false)

  // Redirect if already authenticated (only for page load, not after form submit)
  useEffect(() => {
    if (!loading && (user || isGuest) && !redirecting.current) {
      redirecting.current = true
      router.replace('/wizard/nodo')
    }
  }, [user, isGuest, loading, router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    const { error: err } = await signIn(email, password)
    if (err) {
      setError(err)
      setSubmitting(false)
    } else {
      redirecting.current = true
      router.replace('/wizard/nodo')
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('Las contrasenas no coinciden.')
      return
    }
    if (password.length < 6) {
      setError('La contrasena debe tener al menos 6 caracteres.')
      return
    }
    if (!nombre.trim()) {
      setError('El nombre es obligatorio.')
      return
    }

    setSubmitting(true)
    const { error: err } = await signUp(email, password, nombre.trim())
    if (err) {
      setError(err)
      setSubmitting(false)
    } else {
      redirecting.current = true
      router.replace('/wizard/nodo')
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccessMsg(null)

    if (!email.trim()) {
      setError('Ingresa tu correo electronico.')
      return
    }

    setSubmitting(true)
    const { error: err } = await supabase.auth.resetPasswordForEmail(email)
    setSubmitting(false)

    if (err) {
      setError(err.message)
    } else {
      setSuccessMsg('Se envio un enlace de recuperacion a tu correo')
    }
  }

  const handleGuest = () => {
    enterGuestMode()
    redirecting.current = true
    router.replace('/wizard/nodo')
  }

  const switchTab = (newTab: 'login' | 'register' | 'forgot') => {
    setTab(newTab)
    setError(null)
    setSuccessMsg(null)
    setEmail('')
    setPassword('')
    setNombre('')
    setConfirmPassword('')
  }

  if (loading) {
    return (
      <div className="min-h-screen mesh-gradient flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen mesh-gradient noise-bg flex flex-col">
      {/* Decorative blobs */}
      <div className="fixed top-20 left-10 w-72 h-72 bg-brand-400/10 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-10 right-10 w-96 h-96 bg-solar-400/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="pt-8 pb-4 text-center relative z-10">
        <Link href="/" className="inline-flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
          <span className="font-bold text-surface-900 text-lg tracking-tight">SET<span className="text-brand-500">.</span></span>
        </Link>
      </div>

      {/* Main card */}
      <div className="flex-1 flex items-start justify-center px-4 pt-4 pb-16 relative z-10">
        <div className="w-full max-w-md animate-fade-in-up">
          <div className="gradient-border rounded-2xl">
            <div className="glass-card-strong rounded-2xl p-8">
              {/* Tabs - only show login/register when not in forgot mode */}
              {tab !== 'forgot' && (
                <div className="flex rounded-xl bg-surface-100 p-1 mb-8">
                  <button
                    onClick={() => switchTab('login')}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                      tab === 'login'
                        ? 'bg-white text-surface-900 shadow-sm'
                        : 'text-surface-400 hover:text-surface-600'
                    }`}
                  >
                    Iniciar Sesion
                  </button>
                  <button
                    onClick={() => switchTab('register')}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                      tab === 'register'
                        ? 'bg-white text-surface-900 shadow-sm'
                        : 'text-surface-400 hover:text-surface-600'
                    }`}
                  >
                    Crear Cuenta
                  </button>
                </div>
              )}

              {/* Forgot password header */}
              {tab === 'forgot' && (
                <div className="mb-8">
                  <h2 className="text-lg font-bold text-surface-900 text-center">Recuperar Contrasena</h2>
                  <p className="text-sm text-surface-500 text-center mt-1">Ingresa tu correo para recibir un enlace de recuperacion</p>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="mb-6 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                  {error}
                </div>
              )}

              {/* Success */}
              {successMsg && (
                <div className="mb-6 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">
                  {successMsg}
                </div>
              )}

              {/* Login form */}
              {tab === 'login' && (
                <form onSubmit={handleLogin} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-surface-700 mb-1.5">
                      Correo electronico
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="input-field"
                      placeholder="correo@ejemplo.com"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-surface-700 mb-1.5">
                      Contrasena
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="input-field"
                      placeholder="Tu contrasena"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-primary w-full !py-3"
                  >
                    {submitting ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      'Iniciar Sesion'
                    )}
                  </button>
                  {/* Forgot password link */}
                  <button
                    type="button"
                    onClick={() => switchTab('forgot')}
                    className="w-full text-center text-sm text-brand-500 hover:text-brand-700 transition-colors mt-2"
                  >
                    Olvidaste tu contrasena?
                  </button>
                </form>
              )}

              {/* Register form */}
              {tab === 'register' && (
                <form onSubmit={handleRegister} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-surface-700 mb-1.5">
                      Nombre
                    </label>
                    <input
                      type="text"
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      className="input-field"
                      placeholder="Tu nombre completo"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-surface-700 mb-1.5">
                      Correo electronico
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="input-field"
                      placeholder="correo@ejemplo.com"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-surface-700 mb-1.5">
                      Contrasena
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="input-field"
                      placeholder="Minimo 6 caracteres"
                      required
                      minLength={6}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-surface-700 mb-1.5">
                      Confirmar contrasena
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="input-field"
                      placeholder="Repite tu contrasena"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-success w-full !py-3"
                  >
                    {submitting ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      'Crear Cuenta'
                    )}
                  </button>
                </form>
              )}

              {/* Forgot password form */}
              {tab === 'forgot' && (
                <form onSubmit={handleForgotPassword} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-surface-700 mb-1.5">
                      Correo electronico
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="input-field"
                      placeholder="correo@ejemplo.com"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-primary w-full !py-3"
                  >
                    {submitting ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      'Enviar enlace de recuperacion'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => switchTab('login')}
                    className="w-full text-center text-sm text-surface-500 hover:text-surface-700 transition-colors"
                  >
                    Volver
                  </button>
                </form>
              )}

              {/* Divider - only show for login/register */}
              {tab !== 'forgot' && (
                <>
                  <div className="flex items-center gap-3 my-6">
                    <div className="flex-1 h-px bg-surface-200" />
                    <span className="text-xs text-surface-400 font-medium">O</span>
                    <div className="flex-1 h-px bg-surface-200" />
                  </div>

                  {/* Guest mode */}
                  <button
                    onClick={handleGuest}
                    className="btn-solar w-full !py-3"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                      <circle cx="12" cy="7" r="4"/>
                    </svg>
                    Continuar como invitado
                  </button>

                  {/* Info */}
                  <div className="mt-6 p-4 rounded-xl bg-surface-50 border border-surface-200">
                    <p className="text-xs text-surface-500 leading-relaxed">
                      <span className="font-semibold text-surface-700">Con cuenta:</span> guarda tu historial de evaluaciones y accede desde cualquier dispositivo.{' '}
                      <span className="font-semibold text-surface-700">Invitado:</span> realiza evaluaciones sin guardar resultados.
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
