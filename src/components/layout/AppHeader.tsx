import { NavLink } from 'react-router-dom'

import { Icon, type IconName } from '@/components/ui/Icon'
import { useProfile } from '@/context/profile'
import { useTheme } from '@/context/theme'
import { cn } from '@/utils/cn'

const LINKS: { to: string; label: string; icon: IconName }[] = [
  { to: '/', label: 'Dashboard', icon: 'home' },
  { to: '/history', label: 'History', icon: 'list' },
  { to: '/achievements', label: 'Achievements', icon: 'trophy' },
]

export function AppHeader() {
  const { theme, toggleTheme } = useTheme()
  const { profile } = useProfile()

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/80 backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-950/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6">
        <NavLink to="/" className="flex items-center gap-2.5 focus-ring rounded-lg">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white shadow-sm shadow-brand-600/30">
            <Icon name="target" size={19} />
          </span>
          <span className="leading-tight">
            <span className="block text-sm font-bold text-slate-900 dark:text-slate-50">
              IELTS Mock Test
            </span>
            <span className="block text-[11px] font-medium text-slate-500 dark:text-slate-400">
              Assessment Platform
            </span>
          </span>
        </NavLink>

        <nav className="ml-4 hidden items-center gap-1 md:flex" aria-label="Main navigation">
          {LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition',
                  isActive
                    ? 'bg-brand-500/15 text-brand-700 shadow-[0_3px_0_0_rgb(26_52_225_/_0.25)] dark:text-brand-300'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800',
                )
              }
            >
              <Icon name={link.icon} size={17} />
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <span
            className="hidden items-center gap-1.5 rounded-full bg-orange-500/12 px-3 py-1.5 text-xs font-black text-orange-600 dark:text-orange-400 sm:flex"
            title="Practice streak"
          >
            <Icon name="flame" size={14} />
            {profile.streak.current}
          </span>
          <span className="hidden items-center gap-1.5 rounded-full bg-sky-500/12 px-3 py-1.5 text-xs font-black text-sky-600 dark:text-sky-400 md:flex">
            <Icon name="star" size={14} />
            {profile.results.length}
          </span>
          {profile.certificates.length > 0 && (
            <span className="hidden items-center gap-1.5 rounded-full bg-amber-500/12 px-3 py-1.5 text-xs font-black text-amber-600 dark:text-amber-400 lg:flex">
              <Icon name="trophy" size={14} />
              {profile.certificates.length}
            </span>
          )}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
          >
            <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={18} />
          </button>
        </div>
      </div>

      <nav
        className="flex items-center gap-1 border-t border-slate-200/70 px-3 py-1.5 dark:border-slate-800/80 md:hidden"
        aria-label="Main navigation"
      >
        {LINKS.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === '/'}
            className={({ isActive }) =>
              cn(
                'flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-semibold transition',
                isActive
                  ? 'bg-brand-500/10 text-brand-700 dark:text-brand-300'
                  : 'text-slate-500 dark:text-slate-400',
              )
            }
          >
            <Icon name={link.icon} size={15} />
            {link.label}
          </NavLink>
        ))}
      </nav>
    </header>
  )
}
