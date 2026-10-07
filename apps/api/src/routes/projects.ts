import { Router } from 'express';
import { createProjectSchema, projectQuerySchema } from '@app/shared';
import { asyncHandler } from '../middleware/asyncHandler.js';
import {
  createProject,
  deleteProject,
  getProjectDetail,
  listProjects,
} from '../services/projectService.js';
import { getRepoInsights } from '../services/repoInsightsService.js';

export const projectsRouter = Router();

projectsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const { q } = projectQuerySchema.parse(req.query);
    const projects = await listProjects(q);
    res.json(projects);
  }),
);

projectsRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    await deleteProject(req.params.id!);
    res.status(204).end();
  }),
);

projectsRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const input = createProjectSchema.parse(req.body);
    const project = await createProject(input);
    res.status(201).json(project);
  }),
);

projectsRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const project = await getProjectDetail(req.params.id!);
    res.json(project);
  }),
);

projectsRouter.get(
  '/:id/repo-insights',
  asyncHandler(async (req, res) => {
    const insights = await getRepoInsights(req.params.id!);
    res.json(insights);
  }),
);
