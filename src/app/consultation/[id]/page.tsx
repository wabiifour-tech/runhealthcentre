'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { 
  Video, VideoOff, Mic, MicOff, Phone, MessageSquare,
  Clock, User, FileText, Send, LogOut, ChevronLeft
} from 'lucide-react'

export default function ConsultationPage() {
  const router = useRouter()
  const params = useParams()
  const consultationId = params.id as string
  
  const [user, setUser] = useState<any>(null)
  const [appointment, setAppointment] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isVideoOn, setIsVideoOn] = useState(true)
  const [isAudioOn, setIsAudioOn] = useState(true)
  const [consultationTime, setConsultationTime] = useState(0)
  const [showChat, setShowChat] = useState(false)
  const [showPrescription, setShowPrescription] = useState(false)
  const [chatMessages, setChatMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Prescription form state
  const [prescription, setPrescription] = useState({
    diagnosis: '',
    medications: [{ name: '', dosage: '', frequency: '', duration: '' }],
    advice: '',
    followUpDate: '',
  })

  useEffect(() => {
    fetchUser()
    fetchAppointment()
    startTimer()
    
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [consultationId])

  const fetchUser = async () => {
    try {
      const response = await fetch('/api/auth/me')
      const data = await response.json()
      if (data.success) {
        setUser(data.user)
      } else {
        router.push('/auth/login')
      }
    } catch (error) {
      router.push('/auth/login')
    }
  }

  const fetchAppointment = async () => {
    try {
      // In production, fetch from API
      // For demo, use sample data
      setAppointment({
        id: consultationId,
        patient: { name: 'Adebayo Okonkwo', phone: '+234 800 123 4567' },
        doctor: { name: 'Dr. Fatima Mohammed', specialty: 'General Medicine' },
        scheduledAt: new Date(),
        symptoms: 'Headache and fever for 3 days',
        status: 'in-progress',
      })
    } catch (error) {
      console.error('Failed to fetch appointment')
    } finally {
      setLoading(false)
    }
  }

  const startTimer = () => {
    timerRef.current = setInterval(() => {
      setConsultationTime(prev => prev + 1)
    }, 1000)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleEndConsultation = async () => {
    if (timerRef.current) clearInterval(timerRef.current)
    
    // Update appointment status
    try {
      await fetch('/api/appointments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointmentId: consultationId,
          status: 'completed',
        }),
      })
    } catch (error) {
      console.error('Failed to update appointment')
    }
    
    // Redirect based on role
    if (user?.role === 'doctor') {
      router.push('/dashboard/doctor')
    } else {
      router.push('/dashboard/patient')
    }
  }

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      setChatMessages([
        ...chatMessages,
        {
          id: Date.now(),
          sender: user?.name || 'You',
          message: newMessage,
          time: new Date().toLocaleTimeString(),
        },
      ])
      setNewMessage('')
    }
  }

  const handleAddMedication = () => {
    setPrescription({
      ...prescription,
      medications: [
        ...prescription.medications,
        { name: '', dosage: '', frequency: '', duration: '' },
      ],
    })
  }

  const handleMedicationChange = (index: number, field: string, value: string) => {
    const updated = [...prescription.medications]
    updated[index] = { ...updated[index], [field]: value }
    setPrescription({ ...prescription, medications: updated })
  }

  const handleSubmitPrescription = async () => {
    try {
      await fetch('/api/prescriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointmentId: consultationId,
          diagnosis: prescription.diagnosis,
          medications: prescription.medications,
          advice: prescription.advice,
          followUpDate: prescription.followUpDate,
        }),
      })
      setShowPrescription(false)
      alert('Prescription sent successfully!')
    } catch (error) {
      console.error('Failed to create prescription')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white">Connecting...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <header className="bg-gray-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={handleEndConsultation}
            className="text-gray-400 hover:text-white transition"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-white font-medium">
              {user?.role === 'doctor' ? appointment?.patient?.name : appointment?.doctor?.name}
            </h1>
            <p className="text-sm text-gray-400">
              {user?.role === 'doctor' ? 'Patient' : appointment?.doctor?.specialty}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-white">
            <Clock className="w-5 h-5 text-green-500" />
            <span className="font-mono text-lg">{formatTime(consultationTime)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-green-500 text-sm">Recording</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Video Area */}
        <div className="flex-1 relative">
          {/* Main Video (Remote) */}
          <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
            <div className="text-center text-white">
              <div className="w-32 h-32 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="w-16 h-16 text-gray-500" />
              </div>
              <p className="text-xl font-medium">
                {user?.role === 'doctor' ? appointment?.patient?.name : appointment?.doctor?.name}
              </p>
              <p className="text-gray-400 mt-1">
                {isVideoOn ? 'Video connected' : 'Video off'}
              </p>
            </div>
          </div>

          {/* Self Video (Picture-in-Picture) */}
          <div className="absolute bottom-4 right-4 w-48 h-36 bg-gray-800 rounded-xl overflow-hidden border-2 border-gray-600">
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-green-900 to-green-800">
              {isVideoOn ? (
                <div className="text-white text-center">
                  <User className="w-12 h-12 mx-auto mb-2" />
                  <p className="text-sm">You</p>
                </div>
              ) : (
                <VideoOff className="w-8 h-8 text-gray-400" />
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3">
            <button
              onClick={() => setIsAudioOn(!isAudioOn)}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition ${
                isAudioOn ? 'bg-gray-700 text-white' : 'bg-red-500 text-white'
              }`}
            >
              {isAudioOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
            </button>
            <button
              onClick={() => setIsVideoOn(!isVideoOn)}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition ${
                isVideoOn ? 'bg-gray-700 text-white' : 'bg-red-500 text-white'
              }`}
            >
              {isVideoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
            </button>
            <button
              onClick={() => setShowChat(!showChat)}
              className="w-12 h-12 bg-gray-700 text-white rounded-full flex items-center justify-center"
            >
              <MessageSquare className="w-5 h-5" />
            </button>
            {user?.role === 'doctor' && (
              <button
                onClick={() => setShowPrescription(true)}
                className="w-12 h-12 bg-green-600 text-white rounded-full flex items-center justify-center"
              >
                <FileText className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={handleEndConsultation}
              className="w-14 h-14 bg-red-500 text-white rounded-full flex items-center justify-center"
            >
              <Phone className="w-5 h-5 rotate-[135deg]" />
            </button>
          </div>
        </div>

        {/* Chat Panel */}
        {showChat && (
          <div className="w-80 bg-gray-800 flex flex-col">
            <div className="p-4 border-b border-gray-700">
              <h2 className="text-white font-medium">Chat</h2>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {chatMessages.length === 0 ? (
                <p className="text-gray-400 text-center text-sm">
                  No messages yet. Start the conversation!
                </p>
              ) : (
                chatMessages.map((msg) => (
                  <div key={msg.id} className="bg-gray-700 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-white text-sm font-medium">{msg.sender}</span>
                      <span className="text-gray-400 text-xs">{msg.time}</span>
                    </div>
                    <p className="text-gray-300 text-sm">{msg.message}</p>
                  </div>
                ))
              )}
            </div>
            <div className="p-4 border-t border-gray-700">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 bg-gray-700 text-white px-3 py-2 rounded-lg text-sm"
                />
                <button
                  onClick={handleSendMessage}
                  className="bg-green-600 text-white p-2 rounded-lg"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Prescription Modal (Doctor Only) */}
      {showPrescription && user?.role === 'doctor' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full my-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Create Prescription</h2>
              <button
                onClick={() => setShowPrescription(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Diagnosis
                </label>
                <input
                  type="text"
                  value={prescription.diagnosis}
                  onChange={(e) => setPrescription({ ...prescription, diagnosis: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl"
                  placeholder="e.g., Malaria, Common Cold, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Medications
                </label>
                <div className="space-y-3">
                  {prescription.medications.map((med, index) => (
                    <div key={index} className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      <input
                        type="text"
                        value={med.name}
                        onChange={(e) => handleMedicationChange(index, 'name', e.target.value)}
                        className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
                        placeholder="Medicine name"
                      />
                      <input
                        type="text"
                        value={med.dosage}
                        onChange={(e) => handleMedicationChange(index, 'dosage', e.target.value)}
                        className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
                        placeholder="Dosage"
                      />
                      <input
                        type="text"
                        value={med.frequency}
                        onChange={(e) => handleMedicationChange(index, 'frequency', e.target.value)}
                        className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
                        placeholder="Frequency"
                      />
                      <input
                        type="text"
                        value={med.duration}
                        onChange={(e) => handleMedicationChange(index, 'duration', e.target.value)}
                        className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
                        placeholder="Duration"
                      />
                    </div>
                  ))}
                </div>
                <button
                  onClick={handleAddMedication}
                  className="mt-2 text-green-600 text-sm font-medium hover:underline"
                >
                  + Add another medication
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Additional Advice
                </label>
                <textarea
                  rows={3}
                  value={prescription.advice}
                  onChange={(e) => setPrescription({ ...prescription, advice: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl"
                  placeholder="Diet recommendations, lifestyle changes, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Follow-up Date
                </label>
                <input
                  type="date"
                  value={prescription.followUpDate}
                  onChange={(e) => setPrescription({ ...prescription, followUpDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowPrescription(false)}
                  className="flex-1 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitPrescription}
                  className="flex-1 bg-green-600 text-white py-2 rounded-xl hover:bg-green-700 transition"
                >
                  Send Prescription
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
