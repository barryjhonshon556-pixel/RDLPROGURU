'use client'

import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import { useSiteSettings } from '@/hooks/useResults'
import { ThemeToggle } from '@/components/ThemeToggle'
import { NotificationBell } from '@/components/public/NotificationBell'

const FALLBACK_MARQUEE_ITEMS = [
  { text: '🔔 Welcome to RDL Pro Matka — Fastest Results Guaranteed!', color: 'text-yellow-400' },
  { text: '✅ All 6 time slots: 12PM, 2PM, 4PM, 6PM, 8PM, 10PM', color: 'text-green-400' },
  { text: '⚡ Results updated every 30 seconds automatically', color: 'text-red-400' },
  { text: '📞 Contact us on WhatsApp for queries', color: 'text-blue-400' },
]

const MARQUEE_COLORS = [
  'text-yellow-400',
  'text-green-400',
  'text-red-400',
  'text-blue-400',
]

// Star particle component for background - theme-aware
function StarField() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationId: number
    const stars: { x: number; y: number; size: number; speed: number; opacity: number; twinkleSpeed: number }[] = []

    const resize = () => {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }
    resize()
    window.addEventListener('resize', resize)

    // Create stars - increased count and size for visibility
    for (let i = 0; i < 70; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2.5 + 0.8,
        speed: Math.random() * 0.3 + 0.1,
        opacity: Math.random(),
        twinkleSpeed: Math.random() * 0.02 + 0.005,
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

      stars.forEach((star) => {
        star.opacity += star.twinkleSpeed
        if (star.opacity > 1 || star.opacity < 0.2) {
          star.twinkleSpeed *= -1
        }

        // Theme-aware star colors
        const alpha = isDark ? star.opacity * 0.95 : star.opacity * 0.5
        if (isDark) {
          // Dark mode: bright white-blue stars
          ctx!.fillStyle = `rgba(180, 220, 255, ${alpha})`
        } else {
          // Light mode: subtle blue-toned stars
          ctx!.fillStyle = `rgba(0, 80, 200, ${alpha * 0.4})`
        }
        ctx!.beginPath()
        ctx!.arc(star.x, star.y, star.size, 0, Math.PI * 2)
        ctx!.fill()

        // Add cross sparkle for larger stars
        if (star.size > 1.2) {
          if (isDark) {
            ctx!.strokeStyle = `rgba(200, 230, 255, ${alpha * 0.5})`
          } else {
            ctx!.strokeStyle = `rgba(0, 80, 200, ${alpha * 0.3})`
          }
          ctx!.lineWidth = 0.6
          ctx!.beginPath()
          ctx!.moveTo(star.x - star.size * 2.5, star.y)
          ctx!.lineTo(star.x + star.size * 2.5, star.y)
          ctx!.moveTo(star.x, star.y - star.size * 2.5)
          ctx!.lineTo(star.x, star.y + star.size * 2.5)
          ctx!.stroke()
        }

        star.y -= star.speed
        if (star.y < -5) {
          star.y = canvas!.height + 5
          star.x = Math.random() * canvas!.width
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

export function Header() {
  const { data: settings } = useSiteSettings()

  // Build marquee items from settings or fallback
  const marqueeItems = (() => {
    if (settings?.marquee_text) {
      const parts = settings.marquee_text.split('|').map((s) => s.trim()).filter(Boolean)
      if (parts.length > 0) {
        return parts.map((text, i) => ({
          text,
          color: MARQUEE_COLORS[i % MARQUEE_COLORS.length],
        }))
      }
    }
    return FALLBACK_MARQUEE_ITEMS
  })()

  // Duplicate items for seamless loop
  const duplicatedItems = [...marqueeItems, ...marqueeItems]

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full"
    >
      {/* Blue top bar with shimmer */}
      <div className="relative bg-[#0066ff] h-2 w-full overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer-bar" />
      </div>

      {/* Main banner section */}
      <div className="relative bg-gradient-to-b from-[#0055dd] via-[#0066ff] to-[#0044bb] py-6 sm:py-8 overflow-hidden">
        {/* Star particle field */}
        <StarField />

        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-white/5 via-transparent to-white/5 pointer-events-none" />

        {/* SVG grid pattern overlay */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-50 pointer-events-none" />

        <div className="container mx-auto px-4 relative z-10">
          {/* Title row with ThemeToggle positioned to the sides on desktop */}
          <div className="flex items-center justify-between gap-4">
            {/* Left spacer for centering on mobile */}
            <div className="hidden sm:flex w-28 items-center gap-1.5">
              <ThemeToggle />
            </div>

            {/* Center: Sparkle icon + Title with glow */}
            <div className="flex-1 text-center">
              <div className="flex items-center justify-center gap-2 sm:gap-3">
                <motion.div
                  animate={{ rotate: [0, 180, 360], scale: [1, 1.2, 1] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                >
                  <Sparkles className="size-5 sm:size-6 text-yellow-300 drop-shadow-[0_0_8px_rgba(253,224,71,0.6)]" />
                </motion.div>

                <motion.h1
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                  className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-wider animate-title-glow"
                >
                  RDL PRO MATKA
                </motion.h1>

                <motion.div
                  animate={{ rotate: [360, 180, 0], scale: [1, 1.2, 1] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                >
                  <Sparkles className="size-5 sm:size-6 text-yellow-300 drop-shadow-[0_0_8px_rgba(253,224,71,0.6)]" />
                </motion.div>
              </div>

              {/* Tagline under the main title */}
              <motion.p
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-blue-200/70 text-xs sm:text-sm mt-1.5 tracking-wide font-medium"
              >
                Daily 6 Draws &nbsp;|&nbsp; Live Results
              </motion.p>
            </div>

            {/* Right: NotificationBell + ThemeToggle */}
            <div className="hidden sm:flex items-center gap-2">
              <NotificationBell />
              <ThemeToggle />
            </div>
          </div>

          {/* Mobile: NotificationBell + ThemeToggle centered below title */}
          <div className="sm:hidden mt-3 flex justify-center gap-2">
            <NotificationBell />
            <ThemeToggle />
          </div>
        </div>
      </div>

      {/* Scrolling Marquee Ticker */}
      <div className="bg-[var(--bg-secondary)] border-y border-[var(--border-color)] overflow-hidden py-1.5">
        <div className="marquee-container">
          <div className="marquee-content">
            {duplicatedItems.map((item, i) => (
              <span
                key={i}
                className={`${item.color} text-xs sm:text-sm font-semibold mx-8`}
              >
                {item.text}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Decorative bottom border - dot pattern */}
      <div className="bg-[var(--bg-primary)] h-3 relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center gap-1 px-2">
          {Array.from({ length: 80 }).map((_, i) => (
            <div
              key={i}
              className="w-1 h-1 rounded-full bg-[var(--accent-blue)]"
              style={{ opacity: 0.3 + (i % 3) * 0.2 }}
            />
          ))}
        </div>
      </div>

      <style jsx>{`
        .marquee-container {
          overflow: hidden;
          white-space: nowrap;
        }
        .marquee-content {
          display: inline-block;
          animation: marquee-scroll 30s linear infinite;
        }
        .marquee-content:hover {
          animation-play-state: paused;
        }
        @keyframes marquee-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes shimmer-bar {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        .animate-shimmer-bar {
          animation: shimmer-bar 3s ease-in-out infinite;
        }
        @keyframes title-glow {
          0%, 100% { text-shadow: 0 0 10px rgba(255,255,255,0.3), 0 0 30px rgba(0,102,255,0.3); }
          50% { text-shadow: 0 0 20px rgba(255,255,255,0.5), 0 0 50px rgba(0,102,255,0.5), 0 0 80px rgba(0,102,255,0.2); }
        }
        @keyframes title-glow-light {
          0%, 100% { text-shadow: 0 0 8px rgba(0,60,180,0.2); }
          50% { text-shadow: 0 0 16px rgba(0,60,180,0.35), 0 0 40px rgba(0,60,180,0.15); }
        }
        .animate-title-glow {
          animation: title-glow 3s ease-in-out infinite;
        }
        :root:not(.dark) .animate-title-glow {
          animation: title-glow-light 3s ease-in-out infinite;
        }
      `}</style>
    </motion.header>
  )
}
