import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api';
import type { DashboardStats, ActivityItem } from '../types';

export function useDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const [s, a] = await Promise.all([
        api.get<DashboardStats>('/dashboard'),
        api.get<ActivityItem[]>('/activity?limit=10'),
      ]);
      setStats(s);
      setActivity(a);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { stats, activity, loading, error, refetch };
}
