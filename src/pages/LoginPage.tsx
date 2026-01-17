import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Utensils, Eye, EyeOff, AlertCircle, User, Lock } from 'lucide-react';
import { UserRole } from '@/types';

const DEMO_ACCOUNTS = [
  { role: 'admin' as UserRole, email: 'admin@restaurant.com', password: 'admin123', label: 'Admin' },
  { role: 'waiter' as UserRole, email: 'john@restaurant.com', password: 'waiter123', label: 'Waiter' },
  { role: 'cashier' as UserRole, email: 'sarah@restaurant.com', password: 'cashier123', label: 'Cashier' },
  { role: 'kitchen' as UserRole, email: 'mike@restaurant.com', password: 'kitchen123', label: 'Kitchen' },
];

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, isLoading } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please enter email and password');
      return;
    }

    const success = await login(email, password);
    if (success) {
      navigate('/');
    } else {
      setError('Invalid email or password');
    }
  };

  const handleDemoLogin = async (account: typeof DEMO_ACCOUNTS[0]) => {
    setEmail(account.email);
    setPassword(account.password);
    setError('');

    const success = await login(account.email, account.password);
    if (success) {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-surface p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-primary mb-4">
            <Utensils className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">RestaurantPOS</h1>
          <p className="text-muted-foreground mt-2">Sign in to manage your restaurant</p>
        </div>

        {/* Login Card */}
        <Card className="border-border/50">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl">Welcome back</CardTitle>
            <CardDescription>Enter your credentials to access the system</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="pl-10"
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="pl-10 pr-10"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-primary hover:opacity-90 text-primary-foreground font-semibold"
                disabled={isLoading}
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Demo Accounts */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Quick Demo Access
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2">
            {DEMO_ACCOUNTS.map(account => (
              <Button
                key={account.role}
                variant="outline"
                size="sm"
                onClick={() => handleDemoLogin(account)}
                disabled={isLoading}
                className="justify-start"
              >
                <span className={`w-2 h-2 rounded-full mr-2 ${
                  account.role === 'admin' ? 'bg-primary' :
                  account.role === 'waiter' ? 'bg-info' :
                  account.role === 'cashier' ? 'bg-success' :
                  'bg-warning'
                }`} />
                {account.label}
              </Button>
            ))}
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          Production-ready Restaurant POS System
        </p>
      </div>
    </div>
  );
}
