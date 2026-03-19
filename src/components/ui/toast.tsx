"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface ToastProps {
  id?: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  variant?: 'default' | 'destructive' | 'success'
  children?: React.ReactNode
}

export interface ToastActionElement {
  altText?: string
}

export type ToastAction = {
  label: string
  onClick: () => void
}

export function Toast({ 
  className, 
  variant = 'default',
  title,
  description,
  action,
  children,
  ...props 
}: ToastProps & { className?: string }) {
  return (
    <div
      className={cn(
        "group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all",
        variant === 'default' && "border-gray-200 bg-white text-gray-900",
        variant === 'destructive' && "destructive group border-red-500 bg-red-50 text-red-900",
        variant === 'success' && "border-green-500 bg-green-50 text-green-900",
        className
      )}
      {...props}
    >
      {children || (
        <>
          <div className="grid gap-1">
            {title && (
              <div className="text-sm font-semibold">
                {title}
              </div>
            )}
            {description && (
              <div className="text-sm opacity-90">
                {description}
              </div>
            )}
          </div>
          {action}
        </>
      )}
    </div>
  )
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

export function ToastViewport({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]",
        className
      )}
    />
  )
}

export function ToastTitle({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("text-sm font-semibold", className)}
      {...props}
    />
  )
}

export function ToastDescription({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("text-sm opacity-90", className)}
      {...props}
    />
  )
}

export function ToastClose({ className, ...props }: React.HTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={cn(
        "absolute right-2 top-2 rounded-md p-1 text-gray-500 opacity-0 transition-opacity hover:text-gray-900 focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100",
        className
      )}
      {...props}
    >
      <span className="h-4 w-4">×</span>
    </button>
  )
}
