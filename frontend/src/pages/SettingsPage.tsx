import { useEffect, useState } from 'react';
import { API_BASE_URL } from '@/config';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CustomSwitch } from '@/components/ui/custom-switch';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Store,
  Bell,
  Printer,
  CreditCard,
  Save,
  MapPin,
  Phone,
  Mail,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  useRestaurantSettings,
  RestaurantSettings,
} from '@/contexts/RestaurantSettingsContext';

export default function SettingsPage() {
  const { toast } = useToast();
  const {
    settings: globalSettings,
    isLoading,
    setSettings: setGlobalSettings,
  } = useRestaurantSettings();
  const [isSaving, setIsSaving] = useState(false);
  const [showSavedDialog, setShowSavedDialog] = useState(false);

  const [settings, setSettings] = useState<RestaurantSettings>(globalSettings);

  useEffect(() => {
    setSettings(globalSettings);
  }, [globalSettings]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantName: settings.restaurantName,
          address: settings.address,
          phone: settings.phone,
          email: settings.email,
          enableNotifications: settings.enableNotifications,
          enableSounds: settings.enableSounds,
          autoPrintBills: settings.autoPrintBills,
          enableUPI: settings.enableUPI,
          enableCash: settings.enableCash,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSettings(data);
        setGlobalSettings(data);
        setShowSavedDialog(true);
        setTimeout(() => setShowSavedDialog(false), 1000);
        toast({
          title: 'Settings Saved',
          description: 'Your settings have been updated successfully.',
        });
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to save settings',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (
    key: keyof RestaurantSettings,
    value: string | boolean,
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  if (isLoading) {
    return (
      <div
        className="flex items-center justify-center h-64"
        data-testid="page-settings-loading"
      >
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6" data-testid="page-settings">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Settings</h1>
          <p className="text-sm text-muted-foreground">
            Manage your restaurant configuration
          </p>
        </div>
        <Button
          onClick={handleSave}
          disabled={isSaving}
          data-testid="button-save-settings"
        >
          {isSaving ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Save Changes
        </Button>
      </div>

      <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Store className="w-5 h-5 text-primary" />
              <CardTitle className="text-base sm:text-lg">
                Restaurant Details
              </CardTitle>
            </div>
            <CardDescription>
              Basic information about your restaurant
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="restaurantName">Restaurant Name</Label>
              <Input
                id="restaurantName"
                value={settings.restaurantName}
                onChange={(e) => handleChange('restaurantName', e.target.value)}
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
                onChange={(e) => handleChange('address', e.target.value)}
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
                  onChange={(e) => handleChange('phone', e.target.value)}
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
                  onChange={(e) => handleChange('email', e.target.value)}
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
              <CardTitle className="text-base sm:text-lg">
                Notifications
              </CardTitle>
            </div>
            <CardDescription>
              Configure alerts and sound settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Enable Notifications</Label>
                <p className="text-xs text-muted-foreground">
                  Show alerts for new orders
                </p>
              </div>
              <div className="scale-75 origin-right">
                <CustomSwitch
                  checked={settings.enableNotifications}
                  onCheckedChange={(checked) =>
                    handleChange('enableNotifications', checked)
                  }
                  data-testid="switch-notifications"
                />
              </div>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label>Sound Alerts</Label>
                <p className="text-xs text-muted-foreground">
                  Play sound for order updates
                </p>
              </div>
              <div className="scale-75 origin-right">
                <CustomSwitch
                  checked={settings.enableSounds}
                  onCheckedChange={(checked) =>
                    handleChange('enableSounds', checked)
                  }
                  data-testid="switch-sounds"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary" />
              <CardTitle className="text-base sm:text-lg">
                Payment Methods
              </CardTitle>
            </div>
            <CardDescription>Enable or disable payment options</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Cash Payments</Label>
                <p className="text-xs text-muted-foreground">
                  Accept cash payments
                </p>
              </div>
              <div className="scale-75 origin-right">
                <CustomSwitch
                  checked={settings.enableCash}
                  onCheckedChange={(checked) =>
                    handleChange('enableCash', checked)
                  }
                  data-testid="switch-cash"
                />
              </div>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label>UPI Payments</Label>
                <p className="text-xs text-muted-foreground">
                  Accept UPI payments
                </p>
              </div>
              <div className="scale-75 origin-right">
                <CustomSwitch
                  checked={settings.enableUPI}
                  onCheckedChange={(checked) =>
                    handleChange('enableUPI', checked)
                  }
                  data-testid="switch-upi"
                />
              </div>
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
                <p className="text-xs text-muted-foreground">
                  Automatically print when order is completed
                </p>
              </div>
              <div className="scale-75 origin-right">
                <CustomSwitch
                  checked={settings.autoPrintBills}
                  onCheckedChange={(checked) =>
                    handleChange('autoPrintBills', checked)
                  }
                  data-testid="switch-auto-print"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={showSavedDialog} onOpenChange={setShowSavedDialog}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-2">
              <CheckCircle2 className="w-7 h-7 text-green-600" />
            </div>
            <DialogTitle>Changes Saved</DialogTitle>
            <DialogDescription>
              Restaurant details and settings have been saved successfully.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setShowSavedDialog(false)}>OK</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
