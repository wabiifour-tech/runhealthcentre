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
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

// Color palette
const COLORS = {
  primary: '#3B82F6',
  secondary: '#10B981',
  accent: '#F59E0B',
  danger: '#EF4444',
  purple: '#8B5CF6',
  pink: '#EC4899'
}

const PIE_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16']

// Patient Visits Chart
interface PatientVisitsChartProps {
  data: Array<{ date: string; label: string; count: number }>
  title?: string
}

export function PatientVisitsChart({ data, title = "Daily Patient Visits" }: PatientVisitsChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>Last 7 days</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="label" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
            <Area type="monotone" dataKey="count" stroke={COLORS.primary} fill="#BFDBFE" strokeWidth={2} name="Visits" />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

// Revenue Chart
interface RevenueChartProps {
  data: Array<{ date: string; label: string; amount: number }>
  title?: string
}

export function RevenueChart({ data, title = "Revenue Trend" }: RevenueChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>Last 7 days (₦)</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="label" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
              formatter={(value: number) => [`₦${value.toLocaleString()}`, 'Revenue']}
            />
            <Line type="monotone" dataKey="amount" stroke={COLORS.secondary} strokeWidth={2} dot={{ fill: COLORS.secondary, r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

// Department Statistics Chart
interface DepartmentStatsChartProps {
  data: Array<{ name: string; patients: number; revenue: number }>
  title?: string
}

export function DepartmentStatsChart({ data, title = "Department Statistics" }: DepartmentStatsChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>Patients by department</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis type="number" tick={{ fontSize: 12 }} />
            <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 11 }} />
            <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
            <Bar dataKey="patients" fill={COLORS.primary} name="Patients" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

// Diagnosis Distribution Pie Chart
interface DiagnosisPieChartProps {
  data: Array<{ name: string; count: number; percentage: number }>
  title?: string
}

export function DiagnosisPieChart({ data, title = "Top Diagnoses" }: DiagnosisPieChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>Diagnosis distribution</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={80}
              fill="#8884d8"
              dataKey="count"
              label={({ name, percentage }) => `${name} ${percentage}%`}
            >
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

// Queue Status Chart
interface QueueStatusChartProps {
  data: Array<{ unit: string; waiting: number; inProgress: number; completed: number }>
  title?: string
}

export function QueueStatusChart({ data, title = "Queue Status by Unit" }: QueueStatusChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>Current queue status</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="unit" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="waiting" stackId="a" fill={COLORS.accent} name="Waiting" />
            <Bar dataKey="inProgress" stackId="a" fill={COLORS.primary} name="In Progress" />
            <Bar dataKey="completed" stackId="a" fill={COLORS.secondary} name="Completed" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

// Inventory Status Chart
interface InventoryStatusChartProps {
  data: Array<{ category: string; inStock: number; lowStock: number; outOfStock: number }>
  title?: string
}

export function InventoryStatusChart({ data, title = "Inventory Status" }: InventoryStatusChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>Stock levels by category</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="category" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="inStock" fill={COLORS.secondary} name="In Stock" />
            <Bar dataKey="lowStock" fill={COLORS.accent} name="Low Stock" />
            <Bar dataKey="outOfStock" fill={COLORS.danger} name="Out of Stock" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

// Mini Stat Card with Sparkline
interface MiniStatCardProps {
  title: string
  value: string | number
  change?: number
  data?: number[]
  icon?: React.ReactNode
  color?: string
}

export function MiniStatCard({ title, value, change, data, icon, color = COLORS.primary }: MiniStatCardProps) {
  const sparklineData = data?.map((v, i) => ({ value: v, index: i })) || []
  
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">{title}</p>
            <p className="text-2xl font-bold" style={{ color }}>{value}</p>
            {change !== undefined && (
              <p className={`text-xs ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {change >= 0 ? '↑' : '↓'} {Math.abs(change)}% from last period
              </p>
            )}
          </div>
          {icon && <div className="opacity-20">{icon}</div>}
        </div>
        {sparklineData.length > 0 && (
          <div className="mt-2 h-8">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparklineData}>
                <Area type="monotone" dataKey="value" stroke={color} fill={color} fillOpacity={0.2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Vital Signs Trend Chart
export interface VitalSignDataPoint {
  date: string
  label: string
  systolic?: number
  diastolic?: number
  temperature?: number
  pulse?: number
  weight?: number
  spO2?: number
  respiratoryRate?: number
}

interface VitalSignsTrendChartProps {
  data: VitalSignDataPoint[]
  title?: string
  type?: 'bloodPressure' | 'temperature' | 'pulse' | 'weight' | 'spO2' | 'all'
}

export function VitalSignsTrendChart({ data, title = "Vital Signs Trend", type = 'all' }: VitalSignsTrendChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <p>No vital signs data available</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Reverse data to show oldest to newest
  const chartData = [...data].reverse()

  if (type === 'bloodPressure') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Blood Pressure Trend</CardTitle>
          <CardDescription>mmHg over time</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis domain={[40, 200]} tick={{ fontSize: 12 }} />
              <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
              <Legend />
              <Line type="monotone" dataKey="systolic" stroke="#EF4444" strokeWidth={2} dot={{ fill: '#EF4444', r: 4 }} name="Systolic" />
              <Line type="monotone" dataKey="diastolic" stroke="#3B82F6" strokeWidth={2} dot={{ fill: '#3B82F6', r: 4 }} name="Diastolic" />
            </LineChart>
          </ResponsiveContainer>
          {/* Reference ranges */}
          <div className="mt-2 flex justify-center gap-4 text-xs text-gray-500">
            <span>Normal: 90/60 - 120/80 mmHg</span>
            <span className="text-yellow-600">Elevated: 120-129</span>
            <span className="text-red-600">High: ≥130/80</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (type === 'temperature') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Temperature Trend</CardTitle>
          <CardDescription>°C over time</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis domain={[35, 41]} tick={{ fontSize: 12 }} />
              <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
              <Area type="monotone" dataKey="temperature" stroke="#F59E0B" fill="#FEF3C7" strokeWidth={2} name="Temperature (°C)" />
            </AreaChart>
          </ResponsiveContainer>
          <div className="mt-2 flex justify-center gap-4 text-xs text-gray-500">
            <span>Normal: 36.1 - 37.2°C</span>
            <span className="text-orange-600">Fever: {'>'}37.5°C</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (type === 'pulse') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Pulse Rate Trend</CardTitle>
          <CardDescription>bpm over time</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis domain={[40, 150]} tick={{ fontSize: 12 }} />
              <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
              <Line type="monotone" dataKey="pulse" stroke="#8B5CF6" strokeWidth={2} dot={{ fill: '#8B5CF6', r: 4 }} name="Pulse (bpm)" />
            </LineChart>
          </ResponsiveContainer>
          <div className="mt-2 text-center text-xs text-gray-500">
            Normal: 60 - 100 bpm
          </div>
        </CardContent>
      </Card>
    )
  }

  if (type === 'weight') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Weight Trend</CardTitle>
          <CardDescription>kg over time</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
              <Line type="monotone" dataKey="weight" stroke="#10B981" strokeWidth={2} dot={{ fill: '#10B981', r: 4 }} name="Weight (kg)" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    )
  }

  if (type === 'spO2') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Oxygen Saturation Trend</CardTitle>
          <CardDescription>% over time</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis domain={[85, 100]} tick={{ fontSize: 12 }} />
              <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
              <Area type="monotone" dataKey="spO2" stroke="#06B6D4" fill="#CFFAFE" strokeWidth={2} name="SpO₂ (%)" />
            </AreaChart>
          </ResponsiveContainer>
          <div className="mt-2 text-center text-xs text-gray-500">
            Normal: 95 - 100%
          </div>
        </CardContent>
      </Card>
    )
  }

  // All vitals in one chart
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>Multiple vital signs over time</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
            <Legend />
            <Line type="monotone" dataKey="systolic" stroke="#EF4444" strokeWidth={2} dot={{ r: 3 }} name="Systolic BP" />
            <Line type="monotone" dataKey="diastolic" stroke="#3B82F6" strokeWidth={2} dot={{ r: 3 }} name="Diastolic BP" />
            <Line type="monotone" dataKey="pulse" stroke="#8B5CF6" strokeWidth={2} dot={{ r: 3 }} name="Pulse" />
            <Line type="monotone" dataKey="temperature" stroke="#F59E0B" strokeWidth={2} dot={{ r: 3 }} name="Temp (°C)" />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

// Named exports are already used above, remove default export to avoid warning
// Charts are imported individually via named exports
