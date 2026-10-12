import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Card, CardContent } from '@/components/ui/card'
import { MORE_ITEMS } from '@/layouts/nav'
import { useSettings } from '@/features/settings/hooks'
import { programmeWeek, toISODate } from '@/utils/dates'

export function MorePage() {
  const { settings } = useSettings()
  const week = programmeWeek(settings.programme_start_date, toISODate(new Date()))

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground">Programme start</p>
          <p className="text-lg font-semibold">{settings.programme_start_date}</p>
          <p className="text-sm text-muted-foreground">
            {week >= 1 && week <= 12 ? `Currently in week ${week} of 12` : week < 1 ? 'Programme has not started yet' : 'Programme complete'}
          </p>
        </CardContent>
      </Card>

      <div className="space-y-2">
        {MORE_ITEMS.map((item) => (
          <Link key={item.path} to={item.path} className="block">
            <Card className="transition-colors hover:bg-accent">
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <item.icon className="h-5 w-5 text-primary" />
                  <span className="font-medium">{item.label}</span>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}