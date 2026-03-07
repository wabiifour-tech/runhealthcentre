'use client'

import { useState, useEffect } from 'react'
import { 
  Video, Shield, Clock, CreditCard, CheckCircle, Star, 
  Phone, Mail, MapPin, Menu, X, ArrowRight, User, 
  Stethoscope, Heart, Brain, Eye, Baby, Bone, Activity
} from 'lucide-react'
import Link from 'next/link'

// Medical specialties
const specialties = [
  { name: 'General Medicine', icon: Activity, doctors: 45 },
  { name: 'Cardiology', icon: Heart, doctors: 12 },
  { name: 'Neurology', icon: Brain, doctors: 8 },
  { name: 'Pediatrics', icon: Baby, doctors: 23 },
  { name: 'Ophthalmology', icon: Eye, doctors: 15 },
  { name: 'Orthopedics', icon: Bone, doctors: 18 },
]

// Testimonials
const testimonials = [
  {
    name: 'Adebayo Okonkwo',
    role: 'Patient, Lagos',
    content: 'TeleHealth Nigeria saved me hours of waiting at the hospital. The video consultation was crystal clear and the doctor was very professional.',
    rating: 5,
  },
  {
    name: 'Dr. Fatima Mohammed',
    role: 'Cardiologist, Abuja',
    content: 'As a doctor, this platform has expanded my reach. I can now consult with patients across Nigeria without them traveling long distances.',
    rating: 5,
  },
  {
    name: 'Chidinma Eze',
    role: 'Mother of 3, Port Harcourt',
    content: 'When my child fell sick at midnight, I could immediately video call a pediatrician. The prescription was sent to my phone within minutes.',
    rating: 5,
  },
]

// Pricing plans
const plans = [
  {
    name: 'Basic',
    price: '₦2,000',
    duration: 'per consultation',
    features: [
      '30-minute video consultation',
      'Digital prescription',
      'Email support',
      'Basic health advice',
    ],
    popular: false,
  },
  {
    name: 'Standard',
    price: '₦5,000',
    duration: 'per consultation',
    features: [
      '45-minute video consultation',
      'Digital prescription',
      'Lab test recommendations',
      'Follow-up message',
      'Priority support',
    ],
    popular: true,
  },
  {
    name: 'Premium',
    price: '₦10,000',
    duration: 'per consultation',
    features: [
      '60-minute video consultation',
      'Digital prescription',
      'Lab test recommendations',
      'Follow-up calls',
      'Health report',
      '24/7 support',
    ],
    popular: false,
  },
]

export default function TeleHealthNigeria() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white shadow-lg' : 'bg-white/80 backdrop-blur-md'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <img src="/logo.jpg" alt="TeleHealth Nigeria" className="h-10 w-auto rounded" />
              <span className="text-xl font-bold text-green-700">TeleHealth Nigeria</span>
            </Link>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-gray-700 hover:text-green-600 transition">Features</a>
              <a href="#specialties" className="text-gray-700 hover:text-green-600 transition">Specialties</a>
              <a href="#how-it-works" className="text-gray-700 hover:text-green-600 transition">How It Works</a>
              <a href="#pricing" className="text-gray-700 hover:text-green-600 transition">Pricing</a>
              <Link href="/auth/login" className="text-gray-700 hover:text-green-600 transition">Login</Link>
              <Link 
                href="/auth/register" 
                className="bg-green-600 text-white px-6 py-2 rounded-full hover:bg-green-700 transition font-medium"
              >
                Get Started
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button 
              className="md:hidden p-2"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-t">
            <div className="px-4 py-4 space-y-3">
              <a href="#features" className="block py-2 text-gray-700" onClick={() => setIsMenuOpen(false)}>Features</a>
              <a href="#specialties" className="block py-2 text-gray-700" onClick={() => setIsMenuOpen(false)}>Specialties</a>
              <a href="#how-it-works" className="block py-2 text-gray-700" onClick={() => setIsMenuOpen(false)}>How It Works</a>
              <a href="#pricing" className="block py-2 text-gray-700" onClick={() => setIsMenuOpen(false)}>Pricing</a>
              <Link href="/auth/login" className="block py-2 text-gray-700">Login</Link>
              <Link 
                href="/auth/register" 
                className="block bg-green-600 text-white px-6 py-3 rounded-full text-center font-medium"
              >
                Get Started
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="pt-24 md:pt-32 pb-16 bg-gradient-to-br from-green-50 via-white to-emerald-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
                <Shield className="w-4 h-4" />
                Trusted by 10,000+ Nigerians
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                Quality Healthcare,{' '}
                <span className="text-green-600">Anytime, Anywhere</span>
              </h1>
              <p className="mt-6 text-lg text-gray-600 max-w-xl mx-auto lg:mx-0">
                Connect with licensed Nigerian doctors through secure video consultations. 
                Get prescriptions, lab requests, and medical advice from the comfort of your home.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link
                  href="/auth/register"
                  className="inline-flex items-center justify-center gap-2 bg-green-600 text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-green-700 transition shadow-lg shadow-green-200"
                >
                  Book a Consultation
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  href="/auth/register?role=doctor"
                  className="inline-flex items-center justify-center gap-2 bg-white text-green-600 border-2 border-green-600 px-8 py-4 rounded-full text-lg font-semibold hover:bg-green-50 transition"
                >
                  <Stethoscope className="w-5 h-5" />
                  Join as a Doctor
                </Link>
              </div>
              <div className="mt-8 flex items-center gap-6 justify-center lg:justify-start text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  Licensed Doctors
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  Secure & Private
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  24/7 Available
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="relative z-10 bg-white rounded-2xl shadow-2xl p-4 max-w-md mx-auto">
                <div className="aspect-video bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center">
                  <div className="text-center text-white">
                    <Video className="w-16 h-16 mx-auto mb-4" />
                    <p className="font-medium">Video Consultation</p>
                    <p className="text-sm opacity-80">Connect with doctors instantly</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">Dr. Adebayo Johnson</p>
                    <p className="text-sm text-gray-500">General Physician • 15 years exp.</p>
                  </div>
                  <div className="flex items-center gap-1 text-yellow-500">
                    <Star className="w-4 h-4 fill-current" />
                    <span className="text-sm font-medium">4.9</span>
                  </div>
                </div>
              </div>
              {/* Decorative elements */}
              <div className="absolute -top-4 -right-4 w-72 h-72 bg-green-200 rounded-full opacity-30 blur-3xl" />
              <div className="absolute -bottom-4 -left-4 w-72 h-72 bg-emerald-200 rounded-full opacity-30 blur-3xl" />
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-green-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center text-white">
            <div>
              <div className="text-4xl font-bold">10,000+</div>
              <div className="text-green-100 mt-1">Patients Served</div>
            </div>
            <div>
              <div className="text-4xl font-bold">500+</div>
              <div className="text-green-100 mt-1">Licensed Doctors</div>
            </div>
            <div>
              <div className="text-4xl font-bold">36</div>
              <div className="text-green-100 mt-1">States Covered</div>
            </div>
            <div>
              <div className="text-4xl font-bold">4.8★</div>
              <div className="text-green-100 mt-1">Average Rating</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
              Why Choose TeleHealth Nigeria?
            </h2>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
              We bring quality healthcare to your fingertips with cutting-edge technology and trusted medical professionals.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: Video,
                title: 'Video Consultations',
                description: 'High-quality video calls with doctors. No travel, no waiting rooms.',
              },
              {
                icon: Shield,
                title: 'Licensed Doctors',
                description: 'All doctors are verified and licensed by the Medical and Dental Council of Nigeria.',
              },
              {
                icon: Clock,
                title: '24/7 Availability',
                description: 'Access healthcare anytime, even at midnight. Doctors are always online.',
              },
              {
                icon: CreditCard,
                title: 'Secure Payments',
                description: 'Pay securely with cards, bank transfer, or USSD. Powered by Paystack.',
              },
            ].map((feature, index) => (
              <div 
                key={index}
                className="bg-gray-50 rounded-2xl p-6 hover:shadow-lg transition group"
              >
                <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-green-600 transition">
                  <feature.icon className="w-7 h-7 text-green-600 group-hover:text-white transition" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Specialties Section */}
      <section id="specialties" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
              Medical Specialties Available
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Consult with specialists across various medical fields
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {specialties.map((specialty, index) => (
              <div 
                key={index}
                className="bg-white rounded-xl p-6 text-center hover:shadow-lg transition cursor-pointer group"
              >
                <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-green-600 transition">
                  <specialty.icon className="w-8 h-8 text-green-600 group-hover:text-white transition" />
                </div>
                <h3 className="font-semibold text-gray-900">{specialty.name}</h3>
                <p className="text-sm text-gray-500 mt-1">{specialty.doctors} doctors</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
              How It Works
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Get medical consultation in 3 simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '1',
                title: 'Book an Appointment',
                description: 'Choose a doctor, select a convenient time, and book your video consultation.',
                icon: Clock,
              },
              {
                step: '2',
                title: 'Video Consultation',
                description: 'Connect with your doctor via secure video call. Discuss your symptoms and concerns.',
                icon: Video,
              },
              {
                step: '3',
                title: 'Get Prescription',
                description: 'Receive your digital prescription instantly. Visit any pharmacy to get your medications.',
                icon: CheckCircle,
              },
            ].map((item, index) => (
              <div key={index} className="relative">
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-8 text-center">
                  <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-6 text-white text-2xl font-bold">
                    {item.step}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">{item.title}</h3>
                  <p className="text-gray-600">{item.description}</p>
                </div>
                {index < 2 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                    <ArrowRight className="w-8 h-8 text-green-300" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
              What Our Users Say
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Trusted by thousands of patients and doctors across Nigeria
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 mb-6">&quot;{testimonial.content}&quot;</p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{testimonial.name}</p>
                    <p className="text-sm text-gray-500">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
              Transparent Pricing
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Choose a plan that fits your healthcare needs
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {plans.map((plan, index) => (
              <div 
                key={index}
                className={`rounded-2xl p-8 ${
                  plan.popular 
                    ? 'bg-green-600 text-white shadow-xl scale-105' 
                    : 'bg-gray-50 text-gray-900'
                }`}
              >
                {plan.popular && (
                  <div className="bg-white text-green-600 text-sm font-semibold px-3 py-1 rounded-full inline-block mb-4">
                    Most Popular
                  </div>
                )}
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <div className="mb-6">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className={plan.popular ? 'text-green-100' : 'text-gray-500'}> {plan.duration}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <CheckCircle className={`w-5 h-5 ${plan.popular ? 'text-green-200' : 'text-green-500'}`} />
                      <span className={plan.popular ? 'text-green-100' : 'text-gray-600'}>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/auth/register"
                  className={`block w-full py-3 rounded-full text-center font-semibold transition ${
                    plan.popular
                      ? 'bg-white text-green-600 hover:bg-green-50'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  Get Started
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-green-600 to-emerald-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Experience Better Healthcare?
          </h2>
          <p className="text-xl text-green-100 mb-8">
            Join thousands of Nigerians who trust TeleHealth Nigeria for their medical consultations.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/register"
              className="inline-flex items-center justify-center gap-2 bg-white text-green-600 px-8 py-4 rounded-full text-lg font-semibold hover:bg-green-50 transition"
            >
              Book Your First Consultation
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/auth/register?role=doctor"
              className="inline-flex items-center justify-center gap-2 bg-transparent text-white border-2 border-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-white/10 transition"
            >
              <Stethoscope className="w-5 h-5" />
              Join as a Doctor
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <img src="/logo.jpg" alt="TeleHealth Nigeria" className="h-10 w-auto rounded" />
                <span className="text-xl font-bold">TeleHealth Nigeria</span>
              </div>
              <p className="text-gray-400">
                Quality healthcare, anytime, anywhere. Connecting Nigerians with licensed doctors through secure video consultations.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#features" className="hover:text-white transition">Features</a></li>
                <li><a href="#specialties" className="hover:text-white transition">Specialties</a></li>
                <li><a href="#how-it-works" className="hover:text-white transition">How It Works</a></li>
                <li><a href="#pricing" className="hover:text-white transition">Pricing</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition">Contact Us</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <ul className="space-y-3 text-gray-400">
                <li className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  +234 700 TELEHEALTH
                </li>
                <li className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  support@telehealthnigeria.com
                </li>
                <li className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Lagos, Nigeria
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; {new Date().getFullYear()} TeleHealth Nigeria. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
