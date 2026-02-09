import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import {
  Users,
  Briefcase,
  TrendingUp,
  UserCheck,
  UserX,
  UserMinus,
  Clock,
  CheckCircle2,
  Calendar,
  Target,
  Activity,
  PieChart,
} from 'lucide-react';

import type { ApplicationStatus, JobOverviewResponse } from '@/types/jobTypes';

// Dashboard Section Component
const DashboardSection: React.FC<{ data: JobOverviewResponse }> = ({ data }) => {
  const statusIcons: Record<ApplicationStatus, React.ReactNode> = {
    APPLIED: <Clock className="w-4 h-4" />,
    SHORTLISTED: <UserCheck className="w-4 h-4" />,
    REJECTED: <UserX className="w-4 h-4" />,
    HIRED: <CheckCircle2 className="w-4 h-4" />,
    WITHDRAWN: <UserMinus className="w-4 h-4" />,
  };

  const statusConfig: Record<
    ApplicationStatus,
    { gradient: string; text: string; label: string }
  > = {
    APPLIED: {
      gradient: 'from-blue-500/15 via-blue-500/5 to-transparent',
      text: 'text-blue-700 dark:text-blue-400',
      label: 'Applied',
    },
    SHORTLISTED: {
      gradient: 'from-purple-500/15 via-purple-500/5 to-transparent',
      text: 'text-purple-700 dark:text-purple-400',
      label: 'Shortlisted',
    },
    REJECTED: {
      gradient: 'from-red-500/15 via-red-500/5 to-transparent',
      text: 'text-red-700 dark:text-red-400',
      label: 'Rejected',
    },
    HIRED: {
      gradient: 'from-green-500/15 via-green-500/5 to-transparent',
      text: 'text-green-700 dark:text-green-400',
      label: 'Hired',
    },
    WITHDRAWN: {
      gradient: 'from-gray-500/15 via-gray-500/5 to-transparent',
      text: 'text-gray-700 dark:text-gray-400',
      label: 'Withdrawn',
    },
  };

  // Calculate metrics
  const totalApps = data.dashboard.total_applications;
  const hiredCount = data.dashboard.by_status.HIRED || 0;
  const shortlistedCount = data.dashboard.by_status.SHORTLISTED || 0;
  const appliedCount = data.dashboard.by_status.APPLIED || 0;
  
  const hiringProgress = data.job.target_headcount > 0 
    ? (hiredCount / data.job.target_headcount) * 100 
    : 0;
  
  const conversionRate = totalApps > 0 
    ? ((shortlistedCount + hiredCount) / totalApps) * 100 
    : 0;

  // Format date - handle missing created_at
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Recently';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Get status entries safely - handle empty object
  const statusEntries = Object.entries(data.dashboard.by_status || {}) as [ApplicationStatus, number][];
  const hasApplications = statusEntries.length > 0;

  return (
    <div className="space-y-6">
      {/* Top Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Applications */}
        <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-primary/10 via-background to-background">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 rounded-xl bg-primary/20">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <Activity className="w-4 h-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Applications</p>
              <p className="text-3xl font-bold text-foreground">{totalApps}</p>
            </div>
          </CardContent>
        </Card>

        {/* Hiring Progress */}
        <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-green-500/10 via-background to-background">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 rounded-xl bg-green-500/20">
                <Target className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <span className="text-xs font-semibold text-green-600 dark:text-green-400">
                {hiringProgress.toFixed(0)}%
              </span>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-2">Hiring Progress</p>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-bold text-foreground">{hiredCount}</p>
                <p className="text-sm text-muted-foreground">/ {data.job.target_headcount}</p>
              </div>
              <div className="mt-3 h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-green-500 to-green-400 transition-all duration-500 rounded-full"
                  style={{ width: `${Math.min(hiringProgress, 100)}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Conversion Rate */}
        <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-purple-500/10 via-background to-background">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 rounded-xl bg-purple-500/20">
                <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <PieChart className="w-4 h-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Conversion Rate</p>
              <p className="text-3xl font-bold text-foreground">{conversionRate.toFixed(1)}%</p>
              <p className="text-xs text-muted-foreground mt-1">
                {shortlistedCount + hiredCount} of {totalApps} candidates
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Days Active */}
        <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-blue-500/10 via-background to-background">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 rounded-xl bg-blue-500/20">
                <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <Briefcase className="w-4 h-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Posted</p>
              <p className="text-xl font-semibold text-foreground">
                {formatDate(data.job.created_at)}
              </p>
              <p className="text-xs text-muted-foreground mt-1 capitalize">
                {data.job.status} position
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Application Pipeline */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-lg bg-primary/10">
            <Activity className="w-4 h-4 text-primary" />
          </div>
          <h2 className="text-lg font-semibold">Application Pipeline</h2>
        </div>

        {hasApplications ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {statusEntries.map(
              ([status, count]) => {
                const config = statusConfig[status];
                const percentage = totalApps > 0 ? (count / totalApps) * 100 : 0;

                return (
                  <Card
                    key={status}
                    className="group relative overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer"
                  >
                    {/* Gradient Background */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${config.gradient} opacity-100`} />
                    
                    {/* Content */}
                    <CardContent className="relative p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className={`p-2.5 rounded-lg bg-background/60 backdrop-blur-sm ${config.text}`}>
                          {statusIcons[status]}
                        </div>
                        <span className={`text-xs font-semibold ${config.text}`}>
                          {percentage.toFixed(0)}%
                        </span>
                      </div>
                      
                      <div className="space-y-2">
                        <p className={`text-2xl font-bold ${config.text}`}>
                          {count}
                        </p>
                        <p className="text-sm font-medium text-foreground/80">
                          {config.label}
                        </p>
                        
                        {/* Mini Progress Bar */}
                        <div className="h-1 bg-background/40 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${config.text} bg-current transition-all duration-500`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    </CardContent>

                    {/* Hover Effect */}
                    <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/5 transition-colors duration-300" />
                  </Card>
                );
              }
            )}
          </div>
        ) : (
          <Card className="border-0 shadow-md">
            <CardContent className="py-12">
              <div className="text-center text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p className="text-sm font-medium">No applications yet</p>
                <p className="text-xs mt-1">Applications will appear here once candidates apply</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Quick Stats Row */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-0 shadow-md bg-gradient-to-br from-blue-500/5 to-transparent">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Pending Review</p>
                <p className="text-xl font-bold text-foreground">{appliedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md bg-gradient-to-br from-purple-500/5 to-transparent">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <UserCheck className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">In Progress</p>
                <p className="text-xl font-bold text-foreground">{shortlistedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md bg-gradient-to-br from-green-500/5 to-transparent">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Positions Filled</p>
                <p className="text-xl font-bold text-foreground">{hiredCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardSection;