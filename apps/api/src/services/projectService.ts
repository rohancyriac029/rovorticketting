import type { CreateProjectInput } from '@app/shared';
import { parseRepo } from '@app/shared';
import { AppError } from '../lib/errors.js';
import {
  countTicketsByProjectAndStatus,
  createProject as createProjectRow,
  findAllProjects,
  findProjectById,
  findRecentTicketsForProjects,
} from '../repositories/projectRepository.js';
import { countTicketsForProject } from '../repositories/ticketRepository.js';
import { fetchRepo } from '../github/client.js';
import { toProjectDTO, toTicketCounts, toTicketDTO } from './mappers.js';
import type { ProjectDetailDTO, ProjectListItemDTO } from '@app/shared';

const RECENT_TICKETS_LIMIT = 3;

export async function listProjects(): Promise<ProjectListItemDTO[]> {
  const projects = await findAllProjects();
  const grouped = await countTicketsByProjectAndStatus();
  const recentLists = await findRecentTicketsForProjects(
    projects.map((p) => p.id),
    RECENT_TICKETS_LIMIT,
  );

  return projects.map((project, i) => ({
    ...toProjectDTO(project),
    counts: toTicketCounts(grouped.filter((g) => g.projectId === project.id)),
    recentTickets: (recentLists[i] ?? []).map(toTicketDTO),
  }));
}

export async function getProjectDetail(id: string): Promise<ProjectDetailDTO> {
  const project = await findProjectById(id);
  if (!project) throw AppError.notFound('Project not found');

  const grouped = await countTicketsForProject(id);
  return {
    ...toProjectDTO(project),
    counts: toTicketCounts(grouped.map((g) => ({ ...g, projectId: id }))),
  };
}

export async function createProject(input: CreateProjectInput) {
  let repoOwner: string | null = null;
  let repoName: string | null = null;

  if (input.repo) {
    const parsed = parseRepo(input.repo);
    if (!parsed) throw AppError.validation('Invalid repo format', { repo: ['Invalid format'] });

    try {
      const result = await fetchRepo(parsed.owner, parsed.name);
      if (result.status === 404) {
        throw AppError.repoNotFound(`GitHub repo "${parsed.owner}/${parsed.name}" was not found`);
      }
    } catch (err) {
      if (err instanceof AppError) throw err;
      // GitHub unreachable: allow the save, just log a warning.
      console.warn(`Could not verify repo ${parsed.owner}/${parsed.name} at creation time`, err);
    }

    repoOwner = parsed.owner;
    repoName = parsed.name;
  }

  const project = await createProjectRow({
    name: input.name,
    description: input.description ?? '',
    repoOwner,
    repoName,
  });

  return toProjectDTO(project);
}
