import React, { useEffect, useState } from 'react'
import { ArrowUp } from 'lucide-react'

type ScrollToTopButtonProps = {
  targetRef: React.RefObject<HTMLElement>
}

const SCROLL_THRESHOLD = 280

const ScrollToTopButton: React.FC<ScrollToTopButtonProps> = ({ targetRef }) => {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      const containerScrollTop = targetRef.current?.scrollTop ?? 0
      const windowScrollTop = window.scrollY ?? document.documentElement.scrollTop ?? 0
      setIsVisible(Math.max(containerScrollTop, windowScrollTop) > SCROLL_THRESHOLD)
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    const target = targetRef.current
    target?.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', handleScroll)
      target?.removeEventListener('scroll', handleScroll)
    }
  }, [targetRef])

  const handleScrollToTop = () => {
    targetRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <button
      type="button"
      onClick={handleScrollToTop}
      aria-label="Scroll to top"
      className={`group fixed bottom-[6.5rem] right-4 z-[95] flex h-13 w-13 items-center justify-center rounded-full border border-white/60 bg-white/90 text-slate-700 shadow-[0_18px_40px_rgba(15,23,42,0.16)] backdrop-blur-md transition-all duration-300 ease-out dark:border-slate-700/70 dark:bg-slate-900/85 dark:text-slate-100 dark:shadow-[0_18px_40px_rgba(2,6,23,0.3)] lg:bottom-8 lg:right-8 lg:h-14 lg:w-14 ${
        isVisible
          ? 'pointer-events-auto translate-y-0 scale-100 opacity-100'
          : 'pointer-events-none translate-y-4 scale-90 opacity-0'
      }`}
    >
      <span className="absolute inset-0 rounded-full ring-1 ring-inset ring-slate-900/5 dark:ring-white/10" />
      <span className="absolute inset-0 rounded-full transition-transform duration-300 group-hover:scale-[1.08]">
        <span className="absolute inset-0 rounded-full bg-slate-900/4 opacity-0 transition-opacity duration-300 group-hover:opacity-100 dark:bg-white/6" />
      </span>
      <div className="relative flex h-7 w-7 items-center justify-center rounded-full bg-slate-900/5 transition-all duration-300 group-hover:bg-sky-500/12 dark:bg-white/5 dark:group-hover:bg-sky-400/12">
        <ArrowUp className="h-[18px] w-[18px] transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:scale-110" strokeWidth={2.4} />
      </div>
    </button>
  )
}

export default ScrollToTopButton
