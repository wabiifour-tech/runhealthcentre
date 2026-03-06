'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  Menu, X, Github, Mail, Phone, ExternalLink, ChevronDown,
  Code2, Smartphone, Brain, Lightbulb, Palette, Music,
  Hospital, Bot, Stethoscope, Send, MessageCircle,
  ArrowRight, Quote, Star, Calendar, User, Briefcase
} from 'lucide-react'

export default function Home() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [activeSection, setActiveSection] = useState('home')
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')

  // Smooth scroll to section
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
    setIsMenuOpen(false)
  }

  // Track active section on scroll
  useEffect(() => {
    const handleScroll = () => {
      const sections = ['home', 'about', 'services', 'projects', 'testimonials', 'contact']
      for (const section of sections) {
        const element = document.getElementById(section)
        if (element) {
          const rect = element.getBoundingClientRect()
          if (rect.top <= 100 && rect.bottom >= 100) {
            setActiveSection(section)
            break
          }
        }
      }
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Handle contact form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // Create mailto link as fallback
    const mailtoLink = `mailto:wabithetechnurse@gmail.com?subject=${encodeURIComponent(formData.subject)}&body=${encodeURIComponent(`Name: ${formData.name}\nEmail: ${formData.email}\n\n${formData.message}`)}`
    window.location.href = mailtoLink
    
    setSubmitStatus('success')
    setIsSubmitting(false)
    setFormData({ name: '', email: '', subject: '', message: '' })
    
    setTimeout(() => setSubmitStatus('idle'), 3000)
  }

  const services = [
    { icon: Code2, title: 'Website Development', description: 'Modern, responsive websites built with cutting-edge technologies. From landing pages to complex web applications.' },
    { icon: Smartphone, title: 'Mobile/Desktop Apps', description: 'Cross-platform applications for iOS, Android, and desktop. Native-like performance with modern frameworks.' },
    { icon: Brain, title: 'AI Integration', description: 'Integrate artificial intelligence into your systems. Chatbots, automation, and smart solutions for your business.' },
    { icon: Lightbulb, title: 'Tech Consultancy', description: 'Expert guidance on technology decisions. Digital transformation strategies and IT infrastructure planning.' },
    { icon: Palette, title: 'UI/UX Design', description: 'Beautiful, intuitive interfaces that users love. User research, wireframing, and prototyping.' },
    { icon: Music, title: 'Sound/Drums Tech', description: 'Audio engineering and sound technology solutions. From recording setups to live sound systems.' },
  ]

  const projects = [
    {
      title: 'RUN Health Centre HMS',
      description: 'A comprehensive Hospital Management System for RUN Health Centre. Features patient management, consultations, pharmacy, laboratory, and real-time notifications.',
      tags: ['Next.js', 'PostgreSQL', 'Healthcare', 'Real-time'],
      image: '/projects/hms.png',
      link: 'https://runhealthcentre.vercel.app/hms',
      icon: Hospital,
      color: 'from-green-500 to-emerald-600'
    },
    {
      title: 'Wabi AI',
      description: 'An AI-powered assistant platform with chat capabilities, image generation, and smart automation features.',
      tags: ['AI', 'Next.js', 'OpenAI', 'Automation'],
      image: '/projects/wabiai.png',
      link: '#',
      icon: Bot,
      color: 'from-purple-500 to-indigo-600'
    },
    {
      title: 'MedLink',
      description: 'A healthcare connectivity platform linking patients with healthcare providers. Appointment booking, telemedicine, and health records management.',
      tags: ['Healthcare', 'React', 'Node.js', 'Telemedicine'],
      image: '/projects/medlink.png',
      link: '#',
      icon: Stethoscope,
      color: 'from-blue-500 to-cyan-600'
    },
  ]

  const testimonials = [
    {
      name: 'Dr. Adewale Johnson',
      role: 'Medical Director, RUN Health Centre',
      content: 'Wabi delivered an exceptional hospital management system that transformed our operations. The attention to detail and understanding of healthcare workflows was impressive.',
      rating: 5
    },
    {
      name: 'Sarah Okonkwo',
      role: 'CEO, TechStart Nigeria',
      content: 'Professional, innovative, and reliable. Wabi built our company website and mobile app ahead of schedule. Highly recommended for any tech project!',
      rating: 5
    },
    {
      name: 'Prof. Maria Adeyemi',
      role: 'Dean, Nursing Sciences',
      content: 'A rare combination of nursing expertise and tech skills. Wabi understands both worlds and creates solutions that truly work for healthcare professionals.',
      rating: 5
    },
  ]

  const stats = [
    { label: 'Projects Completed', value: '25+' },
    { label: 'Happy Clients', value: '50+' },
    { label: 'Years Experience', value: '5+' },
    { label: 'Technologies', value: '20+' },
  ]

  const navLinks = [
    { id: 'home', label: 'Home' },
    { id: 'about', label: 'About' },
    { id: 'services', label: 'Services' },
    { id: 'projects', label: 'Projects' },
    { id: 'testimonials', label: 'Testimonials' },
    { id: 'contact', label: 'Contact' },
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <button onClick={() => scrollToSection('home')} className="flex items-center gap-2 group">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg group-hover:shadow-emerald-200 transition-all">
                W
              </div>
              <span className="font-bold text-gray-900 hidden sm:block">Wabi The Tech Nurse</span>
            </button>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <button
                  key={link.id}
                  onClick={() => scrollToSection(link.id)}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                    activeSection === link.id
                      ? "text-green-600 bg-green-50"
                      : "text-gray-600 hover:text-green-600 hover:bg-gray-50"
                  )}
                >
                  {link.label}
                </button>
              ))}
            </div>

            {/* CTA Button */}
            <div className="hidden md:block">
              <Button
                onClick={() => scrollToSection('contact')}
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-emerald-200"
              >
                Hire Me <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 shadow-lg">
            <div className="px-4 py-4 space-y-1">
              {navLinks.map((link) => (
                <button
                  key={link.id}
                  onClick={() => scrollToSection(link.id)}
                  className={cn(
                    "block w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-all",
                    activeSection === link.id
                      ? "text-green-600 bg-green-50"
                      : "text-gray-600 hover:text-green-600 hover:bg-gray-50"
                  )}
                >
                  {link.label}
                </button>
              ))}
              <Button
                onClick={() => scrollToSection('contact')}
                className="w-full mt-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white"
              >
                Hire Me <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section id="home" className="pt-16 min-h-screen flex items-center relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-green-50 via-white to-emerald-50"></div>
        <div className="absolute top-20 right-0 w-96 h-96 bg-green-200 rounded-full filter blur-3xl opacity-30 animate-pulse"></div>
        <div className="absolute bottom-20 left-0 w-96 h-96 bg-emerald-200 rounded-full filter blur-3xl opacity-30 animate-pulse" style={{ animationDelay: '1s' }}></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-medium">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                Available for Projects
              </div>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                Hi, I'm{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-500 to-emerald-600">
                  Abolaji Odewabi
                </span>
              </h1>
              
              <h2 className="text-2xl sm:text-3xl font-semibold text-gray-700">
                <span className="text-green-600">Wabi</span> The Tech Nurse
              </h2>
              
              <p className="text-lg text-gray-600 leading-relaxed max-w-xl">
                Bridging <span className="text-green-600 font-semibold">Healthcare</span> and{' '}
                <span className="text-green-600 font-semibold">Technology</span>. I build digital solutions 
                that solve real problems in healthcare and beyond. With a unique blend of clinical knowledge 
                and tech expertise, I create innovative tools that make a difference.
              </p>
              
              <div className="flex flex-wrap gap-4">
                <Button
                  onClick={() => scrollToSection('projects')}
                  size="lg"
                  className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-emerald-200 px-8"
                >
                  View My Work <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button
                  onClick={() => scrollToSection('contact')}
                  size="lg"
                  variant="outline"
                  className="border-2 border-green-500 text-green-600 hover:bg-green-50 px-8"
                >
                  Get In Touch
                </Button>
              </div>

              {/* Social Links */}
              <div className="flex items-center gap-4 pt-4">
                <span className="text-sm text-gray-500">Connect with me:</span>
                <a
                  href="https://github.com/wabiifour-tech"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-green-100 hover:text-green-600 transition-all"
                >
                  <Github className="h-5 w-5" />
                </a>
                <a
                  href="https://wa.me/2348136375114"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-green-100 hover:text-green-600 transition-all"
                >
                  <MessageCircle className="h-5 w-5" />
                </a>
                <a
                  href="mailto:wabithetechnurse@gmail.com"
                  className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-green-100 hover:text-green-600 transition-all"
                >
                  <Mail className="h-5 w-5" />
                </a>
              </div>
            </div>

            {/* Hero Image/Avatar */}
            <div className="relative flex justify-center lg:justify-end">
              <div className="relative">
                <div className="w-72 h-72 sm:w-80 sm:h-80 lg:w-96 lg:h-96 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 p-1 shadow-2xl">
                  <div className="w-full h-full rounded-full bg-gradient-to-br from-green-50 to-white flex items-center justify-center">
                    <span className="text-8xl sm:text-9xl">👨‍💻</span>
                  </div>
                </div>
                
                {/* Floating Elements */}
                <div className="absolute -top-4 -right-4 w-20 h-20 bg-white rounded-2xl shadow-xl flex items-center justify-center animate-bounce" style={{ animationDuration: '3s' }}>
                  <span className="text-3xl">🩺</span>
                </div>
                <div className="absolute -bottom-4 -left-4 w-20 h-20 bg-white rounded-2xl shadow-xl flex items-center justify-center animate-bounce" style={{ animationDuration: '3s', animationDelay: '0.5s' }}>
                  <span className="text-3xl">💻</span>
                </div>
                <div className="absolute top-1/2 -right-8 w-16 h-16 bg-white rounded-2xl shadow-xl flex items-center justify-center animate-bounce" style={{ animationDuration: '3s', animationDelay: '1s' }}>
                  <span className="text-2xl">🚀</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <button onClick={() => scrollToSection('about')} className="text-gray-400 hover:text-green-500">
            <ChevronDown className="h-8 w-8" />
          </button>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-gradient-to-r from-green-500 to-emerald-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl font-bold text-white mb-2">{stat.value}</div>
                <div className="text-green-100 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="bg-green-100 text-green-700 mb-4">About Me</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              The Story Behind <span className="text-green-600">Wabi The Tech Nurse</span>
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              A unique journey combining healthcare and technology to create meaningful solutions.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="prose prose-lg text-gray-600">
                <p>
                  I'm <strong className="text-gray-900">Abolaji Odewabi</strong>, a Nurse and Tech Enthusiast 
                  passionate about leveraging technology to transform healthcare delivery. My journey began in 
                  the nursing profession at <strong className="text-green-600">Redeemer's University</strong>, 
                  where I discovered the powerful intersection of healthcare and technology.
                </p>
                <p>
                  This unique combination allows me to understand clinical workflows deeply while having the 
                  technical skills to build solutions that truly address healthcare challenges. From hospital 
                  management systems to AI-powered tools, I create digital products that make a real impact.
                </p>
                <p>
                  When I'm not coding, you'll find me exploring new technologies, contributing to open-source 
                  projects, or creating content to help others learn. I believe in continuous learning and 
                  sharing knowledge with the community.
                </p>
              </div>

              <div className="flex flex-wrap gap-3 pt-4">
                {['Next.js', 'React', 'TypeScript', 'Node.js', 'PostgreSQL', 'AI/ML', 'UI/UX', 'Healthcare IT'].map((skill) => (
                  <span key={skill} className="px-4 py-2 bg-green-50 text-green-700 rounded-full text-sm font-medium">
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              {/* Education */}
              <Card className="border-0 shadow-lg hover:shadow-xl transition-all">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center text-green-600">
                      <User className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Education</h3>
                      <p className="text-gray-600">B.NSc. Nursing Sciences</p>
                      <p className="text-sm text-green-600">Redeemer's University, Ede</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Experience */}
              <Card className="border-0 shadow-lg hover:shadow-xl transition-all">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center text-green-600">
                      <Briefcase className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Experience</h3>
                      <p className="text-gray-600">Full Stack Developer & Healthcare IT Specialist</p>
                      <p className="text-sm text-green-600">5+ Years in Tech</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Focus */}
              <Card className="border-0 shadow-lg hover:shadow-xl transition-all">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center text-green-600">
                      <Stethoscope className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Specialization</h3>
                      <p className="text-gray-600">Health Tech Solutions</p>
                      <p className="text-sm text-green-600">HMS, Telemedicine, AI in Healthcare</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="bg-green-100 text-green-700 mb-4">Services</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              What I Can Do For <span className="text-green-600">You</span>
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              From web development to AI integration, I offer a range of tech services tailored to your needs.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-all group cursor-pointer overflow-hidden">
                <CardContent className="p-8">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform">
                    <service.icon className="h-7 w-7" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">{service.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{service.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Projects Section */}
      <section id="projects" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="bg-green-100 text-green-700 mb-4">Projects</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Featured <span className="text-green-600">Work</span>
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              A showcase of projects I've built, from healthcare systems to AI platforms.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {projects.map((project, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-2xl transition-all group overflow-hidden">
                <div className={`h-48 bg-gradient-to-br ${project.color} flex items-center justify-center relative overflow-hidden`}>
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-all"></div>
                  <project.icon className="h-20 w-20 text-white/80 group-hover:scale-110 transition-transform" />
                </div>
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{project.title}</h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">{project.description}</p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {project.tags.map((tag) => (
                      <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <a
                    href={project.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-green-600 hover:text-green-700 font-medium text-sm"
                  >
                    View Project <ExternalLink className="ml-1 h-4 w-4" />
                  </a>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 bg-gradient-to-br from-green-50 to-emerald-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="bg-green-100 text-green-700 mb-4">Testimonials</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              What People <span className="text-green-600">Say</span>
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Feedback from clients and colleagues I've had the pleasure of working with.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-all">
                <CardContent className="p-8">
                  <Quote className="h-10 w-10 text-green-200 mb-4" />
                  <p className="text-gray-700 mb-6 leading-relaxed">{testimonial.content}</p>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-white font-bold">
                      {testimonial.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">{testimonial.name}</div>
                      <div className="text-sm text-gray-500">{testimonial.role}</div>
                    </div>
                  </div>
                  <div className="flex gap-1 mt-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="bg-green-100 text-green-700 mb-4">Contact</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Let's Work <span className="text-green-600">Together</span>
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Have a project in mind? Let's discuss how I can help bring your ideas to life.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Info */}
            <div className="space-y-8">
              <div className="space-y-6">
                <Card className="border-0 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center text-green-600">
                        <Mail className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">Email</h3>
                        <a href="mailto:wabithetechnurse@gmail.com" className="text-green-600 hover:text-green-700">
                          wabithetechnurse@gmail.com
                        </a>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center text-green-600">
                        <MessageCircle className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">WhatsApp</h3>
                        <a href="https://wa.me/2348136375114" target="_blank" rel="noopener noreferrer" className="text-green-600 hover:text-green-700">
                          +234 813 637 5114
                        </a>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center text-green-600">
                        <Github className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">GitHub</h3>
                        <a href="https://github.com/wabiifour-tech" target="_blank" rel="noopener noreferrer" className="text-green-600 hover:text-green-700">
                          github.com/wabiifour-tech
                        </a>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Contact Form */}
            <Card className="border-0 shadow-xl">
              <CardContent className="p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                      <Input
                        type="text"
                        placeholder="Your name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                        className="border-gray-200 focus:border-green-500 focus:ring-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                      <Input
                        type="email"
                        placeholder="your@email.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                        className="border-gray-200 focus:border-green-500 focus:ring-green-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                    <Input
                      type="text"
                      placeholder="Project inquiry"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      required
                      className="border-gray-200 focus:border-green-500 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                    <Textarea
                      placeholder="Tell me about your project..."
                      rows={5}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      required
                      className="border-gray-200 focus:border-green-500 focus:ring-green-500"
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white py-6 text-lg"
                  >
                    {isSubmitting ? (
                      'Sending...'
                    ) : (
                      <>
                        Send Message <Send className="ml-2 h-5 w-5" />
                      </>
                    )}
                  </Button>
                  {submitStatus === 'success' && (
                    <p className="text-green-600 text-center text-sm">
                      Message sent! I'll get back to you soon.
                    </p>
                  )}
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center text-white font-bold">
                W
              </div>
              <span className="font-bold">Wabi The Tech Nurse</span>
            </div>
            
            <div className="flex items-center gap-6">
              <a href="https://github.com/wabiifour-tech" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-green-400 transition-colors">
                <Github className="h-5 w-5" />
              </a>
              <a href="https://wa.me/2348136375114" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-green-400 transition-colors">
                <MessageCircle className="h-5 w-5" />
              </a>
              <a href="mailto:wabithetechnurse@gmail.com" className="text-gray-400 hover:text-green-400 transition-colors">
                <Mail className="h-5 w-5" />
              </a>
            </div>
            
            <p className="text-gray-400 text-sm">
              © {new Date().getFullYear()} Wabi The Tech Nurse. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
