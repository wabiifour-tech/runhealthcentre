'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Heart, Activity, Users, Calendar, Stethoscope, Shield, Clock, Phone, Mail, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    // Auto redirect to HMS after 3 seconds
    const timer = setTimeout(() => {
      router.push('/hms')
    }, 3000)
    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-emerald-100 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
                <Heart className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-lg text-gray-900 dark:text-white">RUN Health Centre</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">Redeemer's University</p>
              </div>
            </div>
            <Button 
              onClick={() => router.push('/hms')}
              className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
            >
              Access HMS
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Activity className="w-4 h-4" />
            Comprehensive Hospital Management System
          </div>
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
            Welcome to{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">
              RUN Health Centre
            </span>
          </h1>
          
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
            Providing quality healthcare services to the Redeemer's University community. 
            Our modern Hospital Management System ensures efficient patient care, 
            appointments, pharmacy services, and more.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 mb-12">
            <Button 
              size="lg"
              onClick={() => router.push('/hms')}
              className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg text-lg px-8"
            >
              <Stethoscope className="w-5 h-5 mr-2" />
              Enter Health Centre
            </Button>
          </div>

          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Redirecting automatically in 3 seconds...
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-white/50 dark:bg-slate-800/50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
            Our Services
          </h2>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Users, title: 'Patient Management', desc: 'Comprehensive patient records and history tracking' },
              { icon: Calendar, title: 'Appointments', desc: 'Easy scheduling and appointment management' },
              { icon: Stethoscope, title: 'Consultations', desc: 'Doctor consultations and medical records' },
              { icon: Shield, title: 'Pharmacy', desc: 'Medication dispensing and inventory' },
            ].map((feature, index) => (
              <Card key={index} className="bg-white dark:bg-slate-800 border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-6 text-center">
                  <div className="w-14 h-14 mx-auto mb-4 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
                    <feature.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{feature.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{feature.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 bg-gradient-to-r from-emerald-500 to-teal-600">
        <div className="max-w-6xl mx-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 text-center text-white">
            {[
              { number: '24/7', label: 'Emergency Services' },
              { number: '10+', label: 'Medical Staff' },
              { number: '5000+', label: 'Patients Served' },
              { number: '15+', label: 'Years of Service' },
            ].map((stat, index) => (
              <div key={index}>
                <div className="text-4xl font-bold mb-2">{stat.number}</div>
                <div className="text-emerald-100">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-8">
            Contact Us
          </h2>
          
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { icon: Phone, label: 'Phone', value: 'Emergency Line Available' },
              { icon: Mail, label: 'Email', value: 'healthcentre@run.edu.ng' },
              { icon: MapPin, label: 'Location', value: 'Redeemer\'s University, Ede' },
            ].map((contact, index) => (
              <Card key={index} className="bg-white dark:bg-slate-800 border-0 shadow-lg">
                <CardContent className="p-6 text-center">
                  <contact.icon className="w-8 h-8 mx-auto mb-3 text-emerald-600 dark:text-emerald-400" />
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">{contact.label}</div>
                  <div className="font-medium text-gray-900 dark:text-white">{contact.value}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 bg-slate-900 text-white">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
              <Heart className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold">RUN Health Centre</span>
          </div>
          <p className="text-slate-400 text-sm">
            © {new Date().getFullYear()} Redeemer's University Health Centre. All rights reserved.
          </p>
          <p className="text-slate-500 text-xs mt-2">
            Powered by Wabi The Tech Nurse
          </p>
        </div>
      </footer>
    </div>
  )
}
