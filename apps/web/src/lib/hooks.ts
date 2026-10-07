import { useEffect, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  CreateProjectInput,
  CreateTicketInput,
  ProjectDetailDTO,
  ProjectListItemDTO,
  RepoInsightsResponse,
  TicketDTO,
  UpdateTicketInput,
} from '@app/shared';
import { apiFetch } from './apiFetch';
import { queryKeys } from './queryKeys';

export function useProjects(q = '') {
  return useQuery({
    queryKey: queryKeys.projectList(q),
    queryFn: () =>
      apiFetch<ProjectListItemDTO[]>(`/api/projects${q ? `?q=${encodeURIComponent(q)}` : ''}`),
    // Keep the previous results on screen while a new search loads, instead of flashing skeletons.
    placeholderData: (prev) => prev,
  });
}

export function useProject(id: string) {
  return useQuery({
    queryKey: queryKeys.project(id),
    queryFn: () => apiFetch<ProjectDetailDTO>(`/api/projects/${id}`),
    enabled: !!id,
  });
}

export interface TicketFilters {
  q?: string;
  status?: string;
  priority?: string;
  [key: string]: string | undefined;
}

function buildTicketQuery(filters: TicketFilters) {
  const params = new URLSearchParams();
  if (filters.q) params.set('q', filters.q);
  if (filters.status) params.set('status', filters.status);
  if (filters.priority) params.set('priority', filters.priority);
  return params.toString();
}

export function useTickets(projectId: string, filters: TicketFilters) {
  return useQuery({
    queryKey: queryKeys.tickets(projectId, filters),
    queryFn: () => {
      const qs = buildTicketQuery(filters);
      return apiFetch<TicketDTO[]>(`/api/projects/${projectId}/tickets${qs ? `?${qs}` : ''}`);
    },
    enabled: !!projectId,
    placeholderData: (prev) => prev,
  });
}

export function useTicket(id: string) {
  return useQuery({
    queryKey: queryKeys.ticket(id),
    queryFn: () => apiFetch<TicketDTO & { project: { id: string; name: string } }>(`/api/tickets/${id}`),
    enabled: !!id,
  });
}

export function useRepoInsights(projectId: string) {
  return useQuery({
    queryKey: queryKeys.repoInsights(projectId),
    queryFn: () => apiFetch<RepoInsightsResponse>(`/api/projects/${projectId}/repo-insights`),
    enabled: !!projectId,
    staleTime: 60_000,
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateProjectInput) =>
      apiFetch<ProjectListItemDTO>('/api/projects', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects });
    },
  });
}

function invalidateTicketRelated(
  queryClient: ReturnType<typeof useQueryClient>,
  projectId: string,
) {
  queryClient.invalidateQueries({ queryKey: ['tickets', projectId] });
  queryClient.invalidateQueries({ queryKey: queryKeys.project(projectId) });
  queryClient.invalidateQueries({ queryKey: queryKeys.projects });
}

export function useCreateTicket(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTicketInput) =>
      apiFetch<TicketDTO>(`/api/projects/${projectId}/tickets`, {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: () => invalidateTicketRelated(queryClient, projectId),
  });
}

export function useUpdateTicket(ticketId: string, projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateTicketInput) =>
      apiFetch<TicketDTO>(`/api/tickets/${ticketId}`, {
        method: 'PATCH',
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.ticket(ticketId) });
      invalidateTicketRelated(queryClient, projectId);
    },
  });
}

/**
 * Runs `purge` when the component unmounts, but only after `deleted.current` was set. Cached data
 * for a deleted record has to go, or Back would show it again — but removing it while its page is
 * still mounted would make that page refetch and flash an error on the way out.
 */
function usePurgeAfterDelete(purge: () => void) {
  const deleted = useRef(false);
  const purgeRef = useRef(purge);
  useEffect(() => {
    purgeRef.current = purge;
  });
  useEffect(
    () => () => {
      if (deleted.current) purgeRef.current();
    },
    [],
  );
  return deleted;
}

export function useDeleteProject(projectId: string) {
  const queryClient = useQueryClient();
  const deleted = usePurgeAfterDelete(() => {
    queryClient.removeQueries({ queryKey: queryKeys.project(projectId) });
    queryClient.removeQueries({ queryKey: ['tickets', projectId] });
    queryClient.removeQueries({ queryKey: queryKeys.repoInsights(projectId) });
  });
  return useMutation({
    mutationFn: () => apiFetch<void>(`/api/projects/${projectId}`, { method: 'DELETE' }),
    onSuccess: () => {
      deleted.current = true;
      queryClient.invalidateQueries({ queryKey: queryKeys.projects });
    },
  });
}

export function useDeleteTicket(ticketId: string, projectId: string) {
  const queryClient = useQueryClient();
  const deleted = usePurgeAfterDelete(() => {
    queryClient.removeQueries({ queryKey: queryKeys.ticket(ticketId) });
  });
  return useMutation({
    mutationFn: () => apiFetch<void>(`/api/tickets/${ticketId}`, { method: 'DELETE' }),
    onSuccess: () => {
      deleted.current = true;
      invalidateTicketRelated(queryClient, projectId);
    },
  });
}
