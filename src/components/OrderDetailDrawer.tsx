import { useState } from 'react';
import { X, Copy, Check, MapPin, Phone, Mail, Package, Calendar } from 'lucide-react';
import {
  CANONICAL_STATUSES,
  STATUS_LABELS,
  STATUS_TEXT_STYLES,
  formatOrderDate,
  formatStatusLabel,
  normalizeOrderStatus,
  type CanonicalOrderStatus,
  type Order,
} from '../types/order';

interface OrderDetailDrawerProps {
  order: Order | null;
  onClose: () => void;
  onUpdateStatus: (order: Order, nextStatus: CanonicalOrderStatus) => Promise<void>;
  updatingOrderKey: string | null;
  orderKey: string;
}

export function OrderDetailDrawer({
  order,
  onClose,
  onUpdateStatus,
  updatingOrderKey,
  orderKey,
}: OrderDetailDrawerProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!order) return null;

  const canonicalStatus = normalizeOrderStatus(order.status);
  const isUpdating = updatingOrderKey === orderKey;

  const handleCopy = async (label: string, value: string) => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(label);
      setTimeout(() => setCopiedField(null), 1800);
    } catch {
      // Clipboard unavailable
    }
  };

  const knownKeys = new Set([
    'id',
    'order_id',
    'customer_name',
    'email',
    'phone',
    'city',
    'address',
    'product_variant',
    'quantity',
    'status',
    'created_at',
  ]);

  const extraEntries = Object.entries(order).filter(
    ([key, val]) => !knownKeys.has(key) && val !== null && val !== undefined && val !== ''
  );

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true">
      <div
        className="fixed inset-0 bg-black/20 backdrop-blur-[2px] transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative z-10 w-full max-w-[460px] bg-white h-full border-l border-black/[0.08] flex flex-col">
        <div className="h-16 px-6 border-b border-black/[0.06] flex items-center justify-between shrink-0">
          <div className="min-w-0">
            <h2 className="text-[16px] font-semibold text-[#1D1D1F] truncate">
              Order Details
            </h2>
            <p className="text-[12px] font-mono tabular-nums text-[#6E6E73] truncate">
              {order.id !== undefined
                ? `#${String(order.id)}`
                : order.order_id !== undefined
                  ? `#${String(order.order_id)}`
                  : formatOrderDate(order.created_at)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close order details"
            className="w-9 h-9 rounded-lg flex items-center justify-center text-[#6E6E73] hover:text-[#1D1D1F] hover:bg-black/[0.04] transition-colors focus-visible:outline-2 focus-visible:outline-[#0071E3]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {/* Status control */}
          <section>
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[13px] font-medium text-[#6E6E73]">
                Fulfillment status
              </span>
              <span className={`text-[13px] font-semibold ${STATUS_TEXT_STYLES[canonicalStatus]}`}>
                {formatStatusLabel(order.status)}
              </span>
            </div>
            <div className="grid grid-cols-5 gap-1.5 p-1 rounded-xl bg-[#F5F5F7] border border-black/[0.06]">
              {CANONICAL_STATUSES.map((statusOption) => {
                const active = canonicalStatus === statusOption;
                return (
                  <button
                    key={statusOption}
                    type="button"
                    disabled={isUpdating}
                    onClick={() => onUpdateStatus(order, statusOption)}
                    className={`py-2 px-1.5 rounded-lg text-[12px] font-medium transition-all whitespace-nowrap focus-visible:outline-2 focus-visible:outline-[#0071E3] ${
                      active
                        ? 'bg-white text-[#1D1D1F] shadow-xs border border-black/[0.06]'
                        : 'text-[#6E6E73] hover:text-[#1D1D1F]'
                    } disabled:opacity-50`}
                  >
                    {STATUS_LABELS[statusOption]}
                  </button>
                );
              })}
            </div>
          </section>

          <hr className="border-black/[0.06]" />

          {/* Customer */}
          <section className="space-y-3">
            <h3 className="text-[13px] font-semibold text-[#1D1D1F]">Customer Information</h3>
            <div className="space-y-2.5 text-[14px]">
              <div className="flex items-center justify-between gap-3 py-1">
                <span className="text-[#6E6E73]">Name</span>
                <span className="font-medium text-[#1D1D1F] text-right">
                  {order.customer_name || '—'}
                </span>
              </div>

              <div className="flex items-center justify-between gap-3 py-1">
                <span className="text-[#6E6E73] flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-[#86868B]" />
                  <span>Phone</span>
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-mono tabular-nums text-[#1D1D1F]">
                    {order.phone || '—'}
                  </span>
                  {order.phone && (
                    <button
                      type="button"
                      onClick={() => handleCopy('phone', order.phone)}
                      aria-label="Copy phone number"
                      className="w-7 h-7 rounded-md flex items-center justify-center text-[#6E6E73] hover:text-[#1D1D1F] hover:bg-black/[0.05] transition-colors"
                    >
                      {copiedField === 'phone' ? (
                        <Check className="w-3.5 h-3.5 text-[#15803D]" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 py-1">
                <span className="text-[#6E6E73] flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-[#86868B]" />
                  <span>Email</span>
                </span>
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-[#1D1D1F] truncate">{order.email || '—'}</span>
                  {order.email && (
                    <button
                      type="button"
                      onClick={() => handleCopy('email', order.email)}
                      aria-label="Copy email address"
                      className="w-7 h-7 rounded-md flex items-center justify-center text-[#6E6E73] hover:text-[#1D1D1F] hover:bg-black/[0.05] transition-colors shrink-0"
                    >
                      {copiedField === 'email' ? (
                        <Check className="w-3.5 h-3.5 text-[#15803D]" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </section>

          <hr className="border-black/[0.06]" />

          {/* Delivery */}
          <section className="space-y-3">
            <h3 className="text-[13px] font-semibold text-[#1D1D1F]">Delivery Address</h3>
            <div className="space-y-2.5 text-[14px]">
              <div className="flex items-center justify-between gap-3 py-1">
                <span className="text-[#6E6E73] flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#86868B]" />
                  <span>City</span>
                </span>
                <span className="font-medium text-[#1D1D1F]">{order.city || '—'}</span>
              </div>
              <div className="py-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[#6E6E73]">Street address</span>
                  {order.address && (
                    <button
                      type="button"
                      onClick={() =>
                        handleCopy('address', `${order.address}, ${order.city}`.trim())
                      }
                      className="text-[12px] text-[#0071E3] hover:underline font-medium"
                    >
                      {copiedField === 'address' ? 'Copied' : 'Copy address'}
                    </button>
                  )}
                </div>
                <p className="text-[#1D1D1F] leading-relaxed bg-[#F5F5F7] rounded-xl px-3.5 py-2.5 text-[13.5px]">
                  {order.address || 'No street address provided'}
                </p>
              </div>
            </div>
          </section>

          <hr className="border-black/[0.06]" />

          {/* Order Item */}
          <section className="space-y-3">
            <h3 className="text-[13px] font-semibold text-[#1D1D1F]">Order Summary</h3>
            <div className="space-y-2.5 text-[14px]">
              <div className="flex items-center justify-between gap-3 py-1">
                <span className="text-[#6E6E73] flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-[#86868B]" />
                  <span>Product variant</span>
                </span>
                <span className="font-medium text-[#1D1D1F] text-right">
                  {order.product_variant || '—'}
                </span>
              </div>

              <div className="flex items-center justify-between gap-3 py-1">
                <span className="text-[#6E6E73]">Quantity</span>
                <span className="font-mono tabular-nums font-medium text-[#1D1D1F]">
                  {order.quantity ?? 1}
                </span>
              </div>

              <div className="flex items-center justify-between gap-3 py-1">
                <span className="text-[#6E6E73] flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#86868B]" />
                  <span>Placed on</span>
                </span>
                <span className="font-mono tabular-nums text-[13px] text-[#1D1D1F]">
                  {formatOrderDate(order.created_at)}
                </span>
              </div>

              {extraEntries.map(([key, val]) => (
                <div key={key} className="flex items-center justify-between gap-3 py-1">
                  <span className="text-[#6E6E73] capitalize">{key.replace(/_/g, ' ')}</span>
                  <span className="text-[#1D1D1F] font-mono text-[13px] text-right truncate max-w-[240px]">
                    {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
