'use client'

import { useState, useEffect, useCallback } from 'react'

const NODO_KEY = 'set-wizard-nodo-id'
const STEP_KEY = 'set-wizard-max-step'

/**
 * Mapa de rutas a numero de paso
 */
const PASO_POR_RUTA: Record<string, number> = {
  '/wizard/nodo': 1,
  '/wizard/equipos': 2,
  '/wizard/respaldo': 3,
  '/wizard/condiciones': 4,
  '/wizard/resultados': 5,
  '/wizard/reporte': 6,
}

export function useWizard() {
  const [nodoId, setNodoIdState] = useState<string | null>(null)
  const [maxStep, setMaxStepState] = useState(1)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const storedNodo = localStorage.getItem(NODO_KEY)
    const storedStep = localStorage.getItem(STEP_KEY)
    if (storedNodo) setNodoIdState(storedNodo)
    if (storedStep) setMaxStepState(Number(storedStep))
    setLoaded(true)
  }, [])

  const setNodoId = useCallback((id: string) => {
    localStorage.setItem(NODO_KEY, id)
    setNodoIdState(id)
    // Al crear nodo, minimo paso 1 completado
    const current = Number(localStorage.getItem(STEP_KEY) || '1')
    if (current < 2) {
      localStorage.setItem(STEP_KEY, '2')
      setMaxStepState(2)
    }
  }, [])

  /**
   * Marca un paso como completado y avanza al siguiente
   */
  const completarPaso = useCallback((paso: number) => {
    const siguiente = paso + 1
    const current = Number(localStorage.getItem(STEP_KEY) || '1')
    if (siguiente > current) {
      localStorage.setItem(STEP_KEY, String(siguiente))
      setMaxStepState(siguiente)
    }
  }, [])

  /**
   * Verifica si un paso es accesible
   */
  const puedeAcceder = useCallback((paso: number): boolean => {
    return paso <= maxStep
  }, [maxStep])

  /**
   * Dado una ruta, retorna si es accesible
   */
  const puedeAccederRuta = useCallback((ruta: string): boolean => {
    const paso = PASO_POR_RUTA[ruta]
    if (!paso) return true
    return paso <= maxStep
  }, [maxStep])

  const reset = useCallback(() => {
    localStorage.removeItem(NODO_KEY)
    localStorage.removeItem(STEP_KEY)
    setNodoIdState(null)
    setMaxStepState(1)
  }, [])

  return {
    nodoId,
    setNodoId,
    maxStep,
    completarPaso,
    puedeAcceder,
    puedeAccederRuta,
    reset,
    loaded,
  }
}
