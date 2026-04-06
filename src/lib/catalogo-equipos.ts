/**
 * Catalogo de equipos predefinidos para nodos de telecomunicaciones ISP
 * Permite al usuario seleccionar equipos tipicos rapidamente
 */

import { CategoriaEquipo } from '@/types'

export interface EquipoPreset {
  nombre: string
  categoria: CategoriaEquipo
  potencia_w: number
  horas_operacion: number
  descripcion: string
}

export const CATALOGO_EQUIPOS: Record<string, EquipoPreset[]> = {
  'Equipos de Red': [
    { nombre: 'OLT Huawei MA5608T', categoria: 'red', potencia_w: 150, horas_operacion: 24, descripcion: 'Terminal de linea optica, 8 puertos GPON' },
    { nombre: 'OLT ZTE C320', categoria: 'red', potencia_w: 180, horas_operacion: 24, descripcion: 'Terminal de linea optica, 16 puertos GPON' },
    { nombre: 'Switch Mikrotik CRS326', categoria: 'red', potencia_w: 19, horas_operacion: 24, descripcion: 'Switch capa 3, 24 puertos Gigabit' },
    { nombre: 'Switch Cisco Catalyst 2960', categoria: 'red', potencia_w: 30, horas_operacion: 24, descripcion: 'Switch capa 2, 24 puertos Gigabit + PoE' },
    { nombre: 'Router Mikrotik CCR1036', categoria: 'red', potencia_w: 58, horas_operacion: 24, descripcion: 'Router core, 36 nucleos' },
    { nombre: 'Router Mikrotik CCR2004', categoria: 'red', potencia_w: 31, horas_operacion: 24, descripcion: 'Router core, 4 puertos 10G SFP+' },
    { nombre: 'Router Mikrotik RB4011', categoria: 'red', potencia_w: 33, horas_operacion: 24, descripcion: 'Router 10 puertos Gigabit + SFP+' },
    { nombre: 'Router Mikrotik hEX (RB750Gr3)', categoria: 'red', potencia_w: 10, horas_operacion: 24, descripcion: 'Router compacto, 5 puertos Gigabit' },
    { nombre: 'Radio Ubiquiti Rocket M5', categoria: 'red', potencia_w: 8, horas_operacion: 24, descripcion: 'Radio PtP/PtMP 5GHz, 500+ Mbps' },
    { nombre: 'Radio Ubiquiti AirFiber 5XHD', categoria: 'red', potencia_w: 40, horas_operacion: 24, descripcion: 'Radio backhaul 5GHz, 1+ Gbps' },
    { nombre: 'Radio Cambium ePMP 3000', categoria: 'red', potencia_w: 25, horas_operacion: 24, descripcion: 'Access Point sectorial' },
    { nombre: 'Servidor Dell PowerEdge T340', categoria: 'red', potencia_w: 350, horas_operacion: 24, descripcion: 'Servidor torre para RADIUS/DNS/DHCP' },
    { nombre: 'Servidor HP ProLiant ML110', categoria: 'red', potencia_w: 300, horas_operacion: 24, descripcion: 'Servidor torre basico' },
    { nombre: 'Media Converter FO-Ethernet', categoria: 'red', potencia_w: 5, horas_operacion: 24, descripcion: 'Convertidor fibra a cobre' },
    { nombre: 'ONT/ONU GPON', categoria: 'red', potencia_w: 12, horas_operacion: 24, descripcion: 'Unidad de red optica del cliente' },
    { nombre: 'Patch Panel Fibra Optica', categoria: 'red', potencia_w: 0, horas_operacion: 0, descripcion: 'Panel pasivo (sin consumo)' },
    { nombre: 'UPS APC Smart-UPS 1500', categoria: 'red', potencia_w: 45, horas_operacion: 24, descripcion: 'UPS en linea, consumo de standby' },
  ],
  'Climatizacion': [
    { nombre: 'Aire Acondicionado 12000 BTU', categoria: 'climatizacion', potencia_w: 1200, horas_operacion: 18, descripcion: 'Split inverter, area hasta 15m2' },
    { nombre: 'Aire Acondicionado 18000 BTU', categoria: 'climatizacion', potencia_w: 1800, horas_operacion: 18, descripcion: 'Split inverter, area hasta 25m2' },
    { nombre: 'Aire Acondicionado 24000 BTU', categoria: 'climatizacion', potencia_w: 2500, horas_operacion: 18, descripcion: 'Split inverter, area hasta 35m2' },
    { nombre: 'Aire Acondicionado 36000 BTU', categoria: 'climatizacion', potencia_w: 3500, horas_operacion: 18, descripcion: 'Piso-techo, area hasta 50m2' },
    { nombre: 'Ventilador Industrial 20"', categoria: 'climatizacion', potencia_w: 120, horas_operacion: 24, descripcion: 'Ventilacion forzada de gabinete' },
    { nombre: 'Extractor de Aire 12"', categoria: 'climatizacion', potencia_w: 65, horas_operacion: 24, descripcion: 'Extraccion de calor del rack' },
  ],
  'Iluminacion': [
    { nombre: 'Panel LED 60x60 40W', categoria: 'iluminacion', potencia_w: 40, horas_operacion: 12, descripcion: 'Panel de techo, luz blanca' },
    { nombre: 'Luminaria LED Tubo T8 18W', categoria: 'iluminacion', potencia_w: 18, horas_operacion: 12, descripcion: 'Tubo LED reemplazo fluorescente' },
    { nombre: 'Reflector LED 50W', categoria: 'iluminacion', potencia_w: 50, horas_operacion: 10, descripcion: 'Iluminacion exterior del nodo' },
    { nombre: 'Bombillo LED 9W', categoria: 'iluminacion', potencia_w: 9, horas_operacion: 10, descripcion: 'Iluminacion interior basica' },
    { nombre: 'Luz de Emergencia LED 6W', categoria: 'iluminacion', potencia_w: 6, horas_operacion: 24, descripcion: 'Luz autonoma de emergencia' },
  ],
  'Otros': [
    { nombre: 'Sistema de Seguridad CCTV (4 camaras)', categoria: 'otros', potencia_w: 60, horas_operacion: 24, descripcion: 'DVR + 4 camaras IP' },
    { nombre: 'Camara IP Individual', categoria: 'otros', potencia_w: 15, horas_operacion: 24, descripcion: 'Camara de vigilancia PoE' },
    { nombre: 'Sensor de Temperatura Ambiental', categoria: 'otros', potencia_w: 3, horas_operacion: 24, descripcion: 'Monitoreo de temperatura del rack' },
    { nombre: 'Control de Acceso (Cerradura Electrica)', categoria: 'otros', potencia_w: 12, horas_operacion: 24, descripcion: 'Sistema de acceso biometrico' },
    { nombre: 'Cargador de Laptop/Tablet', categoria: 'otros', potencia_w: 65, horas_operacion: 8, descripcion: 'Equipo de trabajo del tecnico' },
  ],
}

export function buscarPresets(query: string): EquipoPreset[] {
  const normalizado = query.toLowerCase()
  const resultados: EquipoPreset[] = []
  for (const grupo of Object.values(CATALOGO_EQUIPOS)) {
    for (const eq of grupo) {
      if (eq.nombre.toLowerCase().includes(normalizado) || eq.descripcion.toLowerCase().includes(normalizado)) {
        resultados.push(eq)
      }
    }
  }
  return resultados.slice(0, 10)
}

export function getTodosEquipos(): EquipoPreset[] {
  return Object.values(CATALOGO_EQUIPOS).flat()
}
