import { useState } from 'react';
import { useOrders } from '@/contexts/OrderContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { MenuItem } from '@/types';
import { Plus, Pencil, Search } from 'lucide-react';

export default function MenuManagementPage() {
  const { menuItems, categories, refreshData } = useOrders();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    categoryId: '',
    isVeg: false,
    isAvailable: true,
    preparationTime: '15',
    imageUrl: '',
  });

  const filteredItems = menuItems.filter(item => {
    if (categoryFilter !== 'all' && item.categoryId !== categoryFilter) return false;
    if (searchQuery) {
      return item.name.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  });

  const openEditDialog = (item: MenuItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description || '',
      price: item.price.toString(),
      categoryId: item.categoryId,
      isVeg: item.isVeg,
      isAvailable: item.isAvailable,
      preparationTime: item.preparationTime?.toString() || '15',
      imageUrl: item.imageUrl || '',
    });
  };

  const openAddDialog = () => {
    setIsAddingNew(true);
    setFormData({
      name: '',
      description: '',
      price: '',
      categoryId: categories[0]?.id || '',
      isVeg: false,
      isAvailable: true,
      preparationTime: '15',
      imageUrl: '',
    });
  };

  const closeDialog = () => {
    setEditingItem(null);
    setIsAddingNew(false);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.price || !formData.categoryId) {
      toast({ title: 'Error', description: 'Please fill in all required fields', variant: 'destructive' });
      return;
    }

    setIsSaving(true);
    try {
      const url = editingItem ? `/api/menu-items/${editingItem.id}` : '/api/menu-items';
      const method = editingItem ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price),
          preparationTime: parseInt(formData.preparationTime) || 15,
        }),
      });

      if (!response.ok) throw new Error('Failed to save item');

      toast({ title: 'Success', description: editingItem ? 'Menu item updated' : 'Menu item added' });
      closeDialog();
      refreshData();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save menu item', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const toggleAvailability = async (item: MenuItem) => {
    try {
      await fetch(`/api/menu-items/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAvailable: !item.isAvailable }),
      });
      refreshData();
      toast({ title: item.isAvailable ? 'Item marked unavailable' : 'Item marked available' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update availability', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6" data-testid="page-menu-management">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Menu Management</h1>
          <p className="text-muted-foreground">Manage your menu items</p>
        </div>
        <Button onClick={openAddDialog} data-testid="button-add-item">
          <Plus className="w-4 h-4 mr-2" />
          Add Item
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search items..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-9"
            data-testid="input-search-menu"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-[200px]" data-testid="select-category-filter">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map(cat => (
              <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-3">
        {filteredItems.map(item => (
          <Card key={item.id} className={!item.isAvailable ? 'opacity-60' : ''}>
            <CardContent className="py-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-medium truncate">{item.name}</h3>
                    <Badge variant={item.isVeg ? 'default' : 'secondary'} className="text-xs">
                      {item.isVeg ? 'Veg' : 'Non-Veg'}
                    </Badge>
                    {!item.isAvailable && (
                      <Badge variant="destructive" className="text-xs">Unavailable</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{item.category}</p>
                  <div className="flex items-center gap-4 mt-1 text-sm">
                    <span className="font-semibold text-primary">₹{item.price}</span>
                    {item.preparationTime && (
                      <span className="text-muted-foreground">{item.preparationTime} mins</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={item.isAvailable}
                    onCheckedChange={() => toggleAvailability(item)}
                    data-testid={`switch-availability-${item.id}`}
                  />
                  <Button variant="outline" size="icon" onClick={() => openEditDialog(item)} data-testid={`button-edit-${item.id}`}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredItems.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No menu items found
          </CardContent>
        </Card>
      )}

      <Dialog open={!!editingItem || isAddingNew} onOpenChange={() => closeDialog()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit Menu Item' : 'Add Menu Item'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Item Name *</Label>
              <Input
                value={formData.name}
                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Butter Chicken"
                data-testid="input-edit-name"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Price (₹) *</Label>
                <Input
                  type="number"
                  value={formData.price}
                  onChange={e => setFormData(prev => ({ ...prev, price: e.target.value }))}
                  placeholder="250"
                  data-testid="input-edit-price"
                />
              </div>
              <div className="space-y-2">
                <Label>Prep Time (mins)</Label>
                <Input
                  type="number"
                  value={formData.preparationTime}
                  onChange={e => setFormData(prev => ({ ...prev, preparationTime: e.target.value }))}
                  placeholder="15"
                  data-testid="input-edit-prep-time"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Category *</Label>
              <Select
                value={formData.categoryId}
                onValueChange={value => setFormData(prev => ({ ...prev, categoryId: value }))}
              >
                <SelectTrigger data-testid="select-edit-category">
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
              <Label>Description</Label>
              <Input
                value={formData.description}
                onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description"
                data-testid="input-edit-description"
              />
            </div>
            <div className="space-y-2">
              <Label>Image URL</Label>
              <Input
                value={formData.imageUrl}
                onChange={e => setFormData(prev => ({ ...prev, imageUrl: e.target.value }))}
                placeholder="https://..."
                data-testid="input-edit-image-url"
              />
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.isVeg}
                  onCheckedChange={checked => setFormData(prev => ({ ...prev, isVeg: checked }))}
                  data-testid="switch-edit-veg"
                />
                <Label>Vegetarian</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.isAvailable}
                  onCheckedChange={checked => setFormData(prev => ({ ...prev, isAvailable: checked }))}
                  data-testid="switch-edit-available"
                />
                <Label>Available</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button onClick={handleSave} disabled={isSaving} data-testid="button-save-item">
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
