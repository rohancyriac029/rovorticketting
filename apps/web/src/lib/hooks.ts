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

export function useProjects() {
  return useQuery({
    queryKey: queryKeys.projects,
    queryFn: () => apiFetch<ProjectListItemDTO[]>('/api/projects'),
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
