// Notification Types - TypeScript interfaces for the WhatsApp-style notification system

// ============================================
// CORE NOTIFICATION TYPES
// ============================================

export type NotificationPriority = 'low' | 'normal' | 'high' | 'critical'
export type NotificationStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'failed'
export type NotificationChannel = 'in-app' | 'push' | 'sms' | 'email'
export type NotificationCategory = 'patient' | 'staff' | 'system' | 'emergency' | 'billing' | 'pharmacy' | 'lab'

// ============================================
// NOTIFICATION EVENT TYPES
// ============================================

export type NotificationType =
  // Patient Events
  | 'patient_registered'
  | 'patient_admitted'
  | 'patient_discharged'
  | 'patient_transferred'
  
  // Appointment Events
  | 'appointment_created'
  | 'appointment_confirmed'
  | 'appointment_reminder'
  | 'appointment_cancelled'
  | 'appointment_rescheduled'
  
  // Consultation Events
  | 'consultation_started'
  | 'consultation_completed'
  | 'consultation_routed'
  | 'consultation_sent_back'
  
  // Lab Events
  | 'lab_request_created'
  | 'lab_sample_collected'
  | 'lab_result_ready'
  | 'lab_result_critical'
  
  // Prescription Events
  | 'prescription_created'
  | 'prescription_ready'
  | 'prescription_dispensed'
  | 'prescription_cancelled'
  
  // Billing Events
  | 'bill_generated'
  | 'payment_received'
  | 'payment_reminder'
  | 'refund_processed'
  
  // Queue Events
  | 'queue_joined'
  | 'queue_called'
  | 'queue_position_update'
  
  // Staff Events
  | 'staff_account_created'
  | 'staff_account_approved'
  | 'staff_account_rejected'
  | 'shift_assigned'
  | 'shift_swapped'
  
  // System Events
  | 'system_alert'
  | 'system_maintenance'
  | 'security_alert'
  | 'daily_report'
  
  // Emergency Events
  | 'emergency_admission'
  | 'critical_vitals'
  | 'code_blue'
  | 'code_red'

// ============================================
// NOTIFICATION INTERFACES
// ============================================

export interface Notification {
  id: string
  senderId?: string
  senderName?: string
  senderRole?: string
  userId?: string
  targetRoles?: string[]
  targetDepartments?: string[]
  type: NotificationType
  category: NotificationCategory
  title: string
  message: string
  data?: Record<string, any>
  actionUrl?: string
  priority: NotificationPriority
  isUrgent: boolean
  isBroadcast: boolean
  status: NotificationStatus
  sentAt?: Date
  deliveredAt?: Date
  readAt?: Date
  failedAt?: Date
  failureReason?: string
  channels: NotificationChannel[]
  inAppDelivered: boolean
  pushDelivered: boolean
  smsDelivered: boolean
  emailDelivered: boolean
  retryCount: number
  maxRetries: number
  nextRetryAt?: Date
  threadId?: string
  parentNotificationId?: string
  expiresAt?: Date
  createdAt: Date
  updatedAt: Date
}

export interface NotificationRecipient {
  id: string
  notificationId: string
  userId: string
  userName?: string
  userRole?: string
  status: NotificationStatus
  sentAt?: Date
  deliveredAt?: Date
  readAt?: Date
  deliveredToDevice?: string
  readOnDevice?: string
  createdAt: Date
}

export interface NotificationTemplate {
  id: string
  name: string
  type: NotificationType
  category: NotificationCategory
  titleTemplate: string
  messageTemplate: string
  shortMessageTemplate?: string
  defaultPriority: NotificationPriority
  defaultChannels: NotificationChannel[]
  defaultExpiryHours: number
  targetRoles?: string[]
  targetDepartments?: string[]
  variables: string[]
  isActive: boolean
}

export interface NotificationLog {
  id: string
  notificationId?: string
  action: 'created' | 'sent' | 'delivered' | 'read' | 'failed' | 'retry' | 'cancelled'
  channel?: NotificationChannel
  status: 'success' | 'failed'
  errorMessage?: string
  deviceId?: string
  deviceType?: string
  userAgent?: string
  ipAddress?: string
  metadata?: Record<string, any>
  createdAt: Date
}

// ============================================
// USER PREFERENCES
// ============================================

export interface UserNotificationPreferences {
  id: string
  userId: string
  inAppEnabled: boolean
  pushEnabled: boolean
  smsEnabled: boolean
  emailEnabled: boolean
  typePreferences?: Record<string, ChannelPreferences>
  quietHoursEnabled: boolean
  quietHoursStart?: string
  quietHoursEnd?: string
  quietHoursTimezone?: string
  allowCriticalOverride: boolean
  digestEnabled: boolean
  digestFrequency?: 'immediate' | 'hourly' | 'daily' | 'weekly'
  digestTime?: string
  deviceTokens?: string[]
}

export interface ChannelPreferences {
  inApp?: boolean
  push?: boolean
  sms?: boolean
  email?: boolean
}

// ============================================
// DEVICE INFO
// ============================================

export interface UserDevice {
  id: string
  userId: string
  deviceToken?: string
  deviceType: 'desktop' | 'mobile' | 'tablet'
  deviceName?: string
  deviceId?: string
  platform?: 'web' | 'android' | 'ios'
  osVersion?: string
  appVersion?: string
  isActive: boolean
  lastActiveAt?: Date
  pushEnabled: boolean
  badgeCount: number
}

// ============================================
// QUEUE TYPES
// ============================================

export interface NotificationQueueItem {
  id: string
  notificationId: string
  status: 'queued' | 'processing' | 'completed' | 'failed'
  priority: number
  channel: NotificationChannel
  attempts: number
  maxAttempts: number
  lastAttemptAt?: Date
  nextAttemptAt?: Date
  processingBy?: string
  completedAt?: Date
  failedAt?: Date
  errorMessage?: string
  payload?: Record<string, any>
  createdAt: Date
}

// ============================================
// API REQUEST/RESPONSE TYPES
// ============================================

export interface CreateNotificationRequest {
  userId?: string
  targetRoles?: string[]
  targetDepartments?: string[]
  type: NotificationType
  category?: NotificationCategory
  title: string
  message: string
  data?: Record<string, any>
  actionUrl?: string
  priority?: NotificationPriority
  isUrgent?: boolean
  channels?: NotificationChannel[]
  expiresAt?: Date
  threadId?: string
  parentNotificationId?: string
  senderId?: string
  senderName?: string
  senderRole?: string
}

export interface NotificationListResponse {
  success: boolean
  notifications: Notification[]
  unreadCount: number
  totalCount: number
  hasMore: boolean
}

export interface NotificationStatusUpdate {
  notificationId: string
  status: NotificationStatus
  deliveredAt?: Date
  readAt?: Date
  deviceId?: string
  deviceType?: string
}

// ============================================
// ROUTING RULES
// ============================================

export interface RoutingRule {
  eventType: NotificationType
  recipients: RecipientRule[]
  channels: NotificationChannel[]
  priority: NotificationPriority
  template?: string
}

export interface RecipientRule {
  type: 'user' | 'role' | 'department' | 'related'
  value: string
  channels?: NotificationChannel[]
}

// ============================================
// WEBSOCKET TYPES
// ============================================

export interface WebSocketMessage {
  type: 'notification' | 'status_update' | 'acknowledgment' | 'ping' | 'pong'
  payload: any
  timestamp: number
}

export interface NotificationWebSocketMessage {
  type: 'notification'
  payload: {
    notification: Notification
    recipients?: NotificationRecipient[]
  }
  timestamp: number
}

export interface StatusUpdateMessage {
  type: 'status_update'
  payload: {
    notificationId: string
    status: NotificationStatus
    deliveredAt?: string
    readAt?: string
  }
  timestamp: number
}

// ============================================
// PUSH NOTIFICATION TYPES
// ============================================

export interface PushNotificationPayload {
  token: string
  notification: {
    title: string
    body: string
    icon?: string
    badge?: string
    image?: string
    click_action?: string
  }
  data?: Record<string, string>
  android?: {
    notification?: {
      channel_id?: string
      priority?: 'high' | 'normal'
      sound?: string
    }
  }
  apns?: {
    payload?: {
      aps: {
        badge?: number
        sound?: string
        'content-available'?: number
      }
    }
  }
}

// ============================================
// EVENT TRIGGERS
// ============================================

export interface NotificationTrigger {
  event: NotificationType
  data: Record<string, any>
  actor?: {
    id: string
    name: string
    role: string
  }
  patient?: {
    id: string
    name: string
    ruhcCode: string
    phone?: string
    email?: string
  }
  metadata?: Record<string, any>
}
