import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { z } from 'zod';
import { adminApi } from '@/features/admin/admin.api';
import { useAdminMutation } from '@/features/admin/hooks/useAdminMutation';
import { FormAlert } from '@/features/auth/components/AuthCard';
import { useServerErrors } from '@/features/auth/hooks/useServerErrors';
import { cn, OPTION_LABELS } from '@/lib/utils';
import type { OptionKey, Question } from '@/types';
import { Button } from '../common/Button';
import { Input, Textarea } from '../common/Input';
import { Modal } from '../common/Modal';
import { CategoryPicker } from './CategoryPicker';
import { ImageUploader, SingleImageUploader } from './MediaUploader';
import { Select } from '../common/Select';
import { useToast } from '../common/Toast';
import { TranslateButton, useTranslationEnabled } from './HindiTranslate';

const schema = z
  .object({
    questionText: z.string().trim().min(1, 'Question text is required').max(10000),
    images: z.array(z.string()).max(10),
    explanationImages: z.array(z.string()).max(10),
    options: z.array(z.object({ text: z.string().max(2000), imageUrl: z.string(), hiText: z.string().max(2000) })).min(2).max(6),
    correctIndex: z.coerce.number<number>().int().min(0),
    explanation: z.string().max(10000),
    subject: z.string().max(120),
    topic: z.string().max(160),
    difficulty: z.enum(['easy', 'medium', 'hard']),
    language: z.enum(['en', 'hi']),
    sourceExam: z.string().max(120),
    sourceYear: z.string().regex(/^(|\d{4})$/, 'Enter a 4 digit year'),
    tags: z.string().max(600),
    categoryIds: z.array(z.string()).max(10),
    hiQuestionText: z.string().max(10000),
    hiExplanation: z.string().max(10000),
    autoTranslate: z.boolean(),
  })
  .refine((d) => d.options.every((o) => o.text.trim() || o.imageUrl), { message: 'Every option needs text or an image', path: ['options'] })
  .refine((d) => d.correctIndex < d.options.length, { message: 'Select the correct option', path: ['correctIndex'] });

type FormValues = z.infer<typeof schema>;

interface QuestionEditorProps {
  open: boolean;
  onClose: () => void;
  question?: Question | null;
  /** When creating from a test page, the new question is attached to this test. */
  attachToTestId?: string;
  defaults?: Partial<Pick<Question, 'subject' | 'sourceExam'>> & { sourceYear?: number | null; categoryIds?: string[] };
  onSaved?: (q: Question) => void;
}

export function QuestionEditor({ open, onClose, question, attachToTestId, defaults, onSaved }: QuestionEditorProps) {
  // Parents often pass a new defaults object on every render; only react to real changes.
  const defaultsKey = JSON.stringify(defaults ?? {});
  const isEdit = !!question;
  const [tab, setTab] = useState<'en' | 'hi'>('en');
  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    setValue,
    getValues,
    setError,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });
  const { fields, append, remove } = useFieldArray({ control, name: 'options' });
  const { formError, setFormError, handle } = useServerErrors(setError);
  const translationOn = useTranslationEnabled();
  const toast = useToast();

  useEffect(() => {
    if (!open) return;
    setTab('en');
    setFormError(null);
    const hi = question?.translations.find((t) => t.language === 'hi');
    const options = question?.options.length
      ? question.options.map((o) => ({ text: o.text, imageUrl: o.imageUrl ?? '', hiText: hi?.options.find((h) => h.key === o.key)?.text ?? '' }))
      : Array.from({ length: 4 }, () => ({ text: '', imageUrl: '', hiText: '' }));
    reset({
      questionText: question?.questionText ?? '',
      images: [question?.imageUrl ?? '', ...(question?.images ?? [])].filter(Boolean).slice(0, 10),
      explanationImages: question?.explanationImages ?? [],
      options,
      correctIndex: question ? Math.max(0, question.options.findIndex((o) => o.key === question.correctOption)) : 0,
      explanation: question?.explanation ?? '',
      subject: question?.subject ?? defaults?.subject ?? '',
      topic: question?.topic ?? '',
      difficulty: question?.difficulty ?? 'medium',
      language: question?.language ?? 'en',
      sourceExam: question?.sourceExam ?? defaults?.sourceExam ?? '',
      sourceYear: question?.sourceYear ? String(question.sourceYear) : defaults?.sourceYear ? String(defaults.sourceYear) : '',
      tags: question?.tags.join(', ') ?? '',
      categoryIds: question ? (question.categoryIds ?? question.categories?.map((c) => c._id) ?? []) : (defaults?.categoryIds ?? []),
      hiQuestionText: hi?.questionText ?? '',
      hiExplanation: hi?.explanation ?? '',
      autoTranslate: true,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, question, defaultsKey, reset, setFormError]);

  const save = useAdminMutation(
    async (v: FormValues) => {
      const keys = OPTION_LABELS.slice(0, v.options.length) as unknown as OptionKey[];
      const body = {
        questionText: v.questionText,
        imageUrl: v.images[0] ?? '',
        images: v.images.slice(1),
        explanationImages: v.explanationImages,
        options: v.options.map((o, i) => ({ key: keys[i], text: o.text.trim(), imageUrl: o.imageUrl })),
        correctOption: keys[v.correctIndex],
        explanation: v.explanation,
        subject: v.subject.trim(),
        topic: v.topic.trim(),
        difficulty: v.difficulty,
        language: v.language,
        sourceExam: v.sourceExam.trim(),
        sourceYear: v.sourceYear ? Number(v.sourceYear) : null,
        categoryIds: v.categoryIds,
        tags: v.tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean)
          .slice(0, 20),
        translations: v.hiQuestionText.trim()
          ? [{ language: 'hi', questionText: v.hiQuestionText.trim(), options: v.options.map((o, i) => ({ key: keys[i], text: o.hiText.trim() })).filter((o) => o.text), explanation: v.hiExplanation.trim() }]
          : [],
        autoTranslate: v.autoTranslate && translationOn && v.language === 'en',
      };
      const saved = isEdit ? await adminApi.updateQuestion(question!._id, body) : await adminApi.createQuestion(body);
      if (!isEdit && attachToTestId) await adminApi.addTestQuestions(attachToTestId, [saved._id]);
      return saved;
    },
    {
      success: isEdit ? 'Question updated' : attachToTestId ? 'Question created and added to the test' : 'Question created',
      silentError: true,
      onSuccess: (q) => {
        const warning = (q as Question & { translationWarning?: string | null }).translationWarning;
        if (warning) toast.info(warning);
        onSaved?.(q);
        onClose();
      },
    },
  );

  const correctIndex = Number(watch('correctIndex'));
  const language = watch('language');
  const onSubmit = handleSubmit(
    (v) => {
      setFormError(null);
      save.mutate(v, { onError: handle });
    },
    () => setTab('en'),
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="xl"
      title={isEdit ? 'Edit question' : 'New question'}
      dismissible={!save.isPending}
      footer={
        <>
          {translationOn && language === 'en' && (
            <label className="mr-auto flex items-center gap-2 text-sm text-slate-600" title="Fills the Hindi version from English on save when it is empty">
              <input type="checkbox" className="accent-brand-600" {...register('autoTranslate')} />
              Auto-translate to Hindi
            </label>
          )}
          <Button variant="outline" onClick={onClose} disabled={save.isPending}>
            Cancel
          </Button>
          <Button onClick={onSubmit} loading={save.isPending}>
            {isEdit ? 'Save question' : 'Create question'}
          </Button>
        </>
      }
    >
      <FormAlert message={formError} />
      <div className="mb-4 flex gap-1 rounded-lg bg-slate-100 p-1 text-sm font-semibold">
        {(['en', 'hi'] as const).map((l) => (
          <button key={l} type="button" onClick={() => setTab(l)} className={cn('flex-1 rounded-md py-1.5', tab === l ? 'bg-white shadow-sm' : 'text-slate-500')}>
            {l === 'en' ? 'Primary content' : translationOn ? 'Hindi (auto-filled if empty)' : 'Hindi translation (optional)'}
          </button>
        ))}
      </div>
      <form onSubmit={onSubmit} noValidate className="space-y-5">
        {tab === 'en' ? (
          <>
            <Controller
              control={control}
              name="categoryIds"
              render={({ field }) => (
                <CategoryPicker
                  label="Category / sub-category"
                  value={field.value}
                  onChange={field.onChange}
                  hint="The question is saved in these categories (e.g. Defence › CDS › Maths). It also appears under every parent category."
                />
              )}
            />
            <Textarea label="Question" rows={4} required error={errors.questionText?.message} {...register('questionText')} />
            <Controller
              control={control}
              name="images"
              render={({ field }) => <ImageUploader label="Question images (optional)" value={field.value} onChange={field.onChange} max={10} hint="Add one or more figures, diagrams or charts. The first image is shown first." />}
            />
            <div>
              <span className="label">Options - select the correct answer</span>
              <div className="space-y-2">
                {fields.map((f, i) => (
                  <div key={f.id} className={cn('rounded-lg border-2 p-3', correctIndex === i ? 'border-emerald-500 bg-emerald-50/50' : 'border-slate-200')}>
                    <div className="flex items-start gap-3">
                      <label className="flex items-center gap-2 pt-2 text-sm font-bold">
                        <input type="radio" value={i} className="h-4 w-4 accent-emerald-600" {...register('correctIndex')} aria-label={`Option ${OPTION_LABELS[i]} is correct`} />
                        {OPTION_LABELS[i]}
                      </label>
                      <div className="flex-1 space-y-2">
                        <Textarea rows={2} placeholder={`Option ${OPTION_LABELS[i]}`} aria-label={`Option ${OPTION_LABELS[i]} text`} {...register(`options.${i}.text`)} />
                        <Controller control={control} name={`options.${i}.imageUrl`} render={({ field }) => <SingleImageUploader value={field.value} onChange={field.onChange} compact />} />
                      </div>
                      {fields.length > 2 && (
                        <button type="button" onClick={() => remove(i)} className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600" aria-label={`Remove option ${OPTION_LABELS[i]}`}>
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              {errors.options && <p className="mt-1 text-xs text-red-600">{errors.options.message ?? errors.options.root?.message}</p>}
              {errors.correctIndex && <p className="mt-1 text-xs text-red-600">{errors.correctIndex.message}</p>}
              {fields.length < 6 && (
                <Button variant="ghost" size="sm" className="mt-2" icon={<Plus className="h-4 w-4" />} onClick={() => append({ text: '', imageUrl: '', hiText: '' })}>
                  Add option
                </Button>
              )}
            </div>
            <Textarea label="Explanation" rows={3} hint="Shown with the solution after the test" {...register('explanation')} />
            <Controller
              control={control}
              name="explanationImages"
              render={({ field }) => <ImageUploader label="Explanation images (optional)" value={field.value} onChange={field.onChange} max={10} />}
            />
            <div className="grid gap-4 sm:grid-cols-3">
              <Input label="Subject" placeholder="e.g. Polity" {...register('subject')} />
              <Input label="Topic" placeholder="e.g. Fundamental Rights" {...register('topic')} />
              <Select
                label="Difficulty"
                options={[
                  { value: 'easy', label: 'Easy' },
                  { value: 'medium', label: 'Medium' },
                  { value: 'hard', label: 'Hard' },
                ]}
                {...register('difficulty')}
              />
              <Select
                label="Language"
                options={[
                  { value: 'en', label: 'English' },
                  { value: 'hi', label: 'Hindi' },
                ]}
                {...register('language')}
              />
              <Input label="Source exam" placeholder="e.g. NDA (I)" {...register('sourceExam')} />
              <Input label="Source year" inputMode="numeric" placeholder="e.g. 2023" error={errors.sourceYear?.message} {...register('sourceYear')} />
            </div>
            <Input label="Tags" placeholder="comma separated" {...register('tags')} />
          </>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-brand-50 px-3 py-2">
              <p className="text-xs text-brand-800">
                Students can switch to Hindi during the test when the test offers Hindi. {translationOn && 'Click translate to fill this from English, then review.'}
              </p>
              <TranslateButton
                getTexts={() => [getValues('questionText'), getValues('explanation'), ...getValues('options').map((o) => o.text)]}
                onTranslated={([q, e, ...opts]) => {
                  setValue('hiQuestionText', q ?? '', { shouldDirty: true });
                  setValue('hiExplanation', e ?? '', { shouldDirty: true });
                  opts.forEach((t, i) => setValue(`options.${i}.hiText`, t ?? '', { shouldDirty: true }));
                }}
              />
            </div>
            <Textarea label="Question (Hindi)" rows={4} lang="hi" {...register('hiQuestionText')} />
            {fields.map((f, i) => (
              <Input key={f.id} label={`Option ${OPTION_LABELS[i]} (Hindi)`} lang="hi" {...register(`options.${i}.hiText`)} />
            ))}
            <Textarea label="Explanation (Hindi)" rows={3} lang="hi" {...register('hiExplanation')} />
          </>
        )}
      </form>
    </Modal>
  );
}
