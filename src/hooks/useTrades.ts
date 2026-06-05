import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api';
import type { Trade, TradeStats, TradeInput } from '../types';

export interface TradeFilters {
  asset?: string;
  outcome?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

export function useTrades(filters?: TradeFilters) {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<TradeStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const params = new URLSearchParams();
  if (filters) {
    Object.entries(filters).forEach(([k, v]) => {
      if (v != null && v !== '') params.append(k, String(v));
    });
  }
  const qs = params.toString();

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<{ trades: Trade[]; total: number; stats: TradeStats }>(
        `/trades${qs ? `?${qs}` : ''}`,
      );
      setTrades(data.trades);
      setTotal(data.total);
      setStats(data.stats);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [qs]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const createTrade = async (input: TradeInput) => {
    const created = await api.post<Trade>('/trades', input);
    await refetch();
    return created;
  };

  const updateTrade = async (id: number, input: Partial<TradeInput>) => {
    const updated = await api.put<Trade>(`/trades/${id}`, input);
    await refetch();
    return updated;
  };

  const deleteTrade = async (id: number) => {
    await api.delete<{ success: boolean }>(`/trades/${id}`);
    await refetch();
  };

  return { trades, total, stats, loading, error, refetch, createTrade, updateTrade, deleteTrade };
}
