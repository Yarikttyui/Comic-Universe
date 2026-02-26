import { useEffect, useState } from 'react';
import { BellPlus, BellOff } from 'lucide-react';
import { subscriptionsApi } from '../../services/api';
import { useAuthStore } from '../../store/authStore';

interface Props {
  authorId: string;
}

export function SubscribeButton({ authorId }: Props) {
  const { isAuthenticated, user } = useAuthStore();
  const [subscribed, setSubscribed] = useState(false);
  const [count, setCount] = useState(0);
  const [busy, setBusy] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    if (!authorId) { setInitialLoading(false); return; }
    let cancelled = false;

    const promises: Promise<void>[] = [];

    if (isAuthenticated) {
      promises.push(
        subscriptionsApi.check(authorId).then((r) => {
          if (!cancelled) setSubscribed(!!r.data.data.subscribed);
        }).catch(() => {})
      );
    }

    promises.push(
      subscriptionsApi.getCount(authorId).then((r) => {
        if (!cancelled) setCount(r.data.data.count ?? 0);
      }).catch(() => {})
    );

    Promise.allSettled(promises).then(() => {
      if (!cancelled) setInitialLoading(false);
    });

    return () => { cancelled = true; };
  }, [authorId, isAuthenticated]);

  if (!isAuthenticated || user?.id === authorId) {
    return count > 0 ? (
      <span className="subscribe-count">{count} подписчиков</span>
    ) : null;
  }

  const toggle = async () => {
    if (busy || initialLoading) return;
    setBusy(true);
    try {
      if (subscribed) {
        await subscriptionsApi.unsubscribe(authorId);
        setSubscribed(false);
        setCount((c) => Math.max(0, c - 1));
      } else {
        await subscriptionsApi.subscribe(authorId);
        setSubscribed(true);
        setCount((c) => c + 1);
      }
    } catch {
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="subscribe-wrap">
      <button
        className={`btn btn-sm ${subscribed ? 'btn-outline' : 'btn-primary'}`}
        onClick={toggle}
        disabled={busy || initialLoading}
      >
        {subscribed ? <BellOff size={14} /> : <BellPlus size={14} />}
        {subscribed ? 'Отписаться' : 'Подписаться'}
      </button>
      {count > 0 && <span className="subscribe-count">{count}</span>}
    </div>
  );
}
