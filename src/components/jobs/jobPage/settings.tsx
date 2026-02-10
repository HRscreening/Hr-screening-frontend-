import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Users,
  TrendingUp,
  Lock,
} from 'lucide-react';
import type { SettingsTypes,Job } from '@/types/jobTypes';

type SettingsPlaceholderProps = {
    settings: SettingsTypes;
    job:Job
}


const SettingsPlaceholder: React.FC<{ data: SettingsPlaceholderProps }> = ({ data }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Job Settings</CardTitle>
        <CardDescription>Configure job preferences and features</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center py-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted">
                <TrendingUp className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">Voice AI Screening</p>
                <p className="text-xs text-muted-foreground">Automated interviews</p>
              </div>
            </div>
            <Badge variant={data.settings.voice_ai_enabled ? 'default' : 'secondary'}>
              {data.settings.voice_ai_enabled ? 'Enabled' : 'Disabled'}
            </Badge>
          </div>
          
          <Separator />
          
          <div className="flex justify-between items-center py-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted">
                <Users className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">Manual Rounds</p>
                <p className="text-xs text-muted-foreground">Interview rounds</p>
              </div>
            </div>
            <span className="text-lg font-semibold">{data.settings.manual_rounds_count}</span>
          </div>
          
          <Separator />
          
          <div className="flex justify-between items-center py-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted">
                <Lock className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">Confidential Job</p>
                <p className="text-xs text-muted-foreground">Hidden from public</p>
              </div>
            </div>
            <Badge variant={data.settings.is_confidential ? 'default' : 'secondary'}>
              {data.settings.is_confidential ? 'Yes' : 'No'}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SettingsPlaceholder;