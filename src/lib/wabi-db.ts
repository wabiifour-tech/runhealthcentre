// Wabi AI - Nursing Education Platform Database Helper
import { PrismaClient } from '../generated/prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'

const globalForPrisma = globalThis as unknown as {
  wabiPrisma: PrismaClient | undefined
}

// Create PrismaClient with libsql adapter for SQLite
const createWabiPrismaClient = (): PrismaClient | null => {
  // Don't create during build
  if (process.env.NODE_ENV === 'production' && process.env.NEXT_PHASE === 'phase-production-build') {
    return null
  }
  
  // Get database URL
  const dbUrl = process.env.DATABASE_URL
  
  if (!dbUrl) {
    console.log('No DATABASE_URL configured')
    return null
  }
  
  try {
    // Convert file: URL to proper file:// format for libsql
    const libsqlUrl = dbUrl.startsWith('file://') ? dbUrl : dbUrl.replace('file:', 'file://')
    
    // Create Prisma adapter with libsql config
    const adapter = new PrismaLibSql({
      url: libsqlUrl
    })
    
    // Create PrismaClient with adapter
    return new PrismaClient({ adapter })
  } catch (error) {
    console.error('Failed to create Wabi Prisma client:', error)
    return null
  }
}

// Lazy initialization
let _wabiPrisma: PrismaClient | null = null

export const getWabiPrisma = (): PrismaClient | null => {
  if (!_wabiPrisma) {
    _wabiPrisma = globalForPrisma.wabiPrisma ?? createWabiPrismaClient()
    if (process.env.NODE_ENV !== 'production' && _wabiPrisma) {
      globalForPrisma.wabiPrisma = _wabiPrisma
    }
  }
  return _wabiPrisma
}

export const wabiPrisma = globalForPrisma.wabiPrisma ?? createWabiPrismaClient()

if (process.env.NODE_ENV !== 'production' && wabiPrisma) {
  globalForPrisma.wabiPrisma = wabiPrisma
}

// Types
export interface WabiUser {
  id: string
  email: string
  name: string
  password: string
  role: string
  avatar?: string | null
  level: number
  points: number
  streak: number
  createdAt: string
  updatedAt?: string | null
}

export interface WabiQuestion {
  id: string
  category: string
  subcategory?: string | null
  question: string
  options: string // JSON string of options array
  correctAnswer: number
  explanation?: string | null
  difficulty: string
  reference?: string | null
  createdAt: string
}

export interface WabiQuiz {
  id: string
  userId: string
  title: string
  questions: string // JSON string of question IDs
  score?: number | null
  totalQuestions: number
  timeTaken?: number | null
  completedAt?: string | null
  createdAt: string
}

export interface WabiUserProgress {
  id: string
  userId: string
  totalQuestions: number
  correctAnswers: number
  streak: number
  lastActiveDate?: string | null
  categoryStats: string // JSON string
  createdAt: string
  updatedAt?: string | null
}

export interface WabiDictionaryTerm {
  id: string
  term: string
  definition: string
  category?: string | null
  relatedTerms: string // JSON string
  createdAt: string
}

// Helper functions
export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

// User functions
export async function createUser(data: {
  email: string
  name: string
  password: string
  role?: string
}): Promise<WabiUser | null> {
  const db = getWabiPrisma()
  if (!db) return null
  
  try {
    const user = await db.wabi_users.create({
      data: {
        id: generateId(),
        email: data.email,
        name: data.name,
        password: data.password,
        role: data.role || 'student',
        level: 1,
        points: 0,
        streak: 0,
        createdAt: new Date().toISOString()
      }
    })
    return user as WabiUser
  } catch (error) {
    console.error('Error creating user:', error)
    return null
  }
}

export async function getUserByEmail(email: string): Promise<WabiUser | null> {
  const db = getWabiPrisma()
  if (!db) return null
  
  try {
    const user = await db.wabi_users.findUnique({
      where: { email }
    })
    return user as WabiUser | null
  } catch (error) {
    console.error('Error getting user:', error)
    return null
  }
}

export async function getUserById(id: string): Promise<WabiUser | null> {
  const db = getWabiPrisma()
  if (!db) return null
  
  try {
    const user = await db.wabi_users.findUnique({
      where: { id }
    })
    return user as WabiUser | null
  } catch (error) {
    console.error('Error getting user:', error)
    return null
  }
}

export async function updateUserProgress(userId: string, points: number, correct: boolean): Promise<void> {
  const db = getWabiPrisma()
  if (!db) return
  
  try {
    const today = new Date().toISOString().split('T')[0]
    
    // Get or create progress
    let progress = await db.wabi_user_progress.findFirst({
      where: { userId }
    })
    
    if (!progress) {
      progress = await db.wabi_user_progress.create({
        data: {
          id: generateId(),
          userId,
          totalQuestions: 1,
          correctAnswers: correct ? 1 : 0,
          streak: 1,
          lastActiveDate: today,
          categoryStats: '{}',
          createdAt: new Date().toISOString()
        }
      })
    } else {
      const stats = JSON.parse(progress.categoryStats || '{}')
      
      // Check streak
      const lastDate = progress.lastActiveDate
      let newStreak = progress.streak
      if (lastDate !== today) {
        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)
        if (lastDate === yesterday.toISOString().split('T')[0]) {
          newStreak = progress.streak + 1
        } else if (lastDate !== today) {
          newStreak = 1
        }
      }
      
      await db.wabi_user_progress.update({
        where: { id: progress.id },
        data: {
          totalQuestions: progress.totalQuestions + 1,
          correctAnswers: progress.correctAnswers + (correct ? 1 : 0),
          streak: newStreak,
          lastActiveDate: today,
          categoryStats: JSON.stringify(stats),
          updatedAt: new Date().toISOString()
        }
      })
    }
    
    // Update user points
    await db.wabi_users.update({
      where: { id: userId },
      data: {
        points: { increment: points },
        updatedAt: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('Error updating progress:', error)
  }
}

// Question functions
export async function getQuestions(options?: {
  category?: string
  difficulty?: string
  limit?: number
  offset?: number
}): Promise<WabiQuestion[]> {
  const db = getWabiPrisma()
  if (!db) return []
  
  try {
    const where: Record<string, unknown> = {}
    if (options?.category) where.category = options.category
    if (options?.difficulty) where.difficulty = options.difficulty
    
    const questions = await db.wabi_questions.findMany({
      where,
      take: options?.limit || 50,
      skip: options?.offset || 0
    })
    return questions as WabiQuestion[]
  } catch (error) {
    console.error('Error getting questions:', error)
    return []
  }
}

export async function getQuestionById(id: string): Promise<WabiQuestion | null> {
  const db = getWabiPrisma()
  if (!db) return null
  
  try {
    const question = await db.wabi_questions.findUnique({
      where: { id }
    })
    return question as WabiQuestion | null
  } catch (error) {
    console.error('Error getting question:', error)
    return null
  }
}

export async function getQuestionCount(): Promise<number> {
  const db = getWabiPrisma()
  if (!db) return 0
  
  try {
    return await db.wabi_questions.count()
  } catch (error) {
    console.error('Error counting questions:', error)
    return 0
  }
}

export async function getCategories(): Promise<string[]> {
  const db = getWabiPrisma()
  if (!db) return []
  
  try {
    const result = await db.wabi_questions.findMany({
      select: { category: true },
      distinct: ['category']
    })
    return result.map((r: { category: string }) => r.category)
  } catch (error) {
    console.error('Error getting categories:', error)
    return []
  }
}

// Quiz functions
export async function createQuiz(data: {
  userId: string
  title: string
  questionIds: string[]
}): Promise<WabiQuiz | null> {
  const db = getWabiPrisma()
  if (!db) return null
  
  try {
    const quiz = await db.wabi_quizzes.create({
      data: {
        id: generateId(),
        userId: data.userId,
        title: data.title,
        questions: JSON.stringify(data.questionIds),
        totalQuestions: data.questionIds.length,
        createdAt: new Date().toISOString()
      }
    })
    return quiz as WabiQuiz
  } catch (error) {
    console.error('Error creating quiz:', error)
    return null
  }
}

export async function submitQuiz(quizId: string, data: {
  score: number
  timeTaken: number
}): Promise<WabiQuiz | null> {
  const db = getWabiPrisma()
  if (!db) return null
  
  try {
    const quiz = await db.wabi_quizzes.update({
      where: { id: quizId },
      data: {
        score: data.score,
        timeTaken: data.timeTaken,
        completedAt: new Date().toISOString()
      }
    })
    return quiz as WabiQuiz
  } catch (error) {
    console.error('Error submitting quiz:', error)
    return null
  }
}

export async function getUserQuizzes(userId: string): Promise<WabiQuiz[]> {
  const db = getWabiPrisma()
  if (!db) return []
  
  try {
    const quizzes = await db.wabi_quizzes.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20
    })
    return quizzes as WabiQuiz[]
  } catch (error) {
    console.error('Error getting user quizzes:', error)
    return []
  }
}

// Daily notes functions
export async function getDailyNotes(limit?: number): Promise<Array<{
  id: string
  date: string
  title: string
  content: string
  category?: string | null
  author?: string | null
  createdAt: string
}>> {
  const db = getWabiPrisma()
  if (!db) return []
  
  try {
    const notes = await db.wabi_daily_notes.findMany({
      orderBy: { date: 'desc' },
      take: limit || 30
    })
    return notes
  } catch (error) {
    console.error('Error getting daily notes:', error)
    return []
  }
}

// Dictionary functions
export async function getDictionaryTerms(options?: {
  category?: string
  search?: string
  limit?: number
}): Promise<WabiDictionaryTerm[]> {
  const db = getWabiPrisma()
  if (!db) return []
  
  try {
    const where: Record<string, unknown> = {}
    if (options?.category) where.category = options.category
    
    const terms = await db.wabi_terms.findMany({
      where,
      take: options?.limit || 100
    })
    return terms as WabiDictionaryTerm[]
  } catch (error) {
    console.error('Error getting dictionary terms:', error)
    return []
  }
}

// Seed random number generator with date
export function seededRandom(seed: number): () => number {
  return function() {
    const x = Math.sin(seed++) * 10000
    return x - Math.floor(x)
  }
}

// Get daily questions based on date and shift
export async function getDailyQuestions(date: string, shift: 'morning' | 'night'): Promise<WabiQuestion[]> {
  const db = getWabiPrisma()
  if (!db) return []
  
  try {
    // Check if we already have daily questions for this date/shift
    const dailyQuestions = await db.wabi_daily_questions.findFirst({
      where: { date, shift }
    })
    
    if (dailyQuestions) {
      const questionIds = JSON.parse(dailyQuestions.questionIds)
      const questions = await db.wabi_questions.findMany({
        where: { id: { in: questionIds } }
      })
      return questions as WabiQuestion[]
    }
    
    // Generate new daily questions
    const seed = parseInt(date.replace(/-/g, '')) + (shift === 'morning' ? 0 : 1000000)
    const random = seededRandom(seed)
    
    const allQuestions = await db.wabi_questions.findMany()
    const shuffled = [...allQuestions].sort(() => random() - 0.5)
    const selectedQuestions = shuffled.slice(0, 100)
    
    // Save daily questions
    await db.wabi_daily_questions.create({
      data: {
        id: generateId(),
        date,
        shift,
        questionIds: JSON.stringify(selectedQuestions.map((q: { id: string }) => q.id)),
        completed: '[]',
        createdAt: new Date().toISOString()
      }
    })
    
    return selectedQuestions as WabiQuestion[]
  } catch (error) {
    console.error('Error getting daily questions:', error)
    return []
  }
}

// Notification functions
export async function createNotification(data: {
  userId?: string
  title: string
  message: string
  type: string
  scheduledFor?: string
}): Promise<void> {
  const db = getWabiPrisma()
  if (!db) return
  
  try {
    await db.wabi_notifications.create({
      data: {
        id: generateId(),
        userId: data.userId,
        title: data.title,
        message: data.message,
        type: data.type,
        scheduledFor: data.scheduledFor,
        createdAt: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('Error creating notification:', error)
  }
}

export async function getUserNotifications(userId: string): Promise<Array<{
  id: string
  title: string
  message: string
  type: string
  isRead: boolean
  createdAt: string
}>> {
  const db = getWabiPrisma()
  if (!db) return []
  
  try {
    const notifications = await db.wabi_notifications.findMany({
      where: {
        OR: [
          { userId },
          { userId: null } // Global notifications
        ]
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    })
    return notifications
  } catch (error) {
    console.error('Error getting notifications:', error)
    return []
  }
}

// Bookmark functions
export async function addBookmark(userId: string, questionId: string): Promise<void> {
  const db = getWabiPrisma()
  if (!db) return
  
  try {
    // Check if already bookmarked
    const existing = await db.wabi_bookmarks.findFirst({
      where: { userId, questionId }
    })
    
    if (!existing) {
      await db.wabi_bookmarks.create({
        data: {
          id: generateId(),
          userId,
          questionId,
          createdAt: new Date().toISOString()
        }
      })
    }
  } catch (error) {
    console.error('Error adding bookmark:', error)
  }
}

export async function removeBookmark(userId: string, questionId: string): Promise<void> {
  const db = getWabiPrisma()
  if (!db) return
  
  try {
    const bookmark = await db.wabi_bookmarks.findFirst({
      where: { userId, questionId }
    })
    
    if (bookmark) {
      await db.wabi_bookmarks.delete({
        where: { id: bookmark.id }
      })
    }
  } catch (error) {
    console.error('Error removing bookmark:', error)
  }
}

export async function getUserBookmarks(userId: string): Promise<string[]> {
  const db = getWabiPrisma()
  if (!db) return []
  
  try {
    const bookmarks = await db.wabi_bookmarks.findMany({
      where: { userId },
      select: { questionId: true }
    })
    return bookmarks.map((b: { questionId: string }) => b.questionId)
  } catch (error) {
    console.error('Error getting bookmarks:', error)
    return []
  }
}

export default wabiPrisma
