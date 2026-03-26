import { ReactNode } from 'react';
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
} from 'lucide-react';
import { useState } from 'react';
import { canAccessRoute, UserRole } from '@/types';
import { AnimatedThemeToggler } from '@/components/ui/animated-theme-toggler';

interface NavItem {
  path: string;
  label: string;
  icon: React.ElementType;
  color?: string;
}

const allNavItems: NavItem[] = [
  { path: '/', label: 'Dashboard', icon: LayoutGrid, color: 'from-amber-500 to-orange-500' },
  { path: '/tables', label: 'Tables', icon: Utensils, color: 'from-emerald-500 to-teal-500' },
  { path: '/orders', label: 'Orders', icon: ClipboardList, color: 'from-sky-500 to-blue-500' },
  { path: '/kitchen', label: 'Kitchen', icon: ChefHat, color: 'from-amber-500 to-yellow-500' },
  { path: '/billing', label: 'Billing', icon: Receipt, color: 'from-violet-500 to-purple-500' },
  { path: '/reports', label: 'Reports', icon: BarChart3, color: 'from-cyan-500 to-teal-500' },
  { path: '/menu', label: 'Menu', icon: UtensilsCrossed, color: 'from-rose-500 to-pink-500' },
  { path: '/users', label: 'Users', icon: Users, color: 'from-indigo-500 to-violet-500' },
  { path: '/settings', label: 'Settings', icon: Settings, color: 'from-slate-500 to-gray-500' },
];

function getNavItemsForRole(role: UserRole): NavItem[] {
  return allNavItems.filter(item => canAccessRoute(role, item.path));
}

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { user, logout } = useAuth();
  const { orders } = useOrders();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);

  if (!user) return null;

  const navItems = getNavItemsForRole(user.role);

  const NavLink = ({ item }: { item: NavItem }) => {
    const isActive = location.pathname === item.path;
    const Icon = item.icon;
    
    // Calculate badge count
    let badgeCount = 0;
    if (item.path === '/orders') {
      badgeCount = orders.filter(o => !['collected', 'cancelled'].includes(o.status)).length;
    } else if (item.path === '/kitchen') {
      badgeCount = orders.filter(o => o.status === 'new').length;
    } else if (item.path === '/billing') {
      badgeCount = orders.filter(o => o.status === 'served').length;
    }

    return (
      <Link
        to={item.path}
        onClick={() => setMobileMenuOpen(false)}
        className={cn(
          'flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group',
          isActive
            ? `bg-gradient-to-r ${item.color} text-white shadow-lg`
            : 'text-muted-foreground hover:text-foreground hover:bg-secondary/80'
        )}
      >
        <div className="flex items-center gap-3">
          {isActive ? (
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-white/20">
              <Icon className="w-4 h-4 text-white" />
            </div>
          ) : (
            <Icon className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
          )}
          <span>{item.label}</span>
        </div>
        
        {badgeCount > 0 && (
          <span className={cn(
            "flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-bold",
            isActive 
              ? "bg-white/25 text-white" 
              : "bg-primary text-primary-foreground"
          )}>
            {badgeCount > 99 ? '99+' : badgeCount}
          </span>
        )}
      </Link>
    );
  };

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'admin': return 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-400';
      case 'waiter': return 'bg-gradient-to-r from-sky-500/20 to-blue-500/20 text-sky-400';
      case 'cashier': return 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-400';
      case 'kitchen': return 'bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-yellow-400';
    }
  };

  return (
    <div className="min-h-screen bg-background flex bg-orbs relative overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-60 xl:w-64 glass border-r border-sidebar-border shrink-0 z-10">
        {/* Logo */}
        <div className="flex items-center gap-2 xl:gap-3 px-4 xl:px-6 py-4 xl:py-5 border-b border-sidebar-border">
          <div className="w-9 xl:w-10 h-9 xl:h-10 rounded-xl bg-gradient-primary flex items-center justify-center shrink-0 shadow-lg shadow-primary/25">
            <Utensils className="w-4 xl:w-5 h-4 xl:h-5 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="font-bold text-base xl:text-lg truncate">
              <span className="text-gradient-primary">Kaveri</span>
            </h1>
            <p className="text-[10px] xl:text-xs text-muted-foreground truncate">Order Management</p>
          </div>
          <AnimatedThemeToggler />
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 xl:p-4 space-y-1 overflow-y-auto touch-scroll">
          {navItems.map(item => (
            <NavLink key={item.path} item={item} />
          ))}
        </nav>

        {/* User section */}
        <div className="p-3 xl:p-4 border-t border-sidebar-border">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-full flex items-center gap-2 xl:gap-3 p-2 xl:p-3 rounded-xl hover:bg-secondary/80 transition-all duration-200 group">
                <div className="w-9 xl:w-10 h-9 xl:h-10 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center shrink-0 ring-2 ring-primary/20 group-hover:ring-primary/40 transition-all">
                  <User className="w-4 xl:w-5 h-4 xl:h-5 text-primary" />
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className="text-xs xl:text-sm font-medium truncate">{user.name}</p>
                  <span className={cn('text-[10px] xl:text-xs px-1.5 xl:px-2 py-0.5 rounded-full capitalize font-medium', getRoleBadgeColor(user.role))}>
                    {user.role}
                  </span>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => setIsLogoutDialogOpen(true)} 
                className="text-destructive focus:text-destructive cursor-pointer px-3 py-2.5 rounded-lg transition-colors hover:bg-destructive/10"
              >
                <LogOut className="w-4 h-4 mr-2" />
                <span>Sign Out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 glass border-b border-border">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center shadow-md shadow-primary/20">
              <Utensils className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-gradient-primary">Kaveri</span>
          </div>
          <div className="flex items-center gap-2">
            <AnimatedThemeToggler />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="absolute top-full left-0 right-0 bg-background/95 backdrop-blur-xl border-b border-border p-4 space-y-1 animate-slide-in-up shadow-xl">
            {navItems.map(item => (
              <NavLink key={item.path} item={item} />
            ))}
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                setIsLogoutDialogOpen(true);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              Sign Out
            </button>
          </div>
        )}
      </div>

      {/* Main Content */}
      <main className="flex-1 lg:ml-0 mt-14 lg:mt-0 overflow-auto min-w-0">
        <div className="p-3 sm:p-4 lg:p-6 max-w-[1600px] mx-auto">
          {children}
        </div>
      </main>

      {/* Logout Confirmation Dialog */}
      <Dialog open={isLogoutDialogOpen} onOpenChange={setIsLogoutDialogOpen}>
        <DialogContent className="sm:max-w-[425px] p-6 gap-6">
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
            <Button
              variant="outline"
              className="sm:flex-1 h-11 text-base rounded-xl"
              onClick={() => setIsLogoutDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="sm:flex-1 h-11 text-base rounded-xl bg-destructive hover:bg-destructive/90 shadow-lg shadow-destructive/20"
              onClick={() => {
                setIsLogoutDialogOpen(false);
                logout();
              }}
            >
              Sign Out
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
