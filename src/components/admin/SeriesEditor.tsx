import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { adminApi } from '@/features/admin/admin.api';
import type { AdminSeries } from '@/features/admin/admin.types';
import { fromLocalInput, toLocalInput, Toggle } from '@/features/admin/components/formHelpers';
import { useAdminMutation } from '@/features/admin/hooks/useAdminMutation';
import { FormAlert } from '@/features/auth/components/AuthCard';
import { useServerErrors } from '@/features/auth/hooks/useServerErrors';
import type { ModuleType } from '@/types';
import { Button } from '../common/Button';
import { Input, Textarea } from '../common/Input';
import { Modal } from '../common/Modal';
import { Select } from '../common/Select';
import { useToast } from '../common/Toast';
import { CategoryTreeSelect } from './CategoryPicker';
import { HindiPanel, TranslateButton, useTranslationEnabled } from './HindiTranslate';
import { SingleImageUploader } from './MediaUploader';

/** Textarea with one item per line -> trimmed list (max 12). */
const lines = (v: string) =>
  v
    .split('\n')
    .map((h) => h.trim())
    .filter(Boolean)
    .slice(0, 12);

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
    hiTitle: z.string().max(400),
    hiDescription: z.string().max(15000),
    hiHighlights: z.string().max(5000),
    autoTranslate: z.boolean(),
  })
  .refine((d) => d.english || d.hindi, { message: 'Select at least one language', path: ['english'] })
  .refine((d) => d.accessType === 'free' || d.price > 0, { message: 'Enter a price for a paid series', path: ['price'] });

type FormValues = z.infer<typeof schema>;

export function SeriesEditor({ open, onClose, series, moduleType = 'TEST_SERIES', onSaved }: { open: boolean; onClose: () => void; series?: AdminSeries | null; moduleType?: ModuleType; onSaved?: (s: AdminSeries) => void }) {
  const isEdit = !!series;
  const {
    register,
    handleSubmit,
    reset,
    watch,
    control,
    setValue,
    getValues,
    setError,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });
  const { formError, setFormError, handle } = useServerErrors(setError);
  const translationOn = useTranslationEnabled();
  const toast = useToast();

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
      hiTitle: series?.hi?.title ?? '',
      hiDescription: series?.hi?.description ?? '',
      hiHighlights: series?.hi?.highlights?.join('\n') ?? '',
      autoTranslate: true,
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
        highlights: lines(v.highlights),
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
        hi: { title: v.hiTitle.trim(), description: v.hiDescription.trim(), highlights: lines(v.hiHighlights) },
        autoTranslate: v.autoTranslate && translationOn,
      };
      return isEdit ? adminApi.updateSeries(series!._id, body) : adminApi.createSeries(body);
    },
    {
      success: isEdit ? 'Test series updated' : 'Test series created as draft',
      silentError: true,
      onSuccess: (s, v) => {
        if (v.autoTranslate && translationOn && !s.hi?.title) toast.info('Saved in English only - Hindi auto translation is unavailable right now.');
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
        <Controller
          control={control}
          name="categoryId"
          render={({ field }) => (
            <CategoryTreeSelect label="Category" required value={field.value ?? ''} onChange={field.onChange} moduleType={moduleType} error={errors.categoryId?.message} hint="The series is listed under this category on the website" />
          )}
        />
        <Input label="Exam name" placeholder="e.g. UPSC CSE Prelims 2027" {...register('examName')} />
        <Input label="Subject" placeholder="Optional" {...register('subject')} />
        <Input label="Display order" type="number" min={0} {...register('sortOrder')} />
        <div className="md:col-span-2">
          <Textarea label="Description" rows={4} error={errors.description?.message} {...register('description')} />
        </div>
        <div className="md:col-span-2">
          <Textarea label="Highlights" rows={3} hint="One per line, shown as bullet points" {...register('highlights')} />
        </div>
        <Controller control={control} name="coverImage" render={({ field }) => <SingleImageUploader label="Cover image" folder="covers" value={field.value} onChange={field.onChange} hint="Recommended 1600 × 800 px" />} />
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
          <Controller
            control={control}
            name="autoTranslate"
            render={({ field }) => (
              <HindiPanel
                autoTranslate={field.value}
                onAutoTranslate={field.onChange}
                actions={
                  <TranslateButton
                    getTexts={() => [getValues('title'), getValues('description'), ...lines(getValues('highlights'))]}
                    onTranslated={([t, d, ...h]) => {
                      setValue('hiTitle', t ?? '', { shouldDirty: true });
                      setValue('hiDescription', d ?? '', { shouldDirty: true });
                      setValue('hiHighlights', h.filter(Boolean).join('\n'), { shouldDirty: true });
                    }}
                  />
                }
              >
                <Input label="Title in Hindi" lang="hi" error={errors.hiTitle?.message} {...register('hiTitle')} />
                <Textarea label="Description in Hindi" lang="hi" rows={3} {...register('hiDescription')} />
                <Textarea label="Highlights in Hindi" lang="hi" rows={3} hint="One per line" {...register('hiHighlights')} />
              </HindiPanel>
            )}
          />
        </div>
        <div className="md:col-span-2">
          <Controller control={control} name="isFeatured" render={({ field }) => <Toggle checked={field.value} onChange={field.onChange} label="Featured" description="Show on the home page." />} />
        </div>
      </form>
    </Modal>
  );
}
