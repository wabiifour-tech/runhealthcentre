// Internal Messaging System - Real-time communication between staff
// Supports direct messages, department messages, and urgent alerts

export interface InternalMessage {
  id: string
  senderId: string
  senderName: string
  senderRole: string
  recipientId?: string // For direct messages
  recipientRole?: string // For role-based messages
  recipientDepartment?: string // For department messages
  subject: string
  content: string
  priority: 'normal' | 'urgent' | 'critical'
  category: 'message' | 'alert' | 'task' | 'system'
  patientId?: string // Related patient
  patientName?: string
  attachmentUrl?: string
  isRead: boolean
  readAt?: string
  createdAt: string
  expiresAt?: string // For time-sensitive messages
  threadId?: string // For conversation threads
  parentId?: string // For replies
}

export interface Conversation {
  id: string
  participants: Array<{ id: string; name: string; role: string }>
  lastMessage: InternalMessage
  unreadCount: number
  updatedAt: string
}

// In-memory message store
let messages: InternalMessage[] = []
let conversations: Conversation[] = []

// Generate unique ID
function generateId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// Send a message
export function sendMessage(params: {
  senderId: string
  senderName: string
  senderRole: string
  recipientId?: string
  recipientRole?: string
  recipientDepartment?: string
  subject: string
  content: string
  priority?: 'normal' | 'urgent' | 'critical'
  category?: 'message' | 'alert' | 'task' | 'system'
  patientId?: string
  patientName?: string
  attachmentUrl?: string
  expiresAt?: string
  threadId?: string
  parentId?: string
}): InternalMessage {
  const message: InternalMessage = {
    id: generateId(),
    ...params,
    priority: params.priority || 'normal',
    category: params.category || 'message',
    isRead: false,
    createdAt: new Date().toISOString()
  }
  
  // Add to messages
  messages.unshift(message)
  
  // Update or create conversation
  updateConversation(message)
  
  // Sync to database
  syncMessageToDB(message)
  
  // Trigger real-time notification
  triggerNotification(message)
  
  return message
}

// Update conversation tracking
function updateConversation(message: InternalMessage) {
  const threadId = message.threadId || message.id
  const existingConversation = conversations.find(c => c.id === threadId)
  
  if (existingConversation) {
    existingConversation.lastMessage = message
    existingConversation.updatedAt = message.createdAt
    if (!message.isRead) {
      existingConversation.unreadCount++
    }
  } else {
    const participants = []
    participants.push({ id: message.senderId, name: message.senderName, role: message.senderRole })
    
    if (message.recipientId) {
      // For direct messages, we'd need recipient info - simplified here
    }
    
    conversations.unshift({
      id: threadId,
      participants,
      lastMessage: message,
      unreadCount: message.isRead ? 0 : 1,
      updatedAt: message.createdAt
    })
  }
}

// Get messages for a user
export function getMessagesForUser(userId: string, role: string): InternalMessage[] {
  return messages.filter(m => 
    m.recipientId === userId ||
    m.recipientRole === role ||
    m.senderId === userId ||
    m.recipientRole === 'all'
  )
}

// Get unread count
export function getUnreadCount(userId: string, role: string): number {
  return messages.filter(m => 
    !m.isRead && (
      m.recipientId === userId ||
      m.recipientRole === role ||
      m.recipientRole === 'all'
    )
  ).length
}

// Mark message as read
export function markAsRead(messageId: string): void {
  const message = messages.find(m => m.id === messageId)
  if (message && !message.isRead) {
    message.isRead = true
    message.readAt = new Date().toISOString()
    
    // Update conversation unread count
    const threadId = message.threadId || message.id
    const conversation = conversations.find(c => c.id === threadId)
    if (conversation && conversation.unreadCount > 0) {
      conversation.unreadCount--
    }
    
    // Sync to database
    syncMessageToDB(message)
  }
}

// Mark all as read for a user
export function markAllAsRead(userId: string, role: string): void {
  messages.forEach(m => {
    if (!m.isRead && (m.recipientId === userId || m.recipientRole === role)) {
      m.isRead = true
      m.readAt = new Date().toISOString()
    }
  })
  
  // Reset conversation unread counts
  conversations.forEach(c => {
    c.unreadCount = 0
  })
}

// Get conversations for a user
export function getConversationsForUser(userId: string): Conversation[] {
  return conversations.filter(c => 
    c.participants.some(p => p.id === userId)
  ).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
}

// Send urgent alert to all staff
export function broadcastAlert(params: {
  senderId: string
  senderName: string
  senderRole: string
  subject: string
  content: string
  patientId?: string
  patientName?: string
}): InternalMessage {
  return sendMessage({
    ...params,
    recipientRole: 'all',
    priority: 'critical',
    category: 'alert'
  })
}

// Send department message
export function sendDepartmentMessage(params: {
  senderId: string
  senderName: string
  senderRole: string
  recipientDepartment: string
  subject: string
  content: string
  priority?: 'normal' | 'urgent' | 'critical'
  patientId?: string
  patientName?: string
}): InternalMessage {
  return sendMessage({
    ...params,
    recipientRole: params.recipientDepartment as any,
    priority: params.priority || 'normal',
    category: 'message'
  })
}

// Get message thread
export function getMessageThread(threadId: string): InternalMessage[] {
  return messages.filter(m => m.threadId === threadId || m.id === threadId)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
}

// Reply to a message
export function replyToMessage(originalMessage: InternalMessage, params: {
  senderId: string
  senderName: string
  senderRole: string
  content: string
}): InternalMessage {
  return sendMessage({
    ...params,
    subject: `Re: ${originalMessage.subject}`,
    recipientId: originalMessage.senderId,
    recipientRole: originalMessage.senderRole,
    threadId: originalMessage.threadId || originalMessage.id,
    parentId: originalMessage.id,
    patientId: originalMessage.patientId,
    patientName: originalMessage.patientName
  })
}

// Delete a message (soft delete - just hide from user)
export function deleteMessage(messageId: string, userId: string): void {
  messages = messages.filter(m => !(m.id === messageId && (m.senderId === userId || m.recipientId === userId)))
}

// Sync message to database
async function syncMessageToDB(message: InternalMessage): Promise<void> {
  try {
    await fetch('/api/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'internalMessage', data: message })
    })
  } catch (error) {
    console.warn('Failed to sync message to database')
  }
}

// Trigger real-time notification
function triggerNotification(message: InternalMessage): void {
  // Dispatch custom event for real-time updates
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('newMessage', { detail: message }))
    
    // Show browser notification if permitted
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(`New ${message.category}: ${message.subject}`, {
        body: message.content.substring(0, 100),
        tag: message.id
      })
    }
  }
}

// Load messages from database
export async function loadMessages(): Promise<void> {
  try {
    const response = await fetch('/api/data?type=internalMessages')
    const result = await response.json()
    if (result.success && result.data) {
      messages = result.data
    }
  } catch (error) {
    console.warn('Failed to load messages from database')
  }
}

// Request notification permission
export function requestNotificationPermission(): void {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission()
  }
}

// Quick message templates
export const QUICK_MESSAGES = {
  patientReady: {
    subject: 'Patient Ready',
    content: 'Patient {patientName} is ready for {service}.'
  },
  labResultReady: {
    subject: 'Lab Results Ready',
    content: 'Lab results for {patientName} are ready for review.'
  },
  prescriptionReady: {
    subject: 'Prescription Ready',
    content: 'Prescription for {patientName} is ready for pickup.'
  },
  consultationUrgent: {
    subject: 'Urgent Consultation',
    content: 'Please attend to {patientName} urgently. Reason: {reason}'
  },
  medicationDue: {
    subject: 'Medication Due',
    content: 'Medication due for {patientName}: {medication}'
  },
  handoffNote: {
    subject: 'Handoff Note',
    content: 'Shift handoff for {patientName}: {notes}'
  }
}

// Create quick message from template
export function createQuickMessage(
  templateKey: keyof typeof QUICK_MESSAGES,
  variables: Record<string, string>,
  params: {
    senderId: string
    senderName: string
    senderRole: string
    recipientId?: string
    recipientRole?: string
    patientId?: string
    patientName?: string
    priority?: 'normal' | 'urgent' | 'critical'
  }
): InternalMessage {
  const template = QUICK_MESSAGES[templateKey]
  let content = template.content
  
  Object.entries(variables).forEach(([key, value]) => {
    content = content.replace(`{${key}}`, value)
  })
  
  return sendMessage({
    ...params,
    subject: template.subject,
    content,
    category: templateKey === 'consultationUrgent' ? 'alert' : 'message'
  })
}
