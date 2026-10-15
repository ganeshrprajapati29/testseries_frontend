import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { adminApi } from '@/features/admin/admin.api';
import { useAdminMutation } from '@/features/admin/hooks/useAdminMutation';
import { useServerErrors } from '@/features/auth/hooks/useServerErrors';
import { FormAlert } from '@/features/auth/components/AuthCard';
import type { CategoryNode, ModuleType } from '@/types';
import { CATEGORY_ICONS } from '../categories/categoryIcons';
import { Button } from '../common/Button';
import { Checkbox, Input, Textarea } from '../common/Input';
import { Modal } from '../common/Modal';
import { Select } from '../common/Select';

const schema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(120),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .max(100)
    .regex(/^[a-z0-9-]*$/, 'Only lowercase letters, numbers and hyphens'),
  parentId: z.string(),
  description: z.string().max(2000),
  icon: z.string(),
  isActive: z.boolean(),
});
type FormValues = z.infer<typeof schema>;

interface CategoryEditorProps {
  open: boolean;
  onClose: () => void;
  moduleType: ModuleType;
  category?: CategoryNode | null;
  parentId?: string | null;
  parentOptions: { value: string; label: string }[];
}

export function CategoryEditor({ open, onClose, moduleType, category, parentId, parentOptions }: CategoryEditorProps) {
  const isEdit = !!category;
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });
  const { formError, setFormError, handle } = useServerErrors(setError);

  useEffect(() => {
    if (!open) return;
    setFormError(null);
    reset({
      name: category?.name ?? '',
      slug: category?.slug ?? '',
      parentId: category ? (category.parentId ?? '') : (parentId ?? ''),
      description: category?.description ?? '',
      icon: category?.icon ?? '',
      isActive: category ? category.isActive : true,
    });
  }, [open, category, parentId, reset, setFormError]);

  const save = useAdminMutation(
    (v: FormValues) => {
      const body = { ...v, parentId: v.parentId || null, slug: v.slug || undefined };
      return isEdit ? adminApi.updateCategory(category!._id, body) : adminApi.createCategory({ ...body, moduleType });
    },
    { success: isEdit ? 'Category updated' : 'Category created', onSuccess: onClose, silentError: true },
  );

  // Prevent choosing the category itself or one of its descendants as parent.
  const blocked = new Set<string>();
  const collect = (n: CategoryNode) => {
    blocked.add(n._id);
    n.children.forEach(collect);
  };
  if (category) collect(category);

  const onSubmit = handleSubmit((v) => {
    setFormError(null);
    save.mutate(v, { onError: handle });
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? `Edit "${category!.name}"` : 'New category'}
      description={moduleType === 'PYQS' ? 'PYQs: top level = exam, next level = subject.' : 'Categories can be nested up to 5 levels.'}
      dismissible={!save.isPending}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={save.isPending}>
            Cancel
          </Button>
          <Button onClick={onSubmit} loading={save.isPending}>
            {isEdit ? 'Save changes' : 'Create category'}
          </Button>
        </>
      }
    >
      <FormAlert message={formError} />
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <Input label="Name" required error={errors.name?.message} {...register('name')} />
        <Input label="URL slug" hint="Leave empty to generate from the name" error={errors.slug?.message} {...register('slug')} />
        <Select label="Parent category" placeholder="- None (top level) -" options={parentOptions.filter((o) => !blocked.has(o.value))} error={errors.parentId?.message} {...register('parentId')} />
        <Select label="Icon" placeholder="Automatic" options={Object.keys(CATEGORY_ICONS).map((k) => ({ value: k, label: k }))} {...register('icon')} />
        <Textarea label="Description" rows={3} error={errors.description?.message} {...register('description')} />
        <Checkbox label="Active" description="Inactive categories are hidden from students." {...register('isActive')} />
      </form>
    </Modal>
  );
}
