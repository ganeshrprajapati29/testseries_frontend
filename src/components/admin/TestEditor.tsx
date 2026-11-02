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
import { TEST_TYPE_LABELS } from '@/lib/formatters';
import type { ModuleType } from '@/types';
import { Button } from '../common/Button';
import { Input, Textarea } from '../common/Input';
import { Select } from '../common/Select';
import { PdfUploader } from './MediaUploader';
import { CategoryTreeSelect, useFlatCategories } from './CategoryPicker';
import { HindiPanel, TranslateButton, useTranslationEnabled } from './HindiTranslate';
import { useToast } from '../common/Toast';
import { FolderTree } from 'lucide-react';
import { adminApi as api2 } from '@/features/admin/admin.api';
import type { PdfRef } from '@/types';

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
    questionPaperPdf: z.custom<PdfRef | null>(),
    solutionPdf: z.custom<PdfRef | null>(),
    hiTitle: z.string().max(400),
    hiDescription: z.string().max(8000),
    hiInstructions: z.string().max(15000),
    autoTranslate: z.boolean(),
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
  const { flat } = useFlatCategories();

  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    setValue,
    getValues,
    setError,
    formState: { errors, isDirty },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });
  const { formError, setFormError, handle } = useServerErrors(setError);
  const translationOn = useTranslationEnabled();
  const toast = useToast();

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
      questionPaperPdf: test?.questionPaperPdf ?? null,
      solutionPdf: test?.solutionPdf ?? null,
      hiTitle: test?.hi?.title ?? '',
      hiDescription: test?.hi?.description ?? '',
      hiInstructions: test?.hi?.instructions ?? '',
      autoTranslate: true,
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
        questionPaperPdf: v.questionPaperPdf ? { key: v.questionPaperPdf.key, fileName: v.questionPaperPdf.fileName, size: v.questionPaperPdf.size } : null,
        solutionPdf: v.solutionPdf ? { key: v.solutionPdf.key, fileName: v.solutionPdf.fileName, size: v.solutionPdf.size } : null,
        hi: { title: v.hiTitle.trim(), description: v.hiDescription.trim(), instructions: v.hiInstructions.trim() },
        autoTranslate: v.autoTranslate && translationOn,
      };
      return isEdit ? adminApi.updateTest(test!._id, body) : adminApi.createTest(body);
    },
    {
      success: isEdit ? (isPyq ? 'Paper saved' : 'Test settings saved') : isPyq ? 'Paper created as draft' : 'Test created as draft',
      silentError: true,
      onSuccess: (t, v) => {
        if (v.autoTranslate && translationOn && t.title && !t.hi?.title) toast.info('Saved in English only - Hindi auto translation is unavailable right now.');
        onSaved?.(t);
      },
    },
  );

  const seriesId = watch('seriesId');
  const categoryId = watch('categoryId');
  const paperYear = watch('paperYear');
  const seriesCategoryOf = (id: string) => (id ? idOf(series.data?.items.find((s) => s._id === id)?.categoryId) : '');
  const seriesCatId = seriesCategoryOf(seriesId);
  const effectiveCategoryLabel = flat.find((c) => c.id === (categoryId || seriesCatId))?.label ?? '';
  const seriesTitle = series.data?.items.find((s) => s._id === seriesId)?.title;
  const placement = effectiveCategoryLabel
    ? [isPyq ? 'PYQs' : 'Test Series', effectiveCategoryLabel, ...(seriesTitle ? [seriesTitle] : []), ...(isPyq && paperYear ? [paperYear] : [])].join(' › ')
    : '';
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
        <div className="rounded-xl border border-brand-100 bg-brand-50/40 p-4 md:col-span-2">
          <h3 className="flex items-center gap-1.5 text-sm font-semibold">
            <FolderTree className="h-4 w-4 text-brand-600" /> Where does this {isPyq ? 'paper' : 'test'} go?
          </h3>
          <p className="mb-3 text-xs text-slate-500">
            {isPyq
              ? 'Pick the exam and subject from the PYQ category tree, e.g. NDA › Maths.'
              : 'Optionally put the test in a series, then pick the exact category / sub-category from the tree.'}
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            {!isPyq && (
              <Select
                label="Test series"
                placeholder="- Not part of a series -"
                options={(series.data?.items ?? []).map((s) => ({ value: s._id, label: `${s.title}${s.publicationStatus !== 'published' ? ` (${s.publicationStatus})` : ''}` }))}
                hint="Tests inherit free/paid access from their series"
                {...register('seriesId', {
                  onChange: (e) => {
                    // A category from another series' tree no longer fits - fall back to the series' own category.
                    const next = seriesCategoryOf(e.target.value);
                    const current = getValues('categoryId');
                    const cat = flat.find((c) => c.id === current);
                    if (current && next && cat && cat.id !== next && !cat.ancestors.includes(next)) setValue('categoryId', '', { shouldDirty: true });
                  },
                })}
              />
            )}
            <Controller
              control={control}
              name="categoryId"
              render={({ field }) => (
                <CategoryTreeSelect
                  label={isPyq ? 'Exam / subject' : seriesId ? 'Category inside the series' : 'Category'}
                  required={isPyq || !seriesId}
                  value={field.value ?? ''}
                  onChange={field.onChange}
                  moduleType={moduleType}
                  withinId={seriesCatId || undefined}
                  placeholder={seriesId ? "- Same as the series' category -" : 'Choose category / sub-category'}
                  error={errors.categoryId?.message}
                  hint={seriesId ? 'Optional: a more specific sub-category, e.g. a subject inside the series category' : undefined}
                />
              )}
            />
          </div>
          {placement && (
            <div className="mt-3 rounded-lg bg-white px-3 py-2 text-xs text-slate-600 ring-1 ring-slate-200">
              <p>
                <span className="font-semibold text-slate-800">Students find it at:</span> {placement}
              </p>
              <p className="mt-0.5">
                <span className="font-semibold text-slate-800">Question Bank:</span> questions added to this {isPyq ? 'paper' : 'test'} are also filed under{' '}
                <span className="font-medium">{effectiveCategoryLabel}</span>.
              </p>
            </div>
          )}
        </div>
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
      <Controller
        control={control}
        name="autoTranslate"
        render={({ field }) => (
          <HindiPanel
            autoTranslate={field.value}
            onAutoTranslate={field.onChange}
            actions={
              <TranslateButton
                getTexts={() => [getValues('title'), getValues('description'), getValues('instructions')]}
                onTranslated={([t, d, i]) => {
                  setValue('hiTitle', t ?? '', { shouldDirty: true });
                  setValue('hiDescription', d ?? '', { shouldDirty: true });
                  setValue('hiInstructions', i ?? '', { shouldDirty: true });
                }}
              />
            }
          >
            <Input label="Title in Hindi" lang="hi" placeholder="e.g. सामान्य अध्ययन मॉक टेस्ट 1" error={errors.hiTitle?.message} {...register('hiTitle')} />
            <Textarea label="Description in Hindi" lang="hi" rows={2} {...register('hiDescription')} />
            <Textarea label="Instructions in Hindi" lang="hi" rows={3} {...register('hiInstructions')} />
          </HindiPanel>
        )}
      />
      <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
        <h3 className="mb-1 text-sm font-semibold">Question paper PDFs (optional)</h3>
        <p className="mb-3 text-xs text-slate-500">
          Students with access can download the question paper. The solutions PDF unlocks after they submit{isPyq ? ' (PYQ papers: available right away)' : ''}.
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          <Controller control={control} name="questionPaperPdf" render={({ field }) => <PdfUploader label="Question paper PDF" value={field.value ?? null} onChange={field.onChange} viewUrl={test?.questionPaperPdf && field.value?.key === test.questionPaperPdf.key ? api2.testPdfUrl(test._id, 'question-paper') : undefined} />} />
          <Controller control={control} name="solutionPdf" render={({ field }) => <PdfUploader label="Solutions / answer key PDF" value={field.value ?? null} onChange={field.onChange} viewUrl={test?.solutionPdf && field.value?.key === test.solutionPdf.key ? api2.testPdfUrl(test._id, 'solutions') : undefined} />} />
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
