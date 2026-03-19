/**
 * Base Repository - Enterprise Pattern for Database Operations
 * 
 * This provides a consistent interface for all database operations
 * following the Repository Pattern for clean architecture separation.
 * 
 * All domain repositories should extend this base class.
 */

import { PrismaClient } from '@/generated/prisma'
import { getPrisma } from '@/lib/db'
import { createLogger } from '@/lib/logger'

const logger = createLogger('BaseRepository')

export interface PaginationOptions {
  page?: number
  limit?: number
  orderBy?: Record<string, 'asc' | 'desc'>
}

export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

export interface FilterOptions {
  where?: Record<string, any>
  include?: Record<string, any>
  select?: Record<string, any>
  orderBy?: Record<string, 'asc' | 'desc'>
}

export abstract class BaseRepository<T, CreateInput, UpdateInput> {
  protected prisma: PrismaClient | null = null
  protected modelName: string
  private prismaPromise: Promise<PrismaClient> | null = null

  constructor(modelName: string) {
    this.modelName = modelName
  }

  /**
   * Get Prisma client instance
   */
  protected async getClient(): Promise<PrismaClient> {
    if (!this.prisma) {
      this.prisma = await getPrisma()
    }
    if (!this.prisma) {
      throw new Error('Failed to get Prisma client')
    }
    return this.prisma
  }

  /**
   * Find a single record by ID
   */
  async findById(id: string, options?: FilterOptions): Promise<T | null> {
    try {
      const client = await this.getClient()
      const model = (client as any)[this.modelName]
      
      return await model.findUnique({
        where: { id },
        ...options
      })
    } catch (error) {
      logger.error(`Error finding ${this.modelName} by ID`, { id, error: String(error) })
      throw error
    }
  }

  /**
   * Find a single record by any field
   */
  async findOne(where: Record<string, any>, options?: FilterOptions): Promise<T | null> {
    try {
      const client = await this.getClient()
      const model = (client as any)[this.modelName]
      
      return await model.findFirst({
        where,
        ...options
      })
    } catch (error) {
      logger.error(`Error finding ${this.modelName}`, { where, error: String(error) })
      throw error
    }
  }

  /**
   * Find all records matching criteria
   */
  async findMany(options?: FilterOptions & PaginationOptions): Promise<T[]> {
    try {
      const client = await this.getClient()
      const model = (client as any)[this.modelName]
      
      const { page, limit, orderBy, ...filterOptions } = options || {}
      
      const queryOptions: any = { ...filterOptions }
      
      if (orderBy) {
        queryOptions.orderBy = orderBy
      }
      
      if (page && limit) {
        queryOptions.skip = (page - 1) * limit
        queryOptions.take = limit
      }
      
      return await model.findMany(queryOptions)
    } catch (error) {
      logger.error(`Error finding ${this.modelName} records`, { error: String(error) })
      throw error
    }
  }

  /**
   * Find records with pagination
   */
  async findPaginated(options?: FilterOptions & PaginationOptions): Promise<PaginatedResult<T>> {
    try {
      const client = await this.getClient()
      const model = (client as any)[this.modelName]
      
      const { page = 1, limit = 20, orderBy, where, include, select } = options || {}
      
      const queryOptions: any = {}
      if (where) queryOptions.where = where
      if (include) queryOptions.include = include
      if (select) queryOptions.select = select
      if (orderBy) queryOptions.orderBy = orderBy
      
      // Get total count
      const total = await model.count({ where })
      
      // Get paginated data
      queryOptions.skip = (page - 1) * limit
      queryOptions.take = limit
      
      const data = await model.findMany(queryOptions)
      
      const totalPages = Math.ceil(total / limit)
      
      return {
        data,
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    } catch (error) {
      logger.error(`Error paginating ${this.modelName} records`, { error: String(error) })
      throw error
    }
  }

  /**
   * Create a new record
   */
  async create(data: CreateInput): Promise<T> {
    try {
      const client = await this.getClient()
      const model = (client as any)[this.modelName]
      
      return await model.create({ data })
    } catch (error) {
      logger.error(`Error creating ${this.modelName}`, { error: String(error) })
      throw error
    }
  }

  /**
   * Update a record by ID
   */
  async update(id: string, data: UpdateInput): Promise<T> {
    try {
      const client = await this.getClient()
      const model = (client as any)[this.modelName]
      
      return await model.update({
        where: { id },
        data
      })
    } catch (error) {
      logger.error(`Error updating ${this.modelName}`, { id, error: String(error) })
      throw error
    }
  }

  /**
   * Delete a record by ID
   */
  async delete(id: string): Promise<T> {
    try {
      const client = await this.getClient()
      const model = (client as any)[this.modelName]
      
      return await model.delete({ where: { id } })
    } catch (error) {
      logger.error(`Error deleting ${this.modelName}`, { id, error: String(error) })
      throw error
    }
  }

  /**
   * Soft delete (sets isActive to false)
   */
  async softDelete(id: string): Promise<T> {
    try {
      const client = await this.getClient()
      const model = (client as any)[this.modelName]
      
      return await model.update({
        where: { id },
        data: { isActive: false }
      })
    } catch (error) {
      logger.error(`Error soft deleting ${this.modelName}`, { id, error: String(error) })
      throw error
    }
  }

  /**
   * Count records matching criteria
   */
  async count(where?: Record<string, any>): Promise<number> {
    try {
      const client = await this.getClient()
      const model = (client as any)[this.modelName]
      
      return await model.count({ where })
    } catch (error) {
      logger.error(`Error counting ${this.modelName} records`, { error: String(error) })
      throw error
    }
  }

  /**
   * Check if record exists
   */
  async exists(where: Record<string, any>): Promise<boolean> {
    try {
      const count = await this.count(where)
      return count > 0
    } catch (error) {
      logger.error(`Error checking ${this.modelName} existence`, { error: String(error) })
      throw error
    }
  }

  /**
   * Execute a transaction
   */
  async transaction<R>(fn: (prisma: PrismaClient) => Promise<R>): Promise<R> {
    const client = await this.getClient()
    return await client.$transaction(fn as any) as R
  }

  /**
   * Execute raw SQL query
   */
  async $queryRaw<T = any>(query: string, ...values: any[]): Promise<T[]> {
    try {
      const client = await this.getClient()
      return await client.$queryRawUnsafe(query, ...values)
    } catch (error) {
      logger.error(`Error executing raw query on ${this.modelName}`, { error: String(error) })
      throw error
    }
  }

  /**
   * Execute raw SQL command
   */
  async $executeRaw(query: string, ...values: any[]): Promise<number> {
    try {
      const client = await this.getClient()
      return await client.$executeRawUnsafe(query, ...values)
    } catch (error) {
      logger.error(`Error executing raw command on ${this.modelName}`, { error: String(error) })
      throw error
    }
  }
}
