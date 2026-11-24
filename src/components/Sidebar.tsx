import {
  LayoutGrid,
  ClipboardList,
  Settings,
  LogOut,
  PackageCheck,
  X,
} from 'lucide-react';
import type { NavSection } from '../types/order';

interface SidebarProps {
  appName: string;
  activeSection: NavSection;
  onNavigate: (section: NavSection) => void;
  userEmail: string;
  pendingCount: number;
  onSignOut: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export function Sidebar({
  appName,
  activeSection,
  onNavigate,
  userEmail,
  pendingCount,
  onSignOut,
  mobileOpen,
  onCloseMobile,
}: SidebarProps) {
  const navItems: { id: NavSection; label: string; icon: typeof LayoutGrid; count?: number }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutGrid },
    { id: 'orders', label: 'Orders', icon: ClipboardList, count: pendingCount },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const userInitial = userEmail ? userEmail.charAt(0).toUpperCase() : 'A';

  const handleSelect = (id: NavSection) => {
    onNavigate(id);
    onCloseMobile();
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#FBFBFC] border-r border-black/[0.08] w-[248px]">
      <div className="h-16 px-5 flex items-center justify-between border-b border-black/[0.06] shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-[#0071E3] flex items-center justify-center shrink-0">
            <PackageCheck className="w-4 h-4 text-white" strokeWidth={2} />
          </div>
          <span className="font-display font-semibold text-[15px] tracking-tight text-[#1D1D1F] truncate">
            {appName}
          </span>
        </div>
        <button
          type="button"
          onClick={onCloseMobile}
          aria-label="Close navigation menu"
          className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg text-[#6E6E73] hover:bg-black/[0.05]"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1" aria-label="Main navigation">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleSelect(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[14px] font-medium transition-colors whitespace-nowrap focus-visible:outline-2 focus-visible:outline-[#0071E3] ${
                isActive
                  ? 'bg-white text-[#1D1D1F] border border-black/[0.08]'
                  : 'text-[#6E6E73] hover:text-[#1D1D1F] hover:bg-black/[0.03] border border-transparent'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? 'text-[#0071E3]' : 'text-[#86868B]'
                  }`}
                  strokeWidth={1.9}
                />
                <span>{item.label}</span>
              </span>
              {typeof item.count === 'number' && item.count > 0 && (
                <span className="text-[12px] font-mono tabular-nums text-[#6E6E73]">
                  {item.count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-3 border-t border-black/[0.06] shrink-0">
        <div className="flex items-center gap-2.5 px-2.5 py-2 mb-1">
          <div className="w-8 h-8 rounded-lg bg-[#E8E8ED] text-[#1D1D1F] font-display font-semibold text-[13px] flex items-center justify-center shrink-0">
            {userInitial}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-medium text-[#1D1D1F] truncate">{userEmail}</p>
            <p className="text-[11px] text-[#86868B]">Administrator</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onSignOut}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-medium text-[#6E6E73] hover:text-[#B91C1C] hover:bg-[#FEF2F2] transition-colors whitespace-nowrap focus-visible:outline-2 focus-visible:outline-[#0071E3]"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop persistent sidebar */}
      <aside className="hidden lg:block shrink-0 h-screen sticky top-0">
        {sidebarContent}
      </aside>

      {/* Mobile slide-over sidebar */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/25 backdrop-blur-[2px]"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <div className="relative z-10 h-full">{sidebarContent}</div>
        </div>
      )}
    </>
  );
}
