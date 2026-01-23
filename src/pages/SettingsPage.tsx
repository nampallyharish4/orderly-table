import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Settings, 
  Store, 
  Bell, 
  Printer, 
  CreditCard,
  Save,
  MapPin,
  Phone,
  Mail,
  UtensilsCrossed,
  Plus
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useOrders } from '@/contexts/OrderContext';

export default function SettingsPage() {
  const { toast } = useToast();
  const { categories, refreshData } = useOrders();
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItem, setNewItem] = useState({
    name: '',
    description: '',
    price: '',
    categoryId: '',
    isVeg: false,
    preparationTime: '15',
  });

  const handleAddMenuItem = async () => {
    if (!newItem.name || !newItem.price || !newItem.categoryId) {
      toast({ title: 'Error', description: 'Please fill in all required fields', variant: 'destructive' });
      return;
    }

    setIsAddingItem(true);
    try {
      const response = await fetch('/api/menu-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newItem,
          price: parseFloat(newItem.price),
          preparationTime: parseInt(newItem.preparationTime),
        }),
      });

      if (!response.ok) throw new Error('Failed to add item');

      toast({ title: 'Success', description: 'Menu item added successfully' });
      setNewItem({ name: '', description: '', price: '', categoryId: '', isVeg: false, preparationTime: '15' });
      refreshData();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to add menu item', variant: 'destructive' });
    } finally {
      setIsAddingItem(false);
    }
  };

  const [settings, setSettings] = useState({
    restaurantName: 'Kaveri Family Restaurant',
    address: '123 Main Street, City',
    phone: '+91 9876543210',
    email: 'contact@kaveri.com',
    enableNotifications: true,
    enableSounds: true,
    autoPrintBills: false,
    enableUPI: true,
    enableCard: true,
    enableCash: true,
  });

  const handleSave = () => {
    toast({
      title: 'Settings Saved',
      description: 'Your settings have been updated successfully.',
    });
  };

  const handleChange = (key: string, value: string | boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-4 sm:space-y-6" data-testid="page-settings">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Settings</h1>
          <p className="text-sm text-muted-foreground">Manage your restaurant configuration</p>
        </div>
        <Button onClick={handleSave} data-testid="button-save-settings">
          <Save className="w-4 h-4 mr-2" />
          Save Changes
        </Button>
      </div>

      <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Store className="w-5 h-5 text-primary" />
              <CardTitle className="text-base sm:text-lg">Restaurant Details</CardTitle>
            </div>
            <CardDescription>Basic information about your restaurant</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="restaurantName">Restaurant Name</Label>
              <Input
                id="restaurantName"
                value={settings.restaurantName}
                onChange={e => handleChange('restaurantName', e.target.value)}
                data-testid="input-restaurant-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">
                <MapPin className="w-4 h-4 inline mr-1" />
                Address
              </Label>
              <Input
                id="address"
                value={settings.address}
                onChange={e => handleChange('address', e.target.value)}
                data-testid="input-address"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">
                  <Phone className="w-4 h-4 inline mr-1" />
                  Phone
                </Label>
                <Input
                  id="phone"
                  value={settings.phone}
                  onChange={e => handleChange('phone', e.target.value)}
                  data-testid="input-phone"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">
                  <Mail className="w-4 h-4 inline mr-1" />
                  Email
                </Label>
                <Input
                  id="email"
                  value={settings.email}
                  onChange={e => handleChange('email', e.target.value)}
                  data-testid="input-email"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary" />
              <CardTitle className="text-base sm:text-lg">Notifications</CardTitle>
            </div>
            <CardDescription>Configure alerts and sound settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Enable Notifications</Label>
                <p className="text-xs text-muted-foreground">Show alerts for new orders</p>
              </div>
              <Switch
                checked={settings.enableNotifications}
                onCheckedChange={checked => handleChange('enableNotifications', checked)}
                data-testid="switch-notifications"
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label>Sound Alerts</Label>
                <p className="text-xs text-muted-foreground">Play sound for order updates</p>
              </div>
              <Switch
                checked={settings.enableSounds}
                onCheckedChange={checked => handleChange('enableSounds', checked)}
                data-testid="switch-sounds"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary" />
              <CardTitle className="text-base sm:text-lg">Payment Methods</CardTitle>
            </div>
            <CardDescription>Enable or disable payment options</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Cash Payments</Label>
                <p className="text-xs text-muted-foreground">Accept cash payments</p>
              </div>
              <Switch
                checked={settings.enableCash}
                onCheckedChange={checked => handleChange('enableCash', checked)}
                data-testid="switch-cash"
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label>Card Payments</Label>
                <p className="text-xs text-muted-foreground">Accept debit/credit cards</p>
              </div>
              <Switch
                checked={settings.enableCard}
                onCheckedChange={checked => handleChange('enableCard', checked)}
                data-testid="switch-card"
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label>UPI Payments</Label>
                <p className="text-xs text-muted-foreground">Accept UPI payments</p>
              </div>
              <Switch
                checked={settings.enableUPI}
                onCheckedChange={checked => handleChange('enableUPI', checked)}
                data-testid="switch-upi"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Printer className="w-5 h-5 text-primary" />
              <CardTitle className="text-base sm:text-lg">Printing</CardTitle>
            </div>
            <CardDescription>Configure print settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Auto-Print Bills</Label>
                <p className="text-xs text-muted-foreground">Automatically print when order is completed</p>
              </div>
              <Switch
                checked={settings.autoPrintBills}
                onCheckedChange={checked => handleChange('autoPrintBills', checked)}
                data-testid="switch-auto-print"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <UtensilsCrossed className="w-5 h-5 text-primary" />
              <CardTitle className="text-base sm:text-lg">Add Menu Item</CardTitle>
            </div>
            <CardDescription>Add new items to your menu</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="itemName">Item Name *</Label>
                <Input
                  id="itemName"
                  placeholder="e.g., Butter Chicken"
                  value={newItem.name}
                  onChange={e => setNewItem(prev => ({ ...prev, name: e.target.value }))}
                  data-testid="input-item-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="itemPrice">Price (₹) *</Label>
                <Input
                  id="itemPrice"
                  type="number"
                  placeholder="e.g., 250"
                  value={newItem.price}
                  onChange={e => setNewItem(prev => ({ ...prev, price: e.target.value }))}
                  data-testid="input-item-price"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="itemCategory">Category *</Label>
                <Select
                  value={newItem.categoryId}
                  onValueChange={value => setNewItem(prev => ({ ...prev, categoryId: value }))}
                >
                  <SelectTrigger data-testid="select-item-category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="itemPrepTime">Prep Time (mins)</Label>
                <Input
                  id="itemPrepTime"
                  type="number"
                  placeholder="15"
                  value={newItem.preparationTime}
                  onChange={e => setNewItem(prev => ({ ...prev, preparationTime: e.target.value }))}
                  data-testid="input-prep-time"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="itemDescription">Description</Label>
                <Input
                  id="itemDescription"
                  placeholder="Brief description of the item"
                  value={newItem.description}
                  onChange={e => setNewItem(prev => ({ ...prev, description: e.target.value }))}
                  data-testid="input-item-description"
                />
              </div>
            </div>
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2">
                <Switch
                  checked={newItem.isVeg}
                  onCheckedChange={checked => setNewItem(prev => ({ ...prev, isVeg: checked }))}
                  data-testid="switch-is-veg"
                />
                <Label>Vegetarian</Label>
              </div>
              <Button onClick={handleAddMenuItem} disabled={isAddingItem} data-testid="button-add-menu-item">
                <Plus className="w-4 h-4 mr-2" />
                {isAddingItem ? 'Adding...' : 'Add Item'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
