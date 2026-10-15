import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, ShoppingCart } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ROUTES } from '@/app/constants';
import { Button } from '@/components/common/Button';
import { useToast } from '@/components/common/Toast';
import { useAuth } from '@/features/auth/useAuth';
import { useSettings } from '@/hooks/useSettings';
import { formatCurrency } from '@/lib/formatters';
import { errorMessage } from '@/services/apiClient';
import type { SeriesDetail } from '@/types';
import { loadRazorpay, paymentsApi, testSeriesApi } from '../testSeries.api';

/** Free series: "Add to My Tests". Paid series: Razorpay checkout verified on the server. */
export function EnrollButton({ series }: { series: SeriesDetail }) {
  const { user, isAdmin } = useAuth();
  const { settings, logoUrl } = useSettings();
  const toast = useToast();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const payConfig = useQuery({ queryKey: ['payments', 'config'], queryFn: paymentsApi.config, enabled: series.accessType === 'paid', staleTime: 5 * 60_000 });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['series'] });
    qc.invalidateQueries({ queryKey: ['student'] });
  };

  const enroll = useMutation({
    mutationFn: () => testSeriesApi.enroll(series._id),
    onSuccess: () => {
      toast.success('Added to My Tests');
      refresh();
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  const purchase = useMutation({
    mutationFn: async () => {
      await loadRazorpay();
      const order = await paymentsApi.createOrder(series._id);
      return new Promise<void>((resolve, reject) => {
        const rzp = new window.Razorpay!({
          key: order.keyId,
          amount: order.amount,
          currency: order.currency,
          name: settings?.siteName ?? 'Civil Sansad',
          description: order.seriesTitle,
          image: logoUrl.startsWith('http') ? logoUrl : `${window.location.origin}${logoUrl}`,
          order_id: order.providerOrderId,
          prefill: order.prefill,
          theme: { color: '#1e6fd0' },
          handler: async (resp) => {
            try {
              await paymentsApi.verify({ razorpayOrderId: resp.razorpay_order_id, razorpayPaymentId: resp.razorpay_payment_id, razorpaySignature: resp.razorpay_signature });
              resolve();
            } catch (e) {
              reject(e);
            }
          },
          modal: { ondismiss: () => reject(new Error('Payment was cancelled')) },
        });
        rzp.open();
      });
    },
    onSuccess: () => {
      toast.success('Payment successful! The test series is now unlocked.');
      refresh();
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  if (isAdmin) return <p className="text-sm text-slate-500">You are signed in as an administrator.</p>;

  if (series.isEnrolled) {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
        <CheckCircle2 className="h-5 w-5" /> You are enrolled in this series
      </div>
    );
  }

  if (!user) {
    return (
      <Button size="lg" className="w-full" onClick={() => navigate(`${ROUTES.login}?from=${encodeURIComponent(location.pathname)}`)}>
        {series.accessType === 'free' ? 'Login to start for free' : `Login to buy for ${formatCurrency(series.price)}`}
      </Button>
    );
  }

  if (series.accessType === 'free') {
    return (
      <Button size="lg" variant="accent" className="w-full" loading={enroll.isPending} onClick={() => enroll.mutate()}>
        Add to My Tests - Free
      </Button>
    );
  }

  if (series.hasAccess) {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
        <CheckCircle2 className="h-5 w-5" /> Purchased - all tests unlocked
      </div>
    );
  }

  if (payConfig.data && !payConfig.data.enabled) {
    return (
      <div className="space-y-2">
        <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">Online payment is not available yet. Contact Civil Sansad to enrol in this series.</p>
        {settings?.whatsappNumber && (
          <a href={`https://wa.me/${settings.whatsappNumber}?text=${encodeURIComponent(`I want to enrol in ${series.title}`)}`} target="_blank" rel="noopener noreferrer" className="block text-center text-sm font-semibold text-brand-700 hover:underline">
            Enquire on WhatsApp
          </a>
        )}
      </div>
    );
  }

  return (
    <Button size="lg" variant="accent" className="w-full" loading={purchase.isPending || payConfig.isLoading} onClick={() => purchase.mutate()} icon={<ShoppingCart className="h-5 w-5" />}>
      Buy now for {formatCurrency(series.price)}
    </Button>
  );
}
