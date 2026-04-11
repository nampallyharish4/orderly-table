import { ReactNode, useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useOrders } from '@/contexts/OrderContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Utensils,
  LayoutGrid,
  ClipboardList,
  ChefHat,
  Receipt,
  BarChart3,
  Settings,
  Users,
  LogOut,
  User,
  Menu,
  X,
  UtensilsCrossed,
  ShoppingCart,
  CalendarDays,
  ChevronLeft,
  ChevronDown,
  ChevronRight,
  Search,
  Home,
} from 'lucide-react';
import { canAccessRoute, UserRole } from '@/types';
import { AnimatedThemeToggler } from '@/components/ui/animated-theme-toggler';
import { useRestaurantSettings } from '@/contexts/RestaurantSettingsContext';

interface NavItem {
  path: string;
  label: string;
  icon: React.ElementType;
  badge?: number;
}

const allNavItems: NavItem[] = [
  { path: '/', label: 'Dashboard', icon: LayoutGrid },
  { path: '/tables', label: 'Tables', icon: Utensils },
  { path: '/orders', label: 'Orders', icon: ClipboardList },
  { path: '/reservations', label: 'Reservations', icon: CalendarDays },
  { path: '/kitchen', label: 'Kitchen', icon: ChefHat },
  { path: '/billing', label: 'Billing', icon: Receipt },
  { path: '/reports', label: 'Reports', icon: BarChart3 },
  { path: '/menu', label: 'Menu', icon: UtensilsCrossed },
  { path: '/users', label: 'Users', icon: Users },
  { path: '/settings', label: 'Settings', icon: Settings },
];

function getNavItemsForRole(role: UserRole): NavItem[] {
  return allNavItems.filter((item) => canAccessRoute(role, item.path));
}

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { user, logout } = useAuth();
  const { settings } = useRestaurantSettings();
  const { orders, currentOrder } = useOrders();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    overview: true,
  });

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileMenuOpen]);

  if (!user) return null;

  const restaurantName = settings.restaurantName?.trim() || 'Restaurant';
  const navItems = getNavItemsForRole(user.role);

  // Calculate badge counts
  const activeOrderCount = orders.filter(
    (o) => !['collected', 'cancelled'].includes(o.status),
  ).length;
  const kitchenCount = orders.filter((o) => o.status === 'new').length;
  const billingCount = orders.filter((o) => o.status === 'served').length;

  const getBadgeCount = (path: string) => {
    switch (path) {
      case '/orders': return activeOrderCount;
      case '/kitchen': return kitchenCount;
      case '/billing': return billingCount;
      default: return 0;
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };


  // Mobile bottom nav items (most used, max 5)
  const mobileBottomNavItems = navItems.slice(0, 5);

  return (
    <div className="min-h-screen bg-background flex relative">
      {/* ===== DESKTOP SIDEBAR ===== */}
      <aside
        className={cn(
          'hidden lg:flex flex-col shrink-0 z-20 transition-all duration-300 ease-in-out h-screen sticky top-0',
          sidebarCollapsed ? 'w-[68px]' : 'w-64 xl:w-72',
        )}
        style={{
          background: 'hsl(20 20% 10%)',
          borderRight: '1px solid hsl(20 15% 16%)',
        }}
      >
        {/* Sidebar Header */}
        <div
          className="flex items-center gap-3 px-4 py-4 border-b"
          style={{ borderColor: 'hsl(20 15% 16%)' }}
        >
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{
              background: 'linear-gradient(135deg, hsl(24 90% 50%), hsl(12 85% 48%))',
              boxShadow: '0 4px 12px -2px hsl(24 90% 50% / 0.4)',
            }}
          >
            <Utensils className="w-4.5 h-4.5 text-white" />
          </div>
          {!sidebarCollapsed && (
            <div className="flex-1 min-w-0">
              <h1
                className="font-bold text-sm leading-tight truncate"
                style={{ color: 'hsl(30 15% 92%)' }}
              >
                {restaurantName}
              </h1>
            </div>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:bg-white/10 min-h-0"
            style={{ color: 'hsl(30 10% 55%)' }}
          >
            <ChevronLeft className={cn('w-4 h-4 transition-transform duration-300', sidebarCollapsed && 'rotate-180')} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-3 overflow-y-auto sidebar-scroll">
          {sidebarCollapsed ? (
            <div className="flex flex-col items-center gap-1 px-2">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                const Icon = item.icon;
                const badgeCount = getBadgeCount(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      'relative w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-200 group',
                      isActive ? 'text-white' : 'hover:bg-white/8',
                    )}
                    style={isActive ? {
                      background: 'hsl(24 90% 50%)',
                      boxShadow: '0 4px 12px -2px hsl(24 90% 50% / 0.4)',
                      color: 'white',
                    } : { color: 'hsl(30 10% 55%)' }}
                    title={item.label}
                  >
                    <Icon className="w-5 h-5" />
                    {badgeCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-[10px] font-bold bg-red-500 text-white px-1">
                        {badgeCount > 99 ? '99+' : badgeCount}
                      </span>
                    )}
                    <span className="sidebar-tooltip">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="space-y-1 px-3">
              <button onClick={() => toggleSection('overview')} className="sidebar-section-header w-full" style={{ minHeight: 'unset' }}>
                <span>Overview</span>
                {expandedSections.overview ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </button>
              {expandedSections.overview && (
                <div className="space-y-0.5">
                  {navItems.slice(0, 5).map((item) => {
                    const isActive = location.pathname === item.path;
                    const Icon = item.icon;
                    const badgeCount = getBadgeCount(item.path);
                    return (
                      <Link
                        key={item.path} to={item.path}
                        className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
                        style={isActive ? { background: 'hsl(24 90% 50% / 0.12)', color: 'hsl(24 90% 55%)' } : { color: 'hsl(30 10% 60%)' }}
                        onMouseEnter={(e) => { if (!isActive) { e.currentTarget.style.background = 'hsl(20 18% 14%)'; e.currentTarget.style.color = 'hsl(30 15% 88%)'; } }}
                        onMouseLeave={(e) => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'hsl(30 10% 60%)'; } }}
                      >
                        <div className="flex items-center gap-3"><Icon className="w-4.5 h-4.5" /><span>{item.label}</span></div>
                        {badgeCount > 0 && (
                          <span className="min-w-[22px] h-[22px] flex items-center justify-center rounded-full text-[11px] font-bold px-1.5"
                            style={isActive ? { background: 'hsl(24 90% 50% / 0.2)', color: 'hsl(24 90% 55%)' } : { background: 'hsl(4 72% 54%)', color: 'white' }}>
                            {badgeCount > 99 ? '99+' : badgeCount}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}
              {navItems.length > 5 && (
                <>
                  <button onClick={() => toggleSection('management')} className="sidebar-section-header w-full mt-3" style={{ minHeight: 'unset' }}>
                    <span>Management</span>
                    {expandedSections.management ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  </button>
                  {expandedSections.management && (
                    <div className="space-y-0.5">
                      {navItems.slice(5).map((item) => {
                        const isActive = location.pathname === item.path;
                        const Icon = item.icon;
                        const badgeCount = getBadgeCount(item.path);
                        return (
                          <Link key={item.path} to={item.path}
                            className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
                            style={isActive ? { background: 'hsl(24 90% 50% / 0.12)', color: 'hsl(24 90% 55%)' } : { color: 'hsl(30 10% 60%)' }}
                            onMouseEnter={(e) => { if (!isActive) { e.currentTarget.style.background = 'hsl(20 18% 14%)'; e.currentTarget.style.color = 'hsl(30 15% 88%)'; } }}
                            onMouseLeave={(e) => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'hsl(30 10% 60%)'; } }}>
                            <div className="flex items-center gap-3"><Icon className="w-4.5 h-4.5" /><span>{item.label}</span></div>
                            {badgeCount > 0 && (
                              <span className="min-w-[22px] h-[22px] flex items-center justify-center rounded-full text-[11px] font-bold px-1.5"
                                style={{ background: 'hsl(4 72% 54%)', color: 'white' }}>
                                {badgeCount > 99 ? '99+' : badgeCount}
                              </span>
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </nav>

        {/* User section */}
        <div className="border-t px-3 py-3" style={{ borderColor: 'hsl(20 15% 16%)' }}>
          {!sidebarCollapsed ? (
            <>
              <div className="text-xs mb-3 px-2 truncate" style={{ color: 'hsl(30 10% 50%)' }}>{user.email}</div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="w-full flex items-center gap-3 p-2.5 rounded-xl transition-all duration-200 group" style={{ minHeight: 'unset' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'hsl(20 18% 14%)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
                    <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                      style={{ background: 'linear-gradient(135deg, hsl(24 90% 50% / 0.25), hsl(4 72% 58% / 0.2))', border: '2px solid hsl(24 90% 50% / 0.3)' }}>
                      <User className="w-4 h-4" style={{ color: 'hsl(24 90% 55%)' }} />
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: 'hsl(30 15% 88%)' }}>{user.name}</p>
                      <span className="text-[10px] px-2 py-0.5 rounded-full capitalize font-medium border"
                        style={(() => { switch (user.role) { case 'admin': return { background: 'hsl(24 90% 50% / 0.12)', color: 'hsl(24 90% 55%)', borderColor: 'hsl(24 90% 50% / 0.2)' }; case 'cashier': return { background: 'hsl(152 60% 42% / 0.12)', color: 'hsl(152 60% 50%)', borderColor: 'hsl(152 60% 42% / 0.2)' }; default: return { background: 'hsl(210 75% 55% / 0.12)', color: 'hsl(210 75% 60%)', borderColor: 'hsl(210 75% 55% / 0.2)' }; } })()}>
                        {user.role}
                      </span>
                    </div>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setIsLogoutDialogOpen(true)} className="text-destructive focus:text-destructive cursor-pointer px-3 py-2.5 rounded-lg hover:bg-destructive/10">
                    <LogOut className="w-4 h-4 mr-2" /><span>Sign Out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="w-11 h-11 mx-auto rounded-full flex items-center justify-center transition-all"
                  style={{ background: 'linear-gradient(135deg, hsl(24 90% 50% / 0.25), hsl(4 72% 58% / 0.2))', border: '2px solid hsl(24 90% 50% / 0.3)' }}>
                  <User className="w-4.5 h-4.5" style={{ color: 'hsl(24 90% 55%)' }} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1"><p className="text-sm font-medium">{user.name}</p><p className="text-xs text-muted-foreground capitalize">{user.role}</p></div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setIsLogoutDialogOpen(true)} className="text-destructive focus:text-destructive cursor-pointer">
                  <LogOut className="w-4 h-4 mr-2" />Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </aside>

      {/* ===== MOBILE TOP BAR ===== */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50" style={{ background: 'hsl(20 20% 10%)', borderBottom: '1px solid hsl(20 15% 16%)' }}>
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{
                background: 'linear-gradient(135deg, hsl(24 90% 50%), hsl(12 85% 48%))',
                boxShadow: '0 3px 8px -2px hsl(24 90% 50% / 0.35)',
              }}
            >
              <Utensils className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-sm leading-tight truncate" style={{ color: 'hsl(30 15% 92%)' }}>
                {restaurantName}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {/* Cart button on /orders/new */}
            {location.pathname === '/orders/new' && (currentOrder?.items?.length || 0) > 0 && (
              <Button
                variant="ghost" size="icon"
                className="relative rounded-xl"
                style={{ color: 'hsl(24 90% 55%)' }}
                onClick={() => document.getElementById('mobile-cart-button')?.click()}
              >
                <ShoppingCart className="w-5 h-5" />
                <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white min-w-[16px] h-[16px] px-0.5 rounded-full text-[9px] flex items-center justify-center font-bold">
                  {currentOrder?.items?.length}
                </span>
              </Button>
            )}
            <AnimatedThemeToggler className="text-white/70 hover:text-white" />
            <Button
              variant="ghost" size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={{ color: 'hsl(30 15% 80%)' }}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* ===== MOBILE FULL-SCREEN MENU OVERLAY ===== */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-[60] flex flex-col" style={{ background: 'hsl(20 20% 10%)' }}>
          {/* Menu header */}
          <div className="flex items-center justify-between px-4 h-14 border-b" style={{ borderColor: 'hsl(20 15% 16%)' }}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, hsl(24 90% 50%), hsl(12 85% 48%))' }}>
                <Utensils className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-sm" style={{ color: 'hsl(30 15% 92%)' }}>{restaurantName}</span>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(false)} style={{ color: 'hsl(30 15% 80%)' }}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Menu items */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              const badgeCount = getBadgeCount(item.path);
              return (
                <Link
                  key={item.path} to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between px-4 py-3.5 rounded-xl text-base font-medium transition-all duration-200"
                  style={isActive ? {
                    background: 'hsl(24 90% 50%)',
                    color: 'white',
                    boxShadow: '0 4px 12px -2px hsl(24 90% 50% / 0.4)',
                  } : {
                    color: 'hsl(30 10% 65%)',
                  }}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </div>
                  {badgeCount > 0 && (
                    <span className="min-w-[22px] h-[22px] flex items-center justify-center rounded-full text-[11px] font-bold px-1.5"
                      style={isActive ? { background: 'rgba(255,255,255,0.25)', color: 'white' } : { background: 'hsl(4 72% 54%)', color: 'white' }}>
                      {badgeCount > 99 ? '99+' : badgeCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User info + sign out */}
          <div className="border-t p-4 space-y-3" style={{ borderColor: 'hsl(20 15% 16%)' }}>
            <div className="flex items-center gap-3 px-2">
              <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                style={{ background: 'linear-gradient(135deg, hsl(24 90% 50% / 0.25), hsl(4 72% 58% / 0.2))', border: '2px solid hsl(24 90% 50% / 0.3)' }}>
                <User className="w-5 h-5" style={{ color: 'hsl(24 90% 55%)' }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: 'hsl(30 15% 90%)' }}>{user.name}</p>
                <p className="text-xs truncate" style={{ color: 'hsl(30 10% 50%)' }}>{user.email}</p>
              </div>
            </div>
            <button
              onClick={() => { setMobileMenuOpen(false); setIsLogoutDialogOpen(true); }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors"
              style={{ color: 'hsl(4 72% 60%)', background: 'hsl(4 72% 54% / 0.08)' }}
            >
              <LogOut className="w-5 h-5" />
              Sign Out
            </button>
          </div>
        </div>
      )}

      {/* ===== MOBILE BOTTOM NAV BAR ===== */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 pb-safe"
        style={{ background: 'hsl(20 20% 10%)', borderTop: '1px solid hsl(20 15% 16%)' }}>
        <div className="flex items-center justify-around h-16 px-2">
          {mobileBottomNavItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            const badgeCount = getBadgeCount(item.path);
            return (
              <Link
                key={item.path} to={item.path}
                className="relative flex flex-col items-center justify-center gap-0.5 min-w-0 px-2 py-1 rounded-xl transition-all min-h-0"
                style={isActive ? { color: 'hsl(24 90% 55%)' } : { color: 'hsl(30 10% 50%)' }}
              >
                <div className="relative">
                  <Icon className="w-5 h-5" />
                  {badgeCount > 0 && (
                    <span className="absolute -top-1.5 -right-2.5 min-w-[14px] h-[14px] flex items-center justify-center rounded-full text-[8px] font-bold bg-red-500 text-white px-0.5">
                      {badgeCount > 99 ? '99+' : badgeCount}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-medium leading-tight">{item.label}</span>
                {isActive && (
                  <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-full"
                    style={{ background: 'hsl(24 90% 50%)' }} />
                )}
              </Link>
            );
          })}
          {/* More button for additional nav items */}
          {navItems.length > 5 && (
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="flex flex-col items-center justify-center gap-0.5 min-w-0 px-2 py-1 rounded-xl transition-all min-h-0"
              style={{ color: 'hsl(30 10% 50%)' }}
            >
              <Menu className="w-5 h-5" />
              <span className="text-[10px] font-medium leading-tight">More</span>
            </button>
          )}
        </div>
      </div>

      {/* ===== MAIN CONTENT ===== */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Desktop Top Bar */}
        <header className="hidden lg:flex items-center justify-between px-6 py-3.5 border-b border-border/60 bg-background/80 backdrop-blur-sm sticky top-0 z-10">
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
              <input type="text" placeholder="Global search"
                className="h-9 w-56 pl-9 pr-4 rounded-xl bg-muted/50 border border-border/60 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all" />
            </div>
            <AnimatedThemeToggler />
            <div className="flex items-center gap-2.5 pl-3 border-l border-border/60">
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Hi, {user.name}</p>
                <p className="text-sm font-semibold flex items-center gap-1">
                  {restaurantName}
                  <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                </p>
              </div>
              <div className="w-9 h-9 rounded-full flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, hsl(24 90% 50%), hsl(12 85% 48%))' }}>
                <User className="w-4 h-4 text-white" />
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 pt-14 pb-20 lg:pt-0 lg:pb-0 overflow-auto min-w-0">
          <div className="p-3 sm:p-4 lg:p-6 max-w-[1600px] mx-auto w-full">
            {children}
          </div>
        </main>
      </div>

      {/* Logout Dialog */}
      <Dialog open={isLogoutDialogOpen} onOpenChange={setIsLogoutDialogOpen}>
        <DialogContent className="sm:max-w-[425px] p-6 gap-6 mx-4 rounded-2xl">
          <DialogHeader className="gap-2">
            <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-2">
              <LogOut className="w-6 h-6 text-destructive" />
            </div>
            <DialogTitle className="text-xl font-bold">Sign Out</DialogTitle>
            <DialogDescription className="text-base text-muted-foreground">
              Are you sure you want to sign out? You will need to log in again to access your account.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button variant="outline" className="sm:flex-1 h-11 text-base rounded-xl" onClick={() => setIsLogoutDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive"
              className="sm:flex-1 h-11 text-base rounded-xl bg-destructive hover:bg-destructive/90 shadow-lg shadow-destructive/20"
              onClick={() => { setIsLogoutDialogOpen(false); logout(); }}>
              Sign Out
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
