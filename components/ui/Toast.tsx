'use client'

import React, { useEffect, useState } from 'react'
import { Check, AlertCircle, Info, X } from 'lucide-react'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

interface ToastProps {
  id: string
  message: string
  type?: ToastType
  duration?: number
  onClose: (id: string) => void
}

const toastStyles = {
  success: {
    bg: 'bg-success/10',
    border: 'border-success/20',
    text: 'text-success',
    icon: Check,
  },
  error: {
    bg: 'bg-destructive/10',
    border: 'border-destructive/20',
    text: 'text-destructive',
    icon: AlertCircle,
  },
  info: {
    bg: 'bg-primary/10',
    border: 'border-primary/20',
    text: 'text-primary',
    icon: Info,
  },
  warning: {
    bg: 'bg-warning/10',
    border: 'border-warning/20',
    text: 'text-warning',
    icon: AlertCircle,
  },
}

export function Toast({
  id,
  message,
  type = 'info',
  duration = 4000,
  onClose,
}: ToastProps) {
  const [isVisible, setIsVisible] = useState(true)
  const style = toastStyles[type]
  const Icon = style.icon

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(() => onClose(id), 300)
    }, duration)

    return () => clearTimeout(timer)
  }, [id, duration, onClose])

  return (
    <div
      className={`
        fixed bottom-20 left-4 right-4 max-w-sm mx-auto
        transform transition-all duration-300 z-30
        ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0 pointer-events-none'}
      `}
    >
      <div
        className={`
          flex items-center gap-3 p-4 rounded-lg border
          ${style.bg} ${style.border}
        `}
      >
        <Icon size={20} className={style.text} />
        <p className={`flex-1 text-sm font-medium ${style.text}`}>{message}</p>
        <button
          onClick={() => {
            setIsVisible(false)
            setTimeout(() => onClose(id), 300)
          }}
          className={`p-1 hover:bg-black/10 rounded transition-colors ${style.text}`}
        >
          <X size={16} />
        </button>
      </div>
    </div>
  )
}

// Toast Container Component
export function ToastContainer() {
  const [toasts, setToasts] = useState<Array<ToastProps & { id: string }>>([])

  const addToast = (message: string, type: ToastType = 'info', duration?: number) => {
    const id = Math.random().toString()
    const toast = { id, message, type, duration, onClose: removeToast }
    setToasts((prev) => [...prev, toast])
  }

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  // Expose globally
  ;(window as any).showToast = addToast

  return (
    <div className="fixed bottom-0 left-0 right-0 pointer-events-none">
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} />
      ))}
    </div>
  )
}
