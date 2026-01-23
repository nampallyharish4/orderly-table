import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
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

interface NavItem {
  path: string;
  label: string;
  icon: React.ElementType;
}

const allNavItems: NavItem[] = [
  { path: '/', label: 'Dashboard', icon: LayoutGrid },
  { path: '/tables', label: 'Tables', icon: Utensils },
  { path: '/orders', label: 'Orders', icon: ClipboardList },
  { path: '/kitchen', label: 'Kitchen', icon: ChefHat },
  { path: '/billing', label: 'Billing', icon: Receipt },
  { path: '/reports', label: 'Reports', icon: BarChart3 },
  { path: '/menu', label: 'Menu', icon: UtensilsCrossed },
  { path: '/users', label: 'Users', icon: Users },
  { path: '/settings', label: 'Settings', icon: Settings },
];

function getNavItemsForRole(role: UserRole): NavItem[] {
  return allNavItems.filter(item => canAccessRoute(role, item.path));
}

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!user) return null;

  const navItems = getNavItemsForRole(user.role);

  const NavLink = ({ item }: { item: NavItem }) => {
    const isActive = location.pathname === item.path;
    const Icon = item.icon;

    return (
      <Link
        to={item.path}
        onClick={() => setMobileMenuOpen(false)}
        className={cn(
          'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all',
          isActive
            ? 'bg-primary text-primary-foreground shadow-glow'
            : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
        )}
      >
        <Icon className="w-5 h-5" />
        <span>{item.label}</span>
      </Link>
    );
  };

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'admin': return 'bg-primary/20 text-primary';
      case 'waiter': return 'bg-info/20 text-info';
      case 'cashier': return 'bg-success/20 text-success';
      case 'kitchen': return 'bg-warning/20 text-warning';
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-60 xl:w-64 bg-sidebar border-r border-sidebar-border shrink-0">
        {/* Logo */}
        <div className="flex items-center gap-2 xl:gap-3 px-4 xl:px-6 py-4 xl:py-5 border-b border-sidebar-border">
          <div className="w-9 xl:w-10 h-9 xl:h-10 rounded-xl bg-gradient-primary flex items-center justify-center shrink-0">
            <Utensils className="w-4 xl:w-5 h-4 xl:h-5 text-primary-foreground" />
          </div>
          <div className="min-w-0">
            <h1 className="font-bold text-base xl:text-lg truncate">Kaveri Family Restaurant</h1>
            <p className="text-[10px] xl:text-xs text-muted-foreground truncate">Order Management</p>
          </div>
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
              <button className="w-full flex items-center gap-2 xl:gap-3 p-2 xl:p-3 rounded-xl hover:bg-secondary transition-colors">
                <div className="w-9 xl:w-10 h-9 xl:h-10 rounded-full bg-secondary flex items-center justify-center shrink-0">
                  <User className="w-4 xl:w-5 h-4 xl:h-5 text-muted-foreground" />
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className="text-xs xl:text-sm font-medium truncate">{user.name}</p>
                  <span className={cn('text-[10px] xl:text-xs px-1.5 xl:px-2 py-0.5 rounded-full capitalize', getRoleBadgeColor(user.role))}>
                    {user.role}
                  </span>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive">
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-background border-b border-border">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
              <Utensils className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold">Kaveri</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="absolute top-full left-0 right-0 bg-background border-b border-border p-4 space-y-1 animate-slide-in-up">
            {navItems.map(item => (
              <NavLink key={item.path} item={item} />
            ))}
            <button
              onClick={() => {
                logout();
                setMobileMenuOpen(false);
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
    </div>
  );
}
