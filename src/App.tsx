import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import {
  Download,
  Menu,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import {
  DEFAULT_APP_NAME,
  fetchOrders,
  getSavedAppName,
  saveAppNameLocally,
  supabase,
  updateOrderStatusInDb,
} from './lib/supabase';
import {
  STATUS_LABELS,
  computeOrderStats,
  detectTitleCaseConvention,
  getOrderKey,
  type CanonicalOrderStatus,
  type NavSection,
  type Order,
} from './types/order';
import { LoginView } from './components/LoginView';
import { Sidebar } from './components/Sidebar';
import { OverviewView } from './components/OverviewView';
import { OrdersView } from './components/OrdersView';
import { SettingsView } from './components/SettingsView';
import { OrderDetailDrawer } from './components/OrderDetailDrawer';

interface ToastState {
  type: 'success' | 'error';
  message: string;
}

function escapeCsvCell(value: unknown): string {
  const str = String(value ?? '');
  const safe = /^[=+\-@\t\r]/.test(str) ? `'${str}` : str;
  return `"${safe.replace(/"/g, '""')}"`;
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [authChecking, setAuthChecking] = useState(true);

  const [appName, setAppName] = useState<string>(() => getSavedAppName());
  const [activeSection, setActiveSection] = useState<NavSection>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [updatingOrderKey, setUpdatingOrderKey] = useState<string | null>(null);
  const [selectedOrderKey, setSelectedOrderKey] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = useCallback((type: 'success' | 'error', message: string) => {
    setToast({ type, message });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(timer);
  }, [toast]);

  // Keep browser document title synced with customized application name
  useEffect(() => {
    document.title = `${appName} — Order Operations`;
  }, [appName]);

  // Initialize and subscribe to Supabase Auth session
  useEffect(() => {
    let mounted = true;

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!mounted) return;
        setSession(data.session);
        const metaName = data.session?.user?.user_metadata?.app_name;
        if (typeof metaName === 'string' && metaName.trim().length > 0) {
          const synced = saveAppNameLocally(metaName);
          setAppName(synced);
        }
      })
      .finally(() => {
        if (mounted) setAuthChecking(false);
      });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!mounted) return;
      setSession(nextSession);
      if (nextSession) {
        const metaName = nextSession.user?.user_metadata?.app_name;
        if (typeof metaName === 'string' && metaName.trim().length > 0) {
          const synced = saveAppNameLocally(metaName);
          setAppName(synced);
        }
      } else {
        setOrders([]);
        setSelectedOrderKey(null);
        setOrdersError(null);
      }
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const loadOrders = useCallback(async () => {
    if (!session) return;
    setOrdersLoading(true);
    setOrdersError(null);
    try {
      const rows = await fetchOrders();
      setOrders(rows);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Unable to fetch orders from Supabase.';
      setOrdersError(msg);
      showToast('error', msg);
    } finally {
      setOrdersLoading(false);
    }
  }, [session, showToast]);

  useEffect(() => {
    if (session) {
      loadOrders();
    }
  }, [session, loadOrders]);

  const handleUpdateStatus = useCallback(
    async (order: Order, nextCanonical: CanonicalOrderStatus) => {
      const key = getOrderKey(order);
      const useTitleCase = detectTitleCaseConvention(orders);
      const nextValue = useTitleCase ? STATUS_LABELS[nextCanonical] : nextCanonical;

      const previousOrders = orders;
      setUpdatingOrderKey(key);

      // Optimistic update
      setOrders((prev) =>
        prev.map((item, idx) =>
          getOrderKey(item, idx) === key ? { ...item, status: nextValue } : item
        )
      );

      try {
        const updatedRow = await updateOrderStatusInDb(order, nextValue);
        setOrders((prev) =>
          prev.map((item, idx) =>
            getOrderKey(item, idx) === key ? { ...item, ...updatedRow } : item
          )
        );
        showToast(
          'success',
          `Order for ${order.customer_name || 'customer'} marked ${STATUS_LABELS[nextCanonical]}.`
        );
      } catch (err) {
        setOrders(previousOrders);
        showToast(
          'error',
          err instanceof Error ? err.message : 'Failed to update order status.'
        );
      } finally {
        setUpdatingOrderKey(null);
      }
    },
    [orders, showToast]
  );

  const handleSaveAppName = useCallback(
    async (nextName: string) => {
      const cleaned = saveAppNameLocally(nextName || DEFAULT_APP_NAME);
      setAppName(cleaned);

      try {
        await supabase.auth.updateUser({
          data: { app_name: cleaned },
        });
      } catch {
        // Local persistence already succeeded; ignore metadata sync failures
      }
      showToast('success', `Application name updated to "${cleaned}".`);
    },
    [showToast]
  );

  const handleSignOut = useCallback(async () => {
    await supabase.auth.signOut();
    setActiveSection('overview');
  }, []);

  const handleExportCsv = useCallback(() => {
    if (orders.length === 0) return;
    const headers = [
      'id',
      'customer_name',
      'email',
      'phone',
      'city',
      'address',
      'product_variant',
      'quantity',
      'status',
      'created_at',
    ];
    const lines = [
      headers.join(','),
      ...orders.map((row) =>
        [
          row.id ?? row.order_id ?? '',
          row.customer_name,
          row.email,
          row.phone,
          row.city,
          row.address,
          row.product_variant,
          row.quantity,
          row.status,
          row.created_at,
        ]
          .map(escapeCsvCell)
          .join(',')
      ),
    ];

    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cod-orders-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [orders]);

  const stats = useMemo(() => computeOrderStats(orders), [orders]);

  const selectedOrder = useMemo(() => {
    if (!selectedOrderKey) return null;
    return orders.find((o, idx) => getOrderKey(o, idx) === selectedOrderKey) ?? null;
  }, [orders, selectedOrderKey]);

  if (authChecking) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-[#0071E3] animate-spin" />
      </div>
    );
  }

  if (!session) {
    return <LoginView appName={appName} />;
  }

  const userEmail = session.user?.email ?? 'Admin';
  const sectionTitles: Record<NavSection, string> = {
    overview: 'Overview',
    orders: 'Orders',
    settings: 'Settings',
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7] text-[#1D1D1F] flex">
      <Sidebar
        appName={appName}
        activeSection={activeSection}
        onNavigate={setActiveSection}
        userEmail={userEmail}
        pendingCount={stats.pendingCount}
        onSignOut={handleSignOut}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Header Bar */}
        <header className="h-16 bg-white/85 backdrop-blur-md border-b border-black/[0.08] px-4 sm:px-8 flex items-center justify-between gap-4 sticky top-0 z-30">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
              className="lg:hidden w-9 h-9 rounded-lg flex items-center justify-center text-[#1D1D1F] hover:bg-black/[0.05] shrink-0"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-[14px] min-w-0">
              <span className="text-[#86868B] truncate hidden sm:inline">{appName}</span>
              <span className="text-[#86868B] hidden sm:inline" aria-hidden="true">
                /
              </span>
              <h1 className="font-display font-semibold text-[#1D1D1F] text-[16px] whitespace-nowrap">
                {sectionTitles[activeSection]}
              </h1>
            </div>
          </div>

          {activeSection !== 'settings' && (
            <div className="flex items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={handleExportCsv}
                disabled={orders.length === 0}
                className="h-9 px-3.5 rounded-xl border border-black/[0.1] bg-white hover:bg-[#F5F5F7] disabled:opacity-40 disabled:cursor-not-allowed text-[13px] font-medium text-[#1D1D1F] transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
              >
                <Download className="w-3.5 h-3.5 text-[#6E6E73]" />
                <span className="hidden sm:inline">Export CSV</span>
              </button>

              <button
                type="button"
                onClick={loadOrders}
                disabled={ordersLoading}
                className="h-9 px-3.5 rounded-xl bg-[#0071E3] hover:bg-[#0077ED] disabled:opacity-60 text-white text-[13px] font-medium transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${ordersLoading ? 'animate-spin' : ''}`}
                />
                <span>Refresh</span>
              </button>
            </div>
          )}
        </header>

        {/* Main Content Viewport */}
        <main className="flex-1 px-4 sm:px-8 py-6 max-w-[1360px] w-full mx-auto">
          {activeSection === 'overview' && (
            <OverviewView
              orders={orders}
              loading={ordersLoading}
              error={ordersError}
              onRetry={loadOrders}
              onViewAllOrders={() => setActiveSection('orders')}
              onSelectOrder={(order) => setSelectedOrderKey(getOrderKey(order))}
              onUpdateStatus={handleUpdateStatus}
              updatingOrderKey={updatingOrderKey}
            />
          )}

          {activeSection === 'orders' && (
            <OrdersView
              orders={orders}
              loading={ordersLoading}
              error={ordersError}
              onRetry={loadOrders}
              onSelectOrder={(order) => setSelectedOrderKey(getOrderKey(order))}
              onUpdateStatus={handleUpdateStatus}
              updatingOrderKey={updatingOrderKey}
            />
          )}

          {activeSection === 'settings' && (
            <SettingsView
              appName={appName}
              onSaveAppName={handleSaveAppName}
              userEmail={userEmail}
              onSignOut={handleSignOut}
            />
          )}
        </main>
      </div>

      {/* Order Detail Slide-Over */}
      <OrderDetailDrawer
        order={selectedOrder}
        orderKey={selectedOrderKey ?? ''}
        onClose={() => setSelectedOrderKey(null)}
        onUpdateStatus={handleUpdateStatus}
        updatingOrderKey={updatingOrderKey}
      />

      {/* Feedback Toast */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-white border border-black/[0.1] shadow-lg text-[13.5px] font-medium text-[#1D1D1F] max-w-sm"
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-[#DC2626] shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
