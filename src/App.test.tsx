import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import App from './App'

describe('App', () => {
  it('boots without a router error and shows the setup screen when Supabase is unconfigured', async () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>,
    )

    // No VITE_SUPABASE_* env in tests -> the app must gate on the setup screen
    // rather than crashing (regression guard for the missing <Router> bug).
    expect(await screen.findByText(/supabase configuration required/i)).toBeInTheDocument()
  })
})
