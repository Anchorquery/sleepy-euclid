'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { useAuth } from '@/lib/auth'
import { CASO_ESTUDIO_DEMO } from '@/lib/caso-estudio'

export default function HomePage() {
  const { user, isGuest, enterGuestMode, loading } = useAuth()
  const router = useRouter()
  const hasAccess = !!user || isGuest

  const handleGuestMode = () => {
    enterGuestMode()
    router.push('/wizard')
  }

  return (
    <div className="min-h-screen flex flex-col noise-bg">
      <Navbar />

      {/* Hero */}
      <section className="mesh-gradient relative overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-brand-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-solar-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-6xl mx-auto px-4 py-24 md:py-32 relative z-10">
          <div className="text-center animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-50 border border-brand-200 text-brand-700 text-sm font-medium mb-8">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
              Tesis de Grado - Ingenieria de Telecomunicaciones
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-surface-950 tracking-tight leading-tight mb-4">
              Sistema de Evaluacion de{' '}
              <span className="bg-gradient-to-r from-brand-500 via-brand-600 to-brand-700 bg-clip-text text-transparent">
                Respaldo Energetico
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-surface-500 font-medium mb-3">
              para Nodos de Telecomunicaciones
            </p>

            <p className="text-surface-400 max-w-2xl mx-auto mb-10 text-base leading-relaxed">
              Herramienta de apoyo a la decision que permite evaluar y comparar sistemas de respaldo
              energetico tradicionales frente a soluciones basadas en energia solar fotovoltaica
              para nodos de ISP.
            </p>

            {!loading && (
              <div className="flex flex-wrap items-center justify-center gap-4">
                {hasAccess ? (
                  <>
                    <Link href="/wizard" className="btn-primary text-base !py-3 !px-8">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                      </svg>
                      Continuar Evaluacion
                    </Link>
                    <Link href="/historial" className="btn-secondary text-base !py-3 !px-8">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"/>
                        <polyline points="12 6 12 12 16 14"/>
                      </svg>
                      Ver Historial
                    </Link>
                    <Link
                      href="/wizard/demo"
                      title={`Validación: ${CASO_ESTUDIO_DEMO.meta.titulo} — ${CASO_ESTUDIO_DEMO.meta.fuente}`}
                      className="btn-secondary text-base !py-3 !px-8 border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                      </svg>
                      Caso de Estudio
                    </Link>
                  </>
                ) : (
                  <>
                    <Link href="/wizard" className="btn-primary text-base !py-3 !px-8">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                      </svg>
                      Comenzar Evaluacion
                    </Link>
                    <button onClick={handleGuestMode} className="btn-solar text-base !py-3 !px-8">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                        <circle cx="12" cy="7" r="4"/>
                      </svg>
                      Modo Invitado
                    </button>
                    <Link
                      href="/wizard/demo"
                      title={`Validación: ${CASO_ESTUDIO_DEMO.meta.titulo} — ${CASO_ESTUDIO_DEMO.meta.fuente}`}
                      className="btn-secondary text-base !py-3 !px-8 border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                      </svg>
                      Caso de Estudio
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-surface-0">
        <div className="max-w-4xl mx-auto px-4">
          <div className="grid grid-cols-3 gap-6 stagger-children">
            <div className="text-center p-6 rounded-2xl glass-card">
              <div className="text-4xl font-extrabold bg-gradient-to-br from-brand-500 to-brand-700 bg-clip-text text-transparent mb-1">
                5
              </div>
              <p className="text-surface-500 font-medium text-sm">Modulos</p>
            </div>
            <div className="text-center p-6 rounded-2xl glass-card">
              <div className="text-4xl font-extrabold bg-gradient-to-br from-solar-500 to-solar-600 bg-clip-text text-transparent mb-1">
                6
              </div>
              <p className="text-surface-500 font-medium text-sm">Pasos</p>
            </div>
            <div className="text-center p-6 rounded-2xl glass-card">
              <div className="text-4xl font-extrabold bg-gradient-to-br from-emerald-500 to-emerald-600 bg-clip-text text-transparent mb-1">
                3
              </div>
              <p className="text-surface-500 font-medium text-sm">Capas</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 mesh-gradient">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-surface-900 mb-3">
              Flujo de Evaluacion
            </h2>
            <p className="text-surface-400 max-w-xl mx-auto">
              Tres etapas principales para obtener una recomendacion fundamentada sobre el respaldo energetico ideal.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 stagger-children">
            {/* Card 1 */}
            <div className="gradient-border rounded-2xl">
              <div className="glass-card-strong rounded-2xl p-8 h-full">
                <div className="w-12 h-12 rounded-xl bg-brand-50 flex items-center justify-center mb-5">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3381ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-surface-900 mb-2">Caracterizacion Energetica</h3>
                <p className="text-surface-400 text-sm leading-relaxed">
                  Registre los equipos de red, climatizacion e iluminacion de su nodo con su consumo energetico real para obtener la demanda total.
                </p>
              </div>
            </div>

            {/* Card 2 */}
            <div className="gradient-border rounded-2xl">
              <div className="glass-card-strong rounded-2xl p-8 h-full">
                <div className="w-12 h-12 rounded-xl bg-solar-50 flex items-center justify-center mb-5">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                <h3 className="text-lg font-bold text-surface-900 mb-2">Dimensionamiento Fotovoltaico</h3>
                <p className="text-surface-400 text-sm leading-relaxed">
                  El sistema calcula automaticamente paneles solares, baterias e inversores necesarios segun la irradiancia de su zona.
                </p>
              </div>
            </div>

            {/* Card 3 */}
            <div className="gradient-border rounded-2xl">
              <div className="glass-card-strong rounded-2xl p-8 h-full">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center mb-5">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="4" y="4" width="16" height="16" rx="2" ry="2"/>
                    <rect x="9" y="9" width="6" height="6"/>
                    <line x1="9" y1="1" x2="9" y2="4"/>
                    <line x1="15" y1="1" x2="15" y2="4"/>
                    <line x1="9" y1="20" x2="9" y2="23"/>
                    <line x1="15" y1="20" x2="15" y2="23"/>
                    <line x1="20" y1="9" x2="23" y2="9"/>
                    <line x1="20" y1="14" x2="23" y2="14"/>
                    <line x1="1" y1="9" x2="4" y2="9"/>
                    <line x1="1" y1="14" x2="4" y2="14"/>
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-surface-900 mb-2">Motor de Decision</h3>
                <p className="text-surface-400 text-sm leading-relaxed">
                  Sistema basado en reglas que compara costos, autonomia y dependencia logistica para generar una recomendacion automatizada.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Architecture */}
      <section className="py-20 bg-surface-0">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-surface-900 mb-3">
              Arquitectura del Sistema
            </h2>
            <p className="text-surface-400 max-w-xl mx-auto">
              Cinco modulos interconectados que conforman el flujo completo de evaluacion.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 stagger-children">
            {/* Module 1 */}
            <div className="glass-card-strong rounded-2xl p-5 text-center hover:shadow-lg transition-shadow">
              <div className="w-10 h-10 rounded-lg bg-brand-50 flex items-center justify-center mx-auto mb-3">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3381ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                </svg>
              </div>
              <p className="font-bold text-brand-700 text-xs mb-1">Modulo 1</p>
              <p className="text-surface-500 text-xs">Caracterizacion Energetica</p>
            </div>

            {/* Module 2 */}
            <div className="glass-card-strong rounded-2xl p-5 text-center hover:shadow-lg transition-shadow">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center mx-auto mb-3">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <ellipse cx="12" cy="5" rx="9" ry="3"/>
                  <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
                  <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
                </svg>
              </div>
              <p className="font-bold text-emerald-600 text-xs mb-1">Modulo 2</p>
              <p className="text-surface-500 text-xs">Base de Datos</p>
            </div>

            {/* Module 3 */}
            <div className="glass-card-strong rounded-2xl p-5 text-center hover:shadow-lg transition-shadow">
              <div className="w-10 h-10 rounded-lg bg-solar-50 flex items-center justify-center mx-auto mb-3">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
              <p className="font-bold text-solar-600 text-xs mb-1">Modulo 3</p>
              <p className="text-surface-500 text-xs">Dimensionamiento FV</p>
            </div>

            {/* Module 4 */}
            <div className="glass-card-strong rounded-2xl p-5 text-center hover:shadow-lg transition-shadow">
              <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center mx-auto mb-3">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="20" x2="18" y2="10"/>
                  <line x1="12" y1="20" x2="12" y2="4"/>
                  <line x1="6" y1="20" x2="6" y2="14"/>
                </svg>
              </div>
              <p className="font-bold text-purple-600 text-xs mb-1">Modulo 4</p>
              <p className="text-surface-500 text-xs">Analisis Tecnico-Economico</p>
            </div>

            {/* Module 5 */}
            <div className="glass-card-strong rounded-2xl p-5 text-center hover:shadow-lg transition-shadow col-span-2 md:col-span-1">
              <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center mx-auto mb-3">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="4" y="4" width="16" height="16" rx="2" ry="2"/>
                  <rect x="9" y="9" width="6" height="6"/>
                  <line x1="9" y1="1" x2="9" y2="4"/>
                  <line x1="15" y1="1" x2="15" y2="4"/>
                  <line x1="9" y1="20" x2="9" y2="23"/>
                  <line x1="15" y1="20" x2="15" y2="23"/>
                  <line x1="20" y1="9" x2="23" y2="9"/>
                  <line x1="20" y1="14" x2="23" y2="14"/>
                  <line x1="1" y1="9" x2="4" y2="9"/>
                  <line x1="1" y1="14" x2="4" y2="14"/>
                </svg>
              </div>
              <p className="font-bold text-red-600 text-xs mb-1">Modulo 5</p>
              <p className="text-surface-500 text-xs">Motor de Decision</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-surface-950 py-8 text-center">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
            <span className="text-white font-bold text-sm">SET<span className="text-brand-400">.</span></span>
          </div>
          <p className="text-surface-400 text-xs">
            SET - Tesis de Grado - Ingenieria de Telecomunicaciones
          </p>
        </div>
      </footer>
    </div>
  )
}
