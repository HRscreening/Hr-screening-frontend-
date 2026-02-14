import { Card,  CardDescription, CardHeader, CardTitle } from '@/components/ui/card';




type AnalyticsCardProp = {
  title: string;
  value: string | number;
  desc?: string;
  icon?: React.ReactNode;
}

export default function AnalyticsCard({ title, desc, value, icon }: AnalyticsCardProp) {
  return (
    <Card className='my-4 min-w-80 w-fit p-5 bg-card border shadow-sm'>
      <CardHeader className='p-0 space-y-3'>
        <CardTitle className='text-sm font-medium text-foreground-500 uppercase tracking-wide flex flex-row items-center justify-between'>
          {title}
          {icon && <span className='ml-2 text-muted-foreground'>{icon}</span>}
        </CardTitle>

        <div className='flex flex-row items-center gap-4'>
          <div className='text-3xl font-bold text-foreground-900'>
            {value}
          </div>

          {desc && (
            <CardDescription className='text-sm text-gray-400 font-normal'>
              {desc}
            </CardDescription>
          )}
        </div>
      </CardHeader>
    </Card>
  )
}
