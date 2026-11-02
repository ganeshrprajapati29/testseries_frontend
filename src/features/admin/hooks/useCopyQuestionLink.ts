import { useToast } from '@/components/common/Toast';
import { errorMessage } from '@/services/apiClient';
import { adminApi } from '../admin.api';

/** Direct admin link of a question: /admin/questions/:id */
export const questionLink = (id: string) => `/admin/questions/${id}`;

/** Copies the full direct link of a question to the clipboard. */
export function useCopyQuestionLink() {
  const toast = useToast();
  return (id: string) => {
    const url = `${window.location.origin}${questionLink(id)}`;
    navigator.clipboard?.writeText(url).then(
      () => toast.success('Question link copied'),
      () => toast.error(url),
    );
  };
}

/**
 * Opens the student-website page that shows the question (its paper / test, or the category page).
 * The tab is opened first so the browser does not block it as a pop-up.
 */
export function useOpenQuestionOnWebsite() {
  const toast = useToast();
  return async (id: string) => {
    const tab = window.open('about:blank', '_blank');
    try {
      const q = await adminApi.question(id);
      const link = q.websiteLinks[0];
      const url = link?.url ?? q.categories.find((c) => c.siteUrl)?.siteUrl;
      if (!url) {
        tab?.close();
        toast.info('This question is not on the website yet - give it a category or add it to a published test.');
        return;
      }
      if (tab) tab.location.href = url;
      else window.location.href = url;
    } catch (err) {
      tab?.close();
      toast.error(errorMessage(err));
    }
  };
}
