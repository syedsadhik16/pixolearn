import { Skeleton } from '@/components/ui/skeleton';

export function DashboardCardSkeleton() {
  return (
    <div className="pixo-card p-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-12 w-12 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-3 w-32" />
        </div>
      </div>
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="pixo-card p-6">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-7 w-14" />
          <Skeleton className="h-3 w-28" />
        </div>
      </div>
    </div>
  );
}

export function LessonCardSkeleton() {
  return (
    <div className="pixo-card p-5">
      <div className="flex items-start justify-between mb-3">
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-5 w-5 rounded" />
      </div>
      <Skeleton className="h-5 w-3/4 mb-2" />
      <Skeleton className="h-4 w-full mb-1" />
      <Skeleton className="h-4 w-2/3 mb-4" />
      <div className="flex items-center gap-3 mb-4">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 w-16" />
      </div>
      <Skeleton className="h-9 w-full rounded-md" />
    </div>
  );
}

export function TodaysLessonSkeleton() {
  return (
    <div className="pixo-card gradient-bg p-8">
      <div className="flex flex-col lg:flex-row lg:items-center gap-6">
        <div className="flex-1 space-y-3">
          <Skeleton className="h-4 w-32 bg-white/20" />
          <Skeleton className="h-8 w-3/4 bg-white/20" />
          <Skeleton className="h-4 w-full bg-white/20" />
          <div className="flex gap-4">
            <Skeleton className="h-4 w-24 bg-white/20" />
            <Skeleton className="h-4 w-24 bg-white/20" />
            <Skeleton className="h-4 w-20 bg-white/20" />
          </div>
        </div>
        <div className="flex flex-col items-center gap-4">
          <Skeleton className="h-[100px] w-[100px] rounded-full bg-white/20" />
          <Skeleton className="h-10 w-32 rounded-md bg-white/20" />
        </div>
      </div>
    </div>
  );
}

export function ProfileAvatarSkeleton() {
  return (
    <div className="text-center mb-6">
      <Skeleton className="w-24 h-24 rounded-full mx-auto mb-4" />
      <Skeleton className="h-7 w-36 mx-auto mb-2" />
      <Skeleton className="h-4 w-48 mx-auto" />
    </div>
  );
}

export function BadgeSkeleton() {
  return (
    <div className="text-center p-3 rounded-xl border border-border">
      <Skeleton className="w-12 h-12 rounded-full mx-auto mb-2" />
      <Skeleton className="h-3 w-16 mx-auto mb-1" />
      <Skeleton className="h-3 w-10 mx-auto" />
    </div>
  );
}

export function BillingCardSkeleton() {
  return (
    <div className="pixo-card p-6">
      <div className="flex items-start gap-4">
        <Skeleton className="w-12 h-12 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-24" />
          <div className="grid grid-cols-2 gap-3 mt-3">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function PaymentRowSkeleton() {
  return (
    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-xl">
      <div className="flex items-center gap-3">
        <Skeleton className="h-5 w-5 rounded" />
        <div className="space-y-1">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-3 w-36" />
        </div>
      </div>
      <div className="text-right space-y-1">
        <Skeleton className="h-4 w-16 ml-auto" />
        <Skeleton className="h-3 w-10 ml-auto" />
      </div>
    </div>
  );
}

export function ParentDashboardSkeleton() {
  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      {/* Child selector */}
      <div className="flex items-center gap-3">
        <Skeleton className="w-12 h-12 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <DashboardCardSkeleton />
        <DashboardCardSkeleton />
      </div>
    </div>
  );
}

export function TrophyRoomSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8 pb-24">
      <div className="flex items-center gap-3 mb-6">
        <Skeleton className="w-14 h-14 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-56" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3 mb-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="pixo-card text-center py-4">
            <Skeleton className="h-6 w-6 rounded-full mx-auto mb-2" />
            <Skeleton className="h-7 w-12 mx-auto mb-1" />
            <Skeleton className="h-3 w-16 mx-auto" />
          </div>
        ))}
      </div>
      <div className="pixo-card mb-6">
        <Skeleton className="h-5 w-32 mb-4" />
        <div className="flex items-center gap-3 mb-4">
          <Skeleton className="h-[72px] w-[72px] rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      </div>
      <div className="pixo-card">
        <Skeleton className="h-5 w-28 mb-4" />
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <BadgeSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

export function StudentDashboardSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8 pb-24">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4">
          <Skeleton className="w-16 h-16 rounded-full hidden sm:block" />
          <div className="space-y-2">
            <Skeleton className="h-9 w-72" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
      </div>
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
      {/* Today's Lesson */}
      <div className="mb-8">
        <TodaysLessonSkeleton />
      </div>
      {/* Lesson Grid */}
      <Skeleton className="h-6 w-36 mb-6" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <LessonCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
