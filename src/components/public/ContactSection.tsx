'use client'

import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { useSiteSettings } from '@/hooks/useResults'
import { Phone, MessageCircle, Send, Info } from 'lucide-react'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'

// Floating icons canvas for background - theme-aware
function FloatingIcons() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationId: number
    const icons: { x: number; y: number; speed: number; size: number; opacity: number; type: number; drift: number; driftSpeed: number }[] = []

    const resize = () => {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }
    resize()
    window.addEventListener('resize', resize)

    // Create floating icon particles
    for (let i = 0; i < 15; i++) {
      icons.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        speed: Math.random() * 0.4 + 0.15,
        size: Math.random() * 8 + 6,
        opacity: Math.random() * 0.15 + 0.05,
        type: Math.floor(Math.random() * 3), // 0=phone, 1=message, 2=send
        drift: 0,
        driftSpeed: Math.random() * 0.01 + 0.005,
      })
    }

    function getIsDark(): boolean {
      if (typeof document === 'undefined') return true
      return document.documentElement.classList.contains('dark')
    }

    function drawIcon(x: number, y: number, size: number, type: number, alpha: number, isDark: boolean) {
      if (!ctx) return
      ctx.save()
      ctx.translate(x, y)
      ctx.globalAlpha = isDark ? alpha : alpha * 0.5

      // Adjust colors for light/dark mode
      const phoneColor = isDark ? '#0066ff' : '#0044aa'
      const msgColor = isDark ? '#22c55e' : '#16a34a'
      const sendColor = isDark ? '#0088cc' : '#006699'

      if (type === 0) {
        // Phone icon
        ctx.fillStyle = phoneColor
        ctx.strokeStyle = phoneColor
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.roundRect(-size * 0.3, -size * 0.5, size * 0.6, size, size * 0.15)
        ctx.stroke()
        ctx.beginPath()
        ctx.arc(0, size * 0.3, size * 0.08, 0, Math.PI * 2)
        ctx.fill()
      } else if (type === 1) {
        // Message icon
        ctx.strokeStyle = msgColor
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(-size * 0.5, -size * 0.3)
        ctx.lineTo(size * 0.5, -size * 0.3)
        ctx.lineTo(size * 0.5, size * 0.2)
        ctx.lineTo(0, size * 0.2)
        ctx.lineTo(-size * 0.2, size * 0.5)
        ctx.lineTo(-size * 0.1, size * 0.2)
        ctx.lineTo(-size * 0.5, size * 0.2)
        ctx.closePath()
        ctx.stroke()
      } else {
        // Send icon
        ctx.strokeStyle = sendColor
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(-size * 0.4, -size * 0.2)
        ctx.lineTo(size * 0.4, 0)
        ctx.lineTo(-size * 0.4, size * 0.2)
        ctx.lineTo(-size * 0.15, 0)
        ctx.closePath()
        ctx.stroke()
      }

      ctx.restore()
    }

    function animate() {
      if (!ctx || !canvas) return
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      const isDark = getIsDark()

      icons.forEach((icon) => {
        icon.drift += icon.driftSpeed
        const driftX = Math.sin(icon.drift) * 15

        drawIcon(icon.x + driftX, icon.y, icon.size, icon.type, icon.opacity, isDark)

        icon.y -= icon.speed
        if (icon.y < -20) {
          icon.y = canvas!.height + 20
          icon.x = Math.random() * canvas!.width
        }
      })

      animationId = requestAnimationFrame(animate)
    }
    animate()

    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />
}

export function ContactSection() {
  const { data: settings, isLoading } = useSiteSettings()

  const contactNumber = settings?.contact_number || ''
  const contactName = settings?.contact_name || 'RDL Pro'
  const whatsappLink = settings?.whatsapp_link || ''
  const telegramLink = settings?.telegram_link || 'https://t.me/rdlpro'

  // Mask phone number: show first digits, replace last 5 with XXXXX
  const maskedNumber = contactNumber
    ? contactNumber.length > 5
      ? contactNumber.slice(0, -5) + 'XXXXX'
      : 'XXXXX'
    : ''

  // Build WhatsApp URL
  const whatsappUrl = whatsappLink
    ? (whatsappLink.startsWith('http') ? whatsappLink : `https://wa.me/${whatsappLink.replace(/[^0-9]/g, '')}`)
    : contactNumber
      ? `https://wa.me/${contactNumber.replace(/[^0-9]/g, '')}`
      : '#'

  return (
    <section className="w-full bg-[var(--bg-primary)] py-8 sm:py-10 relative overflow-hidden">
      {/* Floating icons background */}
      <FloatingIcons />

      <div className="container mx-auto px-4 max-w-lg relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="space-y-5"
        >
          {/* Section Title */}
          <div className="text-center">
            <h2 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)]">
              Get In Touch
            </h2>
            <p className="text-sm text-[var(--accent-blue)] mt-1">
              Join our community for live updates
            </p>
          </div>

          {/* Telegram Join Section */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-[var(--bg-card)] to-[var(--bg-secondary)] border border-[var(--border-accent)] rounded-xl p-5 sm:p-6 text-center shadow-[var(--card-shadow-lg)] relative overflow-hidden"
          >
            {/* Subtle glow behind button */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-[var(--accent-blue)]/10 rounded-full blur-3xl pointer-events-none" />

            {/* Social media icon badges */}
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="flex items-center justify-center size-10 rounded-full bg-[var(--accent-telegram)]/20 border border-[var(--accent-telegram)]/30">
                <Send className="size-5 text-[var(--accent-telegram)]" />
              </div>
              <div className="flex items-center justify-center size-10 rounded-full bg-green-500/20 border border-green-500/30">
                <MessageCircle className="size-5 text-green-500" />
              </div>
              <div className="flex items-center justify-center size-10 rounded-full bg-orange-500/20 border border-orange-500/30">
                <Phone className="size-5 text-orange-500" />
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 mb-2 relative z-10">
              <Send className="size-5 text-[var(--accent-blue)]" />
              <p className="text-[var(--text-primary)] text-sm sm:text-base font-semibold">
                Join Our Telegram Group
              </p>
            </div>
            <p className="text-[var(--text-secondary)] text-xs sm:text-sm mb-4 relative z-10">
              Get instant result notifications and updates
            </p>
            <a
              href={telegramLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block relative z-10"
            >
              <motion.div
                animate={{ boxShadow: ['0 0 0 0 rgba(0,102,255,0.4)', '0 0 0 12px rgba(0,102,255,0)', '0 0 0 0 rgba(0,102,255,0)'] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
                className="rounded-lg"
              >
                <Button className="bg-[var(--accent-blue)] hover:bg-[var(--accent-blue-hover)] text-white font-bold px-8 py-2.5 text-sm sm:text-base rounded-lg shadow-md shadow-[var(--accent-blue)]/20 transition-all hover:shadow-lg hover:shadow-[var(--accent-blue)]/30">
                  <Send className="size-4 mr-2" />
                  JOIN TELEGRAM
                </Button>
              </motion.div>
            </a>
          </motion.div>

          {/* Decorative divider */}
          <div className="flex items-center gap-3 px-4">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[var(--divider-gradient)] to-transparent" />
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent-blue)]/50" />
              <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent-blue)]/30" />
              <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent-blue)]/50" />
            </div>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[var(--divider-gradient)] to-transparent" />
          </div>

          {/* Contact Info Box */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="bg-[var(--bg-card)] rounded-xl p-5 sm:p-6 text-center shadow-[var(--card-shadow-lg)] relative overflow-hidden border border-[var(--border-color)]"
          >
            {/* Subtle gradient overlay */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[var(--accent-blue)] via-green-500 to-orange-500" />

            <h3 className="text-[var(--text-primary)] font-bold text-sm sm:text-base mb-4 tracking-wide uppercase">
              JOIN OUR GAME UPDATES GROUP
            </h3>

            {isLoading ? (
              <div className="animate-pulse space-y-3">
                <div className="h-5 bg-[var(--bg-secondary)] rounded w-28 mx-auto" />
                <div className="h-4 bg-[var(--bg-secondary)] rounded w-36 mx-auto" />
              </div>
            ) : (
              <>
                <p className="text-[var(--text-primary)] font-semibold text-lg sm:text-xl mb-1">
                  {contactName}
                </p>
                {contactNumber && (
                  <p className="text-[var(--text-secondary)] text-sm sm:text-base mb-5 font-mono flex items-center justify-center gap-2">
                    <Phone className="size-3.5 text-orange-500" />
                    {maskedNumber}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="inline-flex items-center justify-center cursor-help">
                          <Info className="size-3.5 text-[var(--text-muted)] hover:text-[var(--accent-blue)] transition-colors" />
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="bg-[var(--bg-card)] text-[var(--text-primary)] border border-[var(--border-color)] shadow-lg">
                        <p className="text-xs">Number hidden for privacy</p>
                      </TooltipContent>
                    </Tooltip>
                  </p>
                )}

                <div className="flex gap-3 justify-center">
                  <a href={contactNumber ? `tel:${contactNumber}` : '#'}>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-5 sm:px-6 py-2.5 text-xs sm:text-sm rounded-lg shadow-md shadow-orange-500/20 transition-all hover:shadow-lg hover:shadow-orange-500/30">
                        <Phone className="size-4 mr-1.5" />
                        CALL NOW
                      </Button>
                    </motion.div>
                  </a>
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button className="bg-green-500 hover:bg-green-600 text-white font-bold px-5 sm:px-6 py-2.5 text-xs sm:text-sm rounded-lg shadow-md shadow-green-500/20 transition-all hover:shadow-lg hover:shadow-green-500/30">
                        <MessageCircle className="size-4 mr-1.5" />
                        WHATSAPP
                      </Button>
                    </motion.div>
                  </a>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
