import { useMemo } from 'react';
import { ArrowRight, AlertCircle, RefreshCw, PackageOpen } from 'lucide-react';
import {
  CANONICAL_STATUSES,
  STATUS_BAR_COLORS,
  STATUS_LABELS,
  STATUS_TEXT_STYLES,
  computeOrderStats,
  formatShortDate,
  formatStatusLabel,
  getOrderKey,
  normalizeOrderStatus,
  type CanonicalOrderStatus,
  type Order,
} from '../types/order';

interface OverviewViewProps {
  orders: Order[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onViewAllOrders: () => void;
  onSelectOrder: (order: Order) => void;
  onUpdateStatus: (order: Order, nextStatus: CanonicalOrderStatus) => Promise<void>;
  updatingOrderKey: string | null;
}

export function OverviewView({
  orders,
  loading,
  error,
  onRetry,
  onViewAllOrders,
  onSelectOrder,
  onUpdateStatus,
  updatingOrderKey,
}: OverviewViewProps) {
  const stats = useMemo(() => computeOrderStats(orders), [orders]);

  const recentOrders = useMemo(() => orders.slice(0, 6), [orders]);

  const topCities = useMemo(() => {
    const counts = new Map<string, number>();
    for (const o of orders) {
      const city = (o.city || 'Unspecified').trim();
      counts.set(city, (counts.get(city) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [orders]);

  const topVariants = useMemo(() => {
    const counts = new Map<string, { orders: number; units: number }>();
    for (const o of orders) {
      const variant = (o.product_variant || 'Standard').trim();
      const qty = Number(o.quantity) > 0 ? Number(o.quantity) : 1;
      const prev = counts.get(variant) ?? { orders: 0, units: 0 };
      counts.set(variant, { orders: prev.orders + 1, units: prev.units + qty });
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1].orders - a[1].orders)
      .slice(0, 5);
  }, [orders]);

  if (error && !loading && orders.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-black/[0.08] p-10 text-center max-w-lg mx-auto my-8">
        <AlertCircle className="w-8 h-8 text-[#DC2626] mx-auto mb-3" />
        <h2 className="text-[17px] font-semibold text-[#1D1D1F]">Unable to load orders</h2>
        <p className="mt-1.5 text-[14px] text-[#6E6E73]">{error}</p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0071E3] hover:bg-[#0077ED] text-white text-[13px] font-medium transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Try Again</span>
        </button>
      </div>
    );
  }

  const statItems = [
    {
      label: 'Total Orders',
      value: stats.totalOrders,
      detail: `${stats.totalUnits.toLocaleString()} total units · ${stats.todayCount} today`,
      tone: 'text-[#1D1D1F]',
    },
    {
      label: 'Pending Confirmation',
      value: stats.pendingCount,
      detail: 'Awaiting dispatch verification',
      tone: 'text-[#B45309]',
    },
    {
      label: 'In Progress',
      value: stats.confirmedCount + stats.shippedCount,
      detail: `${stats.confirmedCount} confirmed · ${stats.shippedCount} shipped`,
      tone: 'text-[#0071E3]',
    },
    {
      label: 'Delivered',
      value: stats.deliveredCount,
      detail: `${stats.deliveryRate}% completion rate`,
      tone: 'text-[#15803D]',
    },
  ];

  const statusBreakdown = [
    { status: 'pending' as CanonicalOrderStatus, count: stats.pendingCount },
    { status: 'confirmed' as CanonicalOrderStatus, count: stats.confirmedCount },
    { status: 'shipped' as CanonicalOrderStatus, count: stats.shippedCount },
    { status: 'delivered' as CanonicalOrderStatus, count: stats.deliveredCount },
    { status: 'cancelled' as CanonicalOrderStatus, count: stats.cancelledCount },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Summary Strip */}
      <section
        aria-label="Order statistics"
        className="bg-white rounded-2xl border border-black/[0.08] grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-black/[0.06]"
      >
        {statItems.map((item) => (
          <div key={item.label} className="p-5 sm:p-6">
            <p className="text-[13px] font-medium text-[#6E6E73]">{item.label}</p>
            {loading && orders.length === 0 ? (
              <div className="mt-2.5 h-8 w-20 rounded-lg bg-[#F5F5F7] animate-pulse" />
            ) : (
              <p
                className={`mt-1.5 text-[30px] font-display font-semibold tracking-tight tabular-nums leading-none ${item.tone}`}
              >
                {item.value.toLocaleString()}
              </p>
            )}
            <p className="mt-2.5 text-[12px] text-[#86868B] tabular-nums">{item.detail}</p>
          </div>
        ))}
      </section>

      {/* Fulfillment Distribution + Breakdown Grids */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <section className="lg:col-span-7 bg-white rounded-2xl border border-black/[0.08] p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-baseline justify-between gap-4">
              <h2 className="text-[16px] font-semibold text-[#1D1D1F]">
                Fulfillment Pipeline
              </h2>
              <span className="text-[12px] font-mono tabular-nums text-[#6E6E73]">
                {stats.totalOrders} total
              </span>
            </div>
            <p className="mt-1 text-[13px] text-[#6E6E73]">
              Distribution of Cash-on-Delivery orders across lifecycle stages
            </p>

            {/* Segmented proportion bar */}
            <div className="mt-6 h-3 w-full rounded-md bg-[#F5F5F7] overflow-hidden flex">
              {stats.totalOrders > 0 &&
                statusBreakdown.map(({ status, count }) => {
                  if (count === 0) return null;
                  const pct = (count / stats.totalOrders) * 100;
                  return (
                    <div
                      key={status}
                      style={{ width: `${pct}%` }}
                      className={`${STATUS_BAR_COLORS[status]} h-full transition-all duration-300`}
                      title={`${STATUS_LABELS[status]}: ${count}`}
                    />
                  );
                })}
            </div>
          </div>

          <div className="mt-6 divide-y divide-black/[0.06]">
            {statusBreakdown.map(({ status, count }) => {
              const pct =
                stats.totalOrders > 0 ? Math.round((count / stats.totalOrders) * 100) : 0;
              return (
                <div
                  key={status}
                  className="py-2.5 flex items-center justify-between text-[13.5px]"
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`w-2.5 h-2.5 rounded-xs ${STATUS_BAR_COLORS[status]}`}
                      aria-hidden="true"
                    />
                    <span className="font-medium text-[#1D1D1F]">
                      {STATUS_LABELS[status]}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 font-mono tabular-nums">
                    <span className="text-[#1D1D1F] font-medium">{count}</span>
                    <span className="text-[#86868B] w-10 text-right">{pct}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="lg:col-span-5 bg-white rounded-2xl border border-black/[0.08] p-6 flex flex-col justify-between space-y-6">
          <div>
            <h2 className="text-[16px] font-semibold text-[#1D1D1F]">Top Cities</h2>
            <div className="mt-3 divide-y divide-black/[0.06]">
              {loading && orders.length === 0 ? (
                <div className="space-y-2.5 py-2">
                  <div className="h-5 bg-[#F5F5F7] rounded animate-pulse" />
                  <div className="h-5 bg-[#F5F5F7] rounded animate-pulse" />
                </div>
              ) : topCities.length === 0 ? (
                <p className="py-3 text-[13px] text-[#86868B]">No city data available yet.</p>
              ) : (
                topCities.map(([city, count]) => (
                  <div
                    key={city}
                    className="py-2 flex items-center justify-between text-[13.5px]"
                  >
                    <span className="text-[#1D1D1F] truncate pr-3">{city}</span>
                    <span className="font-mono tabular-nums text-[#6E6E73]">
                      {count} {count === 1 ? 'order' : 'orders'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div>
            <h2 className="text-[16px] font-semibold text-[#1D1D1F]">Popular Variants</h2>
            <div className="mt-3 divide-y divide-black/[0.06]">
              {loading && orders.length === 0 ? (
                <div className="space-y-2.5 py-2">
                  <div className="h-5 bg-[#F5F5F7] rounded animate-pulse" />
                  <div className="h-5 bg-[#F5F5F7] rounded animate-pulse" />
                </div>
              ) : topVariants.length === 0 ? (
                <p className="py-3 text-[13px] text-[#86868B]">No product variant data yet.</p>
              ) : (
                topVariants.map(([variant, data]) => (
                  <div
                    key={variant}
                    className="py-2 flex items-center justify-between text-[13.5px]"
                  >
                    <span className="text-[#1D1D1F] truncate pr-3">{variant}</span>
                    <span className="font-mono tabular-nums text-[#6E6E73] whitespace-nowrap">
                      {data.units} units · {data.orders}x
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </div>

      {/* Recent Orders */}
      <section className="bg-white rounded-2xl border border-black/[0.08] overflow-hidden">
        <div className="px-6 py-4 border-b border-black/[0.06] flex items-center justify-between gap-4">
          <div>
            <h2 className="text-[16px] font-semibold text-[#1D1D1F]">Recent Orders</h2>
            <p className="text-[13px] text-[#6E6E73]">
              Latest incoming Cash-on-Delivery requests
            </p>
          </div>
          <button
            type="button"
            onClick={onViewAllOrders}
            className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#0071E3] hover:text-[#0077ED] whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-[#0071E3] rounded-lg px-2 py-1"
          >
            <span>View all orders</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {loading && orders.length === 0 ? (
          <div className="p-6 space-y-3">
            {[0, 1, 2, 3].map((idx) => (
              <div key={idx} className="h-10 bg-[#F5F5F7] rounded-lg animate-pulse" />
            ))}
          </div>
        ) : recentOrders.length === 0 ? (
          <div className="py-12 px-6 text-center">
            <PackageOpen className="w-8 h-8 text-[#86868B] mx-auto mb-2.5" strokeWidth={1.6} />
            <p className="text-[14px] font-medium text-[#1D1D1F]">No orders recorded yet</p>
            <p className="mt-1 text-[13px] text-[#6E6E73]">
              New Cash-on-Delivery orders from Supabase will appear here automatically.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-black/[0.06] bg-[#FBFBFC] text-[12px] font-medium text-[#6E6E73]">
                  <th className="py-2.5 pl-6 pr-3">Customer</th>
                  <th className="py-2.5 px-3">City</th>
                  <th className="py-2.5 px-3">Variant</th>
                  <th className="py-2.5 px-3 text-right">Qty</th>
                  <th className="py-2.5 px-3">Placed</th>
                  <th className="py-2.5 pl-3 pr-6 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.06] text-[13.5px]">
                {recentOrders.map((order, idx) => {
                  const key = getOrderKey(order, idx);
                  const canonical = normalizeOrderStatus(order.status);
                  const isUpdating = updatingOrderKey === key;

                  return (
                    <tr
                      key={key}
                      onClick={() => onSelectOrder(order)}
                      className="hover:bg-[#F5F5F7]/70 transition-colors cursor-pointer"
                    >
                      <td className="py-3 pl-6 pr-3">
                        <div className="font-medium text-[#1D1D1F]">
                          {order.customer_name || 'Unnamed Customer'}
                        </div>
                        <div className="text-[12px] font-mono tabular-nums text-[#6E6E73]">
                          {order.phone || order.email || '—'}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-[#1D1D1F]">{order.city || '—'}</td>
                      <td className="py-3 px-3 text-[#1D1D1F] max-w-[200px] truncate">
                        {order.product_variant || '—'}
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums text-[#1D1D1F]">
                        {order.quantity ?? 1}
                      </td>
                      <td className="py-3 px-3 font-mono tabular-nums text-[12.5px] text-[#6E6E73] whitespace-nowrap">
                        {formatShortDate(order.created_at)}
                      </td>
                      <td
                        className="py-3 pl-3 pr-6 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <select
                          aria-label={`Order status for ${order.customer_name}`}
                          value={canonical}
                          disabled={isUpdating}
                          onChange={(e) =>
                            onUpdateStatus(order, e.target.value as CanonicalOrderStatus)
                          }
                          className={`inline-block h-8 pl-2.5 pr-6 rounded-lg border border-black/[0.1] bg-white text-[12.5px] font-medium focus:outline-none focus:border-[#0071E3] focus:ring-2 focus:ring-[#0071E3]/15 disabled:opacity-50 cursor-pointer ${STATUS_TEXT_STYLES[canonical]}`}
                        >
                          {CANONICAL_STATUSES.map((s) => (
                            <option key={s} value={s} className="text-[#1D1D1F]">
                              {STATUS_LABELS[s]}
                            </option>
                          ))}
                          {!(order.status?.toLowerCase() in STATUS_LABELS) && order.status && (
                            <option value={canonical} className="text-[#1D1D1F]">
                              {formatStatusLabel(order.status)}
                            </option>
                          )}
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
