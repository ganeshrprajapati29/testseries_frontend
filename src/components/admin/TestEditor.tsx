import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { adminApi } from '@/features/admin/admin.api';
import type { AdminTest } from '@/features/admin/admin.types';
import { fromLocalInput, toLocalInput, Toggle } from '@/features/admin/components/formHelpers';
import { useAdminMutation } from '@/features/admin/hooks/useAdminMutation';
import { FormAlert } from '@/features/auth/components/AuthCard';
import { useServerErrors } from '@/features/auth/hooks/useServerErrors';
import { flattenTree } from '@/features/categories/categories.api';
import { TEST_TYPE_LABELS } from '@/lib/formatters';
import type { ModuleType } from '@/types';
import { Button } from '../common/Button';
import { Input, Textarea } from '../common/Input';
import { Select } from '../common/Select';

const schema = z
  .object({
    title: z.string().trim().min(3, 'Title must be at least 3 characters').max(200),
    description: z.string().max(5000),
    instructions: z.string().max(10000),
    seriesId: z.string(),
    categoryId: z.string(),
    testType: z.enum(['FULL_LENGTH', 'SECTIONAL', 'CHAPTER', 'MINI', 'PYQ_PAPER']),
    paperYear: z.string().regex(/^(|\d{4})$/, 'Enter a 4 digit year'),
    paperName: z.string().max(120),
    english: z.boolean(),
    hindi: z.boolean(),
    durationMinutes: z.coerce.number<number>().int().min(1, 'At least 1 minute').max(360, 'At most 6 hours'),
    marksPerCorrect: z.coerce.number<number>().min(0).max(100),
    negativeMarks: z.coerce.number<number>().min(0).max(100),
    maxAttempts: z.coerce.number<number>().int().min(0).max(100),
    isFree: z.boolean(),
    availableFrom: z.string(),
    availableUntil: z.string(),
    randomizeQuestions: z.boolean(),
    randomizeOptions: z.boolean(),
    resultVisibility: z.enum(['IMMEDIATE', 'AFTER_WINDOW', 'HIDDEN']),
    sortOrder: z.coerce.number<number>().int().min(0),
  })
  .refine((d) => d.english || d.hindi, { message: 'Select at least one language', path: ['english'] })
  .refine((d) => !!d.seriesId || !!d.categoryId, { message: 'Select a test series or a category', path: ['categoryId'] })
  .refine((d) => !d.availableFrom || !d.availableUntil || new Date(d.availableFrom) < new Date(d.availableUntil), {
    message: 'Must be after the start time',
    path: ['availableUntil'],
  });

type FormValues = z.infer<typeof schema>;

interface TestEditorProps {
  test?: AdminTest | null;
  moduleType: ModuleType;
  defaultSeriesId?: string;
  defaultCategoryId?: string;
  onSaved?: (t: AdminTest) => void;
  onCancel?: () => void;
}

const idOf = (v: unknown) => (v && typeof v === 'object' ? String((v as { _id: string })._id) : v ? String(v) : '');

export function TestEditor({ test, moduleType, defaultSeriesId, defaultCategoryId, onSaved, onCancel }: TestEditorProps) {
  const isEdit = !!test;
  const isPyq = moduleType === 'PYQS';
  const series = useQuery({ queryKey: ['admin', 'series-options', moduleType], queryFn: () => adminApi.seriesList({ limit: 100, moduleType }) });
  const categories = useQuery({ queryKey: ['admin', 'categories', moduleType], queryFn: () => adminApi.categories(moduleType) });

  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    setError,
    formState: { errors, isDirty },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });
  const { formError, setFormError, handle } = useServerErrors(setError);

  useEffect(() => {
    reset({
      title: test?.title ?? '',
      description: test?.description ?? '',
      instructions: test?.instructions ?? '',
      seriesId: test ? idOf(test.seriesId) : (defaultSeriesId ?? ''),
      categoryId: test ? idOf(test.categoryId) : (defaultCategoryId ?? ''),
      testType: test?.testType ?? (isPyq ? 'PYQ_PAPER' : 'FULL_LENGTH'),
      paperYear: test?.paperYear ? String(test.paperYear) : '',
      paperName: test?.paperName ?? '',
      english: test ? test.languageOptions.includes('en') : true,
      hindi: test ? test.languageOptions.includes('hi') : false,
      durationMinutes: test ? Math.round(test.durationSeconds / 60) : 60,
      marksPerCorrect: test?.marksPerCorrect ?? (isPyq ? 2.5 : 2),
      negativeMarks: test?.negativeMarks ?? (isPyq ? 0.83 : 0.66),
      maxAttempts: test?.maxAttempts ?? (isPyq ? 0 : 1),
      isFree: test?.isFree ?? false,
      availableFrom: toLocalInput(test?.availableFrom),
      availableUntil: toLocalInput(test?.availableUntil),
      randomizeQuestions: test?.randomizeQuestions ?? false,
      randomizeOptions: test?.randomizeOptions ?? false,
      resultVisibility: test?.resultVisibility ?? 'IMMEDIATE',
      sortOrder: test?.sortOrder ?? 0,
    });
  }, [test, defaultSeriesId, defaultCategoryId, isPyq, reset]);

  const save = useAdminMutation(
    (v: FormValues) => {
      const body = {
        title: v.title,
        description: v.description,
        instructions: v.instructions,
        moduleType,
        seriesId: v.seriesId || null,
        categoryId: v.categoryId || undefined,
        testType: v.testType,
        paperYear: v.paperYear ? Number(v.paperYear) : null,
        paperName: v.paperName,
        languageOptions: [...(v.english ? ['en'] : []), ...(v.hindi ? ['hi'] : [])],
        durationMinutes: v.durationMinutes,
        marksPerCorrect: v.marksPerCorrect,
        negativeMarks: v.negativeMarks,
        maxAttempts: v.maxAttempts,
        isFree: v.isFree,
        availableFrom: fromLocalInput(v.availableFrom),
        availableUntil: fromLocalInput(v.availableUntil),
        randomizeQuestions: v.randomizeQuestions,
        randomizeOptions: v.randomizeOptions,
        resultVisibility: v.resultVisibility,
        sortOrder: v.sortOrder,
      };
      return isEdit ? adminApi.updateTest(test!._id, body) : adminApi.createTest(body);
    },
    { success: isEdit ? 'Test settings saved' : 'Test created as draft', silentError: true, onSuccess: (t) => onSaved?.(t) },
  );

  const seriesId = watch('seriesId');
  const onSubmit = handleSubmit((v) => {
    setFormError(null);
    save.mutate(v, { onError: handle });
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      <FormAlert message={formError} />
      <div className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <Input label={isPyq ? 'Paper title' : 'Test title'} required placeholder={isPyq ? 'e.g. NDA (I) 2024 Mathematics' : 'e.g. GS Full Mock Test 1'} error={errors.title?.message} {...register('title')} />
        </div>
        {!isPyq && (
          <Select
            label="Test series"
            placeholder="- Not part of a series -"
            options={(series.data?.items ?? []).map((s) => ({ value: s._id, label: `${s.title}${s.publicationStatus !== 'published' ? ` (${s.publicationStatus})` : ''}` }))}
            hint="Tests inherit free/paid access from their series"
            {...register('seriesId')}
          />
        )}
        <Select
          label={isPyq ? 'Exam / subject' : 'Category'}
          placeholder={seriesId ? "- Use the series' category -" : 'Select category'}
          options={flattenTree(categories.data ?? []).map(({ value, label }) => ({ value, label }))}
          error={errors.categoryId?.message}
          hint={isPyq ? 'Choose the subject, e.g. NDA / Maths' : undefined}
          {...register('categoryId')}
        />
        <Select label="Test type" options={Object.entries(TEST_TYPE_LABELS).map(([value, label]) => ({ value, label }))} {...register('testType')} />
        {isPyq && (
          <>
            <Input label="Paper year" inputMode="numeric" placeholder="e.g. 2024" error={errors.paperYear?.message} {...register('paperYear')} />
            <Input label="Paper name" placeholder="e.g. NDA (I)" {...register('paperName')} />
          </>
        )}
        <Input label="Duration (minutes)" type="number" min={1} required error={errors.durationMinutes?.message} {...register('durationMinutes')} />
        <Input label="Marks per correct answer" type="number" step="0.01" min={0} error={errors.marksPerCorrect?.message} {...register('marksPerCorrect')} />
        <Input label="Negative marks per wrong answer" type="number" step="0.01" min={0} error={errors.negativeMarks?.message} {...register('negativeMarks')} />
        <Input label="Attempts allowed" type="number" min={0} hint="0 = unlimited" error={errors.maxAttempts?.message} {...register('maxAttempts')} />
        <Select
          label="Result visibility"
          options={[
            { value: 'IMMEDIATE', label: 'Immediately after submission' },
            { value: 'AFTER_WINDOW', label: 'After the test window closes' },
            { value: 'HIDDEN', label: 'Hidden until released by admin' },
          ]}
          {...register('resultVisibility')}
        />
        <Input label="Available from" type="datetime-local" hint="Optional schedule" {...register('availableFrom')} />
        <Input label="Available until" type="datetime-local" error={errors.availableUntil?.message} {...register('availableUntil')} />
        <Input label="Display order" type="number" min={0} {...register('sortOrder')} />
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
        <div className="md:col-span-2">
          <Textarea label="Description" rows={2} {...register('description')} />
        </div>
        <div className="md:col-span-2">
          <Textarea label="Test-specific instructions" rows={3} hint="Shown on the instructions page in addition to the general instructions" {...register('instructions')} />
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <Controller control={control} name="isFree" render={({ field }) => <Toggle checked={field.value} onChange={field.onChange} label="Free test" description="Open even in a paid series" />} />
        <Controller control={control} name="randomizeQuestions" render={({ field }) => <Toggle checked={field.value} onChange={field.onChange} label="Shuffle questions" description="Different order per attempt" />} />
        <Controller control={control} name="randomizeOptions" render={({ field }) => <Toggle checked={field.value} onChange={field.onChange} label="Shuffle options" description="Avoid for 'all of the above'" />} />
      </div>
      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button variant="outline" onClick={onCancel} disabled={save.isPending}>
            Cancel
          </Button>
        )}
        <Button type="submit" loading={save.isPending} disabled={isEdit && !isDirty}>
          {isEdit ? 'Save settings' : isPyq ? 'Create paper' : 'Create test'}
        </Button>
      </div>
    </form>
  );
}
