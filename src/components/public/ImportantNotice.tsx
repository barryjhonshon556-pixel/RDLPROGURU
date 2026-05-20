'use client'

import { motion } from 'framer-motion'
import { AlertTriangle, ShieldAlert } from 'lucide-react'
import { useSiteSettings } from '@/hooks/useResults'

export function ImportantNotice() {
  const { data: settings } = useSiteSettings()
  const noticeText = settings?.notice_text || ''

  // Default legal disclaimer text - ALWAYS shown
  const legalDisclaimers = [
    'If gambling is illegal in your state/country, please close this website immediately.',
    'This website is for informational and entertainment purposes only. We do not encourage or promote any form of illegal gambling. Users must be of legal age to participate in any gambling activities as defined by their local jurisdiction.',
    'We are not responsible for any financial losses incurred through the use of information provided on this website. Please gamble responsibly and seek help if you have a gambling problem.',
  ]

  // Custom notice items (split by newline if present)
  const customItems = noticeText
    ? noticeText.split('\n').filter(Boolean)
    : []

  return (
    <section className="w-full py-8 sm:py-10 bg-[var(--bg-primary)]">
      <div className="container mx-auto px-4 max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="bg-gradient-to-br from-[#8b0000] to-[#5c0000] border-2 border-red-700/80 rounded-xl p-5 sm:p-6 shadow-lg shadow-red-900/20 dark:shadow-red-900/20 shadow-red-600/10"
        >
          {/* Title */}
          <div className="flex items-center justify-center gap-2 mb-4">
            <ShieldAlert className="size-5 sm:size-6 text-yellow-400" />
            <h2 className="text-yellow-400 font-bold text-sm sm:text-base tracking-wide text-center">
              RDL PRO IMPORTANT NOTE
            </h2>
            <AlertTriangle className="size-5 sm:size-6 text-yellow-400" />
          </div>

          {/* Divider */}
          <div className="border-t border-red-600/50 my-3" />

          {/* Custom notice text (if any) */}
          {customItems.length > 0 && (
            <div className="space-y-2 mb-4 text-center">
              {customItems.map((text, idx) => (
                <p key={`custom-${idx}`} className="text-white text-xs sm:text-sm leading-relaxed font-medium">
                  {text}
                </p>
              ))}
              {/* Separator between custom and legal */}
              <div className="border-t border-red-600/40 my-3" />
            </div>
          )}

          {/* Legal disclaimers - ALWAYS shown */}
          <div className="space-y-3 text-white/90 text-xs sm:text-sm leading-relaxed text-center">
            {legalDisclaimers.map((text, idx) => (
              <p key={`legal-${idx}`} className={`flex items-start justify-center gap-1.5 ${idx === 0 ? 'font-semibold text-yellow-300' : ''}`}>
                {idx === 0 && <AlertTriangle className="size-3.5 sm:size-4 mt-0.5 shrink-0" />}
                <span>{text}</span>
              </p>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
