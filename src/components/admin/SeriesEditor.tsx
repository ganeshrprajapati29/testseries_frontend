import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { adminApi } from '@/features/admin/admin.api';
import type { AdminSeries } from '@/features/admin/admin.types';
import { fromLocalInput, ImageField, toLocalInput, Toggle } from '@/features/admin/components/formHelpers';
import { useAdminMutation } from '@/features/admin/hooks/useAdminMutation';
import { FormAlert } from '@/features/auth/components/AuthCard';
import { useServerErrors } from '@/features/auth/hooks/useServerErrors';
import { flattenTree } from '@/features/categories/categories.api';
import type { ModuleType } from '@/types';
import { Button } from '../common/Button';
import { Input, Textarea } from '../common/Input';
import { Modal } from '../common/Modal';
import { Select } from '../common/Select';

const schema = z
  .object({
    title: z.string().trim().min(3, 'Title must be at least 3 characters').max(200),
    categoryId: z.string().min(1, 'Select a category'),
    examName: z.string().max(120),
    subject: z.string().max(120),
    description: z.string().max(10000),
    highlights: z.string().max(3000),
    coverImage: z.string(),
    english: z.boolean(),
    hindi: z.boolean(),
    accessType: z.enum(['free', 'paid']),
    price: z.coerce.number<number>().min(0),
    mrp: z.coerce.number<number>().min(0),
    validityDays: z.coerce.number<number>().int().min(1).max(3650),
    availableFrom: z.string(),
    availableUntil: z.string(),
    isFeatured: z.boolean(),
    sortOrder: z.coerce.number<number>().int().min(0),
  })
  .refine((d) => d.english || d.hindi, { message: 'Select at least one language', path: ['english'] })
  .refine((d) => d.accessType === 'free' || d.price > 0, { message: 'Enter a price for a paid series', path: ['price'] });

type FormValues = z.infer<typeof schema>;

export function SeriesEditor({ open, onClose, series, moduleType = 'TEST_SERIES', onSaved }: { open: boolean; onClose: () => void; series?: AdminSeries | null; moduleType?: ModuleType; onSaved?: (s: AdminSeries) => void }) {
  const isEdit = !!series;
  const categories = useQuery({ queryKey: ['admin', 'categories', moduleType], queryFn: () => adminApi.categories(moduleType), enabled: open });
  const {
    register,
    handleSubmit,
    reset,
    watch,
    control,
    setError,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });
  const { formError, setFormError, handle } = useServerErrors(setError);

  useEffect(() => {
    if (!open) return;
    setFormError(null);
    reset({
      title: series?.title ?? '',
      categoryId: series ? (typeof series.categoryId === 'string' ? series.categoryId : series.categoryId._id) : '',
      examName: series?.examName ?? '',
      subject: series?.subject ?? '',
      description: series?.description ?? '',
      highlights: series?.highlights.join('\n') ?? '',
      coverImage: series?.coverImage ?? '',
      english: series ? series.languageOptions.includes('en') : true,
      hindi: series ? series.languageOptions.includes('hi') : false,
      accessType: series?.accessType ?? 'free',
      price: series?.price ?? 0,
      mrp: series?.mrp ?? 0,
      validityDays: series?.validityDays ?? 365,
      availableFrom: toLocalInput(series?.availableFrom),
      availableUntil: toLocalInput(series?.availableUntil),
      isFeatured: series?.isFeatured ?? false,
      sortOrder: series?.sortOrder ?? 0,
    });
  }, [open, series, reset, setFormError]);

  const save = useAdminMutation(
    (v: FormValues) => {
      const body = {
        title: v.title,
        categoryId: v.categoryId,
        moduleType,
        examName: v.examName,
        subject: v.subject,
        description: v.description,
        highlights: v.highlights
          .split('\n')
          .map((h) => h.trim())
          .filter(Boolean)
          .slice(0, 12),
        coverImage: v.coverImage,
        languageOptions: [...(v.english ? ['en'] : []), ...(v.hindi ? ['hi'] : [])],
        accessType: v.accessType,
        price: v.accessType === 'paid' ? v.price : 0,
        mrp: v.accessType === 'paid' ? v.mrp : 0,
        validityDays: v.validityDays,
        availableFrom: fromLocalInput(v.availableFrom),
        availableUntil: fromLocalInput(v.availableUntil),
        isFeatured: v.isFeatured,
        sortOrder: v.sortOrder,
      };
      return isEdit ? adminApi.updateSeries(series!._id, body) : adminApi.createSeries(body);
    },
    {
      success: isEdit ? 'Test series updated' : 'Test series created as draft',
      silentError: true,
      onSuccess: (s) => {
        onSaved?.(s);
        onClose();
      },
    },
  );

  const accessType = watch('accessType');
  const onSubmit = handleSubmit((v) => {
    setFormError(null);
    save.mutate(v, { onError: handle });
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="xl"
      title={isEdit ? 'Edit test series' : 'New test series'}
      dismissible={!save.isPending}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={save.isPending}>
            Cancel
          </Button>
          <Button onClick={onSubmit} loading={save.isPending}>
            {isEdit ? 'Save changes' : 'Create series'}
          </Button>
        </>
      }
    >
      <FormAlert message={formError} />
      <form onSubmit={onSubmit} noValidate className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <Input label="Title" required error={errors.title?.message} {...register('title')} />
        </div>
        <Select label="Category" required placeholder={categories.isLoading ? 'Loading...' : 'Select category'} options={flattenTree(categories.data ?? []).map(({ value, label }) => ({ value, label }))} error={errors.categoryId?.message} {...register('categoryId')} />
        <Input label="Exam name" placeholder="e.g. UPSC CSE Prelims 2027" {...register('examName')} />
        <Input label="Subject" placeholder="Optional" {...register('subject')} />
        <Input label="Display order" type="number" min={0} {...register('sortOrder')} />
        <div className="md:col-span-2">
          <Textarea label="Description" rows={4} error={errors.description?.message} {...register('description')} />
        </div>
        <div className="md:col-span-2">
          <Textarea label="Highlights" rows={3} hint="One per line, shown as bullet points" {...register('highlights')} />
        </div>
        <Controller control={control} name="coverImage" render={({ field }) => <ImageField label="Cover image" folder="covers" value={field.value} onChange={field.onChange} />} />
        <div>
          <span className="label">Languages</span>
          <div className="flex gap-4 pt-2">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" className="accent-brand-600" {...register('english')} /> English
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" className="accent-brand-600" {...register('hindi')} /> Hindi
            </label>
          </div>
          {errors.english && <p className="mt-1 text-xs text-red-600">{errors.english.message}</p>}
        </div>
        <Select
          label="Access"
          options={[
            { value: 'free', label: 'Free for all registered students' },
            { value: 'paid', label: 'Paid (purchase required)' },
          ]}
          {...register('accessType')}
        />
        <Input label="Validity (days)" type="number" min={1} error={errors.validityDays?.message} {...register('validityDays')} />
        {accessType === 'paid' && (
          <>
            <Input label="Price (₹)" type="number" min={0} step="1" required error={errors.price?.message} {...register('price')} />
            <Input label="MRP (₹)" type="number" min={0} step="1" hint="Optional - shown struck through" {...register('mrp')} />
          </>
        )}
        <Input label="Available from" type="datetime-local" hint="Optional" {...register('availableFrom')} />
        <Input label="Available until" type="datetime-local" hint="Optional" error={errors.availableUntil?.message} {...register('availableUntil')} />
        <div className="md:col-span-2">
          <Controller control={control} name="isFeatured" render={({ field }) => <Toggle checked={field.value} onChange={field.onChange} label="Featured" description="Show on the home page." />} />
        </div>
      </form>
    </Modal>
  );
}
