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
  Cell,
  RadialBarChart,
  RadialBar,
  ComposedChart
} from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Activity, TrendingUp, TrendingDown, Users, Pill, Stethoscope, Calendar, DollarSign } from 'lucide-react'

// Color palette
const COLORS = {
  primary: '#3B82F6',
  secondary: '#10B981',
  accent: '#F59E0B',
  danger: '#EF4444',
  purple: '#8B5CF6',
  pink: '#EC4899',
  teal: '#14B8A6',
  orange: '#F97316'
}

const PIE_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16']

// Enhanced Analytics Dashboard Component
interface AnalyticsDashboardProps {
  patients: any[]
  consultations: any[]
  drugs: any[]
  appointments: any[]
  vitals: any[]
  labRequests: any[]
  userRole: string
}

export function AnalyticsDashboard({ 
  patients, 
  consultations, 
  drugs, 
  appointments, 
  vitals, 
  labRequests,
  userRole 
}: AnalyticsDashboardProps) {
  
  // Calculate patient demographics
  const genderData = [
    { name: 'Male', value: patients.filter(p => p.gender === 'Male').length, color: COLORS.primary },
    { name: 'Female', value: patients.filter(p => p.gender === 'Female').length, color: COLORS.pink }
  ]
  
  // Age group distribution
  const getAgeGroup = (dob: string) => {
    const age = new Date().getFullYear() - new Date(dob).getFullYear()
    if (age < 18) return 'Under 18'
    if (age < 30) return '18-29'
    if (age < 45) return '30-44'
    if (age < 60) return '45-59'
    return '60+'
  }
  
  const ageGroupData = [
    { name: 'Under 18', value: patients.filter(p => getAgeGroup(p.dateOfBirth) === 'Under 18').length },
    { name: '18-29', value: patients.filter(p => getAgeGroup(p.dateOfBirth) === '18-29').length },
    { name: '30-44', value: patients.filter(p => getAgeGroup(p.dateOfBirth) === '30-44').length },
    { name: '45-59', value: patients.filter(p => getAgeGroup(p.dateOfBirth) === '45-59').length },
    { name: '60+', value: patients.filter(p => getAgeGroup(p.dateOfBirth) === '60+').length }
  ].filter(d => d.value > 0)
  
  // Last 7 days patient visits
  const getLast7Days = () => {
    const days = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      days.push({
        date: date.toISOString().split('T')[0],
        label: date.toLocaleDateString('en-NG', { weekday: 'short', day: 'numeric' })
      })
    }
    return days
  }
  
  const last7Days = getLast7Days()
  
  const visitsData = last7Days.map(day => ({
    ...day,
    newPatients: patients.filter(p => p.registeredAt?.split('T')[0] === day.date).length,
    consultations: consultations.filter(c => c.createdAt?.split('T')[0] === day.date).length,
    vitals: vitals.filter(v => v.recordedAt?.split('T')[0] === day.date).length
  }))
  
  // Drug categories
  const drugCategoryData = drugs.reduce((acc: any[], drug) => {
    const cat = drug.category || 'Other'
    const existing = acc.find(a => a.name === cat)
    if (existing) {
      existing.value += 1
    } else {
      acc.push({ name: cat, value: 1 })
    }
    return acc
  }, []).slice(0, 8)
  
  // Stock status
  const stockStatus = [
    { name: 'In Stock', value: drugs.filter(d => d.quantityInStock > d.reorderLevel).length, color: COLORS.secondary },
    { name: 'Low Stock', value: drugs.filter(d => d.quantityInStock > 0 && d.quantityInStock <= d.reorderLevel).length, color: COLORS.accent },
    { name: 'Out of Stock', value: drugs.filter(d => d.quantityInStock === 0).length, color: COLORS.danger }
  ]
  
  // Consultation status
  const consultationStatus = [
    { name: 'Pending', value: consultations.filter(c => c.status === 'pending_review').length, color: COLORS.accent },
    { name: 'In Progress', value: consultations.filter(c => c.status === 'in_consultation').length, color: COLORS.primary },
    { name: 'Completed', value: consultations.filter(c => c.status === 'completed').length, color: COLORS.secondary },
    { name: 'Sent Back', value: consultations.filter(c => c.status === 'sent_back').length, color: COLORS.purple }
  ]
  
  // Monthly trend (simulated - would use real data in production)
  const monthlyTrend = [
    { month: 'Jan', patients: 45, consultations: 38, revenue: 125000 },
    { month: 'Feb', patients: 52, consultations: 45, revenue: 145000 },
    { month: 'Mar', patients: 48, consultations: 40, revenue: 132000 },
    { month: 'Apr', patients: 61, consultations: 55, revenue: 178000 },
    { month: 'May', patients: 55, consultations: 48, revenue: 156000 },
    { month: 'Jun', patients: 67, consultations: 60, revenue: 195000 },
    { month: 'Jul', patients: patients.length, consultations: consultations.length, revenue: 0 }
  ]
  
  // Top diagnoses (from consultations)
  const diagnoses = consultations
    .filter(c => c.finalDiagnosis || c.provisionalDiagnosis)
    .reduce((acc: any[], c) => {
      const diagnosis = c.finalDiagnosis || c.provisionalDiagnosis
      const existing = acc.find(a => a.name === diagnosis)
      if (existing) {
        existing.count += 1
      } else {
        acc.push({ name: diagnosis?.substring(0, 20) + (diagnosis?.length > 20 ? '...' : ''), count: 1 })
      }
      return acc
    }, [])
    .sort((a, b) => b.count - a.count)
    .slice(0, 6)
  
  // Lab tests status
  const labStatus = [
    { name: 'Pending', value: labRequests.filter(l => l.status === 'pending').length, color: COLORS.accent },
    { name: 'In Progress', value: labRequests.filter(l => l.status === 'in_progress').length, color: COLORS.primary },
    { name: 'Completed', value: labRequests.filter(l => l.status === 'completed').length, color: COLORS.secondary }
  ]
  
  // KPI Cards Data
  const totalPatients = patients.length
  const todayPatients = patients.filter(p => new Date(p.registeredAt).toDateString() === new Date().toDateString()).length
  const totalConsultations = consultations.length
  const pendingConsultations = consultations.filter(c => c.status === 'pending_review').length
  const lowStockDrugs = drugs.filter(d => d.quantityInStock <= d.reorderLevel).length
  
  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Patients</p>
                <p className="text-2xl font-bold text-blue-600">{totalPatients}</p>
                <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                  <TrendingUp className="h-3 w-3" /> +{todayPatients} today
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-green-500 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Consultations</p>
                <p className="text-2xl font-bold text-green-600">{totalConsultations}</p>
                <p className="text-xs text-orange-600 flex items-center gap-1 mt-1">
                  {pendingConsultations} pending
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <Stethoscope className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-purple-500 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Drugs in Stock</p>
                <p className="text-2xl font-bold text-purple-600">{drugs.length}</p>
                <p className="text-xs text-red-600 flex items-center gap-1 mt-1">
                  {lowStockDrugs} low stock
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <Pill className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-teal-500 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Appointments</p>
                <p className="text-2xl font-bold text-teal-600">{appointments.length}</p>
                <p className="text-xs text-teal-600 mt-1">
                  {appointments.filter(a => a.status === 'scheduled').length} scheduled
                </p>
              </div>
              <div className="p-3 bg-teal-100 rounded-full">
                <Calendar className="h-6 w-6 text-teal-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Patient Visits Trend */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-600" />
              Weekly Activity
            </CardTitle>
            <CardDescription>Patient visits, consultations & vitals (Last 7 days)</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <ComposedChart data={visitsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                />
                <Legend />
                <Bar dataKey="newPatients" fill={COLORS.primary} name="New Patients" radius={[4, 4, 0, 0]} />
                <Line type="monotone" dataKey="consultations" stroke={COLORS.secondary} strokeWidth={2} dot={{ r: 4 }} name="Consultations" />
                <Line type="monotone" dataKey="vitals" stroke={COLORS.accent} strokeWidth={2} dot={{ r: 4 }} name="Vitals" />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        {/* Patient Demographics */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5 text-pink-600" />
              Patient Demographics
            </CardTitle>
            <CardDescription>Gender & age distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {/* Gender Pie */}
              <div>
                <p className="text-sm text-center text-gray-600 mb-2">By Gender</p>
                <ResponsiveContainer width="100%" height={150}>
                  <PieChart>
                    <Pie
                      data={genderData}
                      cx="50%"
                      cy="50%"
                      innerRadius={35}
                      outerRadius={55}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {genderData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex justify-center gap-4 text-xs">
                  {genderData.map((g, i) => (
                    <span key={i} className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: g.color }} />
                      {g.name}: {g.value}
                    </span>
                  ))}
                </div>
              </div>
              
              {/* Age Groups */}
              <div>
                <p className="text-sm text-center text-gray-600 mb-2">By Age Group</p>
                <ResponsiveContainer width="100%" height={150}>
                  <BarChart data={ageGroupData} layout="vertical">
                    <XAxis type="number" tick={{ fontSize: 10 }} />
                    <YAxis dataKey="name" type="category" width={50} tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="value" fill={COLORS.purple} radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Inventory Status */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-lg">Inventory Status</CardTitle>
            <CardDescription>Drug stock levels</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={stockStatus}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                  labelLine={false}
                >
                  {stockStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        {/* Consultation Status */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-lg">Consultation Queue</CardTitle>
            <CardDescription>Current status</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <RadialBarChart 
                cx="50%" 
                cy="50%" 
                innerRadius="20%" 
                outerRadius="90%" 
                data={consultationStatus.filter(s => s.value > 0)} 
                startAngle={180} 
                endAngle={0}
              >
                <RadialBar
                  minAngle={15}
                  background
                  clockWise
                  dataKey="value"
                >
                  {consultationStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </RadialBar>
                <Tooltip />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap justify-center gap-2 mt-2">
              {consultationStatus.filter(s => s.value > 0).map((s, i) => (
                <span key={i} className="text-xs flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                  {s.name}: {s.value}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
        
        {/* Lab Status */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-lg">Laboratory</CardTitle>
            <CardDescription>Test status overview</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={labStatus}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {labStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      
      {/* Top Diagnoses */}
      {diagnoses.length > 0 && (
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-lg">Top Diagnoses</CardTitle>
            <CardDescription>Most common diagnoses this period</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={diagnoses} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="count" fill={COLORS.teal} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
      
      {/* Drug Categories */}
      {drugCategoryData.length > 0 && (
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-lg">Drug Categories</CardTitle>
            <CardDescription>Inventory by category</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={drugCategoryData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                  labelLine={true}
                >
                  {drugCategoryData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
