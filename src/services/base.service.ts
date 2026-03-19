/**
 * Base Service - Enterprise Pattern for Business Logic
 * 
 * This provides a consistent interface for business logic operations
 * following the Service Layer Pattern for clean architecture separation.
 * 
 * All domain services should extend this base class.
 */

import { BaseRepository, PaginationOptions, PaginatedResult, FilterOptions } from '@/repositories/base.repository'
import { createLogger } from '@/lib/logger'
import { logAudit } from '@/lib/audit-logger'

export interface ServiceContext {
  userId?: string
  userName?: string
  userRole?: string
  ipAddress?: string
  requestId?: string
}

export abstract class BaseService<T, CreateInput, UpdateInput> {
  protected repository: BaseRepository<T, CreateInput, UpdateInput>
  protected logger: ReturnType<typeof createLogger>
  protected modelName: string

  constructor(
    modelName: string,
    repository: BaseRepository<T, CreateInput, UpdateInput>
  ) {
    this.modelName = modelName
    this.repository = repository
    this.logger = createLogger(`${modelName}Service`)
  }

  /**
   * Log an audit event
   */
  protected async auditLog(
    action: string,
    context: ServiceContext,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      logAudit({
        action,
        userId: context.userId || 'system',
        userName: context.userName || 'System',
        userRole: context.userRole || 'SYSTEM',
        resourceType: this.modelName,
        resourceId: metadata?.entityId,
        resourceIdentifier: metadata?.entityName,
        details: `${action} on ${this.modelName}`,
        notes: JSON.stringify({
          ...metadata,
          ipAddress: context.ipAddress,
          requestId: context.requestId
        })
      })
    } catch (error) {
      this.logger.error('Failed to log audit', { action, error: String(error) })
    }
  }

  /**
   * Get a single record by ID
   */
  async getById(id: string, context?: ServiceContext): Promise<T | null> {
    this.logger.debug(`Getting ${this.modelName} by ID`, { id, userId: context?.userId })
    
    const result = await this.repository.findById(id)
    
    // Audit sensitive data access
    if (result && context?.userId) {
      await this.auditLog('VIEW', context, { entityId: id })
    }
    
    return result
  }

  /**
   * Get a single record by criteria
   */
  async getOne(where: Record<string, any>, context?: ServiceContext): Promise<T | null> {
    this.logger.debug(`Getting ${this.modelName} by criteria`, { where, userId: context?.userId })
    return await this.repository.findOne(where)
  }

  /**
   * Get all records
   */
  async getAll(options?: FilterOptions & PaginationOptions, context?: ServiceContext): Promise<T[]> {
    this.logger.debug(`Getting all ${this.modelName} records`, { userId: context?.userId })
    return await this.repository.findMany(options)
  }

  /**
   * Get paginated records
   */
  async getPaginated(options?: FilterOptions & PaginationOptions, context?: ServiceContext): Promise<PaginatedResult<T>> {
    this.logger.debug(`Getting paginated ${this.modelName} records`, { userId: context?.userId })
    return await this.repository.findPaginated(options)
  }

  /**
   * Create a new record
   */
  async create(data: CreateInput, context?: ServiceContext): Promise<T> {
    this.logger.info(`Creating ${this.modelName}`, { userId: context?.userId })
    
    // Hook for pre-processing (override in subclass)
    const processedData = await this.beforeCreate(data, context)
    
    // Create the record
    const result = await this.repository.create(processedData)
    
    // Audit log
    if (context?.userId) {
      await this.auditLog('CREATE', context, { 
        entityId: (result as any).id,
        data: processedData 
      })
    }
    
    // Hook for post-processing (override in subclass)
    await this.afterCreate(result, context)
    
    return result
  }

  /**
   * Update an existing record
   */
  async update(id: string, data: UpdateInput, context?: ServiceContext): Promise<T> {
    this.logger.info(`Updating ${this.modelName}`, { id, userId: context?.userId })
    
    // Get existing record for comparison
    const existing = await this.repository.findById(id)
    if (!existing) {
      throw new Error(`${this.modelName} not found with ID: ${id}`)
    }
    
    // Hook for pre-processing (override in subclass)
    const processedData = await this.beforeUpdate(id, data, existing, context)
    
    // Update the record
    const result = await this.repository.update(id, processedData)
    
    // Audit log
    if (context?.userId) {
      await this.auditLog('UPDATE', context, { 
        entityId: id,
        previousData: existing,
        newData: processedData
      })
    }
    
    // Hook for post-processing (override in subclass)
    await this.afterUpdate(result, existing, context)
    
    return result
  }

  /**
   * Delete a record
   */
  async delete(id: string, context?: ServiceContext): Promise<T> {
    this.logger.info(`Deleting ${this.modelName}`, { id, userId: context?.userId })
    
    // Get existing record for audit
    const existing = await this.repository.findById(id)
    if (!existing) {
      throw new Error(`${this.modelName} not found with ID: ${id}`)
    }
    
    // Hook for pre-processing (override in subclass)
    await this.beforeDelete(id, existing, context)
    
    // Delete the record
    const result = await this.repository.delete(id)
    
    // Audit log
    if (context?.userId) {
      await this.auditLog('DELETE', context, { 
        entityId: id,
        deletedData: existing
      })
    }
    
    // Hook for post-processing (override in subclass)
    await this.afterDelete(existing, context)
    
    return result
  }

  /**
   * Soft delete a record (sets isActive to false)
   */
  async softDelete(id: string, context?: ServiceContext): Promise<T> {
    this.logger.info(`Soft deleting ${this.modelName}`, { id, userId: context?.userId })
    
    const result = await this.repository.softDelete(id)
    
    // Audit log
    if (context?.userId) {
      await this.auditLog('SOFT_DELETE', context, { entityId: id })
    }
    
    return result
  }

  /**
   * Count records
   */
  async count(where?: Record<string, any>, context?: ServiceContext): Promise<number> {
    this.logger.debug(`Counting ${this.modelName} records`, { userId: context?.userId })
    return await this.repository.count(where)
  }

  /**
   * Check if record exists
   */
  async exists(where: Record<string, any>, context?: ServiceContext): Promise<boolean> {
    return await this.repository.exists(where)
  }

  // Lifecycle hooks for subclasses to override

  /**
   * Called before creating a record. Override to add custom logic.
   */
  protected async beforeCreate(data: CreateInput, context?: ServiceContext): Promise<CreateInput> {
    return data
  }

  /**
   * Called after creating a record. Override to add custom logic.
   */
  protected async afterCreate(result: T, context?: ServiceContext): Promise<void> {
    // Override in subclass
  }

  /**
   * Called before updating a record. Override to add custom logic.
   */
  protected async beforeUpdate(id: string, data: UpdateInput, existing: T, context?: ServiceContext): Promise<UpdateInput> {
    return data
  }

  /**
   * Called after updating a record. Override to add custom logic.
   */
  protected async afterUpdate(result: T, previous: T, context?: ServiceContext): Promise<void> {
    // Override in subclass
  }

  /**
   * Called before deleting a record. Override to add custom logic.
   */
  protected async beforeDelete(id: string, existing: T, context?: ServiceContext): Promise<void> {
    // Override in subclass
  }

  /**
   * Called after deleting a record. Override to add custom logic.
   */
  protected async afterDelete(deleted: T, context?: ServiceContext): Promise<void> {
    // Override in subclass
  }

  /**
   * Validate data before create. Override to add custom validation.
   */
  async validateCreate(data: CreateInput, context?: ServiceContext): Promise<void> {
    // Override in subclass
  }

  /**
   * Validate data before update. Override to add custom validation.
   */
  async validateUpdate(id: string, data: UpdateInput, context?: ServiceContext): Promise<void> {
    // Override in subclass
  }
}
