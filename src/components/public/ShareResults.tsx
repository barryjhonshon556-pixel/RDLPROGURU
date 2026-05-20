'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Share2, Copy, MessageCircle, Send, Twitter, Check, X } from 'lucide-react'
import { toast } from 'sonner'
import { useTodayResults, useSiteSettings } from '@/hooks/useResults'
import { TIME_SLOTS, MONTH_NAMES } from '@/lib/constants'
import { getClientISTDate } from '@/lib/ist-date'

export function ShareResults() {
  const [isOpen, setIsOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const modalRef = useRef<HTMLDivElement>(null)
  const { data: results } = useTodayResults()
  const { data: settings } = useSiteSettings()

  // Close modal when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  // Close on Escape key
  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') setIsOpen(false)
    }
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
    }
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen])

  const formatResultsText = useCallback(() => {
    if (!results?.slots) return ''

    const ist = getClientISTDate()
    const day = ist.day
    const month = MONTH_NAMES[ist.month]
    const year = ist.year
    const siteName = settings?.site_name || 'RDL Pro Matka'
    const siteUrl = typeof window !== 'undefined' ? window.location.origin : ''

    let text = `🔔 ${siteName} - Live Results\n`
    text += `📅 Date: ${month} ${day}, ${year}\n\n`

    results.slots.forEach((slot, index) => {
      const timeSlot = TIME_SLOTS[index]
      const timeLabel = timeSlot?.label || slot.label || ''
      const hasResult = slot.result !== null && slot.result !== undefined
      const resultStr = hasResult ? String(slot.result).padStart(2, '0') : '--'
      const status = hasResult ? '✅' : '⏳'

      text += `⏰ ${timeLabel}: ${resultStr} ${status}\n`
    })

    text += `\n🎯 Visit: ${siteUrl} for live updates!`
    return text
  }, [results, settings])

  const handleCopyText = useCallback(async () => {
    const text = formatResultsText()
    if (!text) return

    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      toast.success('Results copied to clipboard!', { duration: 2000 })
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = text
      textArea.style.position = 'fixed'
      textArea.style.left = '-9999px'
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopied(true)
      toast.success('Results copied to clipboard!', { duration: 2000 })
      setTimeout(() => setCopied(false), 2000)
    }
  }, [formatResultsText])

  const handleShareWhatsApp = useCallback(() => {
    const text = formatResultsText()
    if (!text) return
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`
    window.open(url, '_blank', 'noopener,noreferrer')
    setIsOpen(false)
  }, [formatResultsText])

  const handleShareTelegram = useCallback(() => {
    const text = formatResultsText()
    if (!text) return
    const siteUrl = typeof window !== 'undefined' ? window.location.origin : ''
    const url = `https://t.me/share/url?url=${encodeURIComponent(siteUrl)}&text=${encodeURIComponent(text)}`
    window.open(url, '_blank', 'noopener,noreferrer')
    setIsOpen(false)
  }, [formatResultsText])

  const handleShareTwitter = useCallback(() => {
    const text = formatResultsText()
    if (!text) return
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`
    window.open(url, '_blank', 'noopener,noreferrer')
    setIsOpen(false)
  }, [formatResultsText])

  const shareOptions = [
    {
      label: 'Copy Text',
      icon: copied ? Check : Copy,
      color: 'text-[var(--text-secondary)]',
      bgColor: 'bg-[var(--bg-card-alt)]',
      hoverBg: 'hover:bg-[var(--accent-blue-subtle)]',
      onClick: handleCopyText,
    },
    {
      label: 'WhatsApp',
      icon: MessageCircle,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      hoverBg: 'hover:bg-green-500/20',
      onClick: handleShareWhatsApp,
    },
    {
      label: 'Telegram',
      icon: Send,
      color: 'text-[var(--accent-telegram)]',
      bgColor: 'bg-[var(--accent-telegram)]/10',
      hoverBg: 'hover:bg-[var(--accent-telegram)]/20',
      onClick: handleShareTelegram,
    },
    {
      label: 'Twitter / X',
      icon: Twitter,
      color: 'text-sky-500',
      bgColor: 'bg-sky-500/10',
      hoverBg: 'hover:bg-sky-500/20',
      onClick: handleShareTwitter,
    },
  ]

  return (
    <>
      {/* Floating Share Button - positioned at bottom-left, above ScrollToTop */}
      <motion.button
        onClick={() => setIsOpen(true)}
        whileHover={{ scale: 1.1, boxShadow: '0 0 20px rgba(0, 102, 255, 0.5)' }}
        whileTap={{ scale: 0.9 }}
        aria-label="Share results"
        className="fixed bottom-6 left-6 z-50 size-11 rounded-full bg-gradient-to-b from-[var(--accent-blue)] to-[var(--accent-blue-hover)] text-white shadow-lg flex items-center justify-center hover:from-[var(--accent-blue-hover)] hover:to-[var(--accent-blue)] active:scale-90 transition-colors cursor-pointer"
      >
        <Share2 className="size-5" />
      </motion.button>

      {/* Share Modal Overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm"
              onClick={() => setIsOpen(false)}
            />

            {/* Modal */}
            <motion.div
              ref={modalRef}
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed z-[70] bottom-20 left-6 sm:left-1/2 sm:-translate-x-1/2 sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2 w-[calc(100vw-3rem)] sm:w-96 max-w-md"
            >
              <div className="rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-color)] bg-[var(--bg-card-alt)]">
                  <div className="flex items-center gap-2.5">
                    <div className="size-8 rounded-full bg-[var(--accent-blue-subtle)] flex items-center justify-center">
                      <Share2 className="size-4 text-[var(--accent-blue)]" />
                    </div>
                    <h3 className="text-base font-bold text-[var(--text-primary)]">Share Results</h3>
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="size-7 rounded-full flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-input)] transition-colors cursor-pointer"
                    aria-label="Close share modal"
                  >
                    <X className="size-4" />
                  </button>
                </div>

                {/* Results Preview */}
                <div className="px-5 py-3 border-b border-[var(--border-color)]">
                  <p className="text-xs text-[var(--text-muted)] mb-1.5 font-medium">Preview</p>
                  <div className="bg-[var(--bg-input)] rounded-lg p-3 max-h-32 overflow-y-auto text-xs text-[var(--text-secondary)] whitespace-pre-wrap font-mono leading-relaxed">
                    {formatResultsText() || 'Loading results...'}
                  </div>
                </div>

                {/* Share Options */}
                <div className="p-4">
                  <p className="text-xs text-[var(--text-muted)] mb-3 font-medium">Share via</p>
                  <div className="grid grid-cols-2 gap-2.5">
                    {shareOptions.map((option) => (
                      <motion.button
                        key={option.label}
                        onClick={option.onClick}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        className={`flex items-center gap-2.5 px-3.5 py-3 rounded-xl ${option.bgColor} ${option.hoverBg} border border-[var(--border-color)] transition-colors cursor-pointer`}
                      >
                        <option.icon className={`size-4.5 ${option.color} shrink-0`} />
                        <span className="text-sm font-medium text-[var(--text-primary)]">{option.label}</span>
                      </motion.button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
