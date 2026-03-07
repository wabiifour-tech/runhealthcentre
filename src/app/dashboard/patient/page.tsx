'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Video, Calendar, FileText, CreditCard, User, Bell, 
  Search, Clock, Star, ChevronRight, LogOut, Menu, X,
  Activity, Heart, Brain, Eye, Baby, Bone
} from 'lucide-react'

const specialties = [
  { name: 'General Medicine', icon: Activity },
  { name: 'Cardiology', icon: Heart },
  { name: 'Neurology', icon: Brain },
  { name: 'Pediatrics', icon: Baby },
  { name: 'Ophthalmology', icon: Eye },
  { name: 'Orthopedics', icon: Bone },
]

// Sample doctors data
const sampleDoctors = [
  {
    id: '1',
    name: 'Dr. Adebayo Johnson',
    specialty: 'General Medicine',
    rating: 4.9,
    reviews: 234,
    fee: 5000,
    available: true,
    nextSlot: '10:30 AM',
  },
  {
    id: '2',
    name: 'Dr. Fatima Mohammed',
    specialty: 'Cardiology',
    rating: 4.8,
    reviews: 189,
    fee: 7500,
    available: true,
    nextSlot: '11:00 AM',
  },
  {
    id: '3',
    name: 'Dr. Chinedu Okafor',
    specialty: 'Pediatrics',
    rating: 4.7,
    reviews: 156,
    fee: 5000,
    available: false,
    nextSlot: '2:00 PM',
  },
]

export default function PatientDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('home')
  const [selectedSpecialty, setSelectedSpecialty] = useState('')
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null)
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [appointments, setAppointments] = useState<any[]>([])
  const [prescriptions, setPrescriptions] = useState<any[]>([])

  useEffect(() => {
    fetchUser()
    fetchAppointments()
    fetchPrescriptions()
  }, [])

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
    } finally {
      setLoading(false)
    }
  }

  const fetchAppointments = async () => {
    try {
      const response = await fetch('/api/appointments?upcoming=true')
      const data = await response.json()
      if (data.success) {
        setAppointments(data.appointments)
      }
    } catch (error) {
      console.error('Failed to fetch appointments')
    }
  }

  const fetchPrescriptions = async () => {
    try {
      const response = await fetch('/api/prescriptions')
      const data = await response.json()
      if (data.success) {
        setPrescriptions(data.prescriptions)
      }
    } catch (error) {
      console.error('Failed to fetch prescriptions')
    }
  }

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/')
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
            <Activity className="w-5 h-5" />
            Home
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
            onClick={() => setActiveTab('prescriptions')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${
              activeTab === 'prescriptions' ? 'bg-green-50 text-green-600' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <FileText className="w-5 h-5" />
            Prescriptions
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${
              activeTab === 'payments' ? 'bg-green-50 text-green-600' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <CreditCard className="w-5 h-5" />
            Payments
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
              <div className="hidden sm:block">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search doctors, specialties..."
                    className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl w-64 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>
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
                  <p className="font-medium text-gray-900">{user?.name || 'Patient'}</p>
                  <p className="text-sm text-gray-500">Patient</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-4 lg:p-8">
          {activeTab === 'home' && (
            <div className="space-y-8">
              {/* Welcome Section */}
              <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl p-6 text-white">
                <h1 className="text-2xl font-bold mb-2">
                  Welcome back, {user?.name?.split(' ')[0] || 'there'}!
                </h1>
                <p className="text-green-100">
                  Your health is our priority. Book a consultation with a doctor today.
                </p>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { icon: Video, label: 'Video Call', color: 'bg-blue-100 text-blue-600' },
                  { icon: Calendar, label: 'Book Appointment', color: 'bg-green-100 text-green-600' },
                  { icon: FileText, label: 'My Records', color: 'bg-purple-100 text-purple-600' },
                  { icon: CreditCard, label: 'Payments', color: 'bg-orange-100 text-orange-600' },
                ].map((action, index) => (
                  <button
                    key={index}
                    className="bg-white rounded-xl p-4 text-center hover:shadow-lg transition"
                  >
                    <div className={`w-12 h-12 ${action.color} rounded-xl flex items-center justify-center mx-auto mb-3`}>
                      <action.icon className="w-6 h-6" />
                    </div>
                    <span className="font-medium text-gray-900">{action.label}</span>
                  </button>
                ))}
              </div>

              {/* Specialty Selection */}
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Find a Doctor by Specialty</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
                  {specialties.map((specialty, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setSelectedSpecialty(specialty.name)
                        setActiveTab('appointments')
                      }}
                      className="bg-white rounded-xl p-4 text-center hover:shadow-lg transition group"
                    >
                      <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-2 group-hover:bg-green-600 transition">
                        <specialty.icon className="w-6 h-6 text-green-600 group-hover:text-white transition" />
                      </div>
                      <span className="text-sm font-medium text-gray-900">{specialty.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Available Doctors */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900">Available Doctors</h2>
                  <button className="text-green-600 font-medium hover:underline">View All</button>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {sampleDoctors.map((doctor) => (
                    <div key={doctor.id} className="bg-white rounded-xl p-4 hover:shadow-lg transition">
                      <div className="flex items-start gap-4">
                        <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center">
                          <User className="w-7 h-7 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{doctor.name}</h3>
                          <p className="text-sm text-gray-500">{doctor.specialty}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Star className="w-4 h-4 text-yellow-400 fill-current" />
                            <span className="text-sm font-medium">{doctor.rating}</span>
                            <span className="text-sm text-gray-400">({doctor.reviews} reviews)</span>
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 flex items-center justify-between">
                        <div>
                          <p className="text-lg font-bold text-green-600">₦{doctor.fee.toLocaleString()}</p>
                          <p className="text-sm text-gray-500">per consultation</p>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedDoctor(doctor)
                            setShowBookingModal(true)
                          }}
                          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
                        >
                          Book Now
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Upcoming Appointments */}
              {appointments.length > 0 && (
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Upcoming Appointments</h2>
                  <div className="bg-white rounded-xl divide-y">
                    {appointments.slice(0, 3).map((appointment) => (
                      <div key={appointment.id} className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                            <User className="w-6 h-6 text-green-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              Dr. {appointment.doctor?.user?.name || 'Doctor'}
                            </p>
                            <p className="text-sm text-gray-500">
                              {new Date(appointment.scheduledAt).toLocaleDateString()} at{' '}
                              {new Date(appointment.scheduledAt).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                        <Link
                          href={`/consultation/${appointment.id}`}
                          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition flex items-center gap-2"
                        >
                          <Video className="w-4 h-4" />
                          Join
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'appointments' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-900">My Appointments</h2>
              
              {appointments.length === 0 ? (
                <div className="bg-white rounded-xl p-8 text-center">
                  <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Appointments Yet</h3>
                  <p className="text-gray-500 mb-4">Book your first consultation with a doctor</p>
                  <button
                    onClick={() => setActiveTab('home')}
                    className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition"
                  >
                    Find a Doctor
                  </button>
                </div>
              ) : (
                <div className="bg-white rounded-xl divide-y">
                  {appointments.map((appointment) => (
                    <div key={appointment.id} className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium text-gray-900">
                          Dr. {appointment.doctor?.user?.name || 'Doctor'}
                        </h3>
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
                      <p className="text-sm text-gray-500">{appointment.type} consultation</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'prescriptions' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-900">My Prescriptions</h2>
              
              {prescriptions.length === 0 ? (
                <div className="bg-white rounded-xl p-8 text-center">
                  <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Prescriptions Yet</h3>
                  <p className="text-gray-500">Your prescriptions will appear here after consultations</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {prescriptions.map((prescription) => (
                    <div key={prescription.id} className="bg-white rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium text-gray-900">{prescription.diagnosis}</h3>
                        <span className="text-sm text-gray-500">
                          {new Date(prescription.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mb-3">
                        Dr. {prescription.doctor?.user?.name || 'Doctor'}
                      </p>
                      <button className="text-green-600 font-medium hover:underline">
                        View Full Prescription →
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'payments' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-900">Payment History</h2>
              <div className="bg-white rounded-xl p-8 text-center">
                <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Payments Yet</h3>
                <p className="text-gray-500">Your payment history will appear here</p>
              </div>
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-900">My Profile</h2>
              <div className="bg-white rounded-xl p-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                    <User className="w-10 h-10 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">{user?.name}</h3>
                    <p className="text-gray-500">{user?.email}</p>
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
                  <button className="bg-green-600 text-white py-2 rounded-xl hover:bg-green-700 transition">
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Booking Modal */}
      {showBookingModal && selectedDoctor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Book Appointment</h2>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center">
                <User className="w-7 h-7 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{selectedDoctor.name}</h3>
                <p className="text-sm text-gray-500">{selectedDoctor.specialty}</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Date</label>
                <input
                  type="date"
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Time</label>
                <select className="w-full px-4 py-2 border border-gray-200 rounded-xl">
                  <option>9:00 AM</option>
                  <option>10:00 AM</option>
                  <option>11:00 AM</option>
                  <option>12:00 PM</option>
                  <option>2:00 PM</option>
                  <option>3:00 PM</option>
                  <option>4:00 PM</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Describe your symptoms</label>
                <textarea
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl"
                  placeholder="Brief description of your symptoms..."
                />
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Consultation Fee</span>
                  <span className="text-xl font-bold text-green-600">
                    ₦{selectedDoctor.fee.toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowBookingModal(false)}
                  className="flex-1 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    // Handle booking
                    setShowBookingModal(false)
                  }}
                  className="flex-1 bg-green-600 text-white py-2 rounded-xl hover:bg-green-700 transition"
                >
                  Proceed to Payment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
