'use client'

import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
  type ChartOptions,
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler)

interface ProyeccionRow {
  anio: number
  costoActual: number
  costoSolarBasico: number
  costoSolarExpansion: number
}

interface ProyeccionCostosChartProps {
  proyeccion: ProyeccionRow[]
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-VE', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

function findCrossoverYear(proyeccion: ProyeccionRow[]): number | null {
  for (let i = 1; i < proyeccion.length; i++) {
    const prev = proyeccion[i - 1]
    const curr = proyeccion[i]
    if (
      prev.costoActual < prev.costoSolarBasico &&
      curr.costoActual >= curr.costoSolarBasico
    ) {
      return curr.anio
    }
  }
  return null
}

export default function ProyeccionCostosChart({ proyeccion }: ProyeccionCostosChartProps) {
  const crossoverYear = findCrossoverYear(proyeccion)

  const data = {
    labels: proyeccion.map((r) => `Ano ${r.anio}`),
    datasets: [
      {
        label: 'Costo Actual (sin solar)',
        data: proyeccion.map((r) => r.costoActual),
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderWidth: 2.5,
        pointRadius: 0,
        pointHoverRadius: 5,
        tension: 0.3,
        fill: false,
      },
      {
        label: 'Solar Basico',
        data: proyeccion.map((r) => r.costoSolarBasico),
        borderColor: '#3381ff',
        backgroundColor: 'rgba(51, 129, 255, 0.1)',
        borderWidth: 2.5,
        pointRadius: 0,
        pointHoverRadius: 5,
        tension: 0.3,
        fill: false,
      },
      {
        label: 'Solar + Expansion',
        data: proyeccion.map((r) => r.costoSolarExpansion),
        borderColor: '#22c55e',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        borderWidth: 2.5,
        borderDash: [6, 4],
        pointRadius: 0,
        pointHoverRadius: 5,
        tension: 0.3,
        fill: false,
      },
    ],
  }

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          padding: 16,
          usePointStyle: true,
          pointStyleWidth: 12,
          color: '#cbd5e1',
          font: { size: 13 },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        titleColor: '#f1f5f9',
        bodyColor: '#f1f5f9',
        borderColor: 'rgba(51, 129, 255, 0.3)',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        callbacks: {
          label(context) {
            return ` ${context.dataset.label}: ${formatCurrency(context.parsed.y ?? 0)}`
          },
        },
      },
    },
    scales: {
      x: {
        grid: { color: 'rgba(148, 163, 184, 0.1)' },
        ticks: { color: '#94a3b8', font: { size: 11 } },
      },
      y: {
        grid: { color: 'rgba(148, 163, 184, 0.1)' },
        ticks: {
          color: '#94a3b8',
          font: { size: 11 },
          callback(value) {
            return formatCurrency(value as number)
          },
        },
        title: {
          display: true,
          text: 'Costo Acumulado ($)',
          color: '#94a3b8',
          font: { size: 12 },
        },
      },
    },
  }

  const crossoverPlugin = {
    id: 'crossoverAnnotation',
    afterDraw(chart: ChartJS) {
      if (!crossoverYear) return
      const xIndex = proyeccion.findIndex((r) => r.anio === crossoverYear)
      if (xIndex < 0) return

      const meta = chart.getDatasetMeta(0)
      if (!meta.data[xIndex]) return

      const { ctx, chartArea } = chart
      const xPixel = meta.data[xIndex].x

      ctx.save()
      ctx.setLineDash([4, 4])
      ctx.strokeStyle = '#facc15'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(xPixel, chartArea.top)
      ctx.lineTo(xPixel, chartArea.bottom)
      ctx.stroke()

      ctx.setLineDash([])
      ctx.fillStyle = 'rgba(250, 204, 21, 0.15)'
      ctx.strokeStyle = '#facc15'
      ctx.lineWidth = 1
      const badgeText = `Cruce: Ano ${crossoverYear}`
      ctx.font = '11px Inter, system-ui, sans-serif'
      const textW = ctx.measureText(badgeText).width + 12
      const badgeX = xPixel - textW / 2
      const badgeY = chartArea.top + 8

      ctx.beginPath()
      ctx.roundRect(badgeX, badgeY, textW, 22, 4)
      ctx.fill()
      ctx.stroke()

      ctx.fillStyle = '#facc15'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(badgeText, xPixel, badgeY + 11)

      ctx.restore()
    },
  }

  return (
    <div className="relative h-[400px] w-full">
      <Line data={data} options={options} plugins={[crossoverPlugin]} />
    </div>
  )
}
