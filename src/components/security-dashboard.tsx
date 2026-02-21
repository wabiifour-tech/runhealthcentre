'use client'

/**
 * Security Dashboard Component
 * Displays security status, audit logs, and security metrics
 * For RUN Health Centre HMS
 */

import React, { useState, useEffect } from 'react'
import { 
  Shield, 
  Activity, 
  AlertTriangle, 
  Lock, 
  Eye, 
  Fingerprint,
  FileText,
  ShieldCheck,
  ShieldAlert,
  Clock,
  User,
  Globe,
  Monitor,
  ChevronDown,
  ChevronUp,
  Download,
  RefreshCw
} from 'lucide-react'

// Types
interface SecurityStatus {
  feature: string
  status: 'active' | 'inactive' | 'warning'
  description: string
  icon: React.ReactNode
}

interface AuditLog {
  id: string
  timestamp: string
  userId?: string
  userEmail?: string
  action: string
  entity: string
  entityId?: string
  details?: string
  ipAddress?: string
  success: boolean
}

interface SecurityStats {
  totalLogs: number
  todayCount: number
  failedLogins: number
  securityAlerts: number
  patientAccessCount: number
}

// Security features status
const securityFeatures: SecurityStatus[] = [
  {
    feature: 'Password Hashing',
    status: 'active',
    description: 'Bcrypt with 12 salt rounds - Industry standard password protection',
    icon: <Lock className="w-5 h-5" />
  },
  {
    feature: 'Rate Limiting',
    status: 'active',
    description: '5 attempts max, 30-minute lockout - Prevents brute force attacks',
    icon: <Shield className="w-5 h-5" />
  },
  {
    feature: 'Session Management',
    status: 'active',
    description: '30-minute timeout with activity tracking - Automatic logout on inactivity',
    icon: <Clock className="w-5 h-5" />
  },
  {
    feature: 'Role-Based Access',
    status: 'active',
    description: 'Multi-tier authorization - DOCTOR, NURSE, LAB_TECH, PHARMACIST, ADMIN',
    icon: <User className="w-5 h-5" />
  },
  {
    feature: 'Audit Logging',
    status: 'active',
    description: 'Complete activity trail - HIPAA & NDPR Nigeria compliance',
    icon: <FileText className="w-5 h-5" />
  },
  {
    feature: 'Input Sanitization',
    status: 'active',
    description: 'XSS & SQL injection prevention - All inputs validated and sanitized',
    icon: <ShieldCheck className="w-5 h-5" />
  },
  {
    feature: 'Session Fingerprinting',
    status: 'active',
    description: 'Device/IP validation - Prevents session hijacking',
    icon: <Fingerprint className="w-5 h-5" />
  },
  {
    feature: 'Data Encryption',
    status: 'active',
    description: 'AES-256 encryption ready - Sensitive data protection at rest',
    icon: <Lock className="w-5 h-5" />
  }
]

export default function SecurityDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'logs' | 'alerts'>('overview')
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [stats, setStats] = useState<SecurityStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [expandedLog, setExpandedLog] = useState<string | null>(null)
  const [filter, setFilter] = useState({
    action: '',
    dateRange: 'today'
  })

  // Fetch audit logs
  const fetchAuditLogs = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/audit-logs?limit=50')
      if (response.ok) {
        const data = await response.json()
        setAuditLogs(data.logs || [])
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Failed to fetch audit logs:', error)
    } finally {
      setLoading(false)
    }
  }

  // Fetch stats
  const fetchStats = async () => {
    try {
      const response = await fetch('/api/audit-logs?stats=true')
      if (response.ok) {
        const data = await response.json()
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    }
  }

  useEffect(() => {
    fetchAuditLogs()
    fetchStats()
  }, [])

  // Export logs
  const exportLogs = async (format: 'json' | 'csv') => {
    try {
      const response = await fetch(`/api/audit-logs?export=true&format=${format}`)
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.${format}`
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Export failed:', error)
    }
  }

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleString('en-NG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  // Get action badge color
  const getActionColor = (action: string) => {
    if (action.includes('SUCCESS') || action.includes('CREATE')) {
      return 'bg-green-100 text-green-800'
    }
    if (action.includes('FAILED') || action.includes('DELETE')) {
      return 'bg-red-100 text-red-800'
    }
    if (action.includes('UPDATE') || action.includes('CHANGE')) {
      return 'bg-yellow-100 text-yellow-800'
    }
    if (action.includes('SECURITY') || action.includes('SUSPICIOUS')) {
      return 'bg-purple-100 text-purple-800'
    }
    return 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 p-3 rounded-xl">
                <ShieldCheck className="w-8 h-8 text-green-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Security Dashboard</h1>
                <p className="text-gray-500">RUN Health Centre HMS - Security Status & Audit Logs</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => fetchAuditLogs()}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow-sm p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Today's Activity</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.todayCount}</p>
                </div>
                <Activity className="w-8 h-8 text-blue-500" />
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Failed Logins</p>
                  <p className="text-2xl font-bold text-red-600">{stats.failedLogins}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Security Alerts</p>
                  <p className="text-2xl font-bold text-purple-600">{stats.securityAlerts}</p>
                </div>
                <ShieldAlert className="w-8 h-8 text-purple-500" />
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Patient Access</p>
                  <p className="text-2xl font-bold text-green-600">{stats.patientAccessCount}</p>
                </div>
                <Eye className="w-8 h-8 text-green-500" />
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <div className="flex">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition ${
                  activeTab === 'overview' 
                    ? 'border-blue-500 text-blue-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Security Overview
              </button>
              <button
                onClick={() => setActiveTab('logs')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition ${
                  activeTab === 'logs' 
                    ? 'border-blue-500 text-blue-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Audit Logs
              </button>
              <button
                onClick={() => setActiveTab('alerts')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition ${
                  activeTab === 'alerts' 
                    ? 'border-blue-500 text-blue-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Security Alerts
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'overview' && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Security Features Status</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {securityFeatures.map((feature, index) => (
                    <div 
                      key={index}
                      className="flex items-start gap-4 p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition"
                    >
                      <div className={`p-2 rounded-lg ${
                        feature.status === 'active' ? 'bg-green-100 text-green-600' :
                        feature.status === 'warning' ? 'bg-yellow-100 text-yellow-600' :
                        'bg-red-100 text-red-600'
                      }`}>
                        {feature.icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-gray-900">{feature.feature}</h3>
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                            feature.status === 'active' ? 'bg-green-100 text-green-700' :
                            feature.status === 'warning' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {feature.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">{feature.description}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Security Best Practices */}
                <div className="mt-8 p-6 bg-blue-50 rounded-xl">
                  <h3 className="text-lg font-semibold text-blue-900 mb-4">Security Best Practices</h3>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2 text-blue-800">
                      <ShieldCheck className="w-5 h-5 mt-0.5 flex-shrink-0" />
                      <span>Set ENCRYPTION_KEY environment variable for production data encryption</span>
                    </li>
                    <li className="flex items-start gap-2 text-blue-800">
                      <ShieldCheck className="w-5 h-5 mt-0.5 flex-shrink-0" />
                      <span>Enable HTTPS (automatically provided by Vercel deployment)</span>
                    </li>
                    <li className="flex items-start gap-2 text-blue-800">
                      <ShieldCheck className="w-5 h-5 mt-0.5 flex-shrink-0" />
                      <span>Review audit logs regularly for suspicious activity</span>
                    </li>
                    <li className="flex items-start gap-2 text-blue-800">
                      <ShieldCheck className="w-5 h-5 mt-0.5 flex-shrink-0" />
                      <span>Require password changes every 90 days for sensitive roles</span>
                    </li>
                    <li className="flex items-start gap-2 text-blue-800">
                      <ShieldCheck className="w-5 h-5 mt-0.5 flex-shrink-0" />
                      <span>Use Redis for rate limiting in production instead of in-memory storage</span>
                    </li>
                  </ul>
                </div>
              </div>
            )}

            {activeTab === 'logs' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Recent Audit Logs</h2>
                  <div className="flex items-center gap-2">
                    <select 
                      value={filter.action}
                      onChange={(e) => setFilter({ ...filter, action: e.target.value })}
                      className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">All Actions</option>
                      <option value="LOGIN">Login Events</option>
                      <option value="PATIENT">Patient Access</option>
                      <option value="SECURITY">Security Events</option>
                    </select>
                    <button 
                      onClick={() => exportLogs('csv')}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                    >
                      <Download className="w-4 h-4" />
                      Export CSV
                    </button>
                  </div>
                </div>

                {loading ? (
                  <div className="text-center py-8">
                    <RefreshCw className="w-8 h-8 text-gray-400 animate-spin mx-auto" />
                    <p className="text-gray-500 mt-2">Loading audit logs...</p>
                  </div>
                ) : auditLogs.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No audit logs found
                  </div>
                ) : (
                  <div className="space-y-2">
                    {auditLogs.map((log) => (
                      <div 
                        key={log.id}
                        className="border border-gray-200 rounded-lg overflow-hidden"
                      >
                        <button
                          onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                          className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition"
                        >
                          <div className="flex items-center gap-4">
                            <div className={`w-2 h-2 rounded-full ${log.success ? 'bg-green-500' : 'bg-red-500'}`} />
                            <div className="text-left">
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-0.5 text-xs font-medium rounded ${getActionColor(log.action)}`}>
                                  {log.action}
                                </span>
                                <span className="text-sm text-gray-500">{log.entity}</span>
                              </div>
                              <p className="text-sm text-gray-600 mt-1">
                                {log.userEmail || log.userId || 'System'} • {formatTimestamp(log.timestamp)}
                              </p>
                            </div>
                          </div>
                          {expandedLog === log.id ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                        </button>
                        
                        {expandedLog === log.id && (
                          <div className="px-4 pb-4 pt-0 border-t border-gray-100 bg-gray-50">
                            <dl className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <dt className="font-medium text-gray-500">IP Address</dt>
                                <dd className="text-gray-900 flex items-center gap-1 mt-1">
                                  <Globe className="w-4 h-4" />
                                  {log.ipAddress || 'Unknown'}
                                </dd>
                              </div>
                              <div>
                                <dt className="font-medium text-gray-500">Entity ID</dt>
                                <dd className="text-gray-900 mt-1">{log.entityId || 'N/A'}</dd>
                              </div>
                              {log.details && (
                                <div className="col-span-2">
                                  <dt className="font-medium text-gray-500">Details</dt>
                                  <dd className="text-gray-900 mt-1">{log.details}</dd>
                                </div>
                              )}
                            </dl>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'alerts' && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Security Alerts</h2>
                
                {auditLogs.filter(log => 
                  ['RATE_LIMIT_EXCEEDED', 'SUSPICIOUS_ACTIVITY', 'INJECTION_ATTEMPT', 'UNAUTHORIZED_ACCESS', 'ACCOUNT_LOCKED'].includes(log.action)
                ).length === 0 ? (
                  <div className="text-center py-12">
                    <ShieldCheck className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900">No Security Alerts</h3>
                    <p className="text-gray-500 mt-1">All systems are operating normally</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {auditLogs
                      .filter(log => 
                        ['RATE_LIMIT_EXCEEDED', 'SUSPICIOUS_ACTIVITY', 'INJECTION_ATTEMPT', 'UNAUTHORIZED_ACCESS', 'ACCOUNT_LOCKED'].includes(log.action)
                      )
                      .map((alert) => (
                        <div 
                          key={alert.id}
                          className="flex items-start gap-4 p-4 bg-red-50 border border-red-200 rounded-lg"
                        >
                          <AlertTriangle className="w-6 h-6 text-red-500 flex-shrink-0" />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium text-red-800">{alert.action.replace(/_/g, ' ')}</h4>
                              <span className="text-sm text-red-600">{formatTimestamp(alert.timestamp)}</span>
                            </div>
                            <p className="text-sm text-red-700 mt-1">{alert.details}</p>
                            <div className="flex items-center gap-4 mt-2 text-sm text-red-600">
                              <span className="flex items-center gap-1">
                                <Globe className="w-4 h-4" />
                                {alert.ipAddress}
                              </span>
                              <span className="flex items-center gap-1">
                                <Monitor className="w-4 h-4" />
                                {alert.userEmail || alert.userId || 'Unknown'}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500">
          <p>RUN Health Centre Hospital Management System</p>
          <p className="mt-1">Security measures comply with HIPAA and NDPR Nigeria requirements</p>
        </div>
      </div>
    </div>
  )
}
