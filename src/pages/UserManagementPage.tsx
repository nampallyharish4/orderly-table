import { useState, useEffect } from 'react';
import { useAuth, UserRole, User } from '@/contexts/AuthContext';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { UserPlus, Users, Mail, Lock, User as UserIcon, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function UserManagementPage() {
  const { user, createUser, getAllUsers } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Form state
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('waiter');

  const loadUsers = async () => {
    const allUsers = await getAllUsers();
    setUsers(allUsers);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newEmail || !newPassword || !newName) {
      toast.error('Please fill in all fields');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    const result = await createUser(newEmail, newPassword, newName, newRole);
    setIsLoading(false);

    if (result.success) {
      toast.success('User created successfully!');
      setNewEmail('');
      setNewPassword('');
      setNewName('');
      setNewRole('waiter');
      setIsDialogOpen(false);
      loadUsers();
    } else {
      toast.error(result.error || 'Failed to create user');
    }
  };

  const getRoleBadgeVariant = (role: UserRole) => {
    switch (role) {
      case 'admin': return 'default';
      case 'waiter': return 'secondary';
      case 'cashier': return 'outline';
      case 'kitchen': return 'destructive';
      default: return 'secondary';
    }
  };

  if (user?.role !== 'admin') {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6 text-center">
              <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
              <p className="text-muted-foreground">
                Only administrators can manage users.
              </p>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">User Management</h1>
            <p className="text-muted-foreground">Create and manage staff accounts</p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-primary hover:opacity-90">
                <UserPlus className="w-4 h-4 mr-2" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New User</DialogTitle>
                <DialogDescription>
                  Add a new staff member to the system
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-name">Full Name</Label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="new-name"
                      type="text"
                      placeholder="John Doe"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="pl-10"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="new-email"
                      type="email"
                      placeholder="john@restaurant.com"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      className="pl-10"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new-password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="new-password"
                      type="password"
                      placeholder="Min. 6 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="pl-10"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new-role">Role</Label>
                  <Select 
                    value={newRole} 
                    onValueChange={(value) => setNewRole(value as UserRole)}
                    disabled={isLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="waiter">Waiter</SelectItem>
                      <SelectItem value="cashier">Cashier</SelectItem>
                      <SelectItem value="kitchen">Kitchen Staff</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-gradient-primary hover:opacity-90"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create User'
                  )}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Users Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {users.map((u) => (
            <Card key={u.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <UserIcon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{u.name}</CardTitle>
                      <CardDescription className="text-xs">{u.email}</CardDescription>
                    </div>
                  </div>
                  <Badge variant={getRoleBadgeVariant(u.role)}>
                    {u.role}
                  </Badge>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>

        {users.length === 0 && (
          <Card>
            <CardContent className="pt-6 text-center">
              <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">No users found</h3>
              <p className="text-muted-foreground text-sm">
                Create your first user to get started
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}
