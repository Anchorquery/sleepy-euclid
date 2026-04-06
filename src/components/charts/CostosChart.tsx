'use client'

import { Bar } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

export default function CostosChart({ costoActual, costoSolar }: { costoActual: number; costoSolar: number }) {
  const data = {
    labels: ['Sistema Actual', 'Sistema Solar'],
    datasets: [
      {
        label: 'Costo mensual ($)',
        data: [costoActual, costoSolar],
        backgroundColor: ['#ef4444', '#3381ff'],
        borderColor: ['#dc2626', '#2563eb'],
        borderWidth: 1,
        borderRadius: 8,
        borderSkipped: false,
        barPercentage: 0.6,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        titleFont: { size: 13, weight: 'bold' as const },
        bodyFont: { size: 12 },
        padding: 12,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          label: (ctx: { parsed: { y: number | null } }) => `$${(ctx.parsed.y ?? 0).toFixed(2)} / mes`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          callback: (value: string | number) => `$${value}`,
          font: { size: 11 },
          color: '#64748b',
        },
      },
      x: {
        grid: { display: false },
        ticks: {
          font: { size: 12, weight: 'bold' as const },
          color: '#334155',
        },
      },
    },
  }

  return <Bar data={data} options={options} />
}
