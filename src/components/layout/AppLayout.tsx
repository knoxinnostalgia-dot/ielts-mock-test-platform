import { Outlet } from 'react-router-dom'

import { AppHeader } from './AppHeader'

export function AppLayout() {
  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="mx-auto max-w-7xl px-4 pb-16 pt-6 sm:px-6">
        <Outlet />
      </main>
      <footer className="border-t border-slate-200/70 py-6 text-center text-xs text-slate-400 dark:border-slate-800/80">
        IELTS Mock Test Platform · All processing, scoring and storage happens locally in your
        browser.
      </footer>
    </div>
  )
}
