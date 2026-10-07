'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createProjectSchema, type CreateProjectInput } from '@app/shared';
import { toast } from 'sonner';
import { Dialog } from './Dialog';
import { useCreateProject } from '@/lib/hooks';
import { ApiError } from '@/lib/apiFetch';

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

  async function onSubmit(data: CreateProjectInput) {
    try {
      await createProject.mutateAsync({ ...data, repo: data.repo || undefined });
      toast.success('Project created');
      reset();
      onClose();
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code === 'REPO_NOT_FOUND') {
          setError('repo', { message: err.message });
        } else {
          toast.error(err.message);
        }
      } else {
        toast.error('Something went wrong');
      }
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title="New project">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="name" className="mb-1 block text-sm font-medium text-[var(--text)]">
            Name
          </label>
          <input
            id="name"
            {...register('name')}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:ring-2 focus:ring-ochre-400"
          />
          {errors.name && <p className="mt-1 text-xs text-rose-600">{errors.name.message}</p>}
        </div>
        <div>
          <label
            htmlFor="description"
            className="mb-1 block text-sm font-medium text-[var(--text)]"
          >
            Description
          </label>
          <textarea
            id="description"
            {...register('description')}
            rows={3}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:ring-2 focus:ring-ochre-400"
          />
        </div>
        <div>
          <label htmlFor="repo" className="mb-1 block text-sm font-medium text-[var(--text)]">
            GitHub repo (optional)
          </label>
          <input
            id="repo"
            placeholder="owner/repo or https://github.com/owner/repo"
            {...register('repo')}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:ring-2 focus:ring-ochre-400"
          />
          {errors.repo && <p className="mt-1 text-xs text-rose-600">{errors.repo.message}</p>}
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-4 py-2 text-sm font-medium text-[var(--text-muted)] hover:bg-ochre-100 dark:hover:bg-ink-700"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-full bg-ochre-500 px-5 py-2 text-sm font-semibold text-white hover:bg-ochre-600 disabled:opacity-50"
          >
            {isSubmitting ? 'Creating…' : 'Create project'}
          </button>
        </div>
      </form>
    </Dialog>
  );
}
