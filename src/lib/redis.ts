import { Redis } from '@upstash/redis'

// Redis client for cross-device data persistence
// Requires UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN environment variables
export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
})

// Helper to check if Redis is configured
export const isRedisConfigured = () => {
  return !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)
}

// Keys for different data types
export const REDIS_KEYS = {
  USERS: 'run_hms:users',
  PATIENTS: 'run_hms:patients',
  CONSULTATIONS: 'run_hms:consultations',
  VITALS: 'run_hms:vitals',
  APPOINTMENTS: 'run_hms:appointments',
  LAB_REQUESTS: 'run_hms:lab_requests',
  LAB_RESULTS: 'run_hms:lab_results',
  PRESCRIPTIONS: 'run_hms:prescriptions',
  PAYMENTS: 'run_hms:payments',
  ANNOUNCEMENTS: 'run_hms:announcements',
  QUEUE: 'run_hms:queue',
}
