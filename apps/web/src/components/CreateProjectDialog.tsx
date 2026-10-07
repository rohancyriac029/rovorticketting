'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createProjectSchema, type CreateProjectInput } from '@app/shared';
import { toast } from 'sonner';
import { Dialog } from './Dialog';
import { Button } from './Button';
import { Field, fieldAria } from './Field';
import { useCreateProject } from '@/lib/hooks';
import { ApiError } from '@/lib/apiFetch';
import { submitOnModEnter } from '@/lib/forms';

export function CreateProjectDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const createProject = useCreateProject();
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CreateProjectInput>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: { name: '', description: '', repo: '' },
  });

  function close() {
    reset();
    onClose();
  }

  async function onSubmit(data: CreateProjectInput) {
    try {
      await createProject.mutateAsync({ ...data, repo: data.repo || undefined });
      toast.success('Project created');
      close();
    } catch (err) {
      if (err instanceof ApiError && err.code === 'REPO_NOT_FOUND') {
        setError('repo', { message: err.message }, { shouldFocus: true });
      } else {
        toast.error(
          err instanceof ApiError ? err.message : 'Couldn’t create the project. Try again.',
        );
      }
    }
  }

  return (
    <Dialog
      open={open}
      onClose={close}
      title="New Project"
      description="Group related tickets and optionally link a public GitHub repository."
    >
      <form onSubmit={handleSubmit(onSubmit)} onKeyDown={submitOnModEnter} className="space-y-4">
        <Field label="Name" htmlFor="project-name" error={errors.name?.message}>
          <input
            {...register('name')}
            {...fieldAria('project-name', errors.name?.message)}
            autoComplete="off"
            placeholder="Payments API…"
            className="input"
          />
        </Field>
        <Field
          label="Description"
          htmlFor="project-description"
          optional
          error={errors.description?.message}
        >
          <textarea
            {...register('description')}
            {...fieldAria('project-description', errors.description?.message)}
            rows={3}
            placeholder="What is this project for…"
            className="input resize-y"
          />
        </Field>
        <Field
          label="GitHub Repository"
          htmlFor="project-repo"
          optional
          error={errors.repo?.message}
          hint="Adds stars, forks, open issues & release info to the project."
        >
          <input
            {...register('repo')}
            {...fieldAria('project-repo', errors.repo?.message)}
            autoComplete="off"
            spellCheck={false}
            placeholder="owner/repo or https://github.com/owner/repo…"
            className="input"
          />
        </Field>
        <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
          <Button variant="ghost" onClick={close}>
            Cancel
          </Button>
          <Button type="submit" loading={isSubmitting}>
            Create Project
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
