import { useState } from 'react';
import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';
import { ApiError, errorMessage } from '@/services/apiClient';

/** Maps API validation errors onto react-hook-form fields and returns a form-level message. */
export function useServerErrors<T extends FieldValues>(setError: UseFormSetError<T>) {
  const [formError, setFormError] = useState<string | null>(null);

  const handle = (err: unknown) => {
    if (err instanceof ApiError && err.details.length) {
      const fields = err.fieldErrors();
      let mapped = false;
      for (const [key, message] of Object.entries(fields)) {
        setError(key as Path<T>, { type: 'server', message });
        mapped = true;
      }
      setFormError(mapped ? null : err.message);
      return;
    }
    setFormError(errorMessage(err));
  };

  return { formError, setFormError, handle };
}
