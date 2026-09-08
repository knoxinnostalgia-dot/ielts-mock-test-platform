import { useEffect, useState, type FormEvent } from 'react'

import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { useProfile } from '@/context/profile'
import type { TestResult } from '@/types'
import { downloadCertificate } from '@/utils/pdf'
import { isValidEmail } from '@/utils/profile'

interface CertificateClaimModalProps {
  open: boolean
  result: TestResult | null
  onClose: () => void
}

const FIELD =
  'mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus-visible:border-brand-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50'

export function CertificateClaimModal({ open, result, onClose }: CertificateClaimModalProps) {
  const { profile, issueCertificate } = useProfile()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (!open || !result) return
    const match = profile.certificates.find((item) => item.resultId === result.id)
    setName(match?.candidateName || (profile.name === 'Candidate' ? '' : profile.name))
    setEmail(match?.email || profile.email)
    setError(null)
    setBusy(false)
    setDone(false)
    // Reset only when this dialog opens for a result, not when the profile updates after sign-in.
  }, [open, result?.id])

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (!result) return
    const trimmedName = name.trim()
    if (trimmedName.length < 2) {
      setError('Enter the name that should appear on the certificate.')
      return
    }
    if (!isValidEmail(email)) {
      setError('Enter a valid email address.')
      return
    }

    setBusy(true)
    setError(null)
    try {
      const certificate = issueCertificate(result, trimmedName, email)
      downloadCertificate(result, certificate)
      setDone(true)
    } catch (err) {
      console.error('[certificate] generation failed', err)
      setError('The certificate could not be created. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      open={open && !!result}
      title={done ? 'Certificate ready' : 'Claim your certificate'}
      description={
        done
          ? 'The PDF has downloaded on this device. This GitHub Pages site cannot send email, so save or print the file yourself.'
          : 'Sign in with your name and email to issue a practice certificate. Email delivery is not available without a server, so the certificate downloads as a PDF instead.'
      }
      onClose={onClose}
      size="md"
    >
      {done ? (
        <div className="flex flex-wrap justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button
            icon="download"
            onClick={() => {
              if (!result) return
              const certificate = issueCertificate(result, name.trim(), email)
              downloadCertificate(result, certificate)
            }}
          >
            Download again
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
            Full name
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              autoComplete="name"
              maxLength={60}
              className={FIELD}
              placeholder="As it should appear on the certificate"
            />
          </label>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              maxLength={80}
              className={FIELD}
              placeholder="you@example.com"
            />
          </label>
          {error && <p className="text-sm font-medium text-rose-600 dark:text-rose-400">{error}</p>}
          <div className="flex flex-wrap justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" icon="download" loading={busy}>
              Sign in and download
            </Button>
          </div>
        </form>
      )}
    </Modal>
  )
}
