import { useState } from 'react';
import { API_BASE_URL } from '@/config';
import { useOrders } from '@/contexts/OrderContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CustomSwitch } from '@/components/ui/custom-switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { MenuItem } from '@/types';
import { Plus, Pencil, Search, Trash2 } from 'lucide-react';

export default function MenuManagementPage() {
  const { menuItems, categories, refreshData } = useOrders();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [optimisticAvailability, setOptimisticAvailability] = useState<Record<string, boolean>>({});

  const [itemToDelete, setItemToDelete] = useState<MenuItem | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);

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

  const [categoryFormData, setCategoryFormData] = useState({
    name: '',
    description: '',
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

  const openAddCategoryDialog = () => {
    setIsAddingCategory(true);
    setCategoryFormData({
      name: '',
      description: '',
      imageUrl: '',
    });
  };

  const closeCategoryDialog = () => {
    setIsAddingCategory(false);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    
    setDeletingId(itemToDelete.id);
    try {
      const response = await fetch(`${API_BASE_URL}/api/menu-items/${itemToDelete.id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete');
      toast({ title: 'Success', description: 'Menu item deleted' });
      refreshData();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete menu item', variant: 'destructive' });
    } finally {
      setDeletingId(null);
      setItemToDelete(null);
    }
  };

  const confirmDeleteCategory = async () => {
    if (!categoryToDelete) return;

    setIsSaving(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/categories/${categoryToDelete}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete category');
      
      toast({ title: 'Success', description: 'Category and associated items deleted successfully' });
      setCategoryFilter('all');
      refreshData();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete category', variant: 'destructive' });
    } finally {
      setIsSaving(false);
      setCategoryToDelete(null);
    }
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

  const handleSaveCategory = async () => {
    if (!categoryFormData.name) {
      toast({ title: 'Error', description: 'Category name is required', variant: 'destructive' });
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(categoryFormData),
      });

      if (!response.ok) throw new Error('Failed to create category');

      toast({ title: 'Success', description: 'Category added successfully' });
      closeCategoryDialog();
      refreshData();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to add category', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const toggleAvailability = async (item: MenuItem) => {
    const isCurrentlyAvailable = optimisticAvailability[item.id] ?? item.isAvailable;
    const nextAvailability = !isCurrentlyAvailable;

    setOptimisticAvailability(prev => ({ ...prev, [item.id]: nextAvailability }));

    try {
      await fetch(`${API_BASE_URL}/api/menu-items/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAvailable: nextAvailability }),
      });
      refreshData();
      toast({ title: nextAvailability ? 'Item marked available' : 'Item marked unavailable' });
    } catch (error) {
      setOptimisticAvailability(prev => ({ ...prev, [item.id]: isCurrentlyAvailable }));
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
        <div className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={openAddCategoryDialog} data-testid="button-add-category">
            <Plus className="w-4 h-4 mr-2" />
            Add Category
          </Button>
          <Button onClick={openAddDialog} data-testid="button-add-item">
            <Plus className="w-4 h-4 mr-2" />
            Add Item
          </Button>
        </div>
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
        
        <div className="flex gap-2 w-full sm:w-auto">
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
          
          {categoryFilter !== 'all' && (
            <Button 
              variant="destructive" 
              size="icon" 
              onClick={() => setCategoryToDelete(categoryFilter)} 
              title="Delete Category"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-3">
        {filteredItems.map(item => {
          const isAvailable = optimisticAvailability[item.id] ?? item.isAvailable;
          return (
          <Card key={item.id} className={`overflow-hidden transition-all duration-200 border border-border group ${!isAvailable ? 'opacity-70 bg-muted/30 grayscale-[0.3]' : 'hover:border-primary/50 hover:shadow-md'}`}>
            <CardContent className="p-0">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4">
                
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  {item.imageUrl && (
                    <div className="shrink-0 w-16 h-16 rounded-md overflow-hidden bg-muted">
                      <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-semibold text-base truncate group-hover:text-primary transition-colors">{item.name}</h3>
                      <Badge variant={item.isVeg ? 'default' : 'secondary'} className={`text-[10px] px-1.5 h-5 ${item.isVeg ? 'bg-green-600/10 text-green-600 hover:bg-green-600/20' : 'bg-red-600/10 text-red-600 hover:bg-red-600/20'} border-transparent`}>
                        {item.isVeg ? 'Veg' : 'Non-Veg'}
                      </Badge>
                      {!isAvailable && (
                        <Badge variant="destructive" className="text-[10px] px-1.5 h-5 uppercase tracking-wide">Disabled</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate mb-2">{item.category}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="font-bold text-lg text-primary">₹{item.price}</span>
                      {item.preparationTime && (
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground flex items-center">
                          ⏱ {item.preparationTime} min
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0 mt-4 sm:mt-0 pt-4 sm:pt-0 border-t sm:border-t-0 border-border">
                  
                  {/* Premium Switch Section requested by user */}
                  <div className="flex items-center gap-3">
                    <CustomSwitch 
                      checked={isAvailable} 
                      onCheckedChange={() => toggleAvailability(item)}
                      data-testid={`switch-availability-${item.id}`}
                    />
                  </div>
                  
                  {/* Actions Section */}
                  <div className="flex gap-1.5">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => openEditDialog(item)} 
                      data-testid={`button-edit-${item.id}`}
                      className="h-9 w-9 bg-muted/50 hover:bg-primary hover:text-primary-foreground border-transparent transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => setItemToDelete(item)} 
                      disabled={deletingId === item.id}
                      className="h-9 w-9 bg-muted/50 hover:bg-destructive hover:text-destructive-foreground border-transparent transition-colors"
                      data-testid={`button-delete-${item.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  
                </div>

              </div>
            </CardContent>
          </Card>
        )})}
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
            <div className="flex items-center gap-6 pt-2">
              <div className="flex items-center gap-3">
                <div className="scale-75 origin-left">
                  <CustomSwitch
                    checked={formData.isVeg}
                    onCheckedChange={checked => setFormData(prev => ({ ...prev, isVeg: checked }))}
                    data-testid="switch-edit-veg"
                  />
                </div>
                <Label className="text-sm font-semibold cursor-pointer">Vegetarian</Label>
              </div>
              <div className="flex items-center gap-3">
                <div className="scale-75 origin-left">
                  <CustomSwitch
                    checked={formData.isAvailable}
                    onCheckedChange={checked => setFormData(prev => ({ ...prev, isAvailable: checked }))}
                    data-testid="switch-edit-available"
                  />
                </div>
                <Label className="text-sm font-semibold cursor-pointer">Available</Label>
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

      <Dialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong className="text-foreground">{itemToDelete?.name}</strong>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setItemToDelete(null)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={!!deletingId}>
              {deletingId ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isAddingCategory} onOpenChange={() => closeCategoryDialog()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Category</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Category Name *</Label>
              <Input
                value={categoryFormData.name}
                onChange={e => setCategoryFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Beverages"
                data-testid="input-edit-category-name"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                value={categoryFormData.description}
                onChange={e => setCategoryFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of the category"
              />
            </div>
            <div className="space-y-2">
              <Label>Image URL</Label>
              <Input
                value={categoryFormData.imageUrl}
                onChange={e => setCategoryFormData(prev => ({ ...prev, imageUrl: e.target.value }))}
                placeholder="https://..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeCategoryDialog}>Cancel</Button>
            <Button onClick={handleSaveCategory} disabled={isSaving} data-testid="button-save-category">
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={!!categoryToDelete} onOpenChange={(open) => !open && setCategoryToDelete(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Category Deletion</DialogTitle>
            <DialogDescription>
              Are you absolutely sure you want to delete this category? <strong>All menu items inside this category will be permanently deleted along with it.</strong> This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setCategoryToDelete(null)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDeleteCategory} disabled={isSaving}>
              {isSaving ? 'Deleting...' : 'Delete Completely'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
