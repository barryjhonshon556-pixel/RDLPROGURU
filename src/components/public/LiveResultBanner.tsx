'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useTodayResults, useSiteSettings } from '@/hooks/useResults'
import { TIME_SLOTS } from '@/lib/constants'
import { getClientISTDate } from '@/lib/ist-date'
import { AlertCircle, CheckCircle2, Radio, Copy, Zap } from 'lucide-react'
import { toast } from 'sonner'

// Hook to get the current active time slot
function useCurrentSlot() {
  const [currentSlot, setCurrentSlot] = useState<{ index: number; label: string; shortLabel: string }>({
    index: 1,
    label: '12:00 PM',
    shortLabel: '12PM',
  })

  useEffect(() => {
    function calculate() {
      const ist = getClientISTDate()
      const currentHour = ist.hour
      let activeSlot = TIME_SLOTS[0]
      for (let i = TIME_SLOTS.length - 1; i >= 0; i--) {
        if (currentHour >= TIME_SLOTS[i].hour) {
          activeSlot = TIME_SLOTS[i]
          break
        }
      }
      // If before first slot (before 12PM), show next slot
      if (currentHour < TIME_SLOTS[0].hour) {
        activeSlot = TIME_SLOTS[0]
      }
      const shortLabel = activeSlot.label.replace(':00 ', '').replace(' ', '')
      setCurrentSlot({ index: activeSlot.index, label: activeSlot.label, shortLabel })
    }
    calculate()
    const interval = setInterval(calculate, 60000) // update every minute
    return () => clearInterval(interval)
  }, [])

  return currentSlot
}

// Slot gradient colors for pill indicators
const SLOT_GRADIENTS = [
  'from-blue-500 to-cyan-400',
  'from-purple-500 to-pink-400',
  'from-green-500 to-emerald-400',
  'from-orange-500 to-amber-400',
  'from-red-500 to-rose-400',
  'from-indigo-500 to-violet-400',
]

export function LiveResultBanner() {
  const { data, isLoading } = useTodayResults()
  const { data: settings } = useSiteSettings()
  const currentSlot = useCurrentSlot()

  const slots = data?.slots ?? []
  const bannerText = settings?.banner_text || 'RDL PRO LIVE RESULT TODAY'
  const siteName = settings?.site_name || 'RDL PRO'

  // Count how many slots have results for progress
  const filledSlots = slots.filter(
    (s) => s && s.result !== null && s.result !== undefined
  ).length

  return (
    <section className="w-full bg-[var(--bg-primary)] py-4 sm:py-6">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="bg-[var(--bg-card)] rounded-xl shadow-[var(--card-shadow-lg)] overflow-hidden border-2 border-red-500/30"
        >
          {/* Header - Dramatic Red gradient */}
          <div className="bg-gradient-to-r from-red-700 via-red-600 to-red-500 px-4 py-2.5 sm:py-3 text-center relative overflow-hidden">
            {/* Subtle diagonal stripe overlay */}
            <div
              className="absolute inset-0 opacity-[0.07]"
              style={{
                backgroundImage:
                  'repeating-linear-gradient(45deg, transparent, transparent 10px, #fff 10px, #fff 12px)',
              }}
            />
            <div className="relative flex items-center justify-center gap-2 sm:gap-3">
              {/* Flashing LIVE badge */}
              <motion.div
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
                className="flex items-center gap-1.5 bg-red-900/50 px-2 py-0.5 rounded-full border border-red-400/40"
              >
                <span className="relative flex size-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex rounded-full size-2 bg-red-500" />
                </span>
                <Radio className="size-3 text-red-300" />
                <span className="text-red-200 text-[9px] sm:text-[10px] font-black tracking-widest">LIVE</span>
              </motion.div>

              <h2 className="text-white font-extrabold text-base sm:text-lg md:text-xl tracking-wide">
                {bannerText}
              </h2>

              {/* Flashing LIVE badge (right side) */}
              <motion.div
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut', delay: 0.6 }}
                className="flex items-center gap-1.5 bg-red-900/50 px-2 py-0.5 rounded-full border border-red-400/40"
              >
                <span className="relative flex size-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex rounded-full size-2 bg-red-500" />
                </span>
                <Radio className="size-3 text-red-300" />
                <span className="text-red-200 text-[9px] sm:text-[10px] font-black tracking-widest">LIVE</span>
              </motion.div>
            </div>
          </div>

          {/* Gradient wave divider between header and results */}
          <div className="relative h-4 overflow-hidden">
            <svg className="absolute bottom-0 w-full h-4 text-[var(--bg-card)]" viewBox="0 0 1200 20" preserveAspectRatio="none">
              <path
                d="M0,20 C150,0 350,0 500,20 C650,0 850,0 1000,20 C1100,10 1150,5 1200,20 L1200,20 L0,20 Z"
                fill="currentColor"
              />
            </svg>
            <div className="absolute top-0 w-full h-4 bg-gradient-to-b from-red-600 to-transparent" />
          </div>

          {/* Current Slot Indicator Banner */}
          <div className="bg-[var(--bg-card)] px-3 sm:px-6 pt-2 pb-0">
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="relative flex items-center justify-center gap-2 sm:gap-3 py-2.5 sm:py-3 px-4 sm:px-6 rounded-lg bg-gradient-to-r from-[var(--accent-blue-subtle)] via-[var(--bg-card-alt)] to-[var(--accent-blue-subtle)] border-2 border-[var(--accent-blue-border)] overflow-hidden"
              style={{
                boxShadow: '0 0 15px rgba(0, 102, 255, 0.15), inset 0 0 15px rgba(0, 102, 255, 0.05)',
              }}
            >
              {/* Animated border glow effect */}
              <motion.div
                className="absolute inset-0 rounded-lg pointer-events-none"
                animate={{
                  boxShadow: [
                    '0 0 8px rgba(0, 102, 255, 0.1), inset 0 0 8px rgba(0, 102, 255, 0.03)',
                    '0 0 20px rgba(0, 102, 255, 0.25), inset 0 0 20px rgba(0, 102, 255, 0.08)',
                    '0 0 8px rgba(0, 102, 255, 0.1), inset 0 0 8px rgba(0, 102, 255, 0.03)',
                  ],
                }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
              />
              {/* Animated gradient border sweep */}
              <motion.div
                className="absolute inset-0 rounded-lg pointer-events-none border-2 border-transparent"
                style={{
                  background: 'linear-gradient(90deg, transparent, rgba(0,102,255,0.3), transparent) border-box',
                  WebkitMask: 'linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)',
                  WebkitMaskComposite: 'xor',
                  maskComposite: 'exclude',
                }}
                animate={{ opacity: [0, 1, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              />
              <span className="text-[var(--accent-blue)] text-base sm:text-lg font-bold">▶</span>
              <Zap className="size-4 sm:size-5 text-[var(--accent-blue)]" />
              <span className="text-[var(--text-secondary)] text-sm sm:text-base font-medium">
                Current:
              </span>
              <span className="text-[var(--accent-blue)] font-extrabold text-base sm:text-lg tracking-wide">
                {siteName} {currentSlot.shortLabel}
              </span>
              <motion.span
                animate={{ opacity: [1, 0.4, 1] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                className="relative flex size-2"
              >
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--accent-blue)] opacity-75" />
                <span className="relative inline-flex rounded-full size-2 bg-[var(--accent-blue)]" />
              </motion.span>
            </motion.div>
          </div>

          {/* Slot number indicators (1-6) with colored gradient pills */}
          <div className="bg-[var(--bg-card)] px-3 sm:px-6 pt-1 pb-1">
            <div className="flex items-center justify-center gap-1.5 sm:gap-2 mb-2">
              {TIME_SLOTS.map((slot, index) => {
                const slotData = slots[index]
                const hasResult = slotData && slotData.result !== null && slotData.result !== undefined
                return (
                  <motion.div
                    key={slot.index}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 + index * 0.05, type: 'spring' }}
                    className={`inline-flex items-center justify-center size-6 sm:size-7 rounded-full bg-gradient-to-br ${SLOT_GRADIENTS[index]} ${
                      hasResult ? 'ring-2 ring-green-400 ring-offset-1 ring-offset-[var(--bg-card)]' : 'opacity-50'
                    }`}
                  >
                    <span className="text-white text-[9px] sm:text-[10px] font-black">{index + 1}</span>
                  </motion.div>
                )
              })}
            </div>
          </div>

          {/* Results Area */}
          <div className="bg-[var(--bg-card-alt)] px-3 sm:px-6 py-4 sm:py-5">
            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-red-500 mr-2" />
                <span className="text-[var(--text-secondary)] text-sm">Loading live results...</span>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
                {TIME_SLOTS.map((slotDef, index) => {
                  const slotData = slots[index]
                  const hasResult =
                    slotData &&
                    slotData.result !== null &&
                    slotData.result !== undefined

                  const resultStr = slotData?.result != null ? String(slotData.result).padStart(2, '0') : '--'
                  const shortLabel = slotDef.label.replace(':00 ', '').replace(' ', '')

                  return (
                    <motion.div
                      key={slotDef.index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.06 }}
                      className={`relative rounded-lg shadow-sm p-3 sm:p-4 text-center overflow-hidden ${
                        hasResult
                          ? 'border border-green-200/60'
                          : 'border-2 border-dashed border-orange-300/60'
                      } ${index % 2 === 0 ? 'bg-[var(--bg-card)]' : 'bg-[var(--bg-card-alt)]'}`}
                      style={
                        !hasResult
                          ? { animation: 'border-rotate 4s linear infinite' }
                          : undefined
                      }
                    >
                      {/* Slot gradient pill badge */}
                      <div className="absolute top-1 right-1">
                        <span className={`inline-flex items-center justify-center size-4 sm:size-5 rounded-full bg-gradient-to-br ${SLOT_GRADIENTS[index]} text-white text-[7px] sm:text-[8px] font-black`}>
                          {index + 1}
                        </span>
                      </div>

                      <p className="text-[var(--accent-blue)] font-bold text-[10px] sm:text-xs mb-2">
                        {siteName} {shortLabel}
                      </p>
                      {hasResult ? (
                        <>
                          <div className="flex items-center justify-center gap-1">
                            <motion.p
                              initial={{ scale: 0.5, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                              className="text-green-600 font-extrabold text-xl sm:text-2xl md:text-3xl"
                            >
                              {resultStr}
                            </motion.p>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(resultStr)
                                toast.success('Copied!', { duration: 1500 })
                              }}
                              className="p-1 rounded-md hover:bg-[var(--accent-blue-subtle)] transition-colors group"
                              title="Copy result"
                            >
                              <Copy className="size-3 text-[var(--text-muted)] group-hover:text-green-600 transition-colors" />
                            </button>
                          </div>
                          <div className="flex items-center justify-center gap-0.5 mt-1">
                            <CheckCircle2 className="size-3 text-green-500" />
                            <span className="text-green-600 text-[9px] sm:text-[10px] font-semibold">
                              RESULT
                            </span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex items-center justify-center">
                            <motion.span
                              animate={{ opacity: [0.5, 1, 0.5] }}
                              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                              className="text-orange-500 dark:text-orange-400 font-extrabold text-xl sm:text-2xl md:text-3xl"
                            >
                              WAIT
                            </motion.span>
                          </div>
                          <div className="flex items-center justify-center gap-0.5 mt-1">
                            <AlertCircle className="size-3 text-orange-500 dark:text-orange-400" />
                            <span className="text-orange-500 dark:text-orange-400 text-[9px] sm:text-[10px] font-semibold">
                              WAITING
                            </span>
                          </div>
                        </>
                      )}
                    </motion.div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Footer strip with LIVE indicator and progress */}
          <div className="bg-[var(--bg-secondary)] border-t border-[var(--border-color)] px-4 py-1.5 sm:py-2">
            <div className="flex items-center justify-center gap-3 flex-wrap">
              {/* LIVE indicator with green dot */}
              <div className="flex items-center gap-1.5">
                <span className="relative flex size-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full size-2 bg-green-400" />
                </span>
                <span className="text-green-600 dark:text-green-400 text-[10px] sm:text-xs font-black tracking-wider">
                  LIVE
                </span>
              </div>
              <span className="text-[var(--text-muted)]">|</span>
              {/* Progress indicator */}
              <div className="flex items-center gap-1.5">
                <div className="flex gap-0.5">
                  {TIME_SLOTS.map((_, i) => (
                    <div
                      key={i}
                      className={`w-1.5 h-2 rounded-sm ${
                        i < filledSlots ? 'bg-green-500' : 'bg-[var(--text-muted)]/30'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-[var(--text-secondary)] text-[10px] sm:text-xs font-medium">
                  {filledSlots}/6
                </span>
              </div>
              <span className="text-[var(--text-muted)]">|</span>
              <p className="text-[var(--text-secondary)] text-[10px] sm:text-xs font-medium">
                Auto-refresh every 30s
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* CSS keyframe for animated border effect */}
      <style jsx global>{`
        @keyframes border-rotate {
          0% { border-color: rgba(251, 146, 60, 0.3); }
          33% { border-color: rgba(251, 146, 60, 0.7); }
          66% { border-color: rgba(251, 146, 60, 0.4); }
          100% { border-color: rgba(251, 146, 60, 0.3); }
        }
      `}</style>
    </section>
  )
}
