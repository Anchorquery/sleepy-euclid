import jsPDF from 'jspdf'
import { FUENTE_RADIACION_SOLAR } from './radiacion-solar'
import { FACTOR_CO2_DIESEL_KG_L, FACTOR_CO2_FV_KG_KWH } from './indicadores'

interface DatosReporte {
  nodo: { nombre: string; ubicacion: string; tipo_nodo: string }
  equipos: { nombre: string; categoria: string; potencia_w: number; cantidad: number; horas_operacion: number }[]
  respaldo: { tipo: string; autonomia_horas: number; consumo_combustible_lh: number | null; costo_mantenimiento_mensual: number }
  condiciones: { horas_falla_promedio: number; margen_crecimiento: number; autonomia_deseada: number; radiacion_solar_kwh_m2: number }
  propuesta: {
    consumo_total_w: number
    consumo_diario_kwh: number
    consumo_con_margen_kwh: number
    paneles_requeridos: number
    potencia_paneles_kw: number
    capacidad_baterias_kwh: number
    inversor_kw: number
    controlador_a?: number
    inversion_estimada: number
    costo_mensual_estimado: number
    autonomia_estimada: number
    recomendacion: string
    detalles_json: Record<string, unknown>
  }
  costoActual: number
}

export function generarPDF(datos: DatosReporte) {
  const doc = new jsPDF()
  let y = 15
  const margenL = 14
  const margenR = 196
  const ancho = margenR - margenL

  // ── Helpers ────────────────────────────────────────────────────────────────

  const checkPage = (espacio = 20) => {
    if (y > 277 - espacio) { doc.addPage(); y = 15 }
  }

  const addLine = (color = 200) => {
    doc.setDrawColor(color); doc.line(margenL, y, margenR, y); y += 4
  }

  const addDoubleLine = () => {
    doc.setDrawColor(180); doc.line(margenL, y, margenR, y); y += 1.5
    doc.line(margenL, y, margenR, y); y += 4
  }

  const titulo = (text: string) => {
    checkPage(20)
    doc.setFontSize(15); doc.setFont('helvetica', 'bold')
    doc.text(text, 105, y, { align: 'center' }); y += 8
  }

  const seccion = (num: string, text: string) => {
    checkPage(14)
    doc.setFillColor(240, 244, 255)
    doc.roundedRect(margenL, y - 4, ancho, 10, 2, 2, 'F')
    doc.setFontSize(10); doc.setFont('helvetica', 'bold')
    doc.setTextColor(40, 80, 200)
    doc.text(`${num}. ${text.toUpperCase()}`, margenL + 3, y + 2)
    doc.setTextColor(0, 0, 0)
    y += 10
  }

  const fila = (label: string, valor: string, negrita = false) => {
    checkPage(8)
    doc.setFontSize(9); doc.setFont('helvetica', 'normal')
    doc.setTextColor(100, 100, 100)
    doc.text(label, margenL + 2, y)
    doc.setFont('helvetica', negrita ? 'bold' : 'normal')
    doc.setTextColor(30, 30, 30)
    doc.text(valor, margenR - 2, y, { align: 'right' })
    y += 6
  }

  const parrafo = (text: string) => {
    checkPage(10)
    doc.setFontSize(8.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(50, 50, 50)
    const lines = doc.splitTextToSize(text, ancho)
    doc.text(lines, margenL + 2, y)
    y += lines.length * 4.5 + 2
  }

  const nota = (text: string) => {
    checkPage(8)
    doc.setFontSize(7.5); doc.setFont('helvetica', 'italic'); doc.setTextColor(120, 120, 120)
    const lines = doc.splitTextToSize(`Nota: ${text}`, ancho)
    doc.text(lines, margenL + 2, y)
    y += lines.length * 4 + 1
    doc.setTextColor(0, 0, 0)
  }

  // ── PORTADA ────────────────────────────────────────────────────────────────

  // Banda superior
  doc.setFillColor(40, 80, 200); doc.rect(0, 0, 210, 28, 'F')
  doc.setFontSize(14); doc.setFont('helvetica', 'bold'); doc.setTextColor(255, 255, 255)
  doc.text('REPORTE DE EVALUACIÓN ENERGÉTICA', 105, 12, { align: 'center' })
  doc.setFontSize(9); doc.setFont('helvetica', 'normal')
  doc.text('Sistema de Apoyo a la Decisión para Migración a Energía Solar Fotovoltaica', 105, 20, { align: 'center' })
  doc.setTextColor(0, 0, 0)
  y = 36

  // Metadatos del reporte
  doc.setFontSize(8.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(80, 80, 80)
  doc.text(`Fecha de generación: ${new Date().toLocaleDateString('es-VE', { year: 'numeric', month: 'long', day: 'numeric' })}`, margenL, y)
  doc.text(`Nodo evaluado: ${datos.nodo.nombre}`, margenR, y, { align: 'right' })
  doc.setTextColor(0, 0, 0)
  y += 6
  addDoubleLine()

  // ── 1. DATOS DEL NODO ─────────────────────────────────────────────────────
  seccion('1', 'Identificación del Nodo de Telecomunicaciones')
  fila('Nombre del nodo:', datos.nodo.nombre)
  fila('Ubicación geográfica:', datos.nodo.ubicacion)
  fila('Tipo de nodo:', datos.nodo.tipo_nodo.charAt(0).toUpperCase() + datos.nodo.tipo_nodo.slice(1))
  y += 2

  // ── 2. INVENTARIO DE EQUIPOS ──────────────────────────────────────────────
  checkPage(20)
  seccion('2', 'Inventario de Equipos y Perfil Energético')

  // Tabla de equipos
  const colW = [70, 28, 20, 16, 22, 24]
  const headers = ['Equipo', 'Categoría', 'P (W)', 'Cant.', 'H/día', 'E (Wh/día)']
  doc.setFillColor(220, 230, 255)
  doc.rect(margenL, y - 3, ancho, 7, 'F')
  doc.setFontSize(7.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(30, 30, 100)
  let xPos = margenL + 1
  headers.forEach((h, i) => { doc.text(h, xPos, y + 1); xPos += colW[i] })
  doc.setTextColor(0, 0, 0)
  y += 7

  datos.equipos.forEach((eq, idx) => {
    checkPage(7)
    if (idx % 2 === 0) {
      doc.setFillColor(248, 250, 255); doc.rect(margenL, y - 3, ancho, 6, 'F')
    }
    doc.setFontSize(7.5); doc.setFont('helvetica', 'normal')
    const energiaWh = eq.potencia_w * eq.cantidad * eq.horas_operacion
    const vals = [
      eq.nombre.length > 28 ? eq.nombre.substring(0, 26) + '…' : eq.nombre,
      eq.categoria,
      `${eq.potencia_w}`,
      `${eq.cantidad}`,
      `${eq.horas_operacion}`,
      `${energiaWh.toLocaleString()}`,
    ]
    xPos = margenL + 1
    vals.forEach((v, i) => { doc.text(v, xPos, y + 1); xPos += colW[i] })
    y += 6
  })

  y += 3
  fila('Potencia total instalada:', `${(datos.propuesta.consumo_total_w / 1000).toFixed(2)} kW`)
  fila('Consumo energético diario:', `${datos.propuesta.consumo_diario_kwh.toFixed(2)} kWh/día`)
  fila(`Consumo con margen de crecimiento (${datos.condiciones.margen_crecimiento}%):`,
    `${datos.propuesta.consumo_con_margen_kwh.toFixed(2)} kWh/día`, true)
  nota('Fórmula: Ei = Pi × Qi × Hi (IPCC/IEC 60038). Consumo con margen: E_total × (1 + margen/100).')
  y += 2

  // ── 3. SISTEMA DE RESPALDO ACTUAL ─────────────────────────────────────────
  checkPage(30)
  seccion('3', 'Sistema de Respaldo Energético Actual')
  fila('Tipo de sistema:', datos.respaldo.tipo === 'planta_diesel' ? 'Planta Eléctrica a Combustible (Diésel)' : 'Banco de Baterías Convencional')
  fila('Autonomía nominal:', `${datos.respaldo.autonomia_horas} horas`)
  if (datos.respaldo.consumo_combustible_lh) {
    fila('Consumo de combustible:', `${datos.respaldo.consumo_combustible_lh} L/h`)
    const litrosMes = datos.respaldo.consumo_combustible_lh * datos.condiciones.horas_falla_promedio * 30
    const co2Mes = litrosMes * FACTOR_CO2_DIESEL_KG_L
    fila('Estimado de combustible mensual:', `${litrosMes.toFixed(1)} L/mes`)
    fila('Emisiones CO₂ estimadas (diesel):', `${co2Mes.toFixed(1)} kg CO₂/mes`)
    nota(`Factor de emisión diésel: ${FACTOR_CO2_DIESEL_KG_L} kg CO₂/L (IPCC 2006, Vol. 2, Tabla 2.2).`)
  }
  fila('Costo de mantenimiento:', `$${datos.respaldo.costo_mantenimiento_mensual.toFixed(2)}/mes`)
  fila('Costo operativo total estimado:', `$${datos.costoActual.toFixed(2)}/mes`, true)
  fila('Horas promedio de falla eléctrica:', `${datos.condiciones.horas_falla_promedio} h/día`)
  y += 2

  // ── 4. DIMENSIONAMIENTO FOTOVOLTAICO ──────────────────────────────────────
  checkPage(45)
  seccion('4', 'Dimensionamiento del Sistema Fotovoltaico')
  parrafo(
    `El sistema fue dimensionado para el nodo ubicado en ${datos.nodo.ubicacion}, con una irradiancia solar ` +
    `de ${datos.condiciones.radiacion_solar_kwh_m2} kWh/m²/día (HSP). Se aplicó una eficiencia global del ` +
    `sistema del 80% y una profundidad de descarga LiFePO₄ del 80%.`
  )

  doc.setFillColor(230, 245, 235)
  doc.roundedRect(margenL, y - 2, ancho, 38, 2, 2, 'F')
  fila('Paneles solares (550 Wp c/u):', `${datos.propuesta.paneles_requeridos} unidades — ${datos.propuesta.potencia_paneles_kw} kWp`)
  fila('Banco de baterías LiFePO₄:', `${datos.propuesta.capacidad_baterias_kwh.toFixed(1)} kWh de capacidad útil`)
  fila('Inversor trifásico:', `${datos.propuesta.inversor_kw} kW`)
  if (datos.propuesta.controlador_a) {
    fila('Controlador de carga MPPT:', `${datos.propuesta.controlador_a} A`)
  }
  fila('Autonomía estimada del sistema:', `${datos.propuesta.autonomia_estimada} horas`, true)
  fila('Costo mensual estimado (25 años):', `$${datos.propuesta.costo_mensual_estimado.toFixed(2)}/mes`)
  y += 3
  fila('INVERSIÓN TOTAL ESTIMADA:', `$${datos.propuesta.inversion_estimada.toLocaleString()}`, true)
  y += 4

  nota(
    `Fuente de datos de radiación solar: ${FUENTE_RADIACION_SOLAR}. ` +
    `Factor de emisión FV (ciclo de vida): ${FACTOR_CO2_FV_KG_KWH} kg CO₂/kWh (NREL 2021).`
  )
  y += 2

  // ── 5. ANÁLISIS COMPARATIVO ───────────────────────────────────────────────
  checkPage(50)
  seccion('5', 'Análisis Comparativo de Sistemas')

  const rowsComp: [string, string, string][] = [
    ['Criterio', 'Sistema Actual', 'Sistema Solar FV'],
    ['Tipo', datos.respaldo.tipo === 'planta_diesel' ? 'Planta Diésel' : 'Baterías', 'Paneles + LiFePO₄'],
    ['Autonomía (h)', `${datos.respaldo.autonomia_horas}`, `${datos.propuesta.autonomia_estimada}`],
    ['Costo mensual ($)', `$${datos.costoActual.toFixed(2)}`, `$${datos.propuesta.costo_mensual_estimado.toFixed(2)}`],
    ['Dependencia combustible', datos.respaldo.tipo === 'planta_diesel' ? 'Sí' : 'No', 'No'],
    ['Emisiones CO₂ (kg/mes)',
      datos.respaldo.consumo_combustible_lh
        ? `${(datos.respaldo.consumo_combustible_lh * datos.condiciones.horas_falla_promedio * 30 * FACTOR_CO2_DIESEL_KG_L).toFixed(1)}`
        : '~0',
      `~${(datos.propuesta.consumo_diario_kwh * 30 * FACTOR_CO2_FV_KG_KWH).toFixed(1)}`
    ],
  ]

  // Calcular disponibilidad
  const dispActual = Math.min(100, ((24 - Math.max(0, datos.condiciones.horas_falla_promedio - datos.respaldo.autonomia_horas)) / 24 * 100))
  const dispSolar = Math.min(100, ((24 - Math.max(0, datos.condiciones.horas_falla_promedio - datos.propuesta.autonomia_estimada)) / 24 * 100))
  rowsComp.push(['Disponibilidad SLA (%)', `${dispActual.toFixed(3)}%`, `${dispSolar.toFixed(3)}%`])

  rowsComp.forEach((row, i) => {
    checkPage(7)
    const isHeader = i === 0
    if (isHeader) {
      doc.setFillColor(40, 80, 200); doc.rect(margenL, y - 3, ancho, 7, 'F')
      doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold')
    } else if (i % 2 === 0) {
      doc.setFillColor(245, 247, 255); doc.rect(margenL, y - 3, ancho, 6, 'F')
      doc.setTextColor(0, 0, 0); doc.setFont('helvetica', 'normal')
    } else {
      doc.setFillColor(255, 255, 255); doc.rect(margenL, y - 3, ancho, 6, 'F')
      doc.setTextColor(0, 0, 0); doc.setFont('helvetica', 'normal')
    }
    doc.setFontSize(8)
    doc.text(row[0], margenL + 2, y + 1)
    doc.text(row[1], 105, y + 1, { align: 'center' })
    doc.text(row[2], margenR - 2, y + 1, { align: 'right' })
    doc.setTextColor(0, 0, 0)
    y += 6
  })
  y += 4

  // ── 6. INDICADORES FINANCIEROS ────────────────────────────────────────────
  checkPage(35)
  seccion('6', 'Indicadores Financieros del Proyecto')

  const ahorroMensual = datos.costoActual - datos.propuesta.costo_mensual_estimado
  const ahorroAnual = ahorroMensual * 12
  const mesesBreakeven = ahorroMensual > 0 ? datos.propuesta.inversion_estimada / ahorroMensual : null
  const anosBreakeven = mesesBreakeven ? mesesBreakeven / 12 : null

  fila('Ahorro mensual estimado:', `$${ahorroMensual.toFixed(2)}/mes`)
  fila('Ahorro anual estimado:', `$${ahorroAnual.toFixed(2)}/año`)
  if (mesesBreakeven && anosBreakeven) {
    fila('Período de recuperación (Payback):', `${Math.round(mesesBreakeven)} meses (${anosBreakeven.toFixed(1)} años)`, true)
  } else {
    fila('Período de recuperación:', 'Sin ahorro proyectado — revisar costos')
  }
  fila('Vida útil del sistema:', '25 años')
  fila('Ahorro total proyectado (25 años):', `$${(ahorroAnual * 25).toLocaleString()}`)

  // TIR y VPN desde detalles_json si disponibles
  const dim = datos.propuesta.detalles_json?.dimensionamiento as { tir?: number | null; vpn?: number | null } | undefined
  if (dim?.tir != null) {
    fila('TIR (Tasa Interna de Retorno):', `${dim.tir.toFixed(2)}%`, true)
    nota('TIR calculada con flujo de caja a 25 años, método Newton-Raphson (VPN = 0).')
  }
  if (dim?.vpn != null) {
    fila('VPN (Valor Presente Neto, r=12%):', `$${dim.vpn.toLocaleString()}`, true)
    nota('VPN calculado con tasa de descuento del 12% anual, horizonte 25 años.')
  }
  y += 2

  // ── 7. OPERACIONALIZACIÓN DE VARIABLES ───────────────────────────────────
  checkPage(55)
  seccion('7', 'Operacionalización de Variables del Modelo')

  const varsTable: [string, string, string, string][] = [
    ['Variable', 'Dimensión', 'Indicadores', 'Fuente'],
    ['Sistema de Respaldo', 'Técnica', 'Potencia inst., autonomía (h)', 'Fichas técnicas'],
    ['Sistema de Respaldo', 'Económica', 'Inversión, costo O&M ($/mes)', 'Registros financieros'],
    ['Continuidad operativa', 'Energética', 'Consumo total (kWh/día)', 'Medición directa'],
    ['Continuidad operativa', 'Operativa', 'Disponibilidad (%), SLA', 'UIT-T E.800'],
    ['Sistema FV propuesto', 'Ambiental', 'Emisiones CO₂ (kg/mes)', 'IPCC 2006 / NREL 2021'],
    ['Sistema FV propuesto', 'Financiera', 'TIR (%), VPN ($), Payback', 'Análisis flujo de caja'],
  ]

  const varCols = [45, 28, 72, 45]
  varsTable.forEach((row, i) => {
    checkPage(7)
    const isHeader = i === 0
    if (isHeader) {
      doc.setFillColor(40, 80, 200); doc.rect(margenL, y - 3, ancho, 7, 'F')
      doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold')
    } else if (i % 2 === 0) {
      doc.setFillColor(245, 247, 255); doc.rect(margenL, y - 3, ancho, 6, 'F')
      doc.setTextColor(0, 0, 0); doc.setFont('helvetica', 'normal')
    } else {
      doc.setFillColor(255, 255, 255); doc.rect(margenL, y - 3, ancho, 6, 'F')
      doc.setTextColor(0, 0, 0); doc.setFont('helvetica', 'normal')
    }
    doc.setFontSize(7.5)
    let xv = margenL + 1
    row.forEach((cell, ci) => {
      const txt = cell.length > 30 ? cell.substring(0, 28) + '…' : cell
      doc.text(txt, xv, y + 1)
      xv += varCols[ci]
    })
    doc.setTextColor(0, 0, 0)
    y += 6
  })
  y += 4

  // ── 8. MOTOR DE DECISIÓN ──────────────────────────────────────────────────
  checkPage(50)
  seccion('8', 'Evaluación del Motor de Decisión — Sistema Basado en Reglas')

  const decision = datos.propuesta.detalles_json?.decision as {
    puntuacion?: number
    reglas?: { nombre: string; cumple: boolean; peso: number; detalle: string }[]
    justificacion?: string
  } | undefined

  if (decision?.reglas) {
    parrafo(
      'El motor de decisión evalúa 5 criterios ponderados conforme al modelo de apoyo a la decisión ' +
      '(DSS) propuesto en el Capítulo 4. La puntuación resultante determina la recomendación final.'
    )

    decision.reglas.forEach((r) => {
      checkPage(10)
      const color = r.cumple ? [34, 197, 94] as [number, number, number] : [239, 68, 68] as [number, number, number]
      doc.setFillColor(...color)
      doc.circle(margenL + 5, y - 1, 2, 'F')
      doc.setFontSize(8.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(30, 30, 30)
      doc.text(`${r.nombre} (peso: ${r.peso}%) — ${r.cumple ? 'CUMPLE' : 'NO CUMPLE'}`, margenL + 10, y)
      y += 5
      doc.setFontSize(7.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(80, 80, 80)
      const lines = doc.splitTextToSize(r.detalle, ancho - 14)
      doc.text(lines, margenL + 10, y)
      y += lines.length * 4 + 2
    })

    y += 2
    doc.setFontSize(11); doc.setFont('helvetica', 'bold')
    doc.text(`Puntuación total: ${decision.puntuacion ?? '—'}/100`, margenL + 2, y); y += 7
  }

  // ── 9. CONCLUSIÓN AUTOMATIZADA ────────────────────────────────────────────
  checkPage(30)
  seccion('9', 'Conclusión del Sistema de Apoyo a la Decisión')

  // Recuadro de recomendación
  const recColor: Record<string, [number, number, number]> = {
    'Migración recomendada': [34, 197, 94],
    'Migración parcialmente viable': [245, 158, 11],
    'Migración no recomendable': [239, 68, 68],
  }
  const color = recColor[datos.propuesta.recomendacion] ?? [100, 100, 100]
  doc.setFillColor(color[0], color[1], color[2])
  doc.roundedRect(margenL, y - 3, ancho, 12, 3, 3, 'F')
  doc.setFontSize(12); doc.setFont('helvetica', 'bold'); doc.setTextColor(255, 255, 255)
  doc.text(datos.propuesta.recomendacion.toUpperCase(), 105, y + 4, { align: 'center' })
  doc.setTextColor(0, 0, 0); y += 16

  if (decision?.justificacion) {
    parrafo(decision.justificacion)
  }
  y += 3

  // ── 10. REFERENCIAS METODOLÓGICAS ─────────────────────────────────────────
  checkPage(40)
  seccion('10', 'Referencias Metodológicas y Fuentes de Datos')

  const refs = [
    `[1] CORPOELEC/IDEAM. Atlas de Radiación Solar de Venezuela (2011). Disponible en: ${FUENTE_RADIACION_SOLAR.split(';')[0].trim()}.`,
    '[2] NASA POWER Project. Surface Solar Energy Data Set. Disponible en: power.larc.nasa.gov.',
    '[3] IRENA. Global Atlas for Renewable Energy — Venezuela (2022).',
    `[4] IPCC. Guidelines for National Greenhouse Gas Inventories, Vol. 2 (2006). Factor CO₂ diésel: ${FACTOR_CO2_DIESEL_KG_L} kg/L.`,
    `[5] NREL. Life Cycle Greenhouse Gas Emissions from Solar PV (2021). Factor FV ciclo de vida: ${FACTOR_CO2_FV_KG_KWH} kg CO₂/kWh.`,
    '[6] UIT-T E.800 (2008). Definiciones de términos relacionados con la calidad de servicio y rendimiento de telecomunicaciones.',
    '[7] IEC 62109 / IEEE 1562. Normas de diseño y dimensionamiento para sistemas fotovoltaicos autónomos.',
  ]
  refs.forEach((ref) => {
    checkPage(8)
    doc.setFontSize(7.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(60, 60, 60)
    const lines = doc.splitTextToSize(ref, ancho)
    doc.text(lines, margenL + 2, y); y += lines.length * 4 + 1.5
  })

  // ── PIE DE PÁGINA (última página) ─────────────────────────────────────────
  const totalPages = doc.getNumberOfPages()
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p)
    doc.setFillColor(40, 80, 200)
    doc.rect(0, 287, 210, 10, 'F')
    doc.setFontSize(7); doc.setFont('helvetica', 'normal'); doc.setTextColor(255, 255, 255)
    doc.text(
      `SET — Sistema de Evaluación de Respaldo Energético · Tesis de Grado, Ing. de Telecomunicaciones · Pág. ${p}/${totalPages}`,
      105, 293, { align: 'center' }
    )
  }

  doc.save(`Reporte_SET_${datos.nodo.nombre.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`)
}
