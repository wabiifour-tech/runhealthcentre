// ============================================
// NOTIFICATION PREFERENCES - User Settings for Notifications
// ============================================

'use client'

import React, { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Bell,
  BellOff,
  Smartphone,
  Mail,
  MessageSquare,
  Moon,
  Clock,
  AlertTriangle,
  Save,
  RefreshCw
} from 'lucide-react'
import { createLogger } from '@/lib/logger'

const logger = createLogger('NotificationPreferences')

// ============================================
// TYPES
// ============================================

interface NotificationPreferencesProps {
  userId: string
  onSave?: (preferences: UserPreferences) => void
}

interface UserPreferences {
  inAppEnabled: boolean
  pushEnabled: boolean
  smsEnabled: boolean
  emailEnabled: boolean
  quietHoursEnabled: boolean
  quietHoursStart: string
  quietHoursEnd: string
  quietHoursTimezone: string
  allowCriticalOverride: boolean
  digestEnabled: boolean
  digestFrequency: string
  digestTime: string
  typePreferences?: Record<string, TypePreference>
}

interface TypePreference {
  inApp: boolean
  push: boolean
  sms: boolean
  email: boolean
}

const NOTIFICATION_TYPES = [
  { key: 'appointments', label: 'Appointments', icon: '📅' },
  { key: 'lab_results', label: 'Lab Results', icon: '🔬' },
  { key: 'prescriptions', label: 'Prescriptions', icon: '💊' },
  { key: 'billing', label: 'Billing', icon: '💳' },
  { key: 'queue', label: 'Queue Updates', icon: '🎫' },
  { key: 'staff', label: 'Staff Updates', icon: '👥' },
  { key: 'emergency', label: 'Emergency Alerts', icon: '🚨' },
  { key: 'system', label: 'System Notifications', icon: '⚙️' }
]

const TIMEZONES = [
  'Africa/Lagos',
  'Africa/Accra',
  'Africa/Nairobi',
  'Europe/London',
  'America/New_York'
]

// ============================================
// NOTIFICATION PREFERENCES COMPONENT
// ============================================

export function NotificationPreferences({ userId, onSave }: NotificationPreferencesProps) {
  const [preferences, setPreferences] = useState<UserPreferences>({
    inAppEnabled: true,
    pushEnabled: true,
    smsEnabled: false,
    emailEnabled: false,
    quietHoursEnabled: false,
    quietHoursStart: '22:00',
    quietHoursEnd: '07:00',
    quietHoursTimezone: 'Africa/Lagos',
    allowCriticalOverride: true,
    digestEnabled: false,
    digestFrequency: 'daily',
    digestTime: '09:00',
    typePreferences: {}
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Load preferences
  useEffect(() => {
    async function loadPreferences() {
      try {
        const response = await fetch(`/api/notifications/preferences?userId=${userId}`)
        if (response.ok) {
          const data = await response.json()
          if (data.preferences) {
            setPreferences(prev => ({ ...prev, ...data.preferences }))
          }
        }
      } catch (error) {
        logger.error('Failed to load preferences', { error })
      } finally {
        setIsLoading(false)
      }
    }

    loadPreferences()
  }, [userId])

  // Save preferences
  const handleSave = async () => {
    setIsSaving(true)
    setMessage(null)

    try {
      const response = await fetch('/api/notifications/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, ...preferences })
      })

      if (response.ok) {
        setMessage({ type: 'success', text: 'Preferences saved successfully!' })
        onSave?.(preferences)
      } else {
        throw new Error('Failed to save')
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save preferences. Please try again.' })
    } finally {
      setIsSaving(false)
    }
  }

  // Update preference
  const updatePreference = <K extends keyof UserPreferences>(
    key: K, 
    value: UserPreferences[K]
  ) => {
    setPreferences(prev => ({ ...prev, [key]: value }))
  }

  // Update type preference
  const updateTypePreference = (
    type: string, 
    channel: keyof TypePreference, 
    value: boolean
  ) => {
    setPreferences(prev => ({
      ...prev,
      typePreferences: {
        ...prev.typePreferences,
        [type]: {
          ...prev.typePreferences?.[type],
          [channel]: value
        }
      } as Record<string, TypePreference>
    }))
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Message */}
      {message && (
        <div className={cn(
          'p-4 rounded-lg',
          message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        )}>
          {message.text}
        </div>
      )}

      {/* Channel Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notification Channels
          </CardTitle>
          <CardDescription>
            Choose how you want to receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-gray-500" />
              <div>
                <Label htmlFor="inApp">In-App Notifications</Label>
                <p className="text-xs text-gray-500">Receive notifications in the application</p>
              </div>
            </div>
            <Switch
              id="inApp"
              checked={preferences.inAppEnabled}
              onCheckedChange={(checked) => updatePreference('inAppEnabled', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Smartphone className="w-5 h-5 text-gray-500" />
              <div>
                <Label htmlFor="push">Push Notifications</Label>
                <p className="text-xs text-gray-500">Receive push notifications on your devices</p>
              </div>
            </div>
            <Switch
              id="push"
              checked={preferences.pushEnabled}
              onCheckedChange={(checked) => updatePreference('pushEnabled', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MessageSquare className="w-5 h-5 text-gray-500" />
              <div>
                <Label htmlFor="sms">SMS Notifications</Label>
                <p className="text-xs text-gray-500">Receive notifications via text message</p>
              </div>
            </div>
            <Switch
              id="sms"
              checked={preferences.smsEnabled}
              onCheckedChange={(checked) => updatePreference('smsEnabled', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-gray-500" />
              <div>
                <Label htmlFor="email">Email Notifications</Label>
                <p className="text-xs text-gray-500">Receive notifications via email</p>
              </div>
            </div>
            <Switch
              id="email"
              checked={preferences.emailEnabled}
              onCheckedChange={(checked) => updatePreference('emailEnabled', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Quiet Hours */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Moon className="w-5 h-5" />
            Quiet Hours
          </CardTitle>
          <CardDescription>
            Set times when you don't want to be disturbed
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="quietHours">Enable Quiet Hours</Label>
            <Switch
              id="quietHours"
              checked={preferences.quietHoursEnabled}
              onCheckedChange={(checked) => updatePreference('quietHoursEnabled', checked)}
            />
          </div>

          {preferences.quietHoursEnabled && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startTime">Start Time</Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={preferences.quietHoursStart}
                    onChange={(e) => updatePreference('quietHoursStart', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endTime">End Time</Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={preferences.quietHoursEnd}
                    onChange={(e) => updatePreference('quietHoursEnd', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Select
                  value={preferences.quietHoursTimezone}
                  onValueChange={(value) => updatePreference('quietHoursTimezone', value)}
                >
                  <SelectTrigger id="timezone">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIMEZONES.map(tz => (
                      <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
              <div>
                <Label htmlFor="criticalOverride" className="text-yellow-700">
                  Allow Critical Override
                </Label>
                <p className="text-xs text-yellow-600">
                  Critical alerts will still come through during quiet hours
                </p>
              </div>
            </div>
            <Switch
              id="criticalOverride"
              checked={preferences.allowCriticalOverride}
              onCheckedChange={(checked) => updatePreference('allowCriticalOverride', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Notification Digest */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Notification Digest
          </CardTitle>
          <CardDescription>
            Bundle notifications instead of receiving them individually
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="digest">Enable Digest</Label>
            <Switch
              id="digest"
              checked={preferences.digestEnabled}
              onCheckedChange={(checked) => updatePreference('digestEnabled', checked)}
            />
          </div>

          {preferences.digestEnabled && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="frequency">Frequency</Label>
                <Select
                  value={preferences.digestFrequency}
                  onValueChange={(value) => updatePreference('digestFrequency', value)}
                >
                  <SelectTrigger id="frequency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hourly">Hourly</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="digestTime">Delivery Time</Label>
                <Input
                  id="digestTime"
                  type="time"
                  value={preferences.digestTime}
                  onChange={(e) => updatePreference('digestTime', e.target.value)}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Type-Specific Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Types</CardTitle>
          <CardDescription>
            Customize which types of notifications you receive on each channel
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-2">Type</th>
                  <th className="text-center py-2 px-2">In-App</th>
                  <th className="text-center py-2 px-2">Push</th>
                  <th className="text-center py-2 px-2">SMS</th>
                  <th className="text-center py-2 px-2">Email</th>
                </tr>
              </thead>
              <tbody>
                {NOTIFICATION_TYPES.map(type => (
                  <tr key={type.key} className="border-b last:border-0">
                    <td className="py-3 px-2">
                      <span className="mr-2">{type.icon}</span>
                      {type.label}
                    </td>
                    <td className="text-center py-2 px-2">
                      <Switch
                        checked={preferences.typePreferences?.[type.key]?.inApp ?? true}
                        onCheckedChange={(checked) => updateTypePreference(type.key, 'inApp', checked)}
                      />
                    </td>
                    <td className="text-center py-2 px-2">
                      <Switch
                        checked={preferences.typePreferences?.[type.key]?.push ?? true}
                        onCheckedChange={(checked) => updateTypePreference(type.key, 'push', checked)}
                      />
                    </td>
                    <td className="text-center py-2 px-2">
                      <Switch
                        checked={preferences.typePreferences?.[type.key]?.sms ?? false}
                        onCheckedChange={(checked) => updateTypePreference(type.key, 'sms', checked)}
                      />
                    </td>
                    <td className="text-center py-2 px-2">
                      <Switch
                        checked={preferences.typePreferences?.[type.key]?.email ?? false}
                        onCheckedChange={(checked) => updateTypePreference(type.key, 'email', checked)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Preferences
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

export default NotificationPreferences
