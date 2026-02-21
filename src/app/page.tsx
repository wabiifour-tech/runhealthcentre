'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function Home() {
  const router = useRouter()
  
  useEffect(() => {
    // Redirect to HMS application
    router.replace('/hms')
  }, [router])
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-40 h-40 bg-white rounded-2xl shadow-2xl mb-6 p-3">
          <Image 
            src="/logo.jpg" 
            alt="RUN Health Centre Logo" 
            width={150}
            height={150}
            className="w-full h-full object-contain rounded-xl"
            priority
          />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">RUN Health Centre</h1>
        <p className="text-blue-200">Loading Hospital Management System...</p>
      </div>
    </div>
  )
}
