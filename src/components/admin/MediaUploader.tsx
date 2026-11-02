import { ArrowLeft, ArrowRight, FileText, ImagePlus, Link2, Loader2, Trash2, UploadCloud, ZoomIn } from 'lucide-react';
import { useRef, useState, type DragEvent } from 'react';
import { adminApi, type ImageFolder } from '@/features/admin/admin.api';
import { cn } from '@/lib/utils';
import { errorMessage } from '@/services/apiClient';
import type { PdfRef } from '@/types';
import { Lightbox } from '../common/ImageGallery';
import { useToast } from '../common/Toast';

const IMAGE_ACCEPT = 'image/png,image/jpeg,image/webp,image/gif,image/svg+xml,image/avif,image/tiff,.jpg,.jpeg,.png,.webp,.gif,.svg,.avif,.tif,.tiff';

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/** "Choose file | From link" switcher shared by image and PDF pickers. */
function LinkBox({ placeholder, busy, onSubmit, onCancel, allowDirect }: { placeholder: string; busy: boolean; onSubmit: (url: string, mode: 'import' | 'direct') => void; onCancel: () => void; allowDirect?: boolean }) {
  const [url, setUrl] = useState('');
  const valid = /^https?:\/\/\S+$/i.test(url.trim());
  return (
    <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
      <input
        type="url"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            if (valid) onSubmit(url.trim(), 'import');
          }
        }}
        placeholder={placeholder}
        className="field"
        aria-label="File link"
        autoFocus
      />
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" disabled={!valid || busy} onClick={() => onSubmit(url.trim(), 'import')} className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50">
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UploadCloud className="h-3.5 w-3.5" />} Import to our server
        </button>
        {allowDirect && (
          <button type="button" disabled={!valid || busy || !/^https:\/\//i.test(url.trim())} onClick={() => onSubmit(url.trim(), 'direct')} className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 disabled:opacity-50" title="Only https links can be used directly">
            Use link as is
          </button>
        )}
        <button type="button" onClick={onCancel} className="text-xs font-medium text-slate-500 hover:text-slate-700">
          Cancel
        </button>
      </div>
      <p className="text-[11px] text-slate-500">Importing copies the file to Civil Sansad storage so it keeps working even if the original link changes.</p>
    </div>
  );
}

interface ImageUploaderProps {
  label?: string;
  value: string[] | undefined;
  onChange: (urls: string[]) => void;
  max?: number;
  folder?: ImageFolder;
  hint?: string;
  compact?: boolean;
}

/** Multiple images: drag & drop or choose files (any common format), or add from a link. */
export function ImageUploader({ label, value: rawValue, onChange, max = 10, folder = 'questions', hint, compact }: ImageUploaderProps) {
  // Form libraries may pass undefined before their default values are set.
  const value = Array.isArray(rawValue) ? rawValue : [];
  const input = useRef<HTMLInputElement>(null);
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [linkMode, setLinkMode] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [zoom, setZoom] = useState<number | null>(null);
  const remaining = max - value.length;

  const uploadFiles = async (files: File[]) => {
    const list = files.filter((f) => f.type.startsWith('image/') || /\.(png|jpe?g|webp|gif|svg|avif|tiff?)$/i.test(f.name));
    if (!list.length) return toast.error('Please choose image files (JPG, PNG, WEBP, GIF, SVG, AVIF, TIFF).');
    const tooBig = list.find((f) => f.size > 8 * 1024 * 1024);
    if (tooBig) return toast.error(`"${tooBig.name}" is larger than 8 MB.`);
    const take = list.slice(0, remaining);
    if (list.length > remaining) toast.info(`Only ${remaining} more image(s) can be added here.`);
    if (!take.length) return;
    setBusy(true);
    try {
      const { files: stored } = await adminApi.uploadImages(take, folder);
      onChange([...value, ...stored.map((s) => s.url)]);
      toast.success(`${stored.length} image(s) uploaded`);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
      if (input.current) input.current.value = '';
    }
  };

  const addLink = async (url: string, mode: 'import' | 'direct') => {
    if (mode === 'direct') {
      onChange([...value, url]);
      setLinkMode(false);
      return;
    }
    setBusy(true);
    try {
      const { files: stored } = await adminApi.importImageFromUrl(url, folder);
      onChange([...value, stored[0]!.url]);
      setLinkMode(false);
      toast.success('Image imported from link');
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= value.length) return;
    const next = [...value];
    [next[i], next[j]] = [next[j]!, next[i]!];
    onChange(next);
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (remaining > 0) void uploadFiles(Array.from(e.dataTransfer.files));
  };

  return (
    <div>
      {label && (
        <div className="mb-1 flex items-baseline justify-between">
          <span className="label mb-0">{label}</span>
          <span className="text-[11px] text-slate-400">
            {value.length}/{max}
          </span>
        </div>
      )}
      {value.length > 0 && (
        <div className={cn('mb-2 grid gap-2', compact ? 'grid-cols-3 sm:grid-cols-4' : 'grid-cols-2 sm:grid-cols-4')}>
          {value.map((src, i) => (
            <div key={`${src}-${i}`} className="group relative overflow-hidden rounded-lg border border-slate-200 bg-white">
              <img src={src} alt={`Image ${i + 1}`} className={cn('w-full object-contain', compact ? 'h-16' : 'h-24')} />
              <div className="absolute inset-x-0 bottom-0 flex justify-between bg-slate-900/60 px-1 py-0.5 opacity-0 transition group-hover:opacity-100 focus-within:opacity-100">
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="rounded p-1 text-white disabled:opacity-30" aria-label="Move left">
                  <ArrowLeft className="h-3.5 w-3.5" />
                </button>
                <button type="button" onClick={() => setZoom(i)} className="rounded p-1 text-white" aria-label="Preview">
                  <ZoomIn className="h-3.5 w-3.5" />
                </button>
                <button type="button" onClick={() => onChange(value.filter((_, k) => k !== i))} className="rounded p-1 text-red-300" aria-label="Remove image">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
                <button type="button" onClick={() => move(i, 1)} disabled={i === value.length - 1} className="rounded p-1 text-white disabled:opacity-30" aria-label="Move right">
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
              {i === 0 && value.length > 1 && <span className="absolute top-1 left-1 rounded bg-brand-600 px-1.5 text-[10px] font-semibold text-white">Main</span>}
            </div>
          ))}
        </div>
      )}
      {remaining > 0 &&
        (linkMode ? (
          <LinkBox placeholder="https://example.com/figure.png" busy={busy} onSubmit={addLink} onCancel={() => setLinkMode(false)} allowDirect />
        ) : (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            className={cn('flex flex-wrap items-center gap-2 rounded-lg border-2 border-dashed px-3 py-2.5 transition', dragging ? 'border-brand-500 bg-brand-50' : 'border-slate-300 bg-white')}
          >
            <button type="button" disabled={busy} onClick={() => input.current?.click()} className="inline-flex items-center gap-1.5 rounded-lg bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700 hover:bg-brand-100">
              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImagePlus className="h-3.5 w-3.5" />}
              {busy ? 'Uploading...' : max > 1 ? 'Choose images' : 'Choose image'}
            </button>
            <button type="button" disabled={busy} onClick={() => setLinkMode(true)} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100">
              <Link2 className="h-3.5 w-3.5" /> From link
            </button>
            {!compact && <span className="text-xs text-slate-400">or drag & drop • JPG, PNG, WEBP, GIF, SVG, AVIF, TIFF • max 8 MB</span>}
            <input ref={input} type="file" multiple={max > 1} accept={IMAGE_ACCEPT} className="hidden" onChange={(e) => void uploadFiles(Array.from(e.target.files ?? []))} />
          </div>
        ))}
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
      {zoom !== null && <Lightbox images={value} index={zoom} onIndex={setZoom} onClose={() => setZoom(null)} />}
    </div>
  );
}

/** Convenience wrapper for a single image stored as a string. */
export function SingleImageUploader({ label, value, onChange, folder, hint, compact }: { label?: string; value: string | undefined; onChange: (url: string) => void; folder?: ImageFolder; hint?: string; compact?: boolean }) {
  return <ImageUploader label={label} value={value ? [value] : []} onChange={(v) => onChange(v[0] ?? '')} max={1} folder={folder} hint={hint} compact={compact} />;
}

/** PDF attachment: choose a file or import from a link. */
export function PdfUploader({ label, value, onChange, viewUrl, hint }: { label: string; value: PdfRef | null; onChange: (v: PdfRef | null) => void; viewUrl?: string; hint?: string }) {
  const input = useRef<HTMLInputElement>(null);
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [linkMode, setLinkMode] = useState(false);

  const upload = async (file?: File) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') return toast.error('Please choose a PDF file.');
    if (file.size > 25 * 1024 * 1024) return toast.error('PDF must be smaller than 25 MB.');
    setBusy(true);
    try {
      onChange(await adminApi.uploadPdf(file));
      toast.success('PDF uploaded');
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
      if (input.current) input.current.value = '';
    }
  };

  const fromLink = async (url: string) => {
    setBusy(true);
    try {
      onChange(await adminApi.importPdfFromUrl(url));
      setLinkMode(false);
      toast.success('PDF imported from link');
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <span className="label">{label}</span>
      {value ? (
        <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600">
            <FileText className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{value.fileName}</p>
            <p className="text-xs text-slate-500">{formatSize(value.size)}</p>
          </div>
          {viewUrl && (
            <a href={viewUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-brand-700 hover:underline">
              View
            </a>
          )}
          <button type="button" onClick={() => input.current?.click()} disabled={busy} className="text-xs font-semibold text-slate-600 hover:underline">
            {busy ? 'Uploading...' : 'Replace'}
          </button>
          <button type="button" onClick={() => onChange(null)} className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600" aria-label="Remove PDF">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ) : linkMode ? (
        <LinkBox placeholder="https://example.com/question-paper.pdf" busy={busy} onSubmit={(u) => void fromLink(u)} onCancel={() => setLinkMode(false)} />
      ) : (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            void upload(e.dataTransfer.files[0]);
          }}
          className="flex flex-wrap items-center gap-2 rounded-lg border-2 border-dashed border-slate-300 bg-white px-3 py-2.5"
        >
          <button type="button" disabled={busy} onClick={() => input.current?.click()} className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100">
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5" />} {busy ? 'Uploading...' : 'Choose PDF'}
          </button>
          <button type="button" disabled={busy} onClick={() => setLinkMode(true)} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100">
            <Link2 className="h-3.5 w-3.5" /> From link
          </button>
          <span className="text-xs text-slate-400">or drag & drop • max 25 MB</span>
        </div>
      )}
      <input ref={input} type="file" accept="application/pdf,.pdf" className="hidden" onChange={(e) => void upload(e.target.files?.[0])} />
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}
