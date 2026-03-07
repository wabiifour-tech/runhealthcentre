'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Video, Calendar, FileText, Users, User, Bell, 
  Clock, Star, LogOut, Menu, X, CheckCircle,
  DollarSign, TrendingUp, MessageSquare
} from 'lucide-react'

export default function DoctorDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('home')
  const [appointments, setAppointments] = useState<any[]>([])
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null)

  // Sample appointments for demo
  const sampleAppointments = [
    {
      id: '1',
      patient: { name: 'Adebayo Okonkwo', phone: '+234 800 123 4567' },
      scheduledAt: new Date(Date.now() + 3600000),
      type: 'video',
      status: 'scheduled',
      symptoms: 'Headache and fever for 3 days',
    },
    {
      id: '2',
      patient: { name: 'Fatima Ibrahim', phone: '+234 802 987 6543' },
      scheduledAt: new Date(Date.now() + 7200000),
      type: 'video',
      status: 'scheduled',
      symptoms: 'Stomach pain after eating',
    },
    {
      id: '3',
      patient: { name: 'Chinedu Eze', phone: '+234 803 111 2222' },
      scheduledAt: new Date(Date.now() - 3600000),
      type: 'video',
      status: 'completed',
      symptoms: 'Back pain',
    },
  ]

  useEffect(() => {
    fetchUser()
    fetchAppointments()
  }, [])

  const fetchUser = async () => {
    try {
      const response = await fetch('/api/auth/me')
      const data = await response.json()
      if (data.success && data.user.role === 'doctor') {
        setUser(data.user)
      } else {
        router.push('/auth/login')
      }
    } catch (error) {
      router.push('/auth/login')
    } finally {
      setLoading(false)
    }
  }

  const fetchAppointments = async () => {
    try {
      const response = await fetch('/api/appointments')
      const data = await response.json()
      if (data.success) {
        setAppointments(data.appointments)
      } else {
        // Use sample data for demo
        setAppointments(sampleAppointments)
      }
    } catch (error) {
      // Use sample data for demo
      setAppointments(sampleAppointments)
    }
  }

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/')
  }

  const handleCreatePrescription = async (prescriptionData: any) => {
    try {
      const response = await fetch('/api/prescriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prescriptionData),
      })
      const data = await response.json()
      if (data.success) {
        setShowPrescriptionModal(false)
        // Refresh appointments
        fetchAppointments()
      }
    } catch (error) {
      console.error('Failed to create prescription')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  const upcomingAppointments = appointments.filter(a => a.status === 'scheduled')
  const completedAppointments = appointments.filter(a => a.status === 'completed')

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 h-full w-64 bg-white shadow-lg z-50 transform transition-transform lg:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="p-4 border-b">
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo.jpg" alt="TeleHealth Nigeria" className="h-8 w-auto rounded" />
            <span className="font-bold text-green-700">TeleHealth</span>
          </Link>
        </div>

        <nav className="p-4 space-y-2">
          <button
            onClick={() => setActiveTab('home')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${
              activeTab === 'home' ? 'bg-green-50 text-green-600' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <TrendingUp className="w-5 h-5" />
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('appointments')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${
              activeTab === 'appointments' ? 'bg-green-50 text-green-600' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Calendar className="w-5 h-5" />
            Appointments
          </button>
          <button
            onClick={() => setActiveTab('consultations')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${
              activeTab === 'consultations' ? 'bg-green-50 text-green-600' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Video className="w-5 h-5" />
            Consultations
          </button>
          <button
            onClick={() => setActiveTab('prescriptions')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${
              activeTab === 'prescriptions' ? 'bg-green-50 text-green-600' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <FileText className="w-5 h-5" />
            Prescriptions
          </button>
          <button
            onClick={() => setActiveTab('patients')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${
              activeTab === 'patients' ? 'bg-green-50 text-green-600' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Users className="w-5 h-5" />
            Patients
          </button>
          <button
            onClick={() => setActiveTab('earnings')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${
              activeTab === 'earnings' ? 'bg-green-50 text-green-600' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <DollarSign className="w-5 h-5" />
            Earnings
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${
              activeTab === 'profile' ? 'bg-green-50 text-green-600' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <User className="w-5 h-5" />
            Profile
          </button>
        </nav>

        <div className="absolute bottom-4 left-4 right-4">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-64">
        {/* Header */}
        <header className="bg-white shadow-sm sticky top-0 z-30">
          <div className="flex items-center justify-between px-4 lg:px-8 py-4">
            <div className="flex items-center gap-4">
              <button
                className="lg:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="w-6 h-6" />
              </button>
              <h1 className="text-xl font-bold text-gray-900">
                {activeTab === 'home' ? 'Dashboard' : 
                 activeTab === 'appointments' ? 'Appointments' :
                 activeTab === 'consultations' ? 'Consultations' :
                 activeTab === 'prescriptions' ? 'Prescriptions' :
                 activeTab === 'patients' ? 'Patients' :
                 activeTab === 'earnings' ? 'Earnings' : 'Profile'}
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <button className="relative p-2 hover:bg-gray-50 rounded-full">
                <Bell className="w-6 h-6 text-gray-600" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-green-600" />
                </div>
                <div className="hidden sm:block">
                  <p className="font-medium text-gray-900">{user?.name || 'Doctor'}</p>
                  <p className="text-sm text-gray-500">{user?.doctor?.specialty || 'Doctor'}</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-4 lg:p-8">
          {activeTab === 'home' && (
            <div className="space-y-8">
              {/* Stats Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Today\'s Appointments', value: upcomingAppointments.length, icon: Calendar, color: 'bg-blue-100 text-blue-600' },
                  { label: 'Completed Today', value: completedAppointments.length, icon: CheckCircle, color: 'bg-green-100 text-green-600' },
                  { label: 'Total Patients', value: 156, icon: Users, color: 'bg-purple-100 text-purple-600' },
                  { label: 'This Month Earnings', value: '₦245,000', icon: DollarSign, color: 'bg-orange-100 text-orange-600' },
                ].map((stat, index) => (
                  <div key={index} className="bg-white rounded-xl p-4">
                    <div className={`w-10 h-10 ${stat.color} rounded-lg flex items-center justify-center mb-3`}>
                      <stat.icon className="w-5 h-5" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    <p className="text-sm text-gray-500">{stat.label}</p>
                  </div>
                ))}
              </div>

              {/* Upcoming Appointments */}
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-4">Upcoming Appointments</h2>
                <div className="bg-white rounded-xl divide-y">
                  {upcomingAppointments.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      No upcoming appointments
                    </div>
                  ) : (
                    upcomingAppointments.map((appointment) => (
                      <div key={appointment.id} className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                            <User className="w-6 h-6 text-green-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{appointment.patient?.name}</p>
                            <p className="text-sm text-gray-500">
                              {new Date(appointment.scheduledAt).toLocaleTimeString()} • {appointment.type}
                            </p>
                            <p className="text-sm text-gray-400">{appointment.symptoms}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => router.push(`/consultation/${appointment.id}`)}
                            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition flex items-center gap-2"
                          >
                            <Video className="w-4 h-4" />
                            Start
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="grid md:grid-cols-3 gap-4">
                <button
                  onClick={() => setActiveTab('appointments')}
                  className="bg-white rounded-xl p-6 text-left hover:shadow-lg transition"
                >
                  <Calendar className="w-8 h-8 text-green-600 mb-4" />
                  <h3 className="font-semibold text-gray-900 mb-1">Manage Schedule</h3>
                  <p className="text-sm text-gray-500">Set your availability and working hours</p>
                </button>
                <button
                  onClick={() => setActiveTab('patients')}
                  className="bg-white rounded-xl p-6 text-left hover:shadow-lg transition"
                >
                  <Users className="w-8 h-8 text-blue-600 mb-4" />
                  <h3 className="font-semibold text-gray-900 mb-1">Patient Records</h3>
                  <p className="text-sm text-gray-500">View and manage patient history</p>
                </button>
                <button
                  onClick={() => setActiveTab('earnings')}
                  className="bg-white rounded-xl p-6 text-left hover:shadow-lg transition"
                >
                  <DollarSign className="w-8 h-8 text-orange-600 mb-4" />
                  <h3 className="font-semibold text-gray-900 mb-1">Earnings Report</h3>
                  <p className="text-sm text-gray-500">View your earnings and payouts</p>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'appointments' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900">All Appointments</h2>
                <select className="px-4 py-2 border border-gray-200 rounded-xl">
                  <option>All</option>
                  <option>Upcoming</option>
                  <option>Completed</option>
                  <option>Cancelled</option>
                </select>
              </div>
              
              <div className="bg-white rounded-xl divide-y">
                {appointments.map((appointment) => (
                  <div key={appointment.id} className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-gray-900">{appointment.patient?.name}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        appointment.status === 'scheduled' ? 'bg-blue-100 text-blue-600' :
                        appointment.status === 'completed' ? 'bg-green-100 text-green-600' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {appointment.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">
                      {new Date(appointment.scheduledAt).toLocaleDateString()} at{' '}
                      {new Date(appointment.scheduledAt).toLocaleTimeString()}
                    </p>
                    <p className="text-sm text-gray-400 mt-1">{appointment.symptoms}</p>
                    {appointment.status === 'scheduled' && (
                      <div className="mt-3 flex gap-2">
                        <button
                          onClick={() => router.push(`/consultation/${appointment.id}`)}
                          className="bg-green-600 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-green-700 transition"
                        >
                          Start Consultation
                        </button>
                        <button className="border border-gray-200 px-4 py-1.5 rounded-lg text-sm hover:bg-gray-50 transition">
                          Reschedule
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'consultations' && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold text-gray-900">Active Consultations</h2>
              <div className="bg-white rounded-xl p-8 text-center">
                <Video className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Consultations</h3>
                <p className="text-gray-500">Start a consultation from your appointments</p>
              </div>
            </div>
          )}

          {activeTab === 'prescriptions' && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold text-gray-900">Prescriptions Issued</h2>
              <div className="bg-white rounded-xl p-8 text-center">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Prescriptions Yet</h3>
                <p className="text-gray-500">Prescriptions will appear here after consultations</p>
              </div>
            </div>
          )}

          {activeTab === 'patients' && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold text-gray-900">Patient Records</h2>
              <div className="bg-white rounded-xl p-8 text-center">
                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Patient Records</h3>
                <p className="text-gray-500">Your patient history will appear here</p>
              </div>
            </div>
          )}

          {activeTab === 'earnings' && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold text-gray-900">Earnings Overview</h2>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl p-6">
                  <p className="text-sm text-gray-500 mb-1">This Month</p>
                  <p className="text-3xl font-bold text-green-600">₦245,000</p>
                </div>
                <div className="bg-white rounded-xl p-6">
                  <p className="text-sm text-gray-500 mb-1">Last Month</p>
                  <p className="text-3xl font-bold text-gray-900">₦198,500</p>
                </div>
                <div className="bg-white rounded-xl p-6">
                  <p className="text-sm text-gray-500 mb-1">Total Earned</p>
                  <p className="text-3xl font-bold text-gray-900">₦2.4M</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold text-gray-900">Doctor Profile</h2>
              <div className="bg-white rounded-xl p-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                    <User className="w-10 h-10 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">{user?.name}</h3>
                    <p className="text-gray-500">{user?.doctor?.specialty || 'Doctor'}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className="text-sm font-medium">4.9</span>
                      <span className="text-sm text-gray-400">(234 reviews)</span>
                    </div>
                  </div>
                </div>
                <div className="grid gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <input
                      type="text"
                      defaultValue={user?.name}
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      defaultValue={user?.email}
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input
                      type="tel"
                      defaultValue={user?.phone}
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Consultation Fee (₦)</label>
                    <input
                      type="number"
                      defaultValue={user?.doctor?.consultationFee || 5000}
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                    <textarea
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl"
                      placeholder="Tell patients about yourself..."
                    />
                  </div>
                  <button className="bg-green-600 text-white py-2 rounded-xl hover:bg-green-700 transition">
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
