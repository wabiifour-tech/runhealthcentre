'use client'

import React from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar
} from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface VitalSign {
  id: string
  patientId: string
  recordedAt: string
  bloodPressureSystolic?: number
  bloodPressureDiastolic?: number
  temperature?: number
  pulse?: number
  respiratoryRate?: number
  weight?: number
  oxygenSaturation?: number
  painScore?: number
}

interface VitalSignsChartProps {
  vitals: VitalSign[]
  title?: string
  showAll?: boolean
}

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('en-NG', { month: 'short', day: 'numeric' })
}

const formatTime = (dateStr: string) => {
  return new Date(dateStr).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })
}

// Blood Pressure Chart
export function BloodPressureChart({ vitals, title = "Blood Pressure Trend" }: VitalSignsChartProps) {
  const data = vitals
    .filter(v => v.bloodPressureSystolic || v.bloodPressureDiastolic)
    .sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime())
    .slice(-20)
    .map(v => ({
      date: formatDate(v.recordedAt),
      time: formatTime(v.recordedAt),
      systolic: v.bloodPressureSystolic,
      diastolic: v.bloodPressureDiastolic
    }))

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader><CardTitle className="text-lg">{title}</CardTitle></CardHeader>
        <CardContent className="h-[200px] flex items-center justify-center text-gray-500">
          No blood pressure readings available
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>Last {data.length} readings</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis domain={[60, 200]} tick={{ fontSize: 12 }} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
              formatter={(value: number, name: string) => [`${value} mmHg`, name === 'systolic' ? 'Systolic' : 'Diastolic']}
            />
            <Legend />
            <Line type="monotone" dataKey="systolic" stroke="#ef4444" strokeWidth={2} dot={{ fill: '#ef4444', r: 4 }} name="Systolic" />
            <Line type="monotone" dataKey="diastolic" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6', r: 4 }} name="Diastolic" />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

// Temperature Chart
export function TemperatureChart({ vitals, title = "Temperature Trend" }: VitalSignsChartProps) {
  const data = vitals
    .filter(v => v.temperature)
    .sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime())
    .slice(-20)
    .map(v => ({
      date: formatDate(v.recordedAt),
      temperature: v.temperature
    }))

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader><CardTitle className="text-lg">{title}</CardTitle></CardHeader>
        <CardContent className="h-[200px] flex items-center justify-center text-gray-500">
          No temperature readings available
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>Last {data.length} readings</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis domain={[35, 42]} tick={{ fontSize: 12 }} />
            <Tooltip formatter={(value: number) => [`${value}°C`, 'Temperature']} />
            <Area type="monotone" dataKey="temperature" stroke="#f97316" fill="#fed7aa" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

// Pulse Chart
export function PulseChart({ vitals, title = "Pulse Rate Trend" }: VitalSignsChartProps) {
  const data = vitals
    .filter(v => v.pulse)
    .sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime())
    .slice(-20)
    .map(v => ({ date: formatDate(v.recordedAt), pulse: v.pulse }))

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader><CardTitle className="text-lg">{title}</CardTitle></CardHeader>
        <CardContent className="h-[200px] flex items-center justify-center text-gray-500">
          No pulse readings available
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>Last {data.length} readings</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis domain={[40, 160]} tick={{ fontSize: 12 }} />
            <Tooltip formatter={(value: number) => [`${value} bpm`, 'Pulse']} />
            <Line type="monotone" dataKey="pulse" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981', r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

// Oxygen Saturation Chart
export function OxygenSaturationChart({ vitals, title = "Oxygen Saturation Trend" }: VitalSignsChartProps) {
  const data = vitals
    .filter(v => v.oxygenSaturation)
    .sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime())
    .slice(-20)
    .map(v => ({ date: formatDate(v.recordedAt), spo2: v.oxygenSaturation }))

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader><CardTitle className="text-lg">{title}</CardTitle></CardHeader>
        <CardContent className="h-[200px] flex items-center justify-center text-gray-500">
          No SpO2 readings available
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>Last {data.length} readings</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis domain={[80, 100]} tick={{ fontSize: 12 }} />
            <Tooltip formatter={(value: number) => [`${value}%`, 'SpO2']} />
            <Area type="monotone" dataKey="spo2" stroke="#8b5cf6" fill="#ddd6fe" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

// Combined Vitals Dashboard
export function VitalsDashboard({ vitals }: VitalSignsChartProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <BloodPressureChart vitals={vitals} />
        <TemperatureChart vitals={vitals} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <PulseChart vitals={vitals} />
        <OxygenSaturationChart vitals={vitals} />
      </div>
    </div>
  )
}

export default VitalsDashboard
