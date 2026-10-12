import { Database, KeyRound, ShieldCheck } from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function SetupRequiredPage() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Supabase configuration required</CardTitle>
          <CardDescription>
            This app talks directly to Supabase (no custom backend). Add your project credentials to continue.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="flex items-start gap-3">
            <Database className="mt-0.5 h-5 w-5 text-primary" />
            <p>
              Copy <code className="rounded bg-muted px-1">.env.example</code> to{' '}
              <code className="rounded bg-muted px-1">.env</code> and set{' '}
              <code className="rounded bg-muted px-1">VITE_SUPABASE_URL</code> and{' '}
              <code className="rounded bg-muted px-1">VITE_SUPABASE_ANON_KEY</code>.
            </p>
          </div>
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 text-primary" />
            <p>Run the SQL migrations in <code className="rounded bg-muted px-1">supabase/migrations/</code> to create tables and RLS policies.</p>
          </div>
          <div className="flex items-start gap-3">
            <KeyRound className="mt-0.5 h-5 w-5 text-primary" />
            <p>Only the publishable/anon key belongs in the frontend. Never expose the service-role key. Restart the dev server after editing <code className="rounded bg-muted px-1">.env</code>.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}