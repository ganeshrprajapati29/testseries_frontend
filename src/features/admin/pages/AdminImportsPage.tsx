import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, CheckCircle2, Download, FileSpreadsheet, Upload } from 'lucide-react';
import { useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DataTable } from '@/components/admin/DataTable';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { Badge, PageHeader } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Checkbox, Input } from '@/components/common/Input';
import { Select } from '@/components/common/Select';
import { useToast } from '@/components/common/Toast';
import { usePagination } from '@/hooks/usePagination';
import { formatDateTime } from '@/lib/formatters';
import { errorMessage } from '@/services/apiClient';
import { adminApi } from '../admin.api';
import type { ImportJob } from '../admin.types';
import { useAdminMutation } from '../hooks/useAdminMutation';

function JobReview({ job, onDone }: { job: ImportJob; onDone: () => void }) {
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const commit = useAdminMutation(() => adminApi.commitImport(job._id, skipDuplicates), { success: (r) => `${r.importedCount} question(s) imported`, onSuccess: onDone });
  const cancel = useAdminMutation(() => adminApi.cancelImport(job._id), { success: 'Import cancelled', onSuccess: onDone });
  const importable = job.validRows - (skipDuplicates ? job.duplicateRows : 0);

  return (
    <div className="card space-y-5 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold">Review: {job.fileName}</h2>
          <p className="text-sm text-slate-500">{typeof job.targetTestId === 'object' && job.targetTestId ? `Questions will be added to "${job.targetTestId.title}"` : 'Questions will be added to the question bank'}</p>
        </div>
        <div className="flex flex-wrap gap-2 text-sm">
          <Badge tone="gray">{job.totalRows} rows</Badge>
          <Badge tone="green">{job.validRows} valid</Badge>
          {job.invalidRows > 0 && <Badge tone="red">{job.invalidRows} with errors</Badge>}
          {job.duplicateRows > 0 && <Badge tone="amber">{job.duplicateRows} duplicates</Badge>}
        </div>
      </div>

      {!!job.rowErrors?.length && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-red-800">
            <AlertTriangle className="h-4 w-4" /> Rows with errors will be skipped
          </p>
          <ul className="max-h-48 space-y-1 overflow-y-auto text-xs text-red-700">
            {job.rowErrors.map((e, i) => (
              <li key={i}>
                Row {e.row}
                {e.field ? ` (${e.field})` : ''}: {e.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {!!job.preview?.length && (
        <div>
          <p className="mb-2 text-sm font-semibold">Preview (first {job.preview.length})</p>
          <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
            {job.preview.map((p) => (
              <li key={p.row} className="p-3 text-sm">
                <div className="flex items-start justify-between gap-2">
                  <p className="line-clamp-2">
                    <span className="text-slate-400">#{p.row}</span> {p.questionText}
                  </p>
                  {p.duplicate && <Badge tone="amber">Duplicate</Badge>}
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {p.options.map((o) => `${o.key}) ${o.text}`).join('   ')} • <b className="text-emerald-700">Answer {p.correctOption}</b>
                  {p.subject ? ` • ${p.subject}` : ''}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
        <Checkbox checked={skipDuplicates} onChange={(e) => setSkipDuplicates(e.target.checked)} label="Skip duplicate questions" description="Recommended - avoids adding the same question twice." />
        <div className="flex gap-2">
          <Button variant="outline" loading={cancel.isPending} onClick={() => cancel.mutate(undefined)}>
            Cancel import
          </Button>
          <Button variant="success" loading={commit.isPending} disabled={importable <= 0} onClick={() => commit.mutate(undefined)} icon={<CheckCircle2 className="h-4 w-4" />}>
            Import {importable} question(s)
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function AdminImportsPage() {
  const toast = useToast();
  const [params] = useSearchParams();
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [targetTestId, setTargetTestId] = useState(params.get('testId') ?? '');
  const [defaults, setDefaults] = useState({ subject: '', topic: '', sourceExam: '', sourceYear: '', language: 'en' });
  const [uploading, setUploading] = useState(false);
  const [job, setJob] = useState<ImportJob | null>(null);
  const { page, setPage } = usePagination();

  const tests = useQuery({ queryKey: ['admin', 'tests', 'import-options'], queryFn: () => adminApi.tests({ limit: 100 }) });
  const history = useQuery({ queryKey: ['admin', 'imports', page], queryFn: () => adminApi.imports({ page, limit: 10 }) });

  const upload = async () => {
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      if (targetTestId) form.append('targetTestId', targetTestId);
      Object.entries(defaults).forEach(([k, v]) => v && form.append(k, v));
      const created = await adminApi.uploadImport(form);
      setJob(created);
      setFile(null);
      if (fileRef.current) fileRef.current.value = '';
      history.refetch();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bulk Import"
        description="Upload questions from Excel (.xlsx) or CSV. Files are validated before anything is saved."
        actions={
          <Button variant="outline" icon={<Download className="h-4 w-4" />} onClick={() => adminApi.downloadTemplate().catch((e) => toast.error(errorMessage(e)))}>
            Download template
          </Button>
        }
      />

      {job && job.status === 'validated' ? (
        <JobReview
          job={job}
          onDone={() => {
            setJob(null);
            history.refetch();
          }}
        />
      ) : (
        <div className="card space-y-5 p-5">
          <div
            className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center hover:border-brand-400"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const f = e.dataTransfer.files[0];
              if (f) setFile(f);
            }}
          >
            <FileSpreadsheet className="h-10 w-10 text-brand-500" />
            <p className="mt-2 font-medium">{file ? file.name : 'Drag & drop your file here'}</p>
            <p className="text-xs text-slate-500">.xlsx or .csv, up to 10 MB and 2,000 rows</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => fileRef.current?.click()}>
              Choose file
            </Button>
            <input ref={fileRef} type="file" accept=".csv,.xlsx" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <Select
              label="Add imported questions to test (optional)"
              placeholder="- Question bank only -"
              value={targetTestId}
              onChange={(e) => setTargetTestId(e.target.value)}
              options={(tests.data?.items ?? []).map((t) => ({ value: t._id, label: `${t.title}${t.moduleType === 'PYQS' ? ' (PYQ)' : ''}` }))}
            />
            <Input label="Default subject" hint="Used when the row has no subject" value={defaults.subject} onChange={(e) => setDefaults({ ...defaults, subject: e.target.value })} />
            <Input label="Default topic" value={defaults.topic} onChange={(e) => setDefaults({ ...defaults, topic: e.target.value })} />
            <Input label="Default source exam" placeholder="e.g. NDA (I)" value={defaults.sourceExam} onChange={(e) => setDefaults({ ...defaults, sourceExam: e.target.value })} />
            <Input label="Default source year" inputMode="numeric" value={defaults.sourceYear} onChange={(e) => setDefaults({ ...defaults, sourceYear: e.target.value.replace(/\D/g, '').slice(0, 4) })} />
            <Select
              label="Default language"
              value={defaults.language}
              onChange={(e) => setDefaults({ ...defaults, language: e.target.value })}
              options={[
                { value: 'en', label: 'English' },
                { value: 'hi', label: 'Hindi' },
              ]}
            />
          </div>
          <div className="flex justify-end">
            <Button icon={<Upload className="h-4 w-4" />} disabled={!file} loading={uploading} onClick={upload}>
              Validate file
            </Button>
          </div>
        </div>
      )}

      <div>
        <h2 className="mb-3 text-lg font-semibold">Import history</h2>
        <DataTable<ImportJob>
          rows={history.data?.items}
          meta={history.data?.meta}
          onPageChange={setPage}
          isLoading={history.isLoading}
          error={history.error}
          onRetry={() => history.refetch()}
          rowKey={(r) => r._id}
          emptyTitle="No imports yet"
          columns={[
            { key: 'file', header: 'File', render: (r) => <span className="font-medium">{r.fileName}</span> },
            { key: 'target', header: 'Target', render: (r) => (typeof r.targetTestId === 'object' && r.targetTestId ? r.targetTestId.title : 'Question bank') },
            { key: 'rows', header: 'Rows', render: (r) => `${r.validRows}/${r.totalRows} valid` },
            { key: 'imported', header: 'Imported', render: (r) => r.importedCount },
            { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
            { key: 'by', header: 'By', render: (r) => r.createdBy?.name ?? '-' },
            { key: 'date', header: 'Date', render: (r) => <span className="text-slate-500">{formatDateTime(r.createdAt)}</span> },
            {
              key: 'act',
              header: '',
              render: (r) =>
                r.status === 'validated' ? (
                  <Button size="sm" variant="secondary" onClick={async () => setJob(await adminApi.importJob(r._id))}>
                    Review
                  </Button>
                ) : null,
            },
          ]}
        />
      </div>
    </div>
  );
}
