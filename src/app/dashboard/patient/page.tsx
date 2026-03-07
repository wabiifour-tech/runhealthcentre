'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Video, Calendar, FileText, CreditCard, User, Bell, 
  Search, Clock, Star, LogOut, Menu,
  Activity, Heart, Brain, Eye, Baby, Bone, Building2, Copy, Check
} from 'lucide-react'

const specialties = [
  { name: 'General Medicine', icon: Activity },
  { name: 'Cardiology', icon: Heart },
  { name: 'Neurology', icon: Brain },
  { name: 'Pediatrics', icon: Baby },
  { name: 'Ophthalmology', icon: Eye },
  { name: 'Orthopedics', icon: Bone },
]

// Sample doctors data with bank details
const sampleDoctors = [
  {
    id: '1',
    name: 'Dr. Adebayo Johnson',
    specialty: 'General Medicine',
    rating: 4.9,
    reviews: 234,
    consultationFee: 5000,
    available: true,
    nextSlot: '10:30 AM',
    bankName: 'Guaranty Trust Bank (GTBank)',
    accountNumber: '0123456789',
    accountName: 'Adebayo Johnson',
  },
  {
    id: '2',
    name: 'Dr. Fatima Mohammed',
    specialty: 'Cardiology',
    rating: 4.8,
    reviews: 189,
    consultationFee: 7500,
    available: true,
    nextSlot: '11:00 AM',
    bankName: 'United Bank for Africa (UBA)',
    accountNumber: '0987654321',
    accountName: 'Fatima Mohammed',
  },
  {
    id: '3',
    name: 'Dr. Chinedu Okafor',
    specialty: 'Pediatrics',
    rating: 4.7,
    reviews: 156,
    consultationFee: 5000,
    available: false,
    nextSlot: '2:00 PM',
    bankName: 'Zenith Bank',
    accountNumber: '1122334455',
    accountName: 'Chinedu Okafor',
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
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const [appointments, setAppointments] = useState<any[]>([])
  const [prescriptions, setPrescriptions] = useState<any[]>([])
  const [bookingData, setBookingData] = useState({
    date: '',
    time: '',
    symptoms: '',
  })

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

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
    setCopied(field)
    setTimeout(() => setCopied(null), 2000)
  }

  const handleBookAppointment = () => {
    if (!bookingData.date || !bookingData.time) {
      alert('Please select date and time')
      return
    }
    setShowBookingModal(false)
    setShowPaymentModal(true)
  }

  const handleConfirmPayment = async () => {
    // In production, this would create the appointment and payment record
    try {
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctorId: selectedDoctor.id,
          scheduledAt: new Date(`${bookingData.date} ${bookingData.time}`),
          symptoms: bookingData.symptoms,
        }),
      })
      
      // For demo, just close modal and show success
      setShowPaymentModal(false)
      alert('Appointment booked! Please transfer to the doctor\'s account before your consultation.')
      setActiveTab('appointments')
    } catch (error) {
      console.error('Failed to book appointment')
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
                          <p className="text-lg font-bold text-green-600">₦{doctor.consultationFee.toLocaleString()}</p>
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
            </div>
          )}

          {activeTab === 'appointments' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-900">My Appointments</h2>
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
            </div>
          )}

          {activeTab === 'prescriptions' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-900">My Prescriptions</h2>
              <div className="bg-white rounded-xl p-8 text-center">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Prescriptions Yet</h3>
                <p className="text-gray-500">Your prescriptions will appear here after consultations</p>
              </div>
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full my-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Book Appointment</h2>
            
            {/* Doctor Info */}
            <div className="flex items-center gap-4 mb-6 p-4 bg-gray-50 rounded-xl">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center">
                <User className="w-7 h-7 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{selectedDoctor.name}</h3>
                <p className="text-sm text-gray-500">{selectedDoctor.specialty}</p>
                <p className="text-sm font-medium text-green-600">₦{selectedDoctor.consultationFee?.toLocaleString()} / session</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Date</label>
                <input
                  type="date"
                  value={bookingData.date}
                  onChange={(e) => setBookingData({ ...bookingData, date: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Time</label>
                <select 
                  value={bookingData.time}
                  onChange={(e) => setBookingData({ ...bookingData, time: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Choose a time</option>
                  <option>9:00 AM</option>
                  <option>10:00 AM</option>
                  <option>11:00 AM</option>
                  <option>12:00 PM</option>
                  <option>2:00 PM</option>
                  <option>3:00 PM</option>
                  <option>4:00 PM</option>
                  <option>5:00 PM</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Describe your symptoms</label>
                <textarea
                  rows={3}
                  value={bookingData.symptoms}
                  onChange={(e) => setBookingData({ ...bookingData, symptoms: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500"
                  placeholder="Brief description of your symptoms..."
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowBookingModal(false)}
                  className="flex-1 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBookAppointment}
                  className="flex-1 bg-green-600 text-white py-3 rounded-xl hover:bg-green-700 transition font-medium"
                >
                  Continue to Payment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal with Bank Details */}
      {showPaymentModal && selectedDoctor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full my-8">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Payment Details</h2>
            <p className="text-gray-500 text-sm mb-6">
              Transfer the consultation fee to the doctor&apos;s account below
            </p>

            {/* Amount to Pay */}
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 text-center">
              <p className="text-sm text-gray-600 mb-1">Amount to Pay</p>
              <p className="text-3xl font-bold text-green-600">₦{selectedDoctor.consultationFee?.toLocaleString()}</p>
            </div>

            {/* Doctor's Bank Details */}
            <div className="space-y-3 mb-6">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-green-600" />
                Doctor&apos;s Bank Account
              </h3>
              
              {/* Bank Name */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-xs text-gray-500">Bank Name</p>
                  <p className="font-medium text-gray-900">{selectedDoctor.bankName}</p>
                </div>
              </div>

              {/* Account Number */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-xs text-gray-500">Account Number</p>
                  <p className="font-medium text-gray-900 font-mono">{selectedDoctor.accountNumber}</p>
                </div>
                <button
                  onClick={() => copyToClipboard(selectedDoctor.accountNumber, 'account')}
                  className="p-2 hover:bg-gray-200 rounded-lg transition"
                >
                  {copied === 'account' ? (
                    <Check className="w-5 h-5 text-green-600" />
                  ) : (
                    <Copy className="w-5 h-5 text-gray-500" />
                  )}
                </button>
              </div>

              {/* Account Name */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-xs text-gray-500">Account Name</p>
                  <p className="font-medium text-gray-900">{selectedDoctor.accountName}</p>
                </div>
                <button
                  onClick={() => copyToClipboard(selectedDoctor.accountName, 'name')}
                  className="p-2 hover:bg-gray-200 rounded-lg transition"
                >
                  {copied === 'name' ? (
                    <Check className="w-5 h-5 text-green-600" />
                  ) : (
                    <Copy className="w-5 h-5 text-gray-500" />
                  )}
                </button>
              </div>
            </div>

            {/* Payment Instructions */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
              <p className="text-sm text-yellow-800">
                <strong>Important:</strong> Make the transfer and keep your receipt/receipt number. 
                The doctor will confirm your payment before the consultation.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowPaymentModal(false)
                  setShowBookingModal(true)
                }}
                className="flex-1 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition font-medium"
              >
                Back
              </button>
              <button
                onClick={handleConfirmPayment}
                className="flex-1 bg-green-600 text-white py-3 rounded-xl hover:bg-green-700 transition font-medium"
              >
                I&apos;ve Made the Transfer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
