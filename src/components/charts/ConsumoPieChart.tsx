'use client'

import { Doughnut } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  type ChartOptions,
} from 'chart.js'

ChartJS.register(ArcElement, Tooltip, Legend)

interface ConsumoPieChartProps {
  consumoPorCategoria: Record<string, number>
}

const COLORES: Record<string, string> = {
  red: '#3381ff',
  climatizacion: '#f59e0b',
  iluminacion: '#a855f7',
  otros: '#64748b',
}

const ETIQUETAS: Record<string, string> = {
  red: 'Red',
  climatizacion: 'Climatizacion',
  iluminacion: 'Iluminacion',
  otros: 'Otros',
}

export default function ConsumoPieChart({ consumoPorCategoria }: ConsumoPieChartProps) {
  const categorias = Object.keys(consumoPorCategoria)
  const valores = Object.values(consumoPorCategoria)
  const totalW = valores.reduce((sum, v) => sum + v, 0)
  const totalKW = (totalW / 1000).toFixed(2)

  const data = {
    labels: categorias.map((c) => ETIQUETAS[c] || c),
    datasets: [
      {
        data: valores,
        backgroundColor: categorias.map((c) => COLORES[c] || '#94a3b8'),
        borderColor: categorias.map((c) => COLORES[c] || '#94a3b8'),
        borderWidth: 2,
        hoverOffset: 8,
      },
    ],
  }

  const options: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '60%',
    plugins: {
      legend: {
        position: 'bottom',
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
            const value = context.parsed
            const pct = totalW > 0 ? ((value / totalW) * 100).toFixed(1) : '0'
            return ` ${context.label}: ${value} W (${pct}%)`
          },
        },
      },
    },
  }

  const centerTextPlugin = {
    id: 'centerText',
    afterDraw(chart: ChartJS<'doughnut'>) {
      const { ctx, chartArea } = chart
      if (!chartArea) return
      const centerX = (chartArea.left + chartArea.right) / 2
      const centerY = (chartArea.top + chartArea.bottom) / 2

      ctx.save()
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'

      ctx.font = 'bold 22px Inter, system-ui, sans-serif'
      ctx.fillStyle = '#f1f5f9'
      ctx.fillText(`${totalKW}`, centerX, centerY - 10)

      ctx.font = '12px Inter, system-ui, sans-serif'
      ctx.fillStyle = '#94a3b8'
      ctx.fillText('kW total', centerX, centerY + 14)

      ctx.restore()
    },
  }

  return (
    <div className="relative h-[320px] w-full">
      <Doughnut data={data} options={options} plugins={[centerTextPlugin]} />
    </div>
  )
}
