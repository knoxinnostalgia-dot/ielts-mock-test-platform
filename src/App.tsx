import { Suspense, lazy } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'

import { AppLayout } from '@/components/layout/AppLayout'
import { ErrorBoundary } from '@/components/layout/ErrorBoundary'
import { LoadingScreen } from '@/components/ui/Feedback'
import { ProfileProvider } from '@/context/ProfileProvider'
import { SessionProvider } from '@/context/SessionProvider'
import { ThemeProvider } from '@/context/ThemeProvider'

const Dashboard = lazy(() => import('@/pages/Dashboard'))
const ReadingTest = lazy(() => import('@/pages/ReadingTest'))
const ListeningTest = lazy(() => import('@/pages/ListeningTest'))
const WritingTest = lazy(() => import('@/pages/WritingTest'))
const SpeakingTest = lazy(() => import('@/pages/SpeakingTest'))
const Results = lazy(() => import('@/pages/Results'))
const History = lazy(() => import('@/pages/History'))
const Achievements = lazy(() => import('@/pages/Achievements'))
const NotFound = lazy(() => import('@/pages/NotFound'))

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <ProfileProvider>
          <SessionProvider>
            <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '') || '/'}>
              <Suspense fallback={<LoadingScreen message="Loading the assessment platform…" />}>
                <Routes>
                  <Route element={<AppLayout />}>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/results" element={<Results />} />
                    <Route path="/results/:resultId" element={<Results />} />
                    <Route path="/history" element={<History />} />
                    <Route path="/achievements" element={<Achievements />} />
                    <Route path="*" element={<NotFound />} />
                  </Route>
                  <Route path="/test/reading" element={<ReadingTest />} />
                  <Route path="/test/listening" element={<ListeningTest />} />
                  <Route path="/test/writing" element={<WritingTest />} />
                  <Route path="/test/speaking" element={<SpeakingTest />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
          </SessionProvider>
        </ProfileProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}
