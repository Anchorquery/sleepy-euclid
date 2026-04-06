/**
 * Sistema de internacionalizacion basico (ES/EN)
 */

export type Locale = 'es' | 'en'

const traducciones: Record<string, Record<Locale, string>> = {
  // Nav
  'nav.nuevaEvaluacion': { es: 'Nueva Evaluacion', en: 'New Evaluation' },
  'nav.historial': { es: 'Historial', en: 'History' },
  'nav.ingresar': { es: 'Ingresar', en: 'Sign In' },
  'nav.modoInvitado': { es: 'Modo invitado', en: 'Guest mode' },
  'nav.cerrarSesion': { es: 'Cerrar sesion', en: 'Sign out' },
  'nav.crearCuenta': { es: 'Crear cuenta', en: 'Create account' },

  // Home
  'home.badge': { es: 'Tesis de Grado - Ingenieria de Telecomunicaciones', en: 'Thesis - Telecommunications Engineering' },
  'home.titulo': { es: 'Sistema de Evaluacion de', en: 'Energy Backup' },
  'home.tituloGradient': { es: 'Respaldo Energetico', en: 'Evaluation System' },
  'home.subtitulo': { es: 'para Nodos de Telecomunicaciones', en: 'for Telecommunications Nodes' },
  'home.descripcion': {
    es: 'Herramienta de apoyo a la decision que permite evaluar y comparar sistemas de respaldo energetico tradicionales frente a soluciones basadas en energia solar fotovoltaica para nodos de ISP.',
    en: 'Decision support tool to evaluate and compare traditional energy backup systems against solar photovoltaic solutions for ISP nodes.',
  },
  'home.comenzar': { es: 'Comenzar Evaluacion', en: 'Start Evaluation' },
  'home.continuar': { es: 'Continuar Evaluacion', en: 'Continue Evaluation' },
  'home.verHistorial': { es: 'Ver Historial', en: 'View History' },
  'home.invitado': { es: 'Modo Invitado', en: 'Guest Mode' },
  'home.modulos': { es: 'Modulos', en: 'Modules' },
  'home.pasos': { es: 'Pasos', en: 'Steps' },
  'home.capas': { es: 'Capas', en: 'Layers' },
  'home.flujoTitulo': { es: 'Flujo de Evaluacion', en: 'Evaluation Flow' },
  'home.flujoDesc': {
    es: 'Tres etapas principales para obtener una recomendacion fundamentada sobre el respaldo energetico ideal.',
    en: 'Three main stages to obtain a well-founded recommendation on the ideal energy backup.',
  },
  'home.feature1Titulo': { es: 'Caracterizacion Energetica', en: 'Energy Characterization' },
  'home.feature2Titulo': { es: 'Dimensionamiento Fotovoltaico', en: 'PV Sizing' },
  'home.feature3Titulo': { es: 'Motor de Decision', en: 'Decision Engine' },
  'home.arquitectura': { es: 'Arquitectura del Sistema', en: 'System Architecture' },

  // Auth
  'auth.iniciarSesion': { es: 'Iniciar Sesion', en: 'Sign In' },
  'auth.crearCuenta': { es: 'Crear Cuenta', en: 'Create Account' },
  'auth.correo': { es: 'Correo electronico', en: 'Email' },
  'auth.contrasena': { es: 'Contrasena', en: 'Password' },
  'auth.confirmarContrasena': { es: 'Confirmar contrasena', en: 'Confirm password' },
  'auth.nombre': { es: 'Nombre', en: 'Name' },
  'auth.invitadoBtn': { es: 'Continuar como invitado', en: 'Continue as guest' },
  'auth.infoTexto': {
    es: 'Con cuenta: guarda tu historial de evaluaciones y accede desde cualquier dispositivo. Invitado: realiza evaluaciones sin guardar resultados.',
    en: 'With account: save your evaluation history and access from any device. Guest: perform evaluations without saving results.',
  },
  'auth.olvidasteContrasena': { es: 'Olvidaste tu contrasena?', en: 'Forgot password?' },
  'auth.enviarRecuperacion': { es: 'Enviar enlace de recuperacion', en: 'Send recovery link' },
  'auth.volverLogin': { es: 'Volver al inicio de sesion', en: 'Back to login' },
  'auth.recuperacionEnviada': { es: 'Se envio un enlace de recuperacion a tu correo', en: 'Recovery link sent to your email' },

  // Wizard steps
  'wizard.paso1': { es: 'Nodo', en: 'Node' },
  'wizard.paso2': { es: 'Equipos', en: 'Equipment' },
  'wizard.paso3': { es: 'Respaldo', en: 'Backup' },
  'wizard.paso4': { es: 'Condiciones', en: 'Conditions' },
  'wizard.paso5': { es: 'Resultados', en: 'Results' },
  'wizard.paso6': { es: 'Reporte', en: 'Report' },
  'wizard.guardarContinuar': { es: 'Guardar y Continuar', en: 'Save & Continue' },
  'wizard.calcularPropuesta': { es: 'Calcular Propuesta Fotovoltaica', en: 'Calculate PV Proposal' },

  // Resultados
  'resultados.titulo': { es: 'Resultados Comparativos', en: 'Comparative Results' },
  'resultados.consumoTotal': { es: 'Consumo Total', en: 'Total Consumption' },
  'resultados.consumoDiario': { es: 'Consumo Diario', en: 'Daily Consumption' },
  'resultados.inversionEstimada': { es: 'Inversion Estimada', en: 'Estimated Investment' },
  'resultados.sistemaActual': { es: 'Sistema Actual', en: 'Current System' },
  'resultados.sistemaSolar': { es: 'Sistema Solar', en: 'Solar System' },
  'resultados.autonomia': { es: 'Autonomia', en: 'Autonomy' },
  'resultados.costoMensual': { es: 'Costo Mensual', en: 'Monthly Cost' },
  'resultados.verReporte': { es: 'Ver Reporte Final', en: 'View Final Report' },
  'resultados.migracionRecomendada': { es: 'Migracion recomendada', en: 'Migration recommended' },
  'resultados.parcialmenteViable': { es: 'Migracion parcialmente viable', en: 'Migration partially viable' },
  'resultados.noRecomendable': { es: 'Migracion no recomendable', en: 'Migration not recommended' },

  // Historial
  'historial.titulo': { es: 'Historial de Evaluaciones', en: 'Evaluation History' },
  'historial.subtitulo': { es: 'Revisa y accede a tus evaluaciones anteriores', en: 'Review and access your previous evaluations' },
  'historial.vacio': { es: 'No tienes evaluaciones aun', en: 'No evaluations yet' },
  'historial.loginRequerido': { es: 'Inicia sesion para ver tu historial', en: 'Sign in to view your history' },

  // General
  'general.descargarPDF': { es: 'Descargar PDF', en: 'Download PDF' },
  'general.exportarCSV': { es: 'Exportar CSV', en: 'Export CSV' },
  'general.nuevaEvaluacion': { es: 'Nueva Evaluacion', en: 'New Evaluation' },
  'general.cargando': { es: 'Cargando...', en: 'Loading...' },
  'general.guardando': { es: 'Guardando...', en: 'Saving...' },
  'general.si': { es: 'Si', en: 'Yes' },
  'general.no': { es: 'No', en: 'No' },
}

let currentLocale: Locale = 'es'

export function setLocale(locale: Locale) {
  currentLocale = locale
  if (typeof window !== 'undefined') {
    localStorage.setItem('set-locale', locale)
  }
}

export function getLocale(): Locale {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('set-locale') as Locale | null
    if (saved) {
      currentLocale = saved
      return saved
    }
  }
  return currentLocale
}

export function t(key: string): string {
  const entry = traducciones[key]
  if (!entry) return key
  return entry[currentLocale] || entry.es || key
}

export function getAllTranslationKeys(): string[] {
  return Object.keys(traducciones)
}
