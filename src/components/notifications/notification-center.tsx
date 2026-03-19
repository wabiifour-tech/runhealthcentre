// ============================================
// NOTIFICATION CENTER - WhatsApp-Style Notification UI
// Complete notification management interface
// ============================================

'use client'

import React, { useState, useRef, useEffect, useMemo } from 'react'
import { formatDistanceToNow, format, isToday, isYesterday } from 'date-fns'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Bell,
  BellOff,
  Check,
  CheckCheck,
  Clock,
  Filter,
  MoreVertical,
  Search,
  Settings,
  Trash2,
  X,
  AlertTriangle,
  AlertCircle,
  Info,
  UserPlus,
  Calendar,
  FileText,
  Pill,
  FlaskConical,
  CreditCard,
  Users,
  Activity,
  ChevronRight,
  Volume2,
  VolumeX
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useNotifications, Notification, playNotificationSound } from '@/lib/use-notifications'
import { useRealtime } from '@/lib/realtime-context'

// ============================================
// TYPES
// ============================================

interface NotificationCenterProps {
  userId: string
  userRole?: string
  onNotificationClick?: (notification: Notification) => void
  showSettings?: boolean
  compact?: boolean
}

type FilterType = 'all' | 'unread' | 'critical' | 'patient' | 'staff' | 'system'
type GroupMode = 'date' | 'type' | 'none'

// ============================================
// NOTIFICATION ICON COMPONENT
// ============================================

function NotificationIcon({ type, priority }: { type: string; priority: string }) {
  const iconClass = cn(
    'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
    priority === 'critical' && 'bg-red-100 text-red-600',
    priority === 'high' && 'bg-orange-100 text-orange-600',
    priority === 'normal' && 'bg-blue-100 text-blue-600',
    priority === 'low' && 'bg-gray-100 text-gray-600'
  )

  const icons: Record<string, React.ReactNode> = {
    patient_registered: <UserPlus className="w-4 h-4" />,
    patient_admitted: <Activity className="w-4 h-4" />,
    patient_discharged: <Check className="w-4 h-4" />,
    appointment_created: <Calendar className="w-4 h-4" />,
    appointment_reminder: <Clock className="w-4 h-4" />,
    consultation_routed: <FileText className="w-4 h-4" />,
    lab_request_created: <FlaskConical className="w-4 h-4" />,
    lab_result_ready: <FlaskConical className="w-4 h-4" />,
    prescription_created: <Pill className="w-4 h-4" />,
    prescription_ready: <Pill className="w-4 h-4" />,
    bill_generated: <CreditCard className="w-4 h-4" />,
    payment_received: <CreditCard className="w-4 h-4" />,
    staff_account_created: <Users className="w-4 h-4" />,
    emergency_admission: <AlertTriangle className="w-4 h-4" />,
    critical_vitals: <AlertCircle className="w-4 h-4" />,
    code_blue: <AlertTriangle className="w-4 h-4" />,
    system_alert: <Info className="w-4 h-4" />,
    default: <Bell className="w-4 h-4" />
  }

  return (
    <div className={iconClass}>
      {icons[type] || icons.default}
    </div>
  )
}

// ============================================
// TICKS COMPONENT (WhatsApp-style)
// ============================================

function NotificationTicks({ status }: { status: string }) {
  if (status === 'pending' || status === 'sent') {
    return <Clock className="w-3 h-3 text-gray-400" />
  }
  
  if (status === 'delivered') {
    return (
      <div className="flex">
        <Check className="w-3 h-3 text-gray-400 -mr-1" />
        <Check className="w-3 h-3 text-gray-400" />
      </div>
    )
  }
  
  if (status === 'read') {
    return (
      <div className="flex">
        <Check className="w-3 h-3 text-blue-500 -mr-1" />
        <Check className="w-3 h-3 text-blue-500" />
      </div>
    )
  }
  
  return null
}

// ============================================
// NOTIFICATION ITEM COMPONENT
// ============================================

function NotificationItem({ 
  notification, 
  onMarkRead, 
  onDelete, 
  onClick,
  isNew 
}: { 
  notification: Notification
  onMarkRead: () => void
  onDelete: () => void
  onClick?: () => void
  isNew?: boolean
}) {
  const isUnread = notification.status !== 'read'
  
  const timeAgo = formatDistanceToNow(new Date(notification.createdAt), { 
    addSuffix: true 
  })

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-3 cursor-pointer transition-colors relative',
        'hover:bg-gray-50 dark:hover:bg-gray-800',
        isUnread && 'bg-blue-50/50 dark:bg-blue-950/20',
        isNew && 'animate-pulse'
      )}
      onClick={() => {
        if (isUnread) onMarkRead()
        onClick?.()
      }}
    >
      {/* Unread indicator */}
      {isUnread && (
        <div className="absolute left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-blue-500 rounded-full" />
      )}
      
      {/* Icon */}
      <NotificationIcon type={notification.type} priority={notification.priority} />
      
      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={cn(
            'text-sm font-medium truncate',
            isUnread && 'font-semibold'
          )}>
            {notification.title}
          </p>
          <div className="flex items-center gap-1 flex-shrink-0">
            <NotificationTicks status={notification.status} />
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <MoreVertical className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {isUnread && (
                  <DropdownMenuItem onClick={(e) => {
                    e.stopPropagation()
                    onMarkRead()
                  }}>
                    <Check className="w-4 h-4 mr-2" />
                    Mark as read
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem 
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete()
                  }}
                  className="text-red-600"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mt-0.5">
          {notification.message}
        </p>
        
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-gray-400">{timeAgo}</span>
          {notification.senderName && (
            <>
              <span className="text-xs text-gray-300">•</span>
              <span className="text-xs text-gray-400">
                from {notification.senderName}
              </span>
            </>
          )}
          {notification.priority === 'critical' && (
            <Badge variant="destructive" className="text-[10px] h-4 px-1">
              CRITICAL
            </Badge>
          )}
          {notification.priority === 'high' && (
            <Badge className="text-[10px] h-4 px-1 bg-orange-100 text-orange-700">
              HIGH
            </Badge>
          )}
        </div>
      </div>
      
      {/* Arrow for actionable notifications */}
      {notification.actionUrl && (
        <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
      )}
    </div>
  )
}

// ============================================
// NOTIFICATION GROUP COMPONENT
// ============================================

function NotificationGroup({ 
  title, 
  notifications, 
  onMarkRead, 
  onDelete,
  onClick
}: { 
  title: string
  notifications: Notification[]
  onMarkRead: (id: string) => void
  onDelete: (id: string) => void
  onClick?: (notification: Notification) => void
}) {
  return (
    <div className="mb-2">
      <div className="px-3 py-2 bg-gray-100 dark:bg-gray-800 sticky top-0 z-10">
        <p className="text-xs font-semibold text-gray-500 uppercase">
          {title}
        </p>
      </div>
      {notifications.map(notification => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onMarkRead={() => onMarkRead(notification.id)}
          onDelete={() => onDelete(notification.id)}
          onClick={() => onClick?.(notification)}
        />
      ))}
    </div>
  )
}

// ============================================
// MAIN NOTIFICATION CENTER COMPONENT
// ============================================

export function NotificationCenter({
  userId,
  userRole,
  onNotificationClick,
  showSettings = true,
  compact = false
}: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [filter, setFilter] = useState<FilterType>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [groupMode, setGroupMode] = useState<GroupMode>('date')
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [viewedIds, setViewedIds] = useState<Set<string>>(new Set())
  
  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    hasUnread,
    hasCritical,
    latestNotification
  } = useNotifications({ userId, autoMarkDelivered: true })

  const scrollRef = useRef<HTMLDivElement>(null)
  const { isConnected } = useRealtime()

  // Play sound for new notifications
  useEffect(() => {
    if (latestNotification && soundEnabled && !viewedIds.has(latestNotification.id)) {
      playNotificationSound(latestNotification.priority)
      setViewedIds(prev => new Set([...prev, latestNotification.id]))
    }
  }, [latestNotification, soundEnabled, viewedIds])

  // Filter and group notifications
  const filteredNotifications = useMemo(() => {
    let filtered = notifications

    // Apply filter
    switch (filter) {
      case 'unread':
        filtered = notifications.filter(n => n.status !== 'read')
        break
      case 'critical':
        filtered = notifications.filter(n => n.priority === 'critical')
        break
      case 'patient':
        filtered = notifications.filter(n => n.category === 'patient')
        break
      case 'staff':
        filtered = notifications.filter(n => n.category === 'staff')
        break
      case 'system':
        filtered = notifications.filter(n => n.category === 'system')
        break
    }

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(n => 
        n.title.toLowerCase().includes(query) ||
        n.message.toLowerCase().includes(query)
      )
    }

    // Group notifications
    if (groupMode === 'date') {
      const groups: Record<string, Notification[]> = {}
      
      filtered.forEach(n => {
        const date = new Date(n.createdAt)
        let key: string
        
        if (isToday(date)) {
          key = 'Today'
        } else if (isYesterday(date)) {
          key = 'Yesterday'
        } else {
          key = format(date, 'EEEE, MMMM d')
        }
        
        if (!groups[key]) groups[key] = []
        groups[key].push(n)
      })
      
      return { mode: 'date', groups }
    }

    if (groupMode === 'type') {
      const groups: Record<string, Notification[]> = {}
      
      filtered.forEach(n => {
        const key = n.type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
        if (!groups[key]) groups[key] = []
        groups[key].push(n)
      })
      
      return { mode: 'type', groups }
    }

    return { mode: 'none', notifications: filtered }
  }, [notifications, filter, searchQuery, groupMode])

  // Handle notification click
  const handleClick = (notification: Notification) => {
    if (notification.actionUrl) {
      window.location.href = notification.actionUrl
    }
    onNotificationClick?.(notification)
  }

  // Notification Bell Button
  const BellButton = (
    <button
      className={cn(
        'relative p-2 rounded-full transition-colors',
        'hover:bg-gray-100 dark:hover:bg-gray-800',
        hasCritical && 'animate-bounce'
      )}
      onClick={() => setIsOpen(!isOpen)}
    >
      <Bell className={cn(
        'w-5 h-5',
        hasUnread ? 'text-blue-600' : 'text-gray-600'
      )} />
      
      {/* Unread badge */}
      {hasUnread && (
        <span className={cn(
          'absolute -top-1 -right-1 flex items-center justify-center',
          'min-w-[18px] h-[18px] text-[10px] font-bold rounded-full',
          hasCritical 
            ? 'bg-red-500 text-white animate-pulse' 
            : 'bg-blue-500 text-white'
        )}>
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
      
      {/* Connection indicator */}
      <span className={cn(
        'absolute bottom-0 right-0 w-2 h-2 rounded-full border-2 border-white',
        isConnected ? 'bg-green-500' : 'bg-gray-400'
      )} />
    </button>
  )

  // Compact mode - just the bell with dropdown
  if (compact) {
    return (
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          {BellButton}
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="end">
          <div className="flex items-center justify-between p-3 border-b">
            <h4 className="font-semibold">Notifications</h4>
            {hasUnread && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 text-xs"
                onClick={() => markAllAsRead()}
              >
                Mark all read
              </Button>
            )}
          </div>
          <ScrollArea className="h-[300px]">
            {notifications.slice(0, 5).map(notification => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkRead={() => markAsRead(notification.id)}
                onDelete={() => deleteNotification(notification.id)}
                onClick={() => handleClick(notification)}
              />
            ))}
            {notifications.length === 0 && (
              <div className="flex flex-col items-center justify-center h-32 text-gray-500">
                <BellOff className="w-8 h-8 mb-2" />
                <p className="text-sm">No notifications</p>
              </div>
            )}
          </ScrollArea>
          {notifications.length > 5 && (
            <div className="p-2 border-t text-center">
              <Button variant="link" size="sm" className="text-xs">
                View all {notifications.length} notifications
              </Button>
            </div>
          )}
        </PopoverContent>
      </Popover>
    )
  }

  // Full notification center
  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        {BellButton}
      </SheetTrigger>
      
      <SheetContent className="w-full sm:max-w-md p-0 flex flex-col">
        {/* Header */}
        <SheetHeader className="p-4 border-b space-y-0">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notifications
              {hasUnread && (
                <Badge variant="secondary" className="ml-2">
                  {unreadCount} unread
                </Badge>
              )}
            </SheetTitle>
            
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setSoundEnabled(!soundEnabled)}
              >
                {soundEnabled ? (
                  <Volume2 className="w-4 h-4" />
                ) : (
                  <VolumeX className="w-4 h-4" />
                )}
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => markAllAsRead()}>
                    <CheckCheck className="w-4 h-4 mr-2" />
                    Mark all as read
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => clearAll()}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Clear all notifications
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setGroupMode('date')}>
                    Group by date
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setGroupMode('type')}>
                    Group by type
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setGroupMode('none')}>
                    No grouping
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          
          {/* Search */}
          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search notifications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </SheetHeader>

        {/* Filters */}
        <div className="border-b p-2 overflow-x-auto">
          <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterType)}>
            <TabsList className="w-full justify-start bg-transparent h-auto p-0">
              <TabsTrigger 
                value="all" 
                className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700"
              >
                All
              </TabsTrigger>
              <TabsTrigger 
                value="unread"
                className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700"
              >
                Unread {unreadCount > 0 && `(${unreadCount})`}
              </TabsTrigger>
              <TabsTrigger 
                value="critical"
                className="data-[state=active]:bg-red-100 data-[state=active]:text-red-700"
              >
                Critical
              </TabsTrigger>
              <TabsTrigger 
                value="patient"
                className="data-[state=active]:bg-green-100 data-[state=active]:text-green-700"
              >
                Patient
              </TabsTrigger>
              <TabsTrigger 
                value="staff"
                className="data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700"
              >
                Staff
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Notification List */}
        <ScrollArea className="flex-1" ref={scrollRef}>
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full" />
            </div>
          ) : filteredNotifications.mode === 'none' ? (
            <div>
              {(filteredNotifications as any).notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-gray-500">
                  <BellOff className="w-8 h-8 mb-2" />
                  <p className="text-sm">No notifications</p>
                </div>
              ) : (
                (filteredNotifications as any).notifications.map((notification: Notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkRead={() => markAsRead(notification.id)}
                    onDelete={() => deleteNotification(notification.id)}
                    onClick={() => handleClick(notification)}
                    isNew={latestNotification?.id === notification.id}
                  />
                ))
              )}
            </div>
          ) : (
            Object.entries((filteredNotifications as any).groups || {}).map(([title, items]) => (
              <NotificationGroup
                key={title}
                title={title}
                notifications={items as Notification[]}
                onMarkRead={markAsRead}
                onDelete={deleteNotification}
                onClick={handleClick}
              />
            ))
          )}
        </ScrollArea>

        {/* Footer */}
        <div className="p-3 border-t bg-gray-50 dark:bg-gray-900">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>
              {isConnected ? (
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-500 rounded-full" />
                  Connected
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-gray-400 rounded-full" />
                  Offline
                </span>
              )}
            </span>
            <span>{notifications.length} total notifications</span>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

// ============================================
// NOTIFICATION TOAST COMPONENT
// ============================================

export function NotificationToast({ 
  notification, 
  onClose,
  onClick 
}: { 
  notification: Notification
  onClose: () => void
  onClick?: () => void
}) {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000)
    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-4 rounded-lg shadow-lg border cursor-pointer',
        'bg-white dark:bg-gray-800',
        notification.priority === 'critical' && 'border-red-500 bg-red-50 dark:bg-red-950'
      )}
      onClick={onClick}
    >
      <NotificationIcon type={notification.type} priority={notification.priority} />
      
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm">{notification.title}</p>
        <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mt-0.5">
          {notification.message}
        </p>
      </div>
      
      <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={(e) => {
        e.stopPropagation()
        onClose()
      }}>
        <X className="w-4 h-4" />
      </Button>
    </div>
  )
}

// ============================================
// EXPORTS
// ============================================

export default NotificationCenter
