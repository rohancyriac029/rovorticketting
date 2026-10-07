import { Router } from 'express';
import { createProjectSchema } from '@app/shared';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { createProject, getProjectDetail, listProjects } from '../services/projectService.js';
import { getRepoInsights } from '../services/repoInsightsService.js';

export const projectsRouter = Router();

projectsRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const projects = await listProjects();
    res.json(projects);
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
