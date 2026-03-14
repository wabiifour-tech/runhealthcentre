'use client'

import { useState, useEffect, useCallback } from 'react'
import { Download, X, Share, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

// Check if running as standalone app
function isStandaloneMode(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(display-mode: standalone)').matches
    || (window.navigator as any).standalone === true
}

// Check if iOS device
function isIOSDevice(): boolean {
  if (typeof window === 'undefined') return false
  return /iPad|iPhone|iPod/.test(navigator.userAgent)
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)

  // Listen for beforeinstallprompt event
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    // Check if already installed
    if (isStandaloneMode()) return

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      
      // Show prompt after a delay (only if not dismissed)
      const dismissed = sessionStorage.getItem('pwa-install-dismissed')
      if (!dismissed) {
        setTimeout(() => setShowPrompt(true), 3000)
      }
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall)
    
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
  }, [])

  // Show iOS prompt after delay
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (isStandaloneMode()) return
    if (!isIOSDevice()) return
    
    const dismissed = sessionStorage.getItem('pwa-install-dismissed')
    if (!dismissed) {
      const timer = setTimeout(() => setShowPrompt(true), 3000)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleInstall = useCallback(async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        setShowPrompt(false)
      }
      setDeferredPrompt(null)
    }
  }, [deferredPrompt])

  const handleDismiss = useCallback(() => {
    setShowPrompt(false)
    sessionStorage.setItem('pwa-install-dismissed', Date.now().toString())
  }, [])

  // Don't show if already installed
  if (isStandaloneMode()) return null

  // iOS Instructions Modal
  if (isIOSDevice() && showPrompt) {
    return (
      <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96">
        <div className="bg-white rounded-xl shadow-2xl p-4 border border-gray-200">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center">
                <Download className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Install RUHC HMS</h3>
                <p className="text-sm text-gray-500">Add to Home Screen</p>
              </div>
            </div>
            <button onClick={handleDismiss} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="space-y-3 text-sm text-gray-600">
            <p>Install this app on your iPhone:</p>
            <ol className="list-decimal list-inside space-y-2 ml-2">
              <li className="flex items-center gap-2">
                Tap the <Share className="w-4 h-4 inline text-blue-600" /> Share button at the bottom
              </li>
              <li className="flex items-center gap-2">
                Scroll down and tap <span className="font-medium">&ldquo;Add to Home Screen&rdquo;</span>
              </li>
              <li className="flex items-center gap-2">
                Tap <Plus className="w-4 h-4 inline text-blue-600" /> <span className="font-medium">&ldquo;Add&rdquo;</span> in the top right
              </li>
            </ol>
          </div>
        </div>
      </div>
    )
  }

  // Android/Desktop Prompt
  if (showPrompt && deferredPrompt) {
    return (
      <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96">
        <div className="bg-white rounded-xl shadow-2xl p-4 border border-gray-200">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl overflow-hidden bg-blue-100">
                <img src="/runlogo.jpg" alt="RUHC" className="w-full h-full object-cover" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Install RUHC HMS</h3>
                <p className="text-sm text-gray-500">Works offline • Fast access</p>
              </div>
            </div>
            <button onClick={handleDismiss} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <Button 
            onClick={handleInstall}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Download className="w-4 h-4 mr-2" />
            Install App
          </Button>
        </div>
      </div>
    )
  }

  return null
}

// Floating Install Button (for menu/header)
export function InstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall)
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
  }, [])

  const handleInstall = useCallback(async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt()
      setDeferredPrompt(null)
    } else if (isIOSDevice()) {
      alert('Tap the Share button at the bottom, then "Add to Home Screen"')
    }
  }, [deferredPrompt])

  // Don't show if already installed
  if (isStandaloneMode()) return null

  // On iOS, show the button but it gives instructions
  // On Android/Desktop, only show if installable
  if (!deferredPrompt && !isIOSDevice()) return null

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleInstall}
      className="gap-2"
    >
      <Download className="w-4 h-4" />
      <span className="hidden sm:inline">Install App</span>
    </Button>
  )
}
