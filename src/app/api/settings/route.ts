import { NextRequest, NextResponse } from 'next/server'

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

// Try to get prisma client with proper error handling
async function getPrismaClient() {
  try {
    const dbModule = await import('@/lib/db')
    const prisma = dbModule.default
    
    // Verify prisma is actually available
    if (!prisma) {
      console.log('Prisma client is null, using demo mode')
      return null
    }
    
    return prisma
  } catch (e) {
    console.log('Database not available, using demo mode:', (e as Error).message)
    return null
  }
}

// GET - Retrieve app settings
export async function GET() {
  try {
    const prisma = await getPrismaClient()
    
    // Demo mode - return in-memory settings
    if (!prisma) {
      console.log('Returning demo settings:', demoSettings.facilityName)
      return NextResponse.json({ 
        success: true, 
        settings: demoSettings, 
        mode: 'demo',
        message: 'Running in demo mode - settings are in-memory'
      })
    }
    
    const p = prisma as any
    
    try {
      let settings = await p.appSetting.findUnique({
        where: { id: 'default' }
      })

      // Create default settings if not exists
      if (!settings) {
        console.log('Creating default settings in database')
        settings = await p.appSetting.create({
          data: defaultSettings
        })
      }

      console.log('Retrieved settings from database:', settings.facilityName)
      return NextResponse.json({ success: true, settings, mode: 'database' })
    } catch (dbError) {
      console.error('Database operation failed:', dbError)
      // Fall back to demo mode
      return NextResponse.json({ 
        success: true, 
        settings: demoSettings, 
        mode: 'demo',
        message: 'Database error, using demo mode'
      })
    }
  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json({ 
      success: true, 
      settings: demoSettings, 
      mode: 'demo',
      error: 'Failed to fetch settings'
    })
  }
}

// PUT - Update app settings (superadmin only)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      userId, 
      userRole,
      settings: newSettings 
    } = body

    console.log('Settings update request:', { userId, userRole, facilityName: newSettings?.facilityName })

    // Only superadmin can update settings
    if (userRole !== 'SUPER_ADMIN') {
      console.log('Access denied - user is not SUPER_ADMIN:', userRole)
      return NextResponse.json(
        { success: false, error: 'Only superadmin can modify settings' },
        { status: 403 }
      )
    }

    const prisma = await getPrismaClient()
    
    // Demo mode - update in memory
    if (!prisma) {
      console.log('Demo mode - updating settings in memory')
      demoSettings = { 
        ...demoSettings, 
        ...newSettings, 
        lastUpdated: new Date().toISOString(), 
        updatedBy: userId 
      }
      console.log('Updated demo settings:', demoSettings.facilityName, demoSettings.primaryPhone)
      return NextResponse.json({ 
        success: true, 
        settings: demoSettings, 
        mode: 'demo',
        message: 'Settings saved successfully (demo mode)'
      })
    }
    
    const p = prisma as any

    try {
      // Ensure settings record exists
      let settings = await p.appSetting.findUnique({
        where: { id: 'default' }
      })

      if (!settings) {
        console.log('Creating settings record before update')
        settings = await p.appSetting.create({
          data: {
            ...defaultSettings,
            facilityName: newSettings.facilityName || 'RUN Health Centre',
            facilityShortName: newSettings.facilityShortName || 'RUHC',
            facilityCode: newSettings.facilityCode || 'RUHC-2026',
            lastUpdated: new Date().toISOString(),
            updatedBy: userId,
          }
        })
      }

      // Update settings
      console.log('Updating settings in database')
      const updatedSettings = await p.appSetting.update({
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
          updatedBy: userId,
        }
      })

      console.log('Settings updated successfully:', updatedSettings.facilityName)
      return NextResponse.json({ 
        success: true, 
        settings: updatedSettings,
        message: 'Settings saved successfully'
      })
    } catch (dbError: any) {
      console.error('Database operation failed, falling back to demo mode:', dbError.message)
      
      // Fall back to demo mode - still save settings in memory
      demoSettings = { 
        ...demoSettings, 
        ...newSettings, 
        lastUpdated: new Date().toISOString(), 
        updatedBy: userId 
      }
      
      return NextResponse.json({ 
        success: true, 
        settings: demoSettings, 
        mode: 'demo',
        message: 'Settings saved (database unavailable, using demo mode)'
      })
    }
  } catch (error: any) {
    console.error('Error updating settings:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update settings: ' + error.message },
      { status: 500 }
    )
  }
}
