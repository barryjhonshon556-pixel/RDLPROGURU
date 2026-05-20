'use client'

import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Zap, Heart, Send, MessageCircle, ShieldCheck } from 'lucide-react'
import { useSiteSettings } from '@/hooks/useResults'

const FOOTER_LINKS = [
  { label: 'Privacy Policy', href: '#' },
  { label: 'Sitemap', href: '#' },
  { label: 'About Us', href: '#' },
  { label: 'Contact Us', href: '#' },
  { label: 'Disclaimer', href: '#' },
]

// Animated particle dots for footer background - theme-aware
function FooterParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationId: number
    const particles: { x: number; y: number; size: number; speed: number; opacity: number; twinkle: number; twinkleSpeed: number }[] = []

    const resize = () => {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }
    resize()
    window.addEventListener('resize', resize)

    for (let i = 0; i < 30; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 1.5 + 0.5,
        speed: Math.random() * 0.15 + 0.05,
        opacity: Math.random() * 0.3 + 0.1,
        twinkle: Math.random() * Math.PI * 2,
        twinkleSpeed: Math.random() * 0.03 + 0.01,
      })
    }

    function getIsDark(): boolean {
      if (typeof document === 'undefined') return true
      return document.documentElement.classList.contains('dark')
    }

    function animate() {
      if (!ctx || !canvas) return
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      const isDark = getIsDark()

      particles.forEach((p) => {
        p.twinkle += p.twinkleSpeed
        const alpha = p.opacity * (0.5 + 0.5 * Math.sin(p.twinkle))

        if (isDark) {
          ctx.fillStyle = `rgba(0, 102, 255, ${alpha})`
        } else {
          // Light mode: subtle blue particles
          ctx.fillStyle = `rgba(0, 80, 200, ${alpha * 0.25})`
        }
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fill()

        p.y -= p.speed
        if (p.y < -5) {
          p.y = canvas!.height + 5
          p.x = Math.random() * canvas!.width
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

export function Footer() {
  const { data: settings } = useSiteSettings()
  const telegramLink = settings?.telegram_link || 'https://t.me/rdlpro'
  const whatsappLink = settings?.whatsapp_link || ''
  const contactNumber = settings?.contact_number || ''

  const whatsappUrl = whatsappLink
    ? (whatsappLink.startsWith('http') ? whatsappLink : `https://wa.me/${whatsappLink.replace(/[^0-9]/g, '')}`)
    : contactNumber
      ? `https://wa.me/${contactNumber.replace(/[^0-9]/g, '')}`
      : '#'

  return (
    <motion.footer
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      role="contentinfo"
      className="bg-[var(--bg-primary)] border-t border-[var(--border-color)] mt-auto relative overflow-hidden"
    >
      {/* Gradient top border */}
      <div className="h-1 bg-gradient-to-r from-transparent via-[var(--accent-blue)] to-transparent" />

      {/* Particle background */}
      <FooterParticles />

      <div className="container mx-auto px-4 py-8 sm:py-10 relative z-10">
        {/* Links */}
        <nav aria-label="Footer navigation" className="flex flex-wrap justify-center gap-x-5 gap-y-2 mb-5">
          {FOOTER_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-[var(--text-secondary)] hover:text-[var(--accent-blue)] text-xs sm:text-sm transition-colors relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-px after:bg-[var(--accent-blue)] after:transition-all hover:after:w-full"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Social Media Links */}
        <div className="flex items-center justify-center gap-3 mb-5">
          <motion.a
            href={telegramLink}
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ scale: 1.15, y: -2 }}
            whileTap={{ scale: 0.9 }}
            className="flex items-center justify-center size-10 rounded-full bg-[var(--accent-telegram)]/15 border border-[var(--accent-telegram)]/25 text-[var(--accent-telegram)] hover:bg-[var(--accent-telegram)]/25 hover:border-[var(--accent-telegram)]/40 transition-all"
            aria-label="Join Telegram"
          >
            <Send className="size-4" />
          </motion.a>
          <motion.a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ scale: 1.15, y: -2 }}
            whileTap={{ scale: 0.9 }}
            className="flex items-center justify-center size-10 rounded-full bg-green-500/15 border border-green-500/25 text-green-500 hover:bg-green-500/25 hover:border-green-500/40 transition-all"
            aria-label="WhatsApp"
          >
            <MessageCircle className="size-4" />
          </motion.a>
        </div>

        {/* Divider */}
        <div className="border-t border-[var(--border-color)] my-5" />

        {/* Tagline */}
        <div className="text-center space-y-4">
          <motion.div
            whileHover={{ scale: 1.05 }}
            transition={{ type: 'spring', stiffness: 300, damping: 15 }}
            className="flex items-center justify-center gap-2 cursor-default"
          >
            <Zap className="size-4 text-[var(--accent-blue)]" />
            <p className="text-[var(--accent-blue)] font-bold text-base sm:text-lg tracking-wider">
              FASTEST RESULT IS HERE
            </p>
            <Zap className="size-4 text-[var(--accent-blue)]" />
          </motion.div>
          <p className="text-[var(--text-secondary)] text-xs sm:text-sm font-medium">
            RDL Pro Matka — Your trusted source for live matka results
          </p>

          {/* Disclaimer / Legal Notice */}
          <div className="flex items-start justify-center gap-2 max-w-md mx-auto">
            <ShieldCheck className="size-4 text-[var(--text-muted)] mt-0.5 shrink-0" />
            <p className="text-[var(--text-muted)] text-[10px] sm:text-xs leading-relaxed">
              This site is for informational purposes only. We do not promote or endorse any form of gambling. Users are advised to comply with their local laws.
            </p>
          </div>

          {/* Copyright */}
          <div className="pt-2 border-t border-[var(--border-color)]/50">
            <p className="text-[var(--text-muted)] text-[10px] sm:text-xs flex items-center justify-center gap-1">
              © {new Date().getFullYear()} RDL Pro Matka. Made with{' '}
              <Heart className="size-3 text-red-500 inline" aria-label="love" />{' '}
              All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </motion.footer>
  )
}
