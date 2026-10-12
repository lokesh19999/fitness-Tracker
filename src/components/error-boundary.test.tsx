import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { ErrorBoundary } from './error-boundary'

function Bomb({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) throw new Error('boom')
  return <div>recovered content</div>
}

function Harness() {
  const [shouldThrow, setShouldThrow] = useState(true)
  return (
    <>
      <button onClick={() => setShouldThrow(false)}>fix</button>
      <ErrorBoundary>
        <Bomb shouldThrow={shouldThrow} />
      </ErrorBoundary>
    </>
  )
}

describe('ErrorBoundary', () => {
  it('renders a fallback with the error message instead of crashing', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    render(
      <ErrorBoundary>
        <Bomb shouldThrow />
      </ErrorBoundary>,
    )
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument()
    expect(screen.getByText('boom')).toBeInTheDocument()
    spy.mockRestore()
  })

  it('recovers when the underlying cause is resolved and the user retries', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const user = userEvent.setup()
    render(<Harness />)

    await user.click(screen.getByText('fix'))
    await user.click(screen.getByRole('button', { name: /try again/i }))

    expect(screen.getByText('recovered content')).toBeInTheDocument()
    spy.mockRestore()
  })
})
