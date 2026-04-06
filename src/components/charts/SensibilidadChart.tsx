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
  type ChartOptions,
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend)

interface SensibilidadParametro {
  nombre: string
  unidad: string
  valorBase: number
}

interface SensibilidadPunto {
  valorParametro: number
  inversionTotal: number
  puntuacion: number
}

interface SensibilidadChartProps {
  datos: {
    parametro: SensibilidadParametro
    puntos: SensibilidadPunto[]
  }
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-VE', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

export default function SensibilidadChart({ datos }: SensibilidadChartProps) {
  const { parametro, puntos } = datos

  const labels = puntos.map(
    (p) => `${p.valorParametro}${parametro.unidad ? ` ${parametro.unidad}` : ''}`
  )

  const data = {
    labels,
    datasets: [
      {
        label: 'Inversion Total ($)',
        data: puntos.map((p) => p.inversionTotal),
        borderColor: '#3381ff',
        backgroundColor: 'rgba(51, 129, 255, 0.1)',
        borderWidth: 2.5,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: '#3381ff',
        tension: 0.3,
        yAxisID: 'yInversion',
      },
      {
        label: 'Puntuacion (0-100)',
        data: puntos.map((p) => p.puntuacion),
        borderColor: '#22c55e',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        borderWidth: 2.5,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: '#22c55e',
        tension: 0.3,
        yAxisID: 'yPuntuacion',
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
          title(items) {
            return `${parametro.nombre}: ${items[0]?.label || ''}`
          },
          label(context) {
            if (context.datasetIndex === 0) {
              return ` Inversion: ${formatCurrency(context.parsed.y ?? 0)}`
            }
            return ` Puntuacion: ${(context.parsed.y ?? 0).toFixed(1)} / 100`
          },
        },
      },
    },
    scales: {
      x: {
        grid: { color: 'rgba(148, 163, 184, 0.1)' },
        ticks: { color: '#94a3b8', font: { size: 11 } },
        title: {
          display: true,
          text: `${parametro.nombre} (${parametro.unidad})`,
          color: '#94a3b8',
          font: { size: 12 },
        },
      },
      yInversion: {
        type: 'linear',
        position: 'left',
        grid: { color: 'rgba(148, 163, 184, 0.1)' },
        ticks: {
          color: '#3381ff',
          font: { size: 11 },
          callback(value) {
            return formatCurrency(value as number)
          },
        },
        title: {
          display: true,
          text: 'Inversion ($)',
          color: '#3381ff',
          font: { size: 12 },
        },
      },
      yPuntuacion: {
        type: 'linear',
        position: 'right',
        min: 0,
        max: 100,
        grid: { drawOnChartArea: false },
        ticks: {
          color: '#22c55e',
          font: { size: 11 },
        },
        title: {
          display: true,
          text: 'Puntuacion',
          color: '#22c55e',
          font: { size: 12 },
        },
      },
    },
  }

  const baseLinePlugin = {
    id: 'baseLineAnnotation',
    afterDraw(chart: ChartJS) {
      const baseIndex = puntos.findIndex(
        (p) => p.valorParametro === parametro.valorBase
      )
      if (baseIndex < 0) return

      const meta = chart.getDatasetMeta(0)
      if (!meta.data[baseIndex]) return

      const { ctx, chartArea } = chart
      const xPixel = meta.data[baseIndex].x

      ctx.save()
      ctx.setLineDash([5, 5])
      ctx.strokeStyle = '#94a3b8'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(xPixel, chartArea.top)
      ctx.lineTo(xPixel, chartArea.bottom)
      ctx.stroke()

      ctx.setLineDash([])
      ctx.font = '11px Inter, system-ui, sans-serif'
      ctx.fillStyle = '#94a3b8'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'top'
      ctx.fillText('Valor base', xPixel, chartArea.top - 14)

      ctx.restore()
    },
  }

  return (
    <div className="relative h-[400px] w-full">
      <Line data={data} options={options} plugins={[baseLinePlugin]} />
    </div>
  )
}
