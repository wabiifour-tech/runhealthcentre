'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()
  
  useEffect(() => {
    // Redirect to HMS application
    router.replace('/hms')
  }, [router])
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-36 h-36 bg-white rounded-2xl shadow-2xl mb-6 p-2 animate-pulse">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src="/runlogo.jpg" 
            alt="RUN Health Centre Logo" 
            className="w-full h-full object-contain rounded-xl"
          />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">RUN Health Centre</h1>
        <p className="text-blue-200">Loading Hospital Management System...</p>
      </div>
    </div>
  )
}
