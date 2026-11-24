export type CanonicalOrderStatus =
  | 'pending'
  | 'confirmed'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export interface Order {
  id?: string | number;
  order_id?: string | number;
  customer_name: string;
  email: string;
  phone: string;
  city: string;
  address: string;
  product_variant: string;
  quantity: number;
  status: string;
  created_at: string;
  [key: string]: unknown;
}

export interface OrderStats {
  totalOrders: number;
  totalUnits: number;
  pendingCount: number;
  confirmedCount: number;
  shippedCount: number;
  deliveredCount: number;
  cancelledCount: number;
  deliveryRate: number;
  todayCount: number;
}

export type NavSection = 'overview' | 'orders' | 'settings';

export const CANONICAL_STATUSES: CanonicalOrderStatus[] = [
  'pending',
  'confirmed',
  'shipped',
  'delivered',
  'cancelled',
];

export const STATUS_LABELS: Record<CanonicalOrderStatus, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export const STATUS_TEXT_STYLES: Record<CanonicalOrderStatus, string> = {
  pending: 'text-[#B45309]',
  confirmed: 'text-[#0071E3]',
  shipped: 'text-[#4F46E5]',
  delivered: 'text-[#15803D]',
  cancelled: 'text-[#B91C1C]',
};

export const STATUS_BAR_COLORS: Record<CanonicalOrderStatus, string> = {
  pending: 'bg-[#D97706]',
  confirmed: 'bg-[#0071E3]',
  shipped: 'bg-[#6366F1]',
  delivered: 'bg-[#16A34A]',
  cancelled: 'bg-[#DC2626]',
};

export function normalizeOrderStatus(rawStatus: string | null | undefined): CanonicalOrderStatus {
  const s = (rawStatus ?? 'pending').toString().trim().toLowerCase();
  if (['pending', 'new', 'unconfirmed', 'awaiting_confirmation', 'awaiting'].includes(s)) {
    return 'pending';
  }
  if (['confirmed', 'processing', 'packed', 'ready', 'accepted'].includes(s)) {
    return 'confirmed';
  }
  if (['shipped', 'in_transit', 'dispatched', 'out_for_delivery', 'transit'].includes(s)) {
    return 'shipped';
  }
  if (['delivered', 'completed', 'done', 'paid'].includes(s)) {
    return 'delivered';
  }
  if (['cancelled', 'canceled', 'returned', 'failed', 'rejected'].includes(s)) {
    return 'cancelled';
  }
  return 'pending';
}

export function formatStatusLabel(rawStatus: string | null | undefined): string {
  const s = (rawStatus ?? '').toString().trim();
  if (!s) return 'Pending';
  const lower = s.toLowerCase();
  if (lower in STATUS_LABELS) {
    return STATUS_LABELS[lower as CanonicalOrderStatus];
  }
  return s
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function detectTitleCaseConvention(orders: Order[]): boolean {
  if (orders.length === 0) return false;
  const sample = orders.slice(0, 10).map((o) => String(o.status ?? '').trim()).filter(Boolean);
  if (sample.length === 0) return false;
  const titleCased = sample.filter((s) => /^[A-Z]/.test(s)).length;
  return titleCased > sample.length / 2;
}

export function formatOrderDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(d);
}

export function formatShortDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(d);
}

export function getOrderKey(order: Order, fallbackIndex?: number): string {
  if (order.id !== undefined && order.id !== null) return String(order.id);
  if (order.order_id !== undefined && order.order_id !== null) return String(order.order_id);
  return `${order.created_at}-${order.phone}-${fallbackIndex ?? 0}`;
}

export function computeOrderStats(orders: Order[]): OrderStats {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

  let totalUnits = 0;
  let pendingCount = 0;
  let confirmedCount = 0;
  let shippedCount = 0;
  let deliveredCount = 0;
  let cancelledCount = 0;
  let todayCount = 0;

  for (const order of orders) {
    const qty = Number(order.quantity);
    totalUnits += Number.isFinite(qty) && qty > 0 ? qty : 1;

    const status = normalizeOrderStatus(order.status);
    if (status === 'pending') pendingCount += 1;
    else if (status === 'confirmed') confirmedCount += 1;
    else if (status === 'shipped') shippedCount += 1;
    else if (status === 'delivered') deliveredCount += 1;
    else if (status === 'cancelled') cancelledCount += 1;

    if (order.created_at) {
      const ts = new Date(order.created_at).getTime();
      if (!Number.isNaN(ts) && ts >= startOfToday) {
        todayCount += 1;
      }
    }
  }

  const totalOrders = orders.length;
  const activeClosedDenominator = totalOrders - cancelledCount;
  const deliveryRate =
    activeClosedDenominator > 0
      ? Math.round((deliveredCount / activeClosedDenominator) * 100)
      : 0;

  return {
    totalOrders,
    totalUnits,
    pendingCount,
    confirmedCount,
    shippedCount,
    deliveredCount,
    cancelledCount,
    deliveryRate,
    todayCount,
  };
}
