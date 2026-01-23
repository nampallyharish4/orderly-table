import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Users, 
  UserPlus, 
  Search,
  Mail,
  Phone,
  Shield,
  MoreVertical,
  Edit,
  Trash2
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { mockUsers } from '@/data/mockData';
import { useToast } from '@/hooks/use-toast';

export default function UsersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();

  const filteredUsers = mockUsers.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-primary/10 text-primary';
      case 'waiter':
        return 'bg-blue-500/10 text-blue-500';
      case 'cashier':
        return 'bg-green-500/10 text-green-500';
      case 'kitchen':
        return 'bg-orange-500/10 text-orange-500';
      default:
        return 'bg-secondary text-secondary-foreground';
    }
  };

  const handleAddUser = () => {
    toast({
      title: 'Coming Soon',
      description: 'User management feature will be available soon.',
    });
  };

  return (
    <div className="space-y-4 sm:space-y-6" data-testid="page-users">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Users</h1>
          <p className="text-sm text-muted-foreground">Manage staff accounts and permissions</p>
        </div>
        <Button onClick={handleAddUser} data-testid="button-add-user">
          <UserPlus className="w-4 h-4 mr-2" />
          Add User
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="input-search-users"
          />
        </div>
      </div>

      <div className="grid gap-4">
        {filteredUsers.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No users found</p>
            </CardContent>
          </Card>
        ) : (
          filteredUsers.map(user => (
            <Card key={user.id} data-testid={`user-card-${user.id}`}>
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-lg font-bold text-primary">
                        {user.name.charAt(0)}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold">{user.name}</h3>
                        <Badge className={getRoleBadgeColor(user.role)}>
                          {user.role}
                        </Badge>
                        {user.isActive ? (
                          <Badge variant="outline" className="text-green-500 border-green-500">
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-red-500 border-red-500">
                            Inactive
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 mt-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Mail className="w-4 h-4" />
                          <span className="truncate">{user.email}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Phone className="w-4 h-4" />
                          <span>{user.phone}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" data-testid={`button-user-menu-${user.id}`}>
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={handleAddUser}>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleAddUser}>
                        <Shield className="w-4 h-4 mr-2" />
                        Change Role
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={handleAddUser}>
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Role Permissions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-5 h-5 text-primary" />
                <span className="font-semibold">Admin</span>
              </div>
              <p className="text-xs text-muted-foreground">Full access to all features including reports, settings, and user management.</p>
            </div>
            <div className="p-4 rounded-lg bg-blue-500/5 border border-blue-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-5 h-5 text-blue-500" />
                <span className="font-semibold">Waiter</span>
              </div>
              <p className="text-xs text-muted-foreground">Can manage tables, create orders, and view order status.</p>
            </div>
            <div className="p-4 rounded-lg bg-green-500/5 border border-green-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-5 h-5 text-green-500" />
                <span className="font-semibold">Cashier</span>
              </div>
              <p className="text-xs text-muted-foreground">Can process payments, generate bills, and view completed orders.</p>
            </div>
            <div className="p-4 rounded-lg bg-orange-500/5 border border-orange-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-5 h-5 text-orange-500" />
                <span className="font-semibold">Kitchen</span>
              </div>
              <p className="text-xs text-muted-foreground">Can view and update order preparation status in kitchen display.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
