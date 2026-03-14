'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Volume2, Monitor, Clock, Users } from 'lucide-react'

interface QueuePatient {
  id: string
  patientId: string
  patientName: string
  department: string
  status: 'waiting' | 'in_progress' | 'completed'
  queueNumber: number
  joinedAt: string
  priority?: 'normal' | 'urgent' | 'emergency'
}

export default function QueueTVPage() {
  const [queuePatients, setQueuePatients] = useState<QueuePatient[]>([])
  const [liveTime, setLiveTime] = useState(new Date())
  const [facilityName, setFacilityName] = useState('RUHC')

  // Fetch queue data
  useEffect(() => {
    const fetchQueueData = async () => {
      try {
        const response = await fetch('/api/data?type=queuePatient')
        if (response.ok) {
          const data = await response.json()
          setQueuePatients(data.queuePatients || [])
        }
      } catch (error) {
        console.error('Failed to fetch queue data:', error)
      }
    }

    fetchQueueData()
    // Refresh every 30 seconds
    const interval = setInterval(fetchQueueData, 30000)
    return () => clearInterval(interval)
  }, [])

  // Fetch settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/settings')
        if (response.ok) {
          const data = await response.json()
          setFacilityName(data.settings?.facilityName || 'RUHC')
        }
      } catch (error) {
        console.error('Failed to fetch settings:', error)
      }
    }
    fetchSettings()
  }, [])

  // Update time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveTime(new Date())
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  // Request fullscreen on double click
  const requestFullscreen = () => {
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen()
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-NG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  }

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'emergency': return 'bg-red-500 animate-pulse'
      case 'urgent': return 'bg-orange-500'
      default: return 'bg-blue-500'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'waiting': return 'bg-yellow-500'
      case 'in_progress': return 'bg-green-500 animate-pulse'
      case 'completed': return 'bg-gray-500'
      default: return 'bg-gray-500'
    }
  }

  const waitingPatients = queuePatients.filter(p => p.status === 'waiting')
  const inProgressPatients = queuePatients.filter(p => p.status === 'in_progress')
  const currentPatient = inProgressPatients[0]

  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 text-white p-8"
      onDoubleClick={requestFullscreen}
    >
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-5xl font-bold mb-2 tracking-wide">{facilityName}</h1>
        <p className="text-blue-200 text-2xl">Patient Queue Display</p>
      </div>

      {/* Date & Time */}
      <div className="text-center mb-8">
        <p className="text-blue-200 text-xl">{formatDate(liveTime)}</p>
        <p className="text-6xl font-mono font-bold mt-2 tracking-wider">{formatTime(liveTime)}</p>
      </div>

      {/* Stats */}
      <div className="flex justify-center gap-8 mb-8">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 text-yellow-400 mb-2">
            <Clock className="h-6 w-6" />
            <span className="text-lg">Waiting</span>
          </div>
          <p className="text-5xl font-bold">{waitingPatients.length}</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 text-green-400 mb-2">
            <Volume2 className="h-6 w-6" />
            <span className="text-lg">In Progress</span>
          </div>
          <p className="text-5xl font-bold">{inProgressPatients.length}</p>
        </div>
      </div>

      {/* Current Patient */}
      {currentPatient && (
        <div className="mb-8">
          <Card className="bg-gradient-to-r from-green-600 to-green-500 border-4 border-green-300 shadow-2xl">
            <CardContent className="p-8 text-center">
              <p className="text-green-100 text-xl mb-2">NOW SERVING</p>
              <p className="text-7xl font-bold mb-4">{currentPatient.queueNumber}</p>
              <p className="text-3xl">{currentPatient.patientName}</p>
              <div className="flex items-center justify-center gap-4 mt-4">
                <Badge className="bg-white/20 text-white text-lg px-4 py-2">
                  {currentPatient.department}
                </Badge>
                <div className={`w-4 h-4 rounded-full ${getPriorityColor(currentPatient.priority)}`}></div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Upcoming Queue */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {waitingPatients.slice(0, 6).map((patient, index) => (
          <Card 
            key={patient.id} 
            className={`${
              index === 0 ? 'bg-gradient-to-r from-yellow-600 to-yellow-500 border-2 border-yellow-300' : 'bg-white/10 border-white/20'
            }`}
          >
            <CardContent className="p-4 flex items-center gap-4">
              <div className="text-4xl font-bold">{patient.queueNumber}</div>
              <div className="flex-1">
                <p className="text-xl font-semibold">{patient.patientName}</p>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-white border-white/40">
                    {patient.department}
                  </Badge>
                  <div className={`w-3 h-3 rounded-full ${getPriorityColor(patient.priority)}`}></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* No patients message */}
      {queuePatients.length === 0 && (
        <div className="text-center py-20">
          <Users className="h-24 w-24 mx-auto mb-6 text-blue-300/50" />
          <p className="text-3xl text-blue-200">No patients in queue</p>
          <p className="text-blue-300/70 mt-2">Queue is empty</p>
        </div>
      )}

      {/* Footer */}
      <div className="fixed bottom-4 left-0 right-0 text-center">
        <p className="text-blue-300/50 text-sm flex items-center justify-center gap-2">
          <Monitor className="h-4 w-4" />
          Double-click anywhere for fullscreen mode
        </p>
      </div>
    </div>
  )
}
