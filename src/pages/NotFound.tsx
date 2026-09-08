import { useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/Feedback'

export default function NotFound() {
  const navigate = useNavigate()
  return (
    <EmptyState
      icon="alert"
      title="Page not found"
      description="The page you were looking for does not exist in this application."
      action={
        <Button icon="home" onClick={() => navigate('/')}>
          Return to Dashboard
        </Button>
      }
    />
  )
}
