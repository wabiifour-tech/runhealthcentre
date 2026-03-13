'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    // Redirect immediately to HMS
    router.replace('/hms')
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 flex items-center justify-center">
      <div className="text-center text-white p-8">
        {/* Logo/Brand */}
        <div className="mb-6">
          <div className="w-24 h-24 bg-white rounded-full mx-auto flex items-center justify-center shadow-2xl">
            <span className="text-4xl font-bold text-blue-700">RUHC</span>
          </div>
        </div>
        
        {/* Title */}
        <h1 className="text-3xl font-bold mb-2">Redeemer's University Health Centre</h1>
        <p className="text-blue-200 mb-8">Health Management System</p>
        
        {/* Loading Spinner */}
        <div className="flex items-center justify-center gap-3">
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm text-blue-100">Loading Health Management System...</span>
        </div>
        
        {/* Footer */}
        <p className="text-xs text-blue-300 mt-8">
          © {new Date().getFullYear()} Redeemer's University Health Centre (RUHC). All rights reserved.
        </p>
      </div>
    </div>
  )
}
