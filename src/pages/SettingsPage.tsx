import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { 
  Store, 
  Bell, 
  Printer, 
  CreditCard,
  Save,
  MapPin,
  Phone,
  Mail,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function SettingsPage() {
  const { toast } = useToast();

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
      </div>
    </div>
  );
}
