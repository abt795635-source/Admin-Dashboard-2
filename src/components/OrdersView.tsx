import { useMemo, useState } from 'react';
import {
  Search,
  X,
  AlertCircle,
  RefreshCw,
  PackageOpen,
  ChevronRight,
} from 'lucide-react';
import {
  CANONICAL_STATUSES,
  STATUS_LABELS,
  STATUS_TEXT_STYLES,
  formatShortDate,
  formatStatusLabel,
  getOrderKey,
  normalizeOrderStatus,
  type CanonicalOrderStatus,
  type Order,
} from '../types/order';

interface OrdersViewProps {
  orders: Order[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onSelectOrder: (order: Order) => void;
  onUpdateStatus: (order: Order, nextStatus: CanonicalOrderStatus) => Promise<void>;
  updatingOrderKey: string | null;
}

type StatusFilter = 'all' | CanonicalOrderStatus;

export function OrdersView({
  orders,
  loading,
  error,
  onRetry,
  onSelectOrder,
  onUpdateStatus,
  updatingOrderKey,
}: OrdersViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [cityFilter, setCityFilter] = useState<string>('all');

  const cities = useMemo(() => {
    const set = new Set<string>();
    for (const order of orders) {
      const city = (order.city ?? '').trim();
      if (city) set.add(city);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [orders]);

  const statusCounts = useMemo(() => {
    const counts: Record<StatusFilter, number> = {
      all: orders.length,
      pending: 0,
      confirmed: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
    };
    for (const order of orders) {
      const normalized = normalizeOrderStatus(order.status);
      counts[normalized] += 1;
    }
    return counts;
  }, [orders]);

  const filteredOrders = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return orders.filter((order) => {
      if (statusFilter !== 'all' && normalizeOrderStatus(order.status) !== statusFilter) {
        return false;
      }
      if (cityFilter !== 'all' && (order.city ?? '').trim() !== cityFilter) {
        return false;
      }
      if (!q) return true;

      const searchable = [
        order.id !== undefined ? String(order.id) : '',
        order.order_id !== undefined ? String(order.order_id) : '',
        order.customer_name,
        order.email,
        order.phone,
        order.city,
        order.address,
        order.product_variant,
        order.status,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return searchable.includes(q);
    });
  }, [orders, searchQuery, statusFilter, cityFilter]);

  const hasActiveFilters =
    searchQuery.trim().length > 0 || statusFilter !== 'all' || cityFilter !== 'all';

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setCityFilter('all');
  };

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

  const filterTabs: { id: StatusFilter; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'pending', label: 'Pending' },
    { id: 'confirmed', label: 'Confirmed' },
    { id: 'shipped', label: 'Shipped' },
    { id: 'delivered', label: 'Delivered' },
    { id: 'cancelled', label: 'Cancelled' },
  ];

  return (
    <div className="space-y-4">
      {/* Search & Filter Toolbar */}
      <div className="bg-white rounded-2xl border border-black/[0.08] p-4 space-y-3.5">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#86868B] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search customer, phone, email, city, address, or variant..."
              aria-label="Search orders"
              className="w-full h-10 pl-10 pr-9 rounded-xl bg-[#F5F5F7] border border-transparent text-[13.5px] text-[#1D1D1F] placeholder:text-[#86868B] focus:outline-none focus:bg-white focus:border-[#0071E3] focus:ring-3 focus:ring-[#0071E3]/15 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-md flex items-center justify-center text-[#6E6E73] hover:text-[#1D1D1F] hover:bg-black/[0.06]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <select
              aria-label="Filter by city"
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="h-10 px-3 rounded-xl bg-[#F5F5F7] border border-transparent text-[13.5px] text-[#1D1D1F] focus:outline-none focus:bg-white focus:border-[#0071E3] focus:ring-3 focus:ring-[#0071E3]/15 transition-all cursor-pointer"
            >
              <option value="all">All Cities</option>
              {cities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="h-10 px-3.5 rounded-xl border border-black/[0.1] text-[13px] font-medium text-[#1D1D1F] hover:bg-[#F5F5F7] transition-colors whitespace-nowrap shrink-0"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Segmented Status Filter */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div
            role="tablist"
            aria-label="Filter orders by status"
            className="inline-flex items-center gap-1 p-1 rounded-xl bg-[#F5F5F7] overflow-x-auto max-w-full"
          >
            {filterTabs.map((tab) => {
              const active = statusFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setStatusFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-[12.5px] font-medium transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 focus-visible:outline-2 focus-visible:outline-[#0071E3] ${
                    active
                      ? 'bg-white text-[#1D1D1F] shadow-xs'
                      : 'text-[#6E6E73] hover:text-[#1D1D1F]'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`font-mono tabular-nums text-[11.5px] ${
                      active ? 'text-[#0071E3]' : 'text-[#86868B]'
                    }`}
                  >
                    {statusCounts[tab.id]}
                  </span>
                </button>
              );
            })}
          </div>

          <span className="text-[12.5px] text-[#6E6E73] font-mono tabular-nums whitespace-nowrap">
            Showing {filteredOrders.length} of {orders.length}
          </span>
        </div>
      </div>

      {/* Orders Data Table */}
      <section className="bg-white rounded-2xl border border-black/[0.08] overflow-hidden">
        {loading && orders.length === 0 ? (
          <div className="p-6 space-y-3">
            {[0, 1, 2, 3, 4, 5].map((idx) => (
              <div key={idx} className="h-11 bg-[#F5F5F7] rounded-lg animate-pulse" />
            ))}
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="py-16 px-6 text-center">
            <PackageOpen className="w-9 h-9 text-[#86868B] mx-auto mb-3" strokeWidth={1.6} />
            <h3 className="text-[15px] font-semibold text-[#1D1D1F]">
              {hasActiveFilters ? 'No matching orders' : 'No orders found'}
            </h3>
            <p className="mt-1 text-[13.5px] text-[#6E6E73] max-w-sm mx-auto">
              {hasActiveFilters
                ? 'Try adjusting your search keywords, city filter, or status tab.'
                : 'Cash-on-Delivery orders stored in your Supabase orders table will appear here.'}
            </p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="mt-4 px-4 py-2 rounded-xl bg-[#0071E3] hover:bg-[#0077ED] text-white text-[13px] font-medium transition-colors"
              >
                Reset Filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-black/[0.06] bg-[#FBFBFC] text-[12px] font-medium text-[#6E6E73]">
                  <th className="py-3 pl-6 pr-3">Customer</th>
                  <th className="py-3 px-3">Contact</th>
                  <th className="py-3 px-3">Delivery</th>
                  <th className="py-3 px-3">Product Variant</th>
                  <th className="py-3 px-3 text-right">Qty</th>
                  <th className="py-3 px-3">Created</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 pl-2 pr-5 text-right">
                    <span className="sr-only">Inspect</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.06] text-[13.5px]">
                {filteredOrders.map((order, idx) => {
                  const key = getOrderKey(order, idx);
                  const canonical = normalizeOrderStatus(order.status);
                  const isUpdating = updatingOrderKey === key;

                  return (
                    <tr
                      key={key}
                      onClick={() => onSelectOrder(order)}
                      className="hover:bg-[#F5F5F7]/75 transition-colors cursor-pointer group"
                    >
                      <td className="py-3 pl-6 pr-3 max-w-[190px]">
                        <div className="font-medium text-[#1D1D1F] truncate">
                          {order.customer_name || 'Unnamed'}
                        </div>
                        {order.id !== undefined && (
                          <div className="text-[11.5px] font-mono tabular-nums text-[#86868B] truncate">
                            #{String(order.id)}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-3 max-w-[200px]">
                        <div className="font-mono tabular-nums text-[12.5px] text-[#1D1D1F] truncate">
                          {order.phone || '—'}
                        </div>
                        <div className="text-[12px] text-[#6E6E73] truncate">
                          {order.email || '—'}
                        </div>
                      </td>

                      <td className="py-3 px-3 max-w-[230px]">
                        <div className="font-medium text-[#1D1D1F] truncate">
                          {order.city || '—'}
                        </div>
                        <div className="text-[12px] text-[#6E6E73] truncate">
                          {order.address || '—'}
                        </div>
                      </td>

                      <td className="py-3 px-3 max-w-[190px] text-[#1D1D1F]">
                        <span className="block truncate">{order.product_variant || '—'}</span>
                      </td>

                      <td className="py-3 px-3 text-right font-mono tabular-nums font-medium text-[#1D1D1F]">
                        {order.quantity ?? 1}
                      </td>

                      <td className="py-3 px-3 font-mono tabular-nums text-[12.5px] text-[#6E6E73] whitespace-nowrap">
                        {formatShortDate(order.created_at)}
                      </td>

                      <td className="py-3 px-3" onClick={(e) => e.stopPropagation()}>
                        <select
                          aria-label={`Status for ${order.customer_name}`}
                          value={canonical}
                          disabled={isUpdating}
                          onChange={(e) =>
                            onUpdateStatus(order, e.target.value as CanonicalOrderStatus)
                          }
                          className={`h-8 pl-2.5 pr-6 rounded-lg border border-black/[0.1] bg-white text-[12.5px] font-medium focus:outline-none focus:border-[#0071E3] focus:ring-2 focus:ring-[#0071E3]/15 disabled:opacity-50 cursor-pointer ${STATUS_TEXT_STYLES[canonical]}`}
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

                      <td className="py-3 pl-2 pr-5 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectOrder(order);
                          }}
                          aria-label={`Open details for ${order.customer_name}`}
                          className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-[#86868B] group-hover:text-[#1D1D1F] hover:bg-black/[0.06] transition-colors"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
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
