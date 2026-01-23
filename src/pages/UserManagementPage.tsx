import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Users, 
  Plus, 
  Pencil, 
  Trash2, 
  Loader2,
  Shield,
  User,
  ChefHat,
  CreditCard
} from 'lucide-react';
import { toast } from 'sonner';

interface UserData {
  id: string;
  visibleId: string;
  name: string;
  email: string;
  phone: string;
  role: 'admin' | 'waiter' | 'cashier' | 'kitchen';
  isActive: boolean;
  createdAt: string;
}

const roleIcons = {
  admin: Shield,
  waiter: User,
  cashier: CreditCard,
  kitchen: ChefHat,
};

const roleColors = {
  admin: 'bg-red-500/10 text-red-500',
  waiter: 'bg-blue-500/10 text-blue-500',
  cashier: 'bg-green-500/10 text-green-500',
  kitchen: 'bg-orange-500/10 text-orange-500',
};

export default function UserManagementPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'waiter' as 'admin' | 'waiter' | 'cashier' | 'kitchen',
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenDialog = (user?: UserData) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        name: user.name,
        email: user.email,
        password: '',
        phone: user.phone,
        role: user.role,
      });
    } else {
      setEditingUser(null);
      setFormData({
        name: '',
        email: '',
        password: '',
        phone: '',
        role: 'waiter',
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingUser(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      phone: '',
      role: 'waiter',
    });
  };

  const handleSave = async () => {
    if (!formData.name || !formData.email || !formData.phone) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!editingUser && !formData.password) {
      toast.error('Password is required for new users');
      return;
    }

    setIsSaving(true);

    try {
      if (editingUser) {
        const updateData: any = {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          role: formData.role,
        };
        if (formData.password) {
          updateData.password = formData.password;
        }

        const response = await fetch(`/api/users/${editingUser.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updateData),
        });

        if (response.ok) {
          toast.success('User updated successfully');
          fetchUsers();
          handleCloseDialog();
        } else {
          const error = await response.json();
          toast.error(error.error || 'Failed to update user');
        }
      } else {
        const response = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });

        if (response.ok) {
          toast.success('User created successfully');
          fetchUsers();
          handleCloseDialog();
        } else {
          const error = await response.json();
          toast.error(error.error || 'Failed to create user');
        }
      }
    } catch (error) {
      console.error('Error saving user:', error);
      toast.error('Failed to save user');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async (user: UserData) => {
    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !user.isActive }),
      });

      if (response.ok) {
        toast.success(user.isActive ? 'User deactivated' : 'User activated');
        fetchUsers();
      }
    } catch (error) {
      console.error('Error toggling user status:', error);
      toast.error('Failed to update user status');
    }
  };

  const handleDelete = async (user: UserData) => {
    if (!confirm(`Are you sure you want to delete ${user.name}?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('User deleted successfully');
        fetchUsers();
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64" data-testid="page-users-loading">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6" data-testid="page-user-management">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">User Management</h1>
          <p className="text-sm text-muted-foreground">Manage staff accounts and roles</p>
        </div>
        <Button onClick={() => handleOpenDialog()} data-testid="button-add-user">
          <Plus className="w-4 h-4 mr-2" />
          Add User
        </Button>
      </div>

      <div className="grid gap-4">
        {users.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No users found</p>
              <Button onClick={() => handleOpenDialog()} className="mt-4">
                <Plus className="w-4 h-4 mr-2" />
                Add First User
              </Button>
            </CardContent>
          </Card>
        ) : (
          users.map((user) => {
            const RoleIcon = roleIcons[user.role];
            return (
              <Card key={user.id} className={!user.isActive ? 'opacity-60' : ''}>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${roleColors[user.role]}`}>
                        <RoleIcon className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{user.name}</h3>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                        <p className="text-sm text-muted-foreground">{user.phone}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={roleColors[user.role]}>
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </Badge>
                      <Switch
                        checked={user.isActive}
                        onCheckedChange={() => handleToggleActive(user)}
                        data-testid={`switch-active-${user.id}`}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenDialog(user)}
                        data-testid={`button-edit-${user.id}`}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(user)}
                        className="text-destructive hover:text-destructive"
                        data-testid={`button-delete-${user.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingUser ? 'Edit User' : 'Add New User'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter full name"
                data-testid="input-user-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Enter email address"
                data-testid="input-user-email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">
                Password {editingUser ? '(leave blank to keep current)' : '*'}
              </Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder={editingUser ? 'Enter new password' : 'Enter password'}
                data-testid="input-user-password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone *</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="Enter phone number"
                data-testid="input-user-phone"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role *</Label>
              <Select
                value={formData.role}
                onValueChange={(value) => setFormData({ ...formData, role: value as any })}
              >
                <SelectTrigger data-testid="select-user-role">
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving} data-testid="button-save-user">
              {isSaving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              {editingUser ? 'Update User' : 'Create User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
