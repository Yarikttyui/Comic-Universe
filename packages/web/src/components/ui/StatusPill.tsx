import clsx from 'clsx';

const STATUS_LABELS: Record<string, string> = {
  draft: 'Черновик',
  pending: 'На рассмотрении',
  pending_review: 'На проверке',
  approved: 'Одобрено',
  rejected: 'Отклонено',
  cancelled: 'Отменено',
  published: 'Опубликовано',
  visible: 'Виден',
  hidden: 'Скрыт',
  deleted: 'Удален',
  open: 'Открыта',
  resolved: 'Решена',
  active: 'Активен',
  archived: 'Архив',
};

export function StatusPill({ status }: { status: string }) {
  return <span className={clsx('status-pill', `status-${status}`)}>{STATUS_LABELS[status] ?? status}</span>;
}
