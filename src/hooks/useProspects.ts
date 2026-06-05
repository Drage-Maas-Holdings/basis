import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api';
import type { Prospect, ProspectInput, PipelineSummary } from '../types';

export interface ProspectFilters {
  stage?: string;
  priority?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export function useProspects(filters?: ProspectFilters) {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [total, setTotal] = useState(0);
  const [pipelineSummary, setPipelineSummary] = useState<PipelineSummary | null>(
    null,
  );
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
      const data = await api.get<{
        prospects: Prospect[];
        total: number;
        pipelineSummary: PipelineSummary;
      }>(`/prospects${qs ? `?${qs}` : ''}`);
      setProspects(data.prospects);
      setTotal(data.total);
      setPipelineSummary(data.pipelineSummary);
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

  const createProspect = async (input: ProspectInput) => {
    const created = await api.post<Prospect>('/prospects', input);
    await refetch();
    return created;
  };

  const updateProspect = async (id: number, input: Partial<ProspectInput>) => {
    const updated = await api.put<Prospect>(`/prospects/${id}`, input);
    await refetch();
    return updated;
  };

  const deleteProspect = async (id: number) => {
    await api.delete<{ success: boolean }>(`/prospects/${id}`);
    await refetch();
  };

  return {
    prospects,
    total,
    pipelineSummary,
    loading,
    error,
    refetch,
    createProspect,
    updateProspect,
    deleteProspect,
  };
}
