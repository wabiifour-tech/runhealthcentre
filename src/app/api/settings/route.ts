import { NextRequest, NextResponse } from 'next/server'
import { getPrisma } from '@/lib/db'
import { createLogger } from '@/lib/logger'
import { errorResponse, successResponse, Errors } from '@/lib/errors'
import { authenticateRequest } from '@/lib/auth-middleware'

const logger = createLogger('Settings')

// Default settings with all new fields
const defaultSettings = {
  id: 'default',
  // Facility Information
  facilityName: 'RUN Health Centre',
  facilityShortName: 'RUHC',
  facilityCode: 'RUHC-2026',
  facilityCountry: 'Nigeria',
  facilityAddress: '',
  facilityCity: '',
  facilityState: '',
  // Contact Information
  primaryPhone: '',
  secondaryPhone: '',
  emergencyPhone: '',
  emailAddress: '',
  website: '',
  // Branding
  logoUrl: '',
  logoBase64: '',
  primaryColor: '#1e40af',
  secondaryColor: '#3b82f6',
  accentColor: '#10b981',
  // Operational Settings
  openingTime: '08:00',
  closingTime: '18:00',
  workingDays: 'Monday,Tuesday,Wednesday,Thursday,Friday',
  timezone: 'Africa/Lagos',
  currency: 'NGN',
  currencySymbol: '₦',
  // Feature Flags
  enableOnlineBooking: false,
  enableSmsNotifications: false,
  enableEmailNotifications: false,
  enableVoiceNotes: true,
  enableDailyDevotionals: true,
  enableDrugInteractionCheck: true,
  enableVitalAlerts: true,
  enableAuditLogging: true,
  enableBreakGlass: true,
  enableTwoFactor: false,
  // Custom Messages
  welcomeMessage: '',
  headerMessage: '',
  footerMessage: '',
  // Security Settings
  sessionTimeoutMinutes: 30,
  maxLoginAttempts: 5,
  lockoutDurationMinutes: 30,
  passwordMinLength: 8,
  passwordRequireUppercase: true,
  passwordRequireLowercase: true,
  passwordRequireNumber: true,
  passwordRequireSpecial: false,
  passwordExpiryDays: 90,
  // Audit Log Settings
  auditLogRetentionDays: 90,
  logPatientAccess: true,
  logDataModifications: true,
  logLoginAttempts: true,
  // Notification Provider Settings
  smsProvider: '',
  smsApiKey: '',
  smsApiSecret: '',
  smsSenderId: '',
  emailProvider: '',
  emailApiKey: '',
  smtpHost: '',
  smtpPort: 587,
  smtpUser: '',
  smtpPassword: '',
  // Role Permissions
  rolePermissions: JSON.stringify({
    SUPER_ADMIN: { all: true },
    ADMIN: { all: true, superAdminOnly: false },
    DOCTOR: { patients: true, consultations: true, labRequests: true, prescriptions: true, certificates: true, referrals: true, discharge: true },
    NURSE: { patients: true, vitals: true, medicationAdmin: true, queue: true, admissions: true },
    PHARMACIST: { drugs: true, dispensing: true, prescriptions: true },
    LAB_TECHNICIAN: { labRequests: true, labResults: true },
    MATRON: { all: false, staff: true, roster: true, announcements: true },
    RECORDS_OFFICER: { patients: true, records: true }
  }),
  // Queue Settings
  queuePrefix: 'RUHC',
  queueStartNumber: 1,
  queueResetDaily: true,
  // Backup Settings
  autoBackupEnabled: false,
  backupFrequency: 'weekly',
  backupRetentionDays: 30,
}

// In-memory settings for demo mode
let demoSettings = { ...defaultSettings }

// GET - Retrieve app settings
export async function GET(request: NextRequest) {
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
            lastUpdated: new Date(),
            updatedBy: auth.user?.id,
          }
        })
      }

      // Update settings with all fields
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
          enableDrugInteractionCheck: newSettings.enableDrugInteractionCheck,
          enableVitalAlerts: newSettings.enableVitalAlerts,
          enableAuditLogging: newSettings.enableAuditLogging,
          enableBreakGlass: newSettings.enableBreakGlass,
          enableTwoFactor: newSettings.enableTwoFactor,
          
          // Custom Messages
          welcomeMessage: newSettings.welcomeMessage,
          headerMessage: newSettings.headerMessage,
          footerMessage: newSettings.footerMessage,
          
          // Security Settings
          sessionTimeoutMinutes: newSettings.sessionTimeoutMinutes,
          maxLoginAttempts: newSettings.maxLoginAttempts,
          lockoutDurationMinutes: newSettings.lockoutDurationMinutes,
          passwordMinLength: newSettings.passwordMinLength,
          passwordRequireUppercase: newSettings.passwordRequireUppercase,
          passwordRequireLowercase: newSettings.passwordRequireLowercase,
          passwordRequireNumber: newSettings.passwordRequireNumber,
          passwordRequireSpecial: newSettings.passwordRequireSpecial,
          passwordExpiryDays: newSettings.passwordExpiryDays,
          
          // Audit Log Settings
          auditLogRetentionDays: newSettings.auditLogRetentionDays,
          logPatientAccess: newSettings.logPatientAccess,
          logDataModifications: newSettings.logDataModifications,
          logLoginAttempts: newSettings.logLoginAttempts,
          
          // Notification Provider Settings
          smsProvider: newSettings.smsProvider,
          smsApiKey: newSettings.smsApiKey,
          smsApiSecret: newSettings.smsApiSecret,
          smsSenderId: newSettings.smsSenderId,
          emailProvider: newSettings.emailProvider,
          emailApiKey: newSettings.emailApiKey,
          smtpHost: newSettings.smtpHost,
          smtpPort: newSettings.smtpPort,
          smtpUser: newSettings.smtpUser,
          smtpPassword: newSettings.smtpPassword,
          
          // Role Permissions
          rolePermissions: newSettings.rolePermissions,
          
          // Queue Settings
          queuePrefix: newSettings.queuePrefix,
          queueStartNumber: newSettings.queueStartNumber,
          queueResetDaily: newSettings.queueResetDaily,
          
          // Backup Settings
          autoBackupEnabled: newSettings.autoBackupEnabled,
          backupFrequency: newSettings.backupFrequency,
          backupRetentionDays: newSettings.backupRetentionDays,
          
          // System
          lastUpdated: new Date(),
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
      
      // Fall back to demo mode
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

// DELETE - Reset settings to default (superadmin only)
export async function DELETE(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request, { requiredRole: 'SUPER_ADMIN' })
    if (!auth.authenticated) {
      throw Errors.forbidden('Only superadmin can reset settings')
    }

    logger.info('Settings reset request', { admin: auth.user?.email })

    const prisma = await getPrisma()

    if (!prisma) {
      demoSettings = { ...defaultSettings }
      return successResponse({ 
        settings: demoSettings, 
        message: 'Settings reset to default (demo mode)' 
      })
    }

    const p = prisma as any

    const settings = await p.app_settings.update({
      where: { id: 'default' },
      data: {
        ...defaultSettings,
        lastUpdated: new Date(),
        updatedBy: auth.user?.id,
      }
    })

    return successResponse({ 
      settings,
      message: 'Settings reset to default successfully' 
    })
  } catch (error) {
    return errorResponse(error, { module: 'Settings', operation: 'reset' })
  }
}
