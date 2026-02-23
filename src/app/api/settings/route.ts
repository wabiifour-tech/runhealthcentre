import { NextRequest, NextResponse } from 'next/server'
import { getPrisma } from '@/lib/db'
import { createLogger } from '@/lib/logger'
import { errorResponse, successResponse, Errors } from '@/lib/errors'
import { authenticateRequest, hasRoleLevel } from '@/lib/auth-middleware'

const logger = createLogger('Settings')

// Default settings
const defaultSettings = {
  id: 'default',
  facilityName: 'RUN Health Centre',
  facilityShortName: 'RUHC',
  facilityCode: 'RUHC-2026',
  facilityCountry: 'Nigeria',
  primaryColor: '#1e40af',
  secondaryColor: '#3b82f6',
  accentColor: '#10b981',
  openingTime: '08:00',
  closingTime: '18:00',
  workingDays: 'Monday,Friday',
  timezone: 'Africa/Lagos',
  currency: 'NGN',
  currencySymbol: '₦',
  enableVoiceNotes: true,
  enableDailyDevotionals: true,
  enableOnlineBooking: false,
  enableSmsNotifications: false,
  enableEmailNotifications: false,
}

// In-memory settings for demo mode (persists during server runtime)
let demoSettings = { ...defaultSettings }

// GET - Retrieve app settings
export async function GET() {
  try {
    const prisma = await getPrisma()
    
    // Demo mode - return in-memory settings
    if (!prisma) {
      logger.debug('Returning demo settings')
      return successResponse({ 
        settings: demoSettings, 
        mode: 'demo',
        message: 'Running in demo mode - settings are in-memory'
      })
    }
    
    const p = prisma as any
    
    try {
      let settings = await p.app_settings.findUnique({
        where: { id: 'default' }
      })

      // Create default settings if not exists
      if (!settings) {
        logger.info('Creating default settings in database')
        settings = await p.app_settings.create({
          data: defaultSettings
        })
      }

      logger.debug('Retrieved settings from database')
      return successResponse({ settings, mode: 'database' })
    } catch (dbError) {
      logger.error('Database operation failed', { error: String(dbError) })
      // Fall back to demo mode
      return successResponse({ 
        settings: demoSettings, 
        mode: 'demo',
        message: 'Database error, using demo mode'
      })
    }
  } catch (error) {
    return errorResponse(error, { module: 'Settings', operation: 'get' })
  }
}

// PUT - Update app settings (superadmin only)
export async function PUT(request: NextRequest) {
  try {
    // Verify super admin access
    const auth = await authenticateRequest(request, { requiredRole: 'SUPER_ADMIN' })
    if (!auth.authenticated) {
      throw Errors.forbidden('Only superadmin can modify settings')
    }

    const body = await request.json()
    const { settings: newSettings } = body

    logger.info('Settings update request', { 
      admin: auth.user?.email,
      facilityName: newSettings?.facilityName 
    })

    const prisma = await getPrisma()

    // Demo mode - update in memory
    if (!prisma) {
      logger.info('Demo mode - updating settings in memory')
      demoSettings = { 
        ...demoSettings, 
        ...newSettings, 
        lastUpdated: new Date().toISOString(), 
        updatedBy: auth.user?.id 
      }
      return successResponse({ 
        settings: demoSettings, 
        mode: 'demo',
        message: 'Settings saved successfully (demo mode)'
      })
    }
    
    const p = prisma as any

    try {
      // Ensure settings record exists
      let settings = await p.app_settings.findUnique({
        where: { id: 'default' }
      })

      if (!settings) {
        logger.info('Creating settings record before update')
        settings = await p.app_settings.create({
          data: {
            ...defaultSettings,
            facilityName: newSettings.facilityName || 'RUN Health Centre',
            facilityShortName: newSettings.facilityShortName || 'RUHC',
            facilityCode: newSettings.facilityCode || 'RUHC-2026',
            lastUpdated: new Date().toISOString(),
            updatedBy: auth.user?.id,
          }
        })
      }

      // Update settings
      const updatedSettings = await p.app_settings.update({
        where: { id: 'default' },
        data: {
          // Facility Information
          facilityName: newSettings.facilityName,
          facilityShortName: newSettings.facilityShortName,
          facilityCode: newSettings.facilityCode,
          facilityAddress: newSettings.facilityAddress,
          facilityCity: newSettings.facilityCity,
          facilityState: newSettings.facilityState,
          facilityCountry: newSettings.facilityCountry,
          
          // Contact Information
          primaryPhone: newSettings.primaryPhone,
          secondaryPhone: newSettings.secondaryPhone,
          emergencyPhone: newSettings.emergencyPhone,
          emailAddress: newSettings.emailAddress,
          website: newSettings.website,
          
          // Branding
          logoUrl: newSettings.logoUrl,
          logoBase64: newSettings.logoBase64,
          primaryColor: newSettings.primaryColor,
          secondaryColor: newSettings.secondaryColor,
          accentColor: newSettings.accentColor,
          
          // Operational Settings
          openingTime: newSettings.openingTime,
          closingTime: newSettings.closingTime,
          workingDays: newSettings.workingDays,
          timezone: newSettings.timezone,
          currency: newSettings.currency,
          currencySymbol: newSettings.currencySymbol,
          
          // Feature Flags
          enableOnlineBooking: newSettings.enableOnlineBooking,
          enableSmsNotifications: newSettings.enableSmsNotifications,
          enableEmailNotifications: newSettings.enableEmailNotifications,
          enableVoiceNotes: newSettings.enableVoiceNotes,
          enableDailyDevotionals: newSettings.enableDailyDevotionals,
          
          // Custom Messages
          welcomeMessage: newSettings.welcomeMessage,
          headerMessage: newSettings.headerMessage,
          footerMessage: newSettings.footerMessage,
          
          // System
          lastUpdated: new Date().toISOString(),
          updatedBy: auth.user?.id,
        }
      })

      logger.info('Settings updated successfully', { 
        admin: auth.user?.email,
        facilityName: updatedSettings.facilityName 
      })
      
      return successResponse({ 
        settings: updatedSettings,
        message: 'Settings saved successfully'
      })
    } catch (dbError: any) {
      logger.error('Database operation failed, falling back to demo mode', { 
        error: dbError.message 
      })
      
      // Fall back to demo mode - still save settings in memory
      demoSettings = { 
        ...demoSettings, 
        ...newSettings, 
        lastUpdated: new Date().toISOString(), 
        updatedBy: auth.user?.id 
      }
      
      return successResponse({ 
        settings: demoSettings, 
        mode: 'demo',
        message: 'Settings saved (database unavailable, using demo mode)'
      })
    }
  } catch (error) {
    return errorResponse(error, { module: 'Settings', operation: 'update' })
  }
}
