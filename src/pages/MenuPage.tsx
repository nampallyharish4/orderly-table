import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Plus, Pencil, Trash2, Shield, Loader2, UtensilsCrossed, FolderOpen, Leaf, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface Category {
  id: string;
  name: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category_id: string | null;
  is_veg: boolean;
  is_available: boolean;
  preparation_time: number | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

export default function MenuPage() {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Category form
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryForm, setCategoryForm] = useState({ name: '', description: '', sort_order: 0, is_active: true });
  const [isSavingCategory, setIsSavingCategory] = useState(false);

  // Menu item form
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [itemForm, setItemForm] = useState({
    name: '',
    description: '',
    price: '',
    category_id: '',
    is_veg: true,
    is_available: true,
    preparation_time: '15',
    image_url: '',
  });
  const [isSavingItem, setIsSavingItem] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [categoriesRes, itemsRes] = await Promise.all([
        supabase.from('categories').select('*').order('sort_order'),
        supabase.from('menu_items').select('*').order('name'),
      ]);

      if (categoriesRes.error) throw categoriesRes.error;
      if (itemsRes.error) throw itemsRes.error;

      setCategories(categoriesRes.data || []);
      setMenuItems(itemsRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load menu data');
    } finally {
      setIsLoading(false);
    }
  };

  // Category handlers
  const openCategoryDialog = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setCategoryForm({
        name: category.name,
        description: category.description || '',
        sort_order: category.sort_order,
        is_active: category.is_active,
      });
    } else {
      setEditingCategory(null);
      setCategoryForm({ name: '', description: '', sort_order: categories.length, is_active: true });
    }
    setCategoryDialogOpen(true);
  };

  const handleSaveCategory = async () => {
    if (!categoryForm.name.trim()) {
      toast.error('Category name is required');
      return;
    }

    setIsSavingCategory(true);
    try {
      if (editingCategory) {
        const { error } = await supabase
          .from('categories')
          .update({
            name: categoryForm.name.trim(),
            description: categoryForm.description.trim() || null,
            sort_order: categoryForm.sort_order,
            is_active: categoryForm.is_active,
          })
          .eq('id', editingCategory.id);

        if (error) throw error;
        toast.success('Category updated');
      } else {
        const { error } = await supabase.from('categories').insert({
          name: categoryForm.name.trim(),
          description: categoryForm.description.trim() || null,
          sort_order: categoryForm.sort_order,
          is_active: categoryForm.is_active,
        });

        if (error) throw error;
        toast.success('Category created');
      }

      setCategoryDialogOpen(false);
      fetchData();
    } catch (error: any) {
      console.error('Error saving category:', error);
      toast.error(error.message || 'Failed to save category');
    } finally {
      setIsSavingCategory(false);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    try {
      const { error } = await supabase.from('categories').delete().eq('id', categoryId);
      if (error) throw error;
      toast.success('Category deleted');
      fetchData();
    } catch (error: any) {
      console.error('Error deleting category:', error);
      toast.error(error.message || 'Failed to delete category');
    }
  };

  // Menu item handlers
  const openItemDialog = (item?: MenuItem) => {
    if (item) {
      setEditingItem(item);
      setItemForm({
        name: item.name,
        description: item.description || '',
        price: item.price.toString(),
        category_id: item.category_id || '',
        is_veg: item.is_veg,
        is_available: item.is_available,
        preparation_time: item.preparation_time?.toString() || '15',
        image_url: item.image_url || '',
      });
    } else {
      setEditingItem(null);
      setItemForm({
        name: '',
        description: '',
        price: '',
        category_id: selectedCategory || '',
        is_veg: true,
        is_available: true,
        preparation_time: '15',
        image_url: '',
      });
    }
    setItemDialogOpen(true);
  };

  const handleSaveItem = async () => {
    if (!itemForm.name.trim()) {
      toast.error('Item name is required');
      return;
    }
    if (!itemForm.price || parseFloat(itemForm.price) <= 0) {
      toast.error('Valid price is required');
      return;
    }

    setIsSavingItem(true);
    try {
      const itemData = {
        name: itemForm.name.trim(),
        description: itemForm.description.trim() || null,
        price: parseFloat(itemForm.price),
        category_id: itemForm.category_id || null,
        is_veg: itemForm.is_veg,
        is_available: itemForm.is_available,
        preparation_time: parseInt(itemForm.preparation_time) || 15,
        image_url: itemForm.image_url.trim() || null,
      };

      if (editingItem) {
        const { error } = await supabase
          .from('menu_items')
          .update(itemData)
          .eq('id', editingItem.id);

        if (error) throw error;
        toast.success('Item updated');
      } else {
        const { error } = await supabase.from('menu_items').insert(itemData);

        if (error) throw error;
        toast.success('Item created');
      }

      setItemDialogOpen(false);
      fetchData();
    } catch (error: any) {
      console.error('Error saving item:', error);
      toast.error(error.message || 'Failed to save item');
    } finally {
      setIsSavingItem(false);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      const { error } = await supabase.from('menu_items').delete().eq('id', itemId);
      if (error) throw error;
      toast.success('Item deleted');
      fetchData();
    } catch (error: any) {
      console.error('Error deleting item:', error);
      toast.error(error.message || 'Failed to delete item');
    }
  };

  const toggleItemAvailability = async (item: MenuItem) => {
    try {
      const { error } = await supabase
        .from('menu_items')
        .update({ is_available: !item.is_available })
        .eq('id', item.id);

      if (error) throw error;
      setMenuItems(prev =>
        prev.map(i => (i.id === item.id ? { ...i, is_available: !i.is_available } : i))
      );
      toast.success(item.is_available ? 'Item marked unavailable' : 'Item marked available');
    } catch (error: any) {
      console.error('Error toggling availability:', error);
      toast.error('Failed to update item');
    }
  };

  const filteredItems = selectedCategory
    ? menuItems.filter(item => item.category_id === selectedCategory)
    : menuItems;

  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId) return 'Uncategorized';
    return categories.find(c => c.id === categoryId)?.name || 'Unknown';
  };

  if (user?.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Shield className="w-16 h-16 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold">Access Denied</h2>
        <p className="text-muted-foreground">Only administrators can access this page.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Menu Management</h1>
          <p className="text-muted-foreground">Manage your menu items and categories</p>
        </div>
      </div>

      <Tabs defaultValue="items" className="w-full">
        <TabsList>
          <TabsTrigger value="items" className="gap-2">
            <UtensilsCrossed className="w-4 h-4" />
            Menu Items ({menuItems.length})
          </TabsTrigger>
          <TabsTrigger value="categories" className="gap-2">
            <FolderOpen className="w-4 h-4" />
            Categories ({categories.length})
          </TabsTrigger>
        </TabsList>

        {/* Menu Items Tab */}
        <TabsContent value="items" className="space-y-4">
          <div className="flex flex-wrap items-center gap-4">
            <Select
              value={selectedCategory || 'all'}
              onValueChange={v => setSelectedCategory(v === 'all' ? null : v)}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Dialog open={itemDialogOpen} onOpenChange={setItemDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-primary hover:opacity-90" onClick={() => openItemDialog()}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Item
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>{editingItem ? 'Edit Item' : 'Add New Item'}</DialogTitle>
                  <DialogDescription>
                    {editingItem ? 'Update the menu item details' : 'Add a new item to your menu'}
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                  <div className="space-y-2">
                    <Label>Name *</Label>
                    <Input
                      value={itemForm.name}
                      onChange={e => setItemForm({ ...itemForm, name: e.target.value })}
                      placeholder="e.g., Butter Chicken"
                      disabled={isSavingItem}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      value={itemForm.description}
                      onChange={e => setItemForm({ ...itemForm, description: e.target.value })}
                      placeholder="Brief description of the dish"
                      disabled={isSavingItem}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Price (₹) *</Label>
                      <Input
                        type="number"
                        value={itemForm.price}
                        onChange={e => setItemForm({ ...itemForm, price: e.target.value })}
                        placeholder="299"
                        min="0"
                        step="0.01"
                        disabled={isSavingItem}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Prep Time (mins)</Label>
                      <Input
                        type="number"
                        value={itemForm.preparation_time}
                        onChange={e => setItemForm({ ...itemForm, preparation_time: e.target.value })}
                        placeholder="15"
                        min="1"
                        disabled={isSavingItem}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select
                      value={itemForm.category_id}
                      onValueChange={v => setItemForm({ ...itemForm, category_id: v })}
                      disabled={isSavingItem}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(cat => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Image URL</Label>
                    <Input
                      value={itemForm.image_url}
                      onChange={e => setItemForm({ ...itemForm, image_url: e.target.value })}
                      placeholder="https://..."
                      disabled={isSavingItem}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={itemForm.is_veg}
                        onCheckedChange={v => setItemForm({ ...itemForm, is_veg: v })}
                        disabled={isSavingItem}
                      />
                      <Label>Vegetarian</Label>
                    </div>

                    <div className="flex items-center gap-2">
                      <Switch
                        checked={itemForm.is_available}
                        onCheckedChange={v => setItemForm({ ...itemForm, is_available: v })}
                        disabled={isSavingItem}
                      />
                      <Label>Available</Label>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setItemDialogOpen(false)} disabled={isSavingItem}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveItem} disabled={isSavingItem} className="bg-gradient-primary hover:opacity-90">
                    {isSavingItem ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    {editingItem ? 'Update' : 'Create'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Items Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredItems.map(item => (
              <Card key={item.id} className={!item.is_available ? 'opacity-60' : ''}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base truncate">{item.name}</CardTitle>
                        {item.is_veg && (
                          <Badge variant="outline" className="text-green-600 border-green-600 shrink-0">
                            <Leaf className="w-3 h-3 mr-1" />
                            Veg
                          </Badge>
                        )}
                      </div>
                      <CardDescription className="text-xs">{getCategoryName(item.category_id)}</CardDescription>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openItemDialog(item)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Item?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete "{item.name}". This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteItem(item.id)} className="bg-destructive text-destructive-foreground">
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {item.description && (
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{item.description}</p>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold">₹{item.price}</span>
                      {item.preparation_time && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {item.preparation_time}m
                        </span>
                      )}
                    </div>
                    <Switch
                      checked={item.is_available}
                      onCheckedChange={() => toggleItemAvailability(item)}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredItems.length === 0 && (
            <div className="flex flex-col items-center justify-center h-64">
              <UtensilsCrossed className="w-16 h-16 text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold">No Items Found</h2>
              <p className="text-muted-foreground">Add your first menu item to get started.</p>
            </div>
          )}
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-primary hover:opacity-90" onClick={() => openCategoryDialog()}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Category
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingCategory ? 'Edit Category' : 'Add New Category'}</DialogTitle>
                  <DialogDescription>
                    {editingCategory ? 'Update the category details' : 'Create a new menu category'}
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Name *</Label>
                    <Input
                      value={categoryForm.name}
                      onChange={e => setCategoryForm({ ...categoryForm, name: e.target.value })}
                      placeholder="e.g., Main Course"
                      disabled={isSavingCategory}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      value={categoryForm.description}
                      onChange={e => setCategoryForm({ ...categoryForm, description: e.target.value })}
                      placeholder="Brief description"
                      disabled={isSavingCategory}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Sort Order</Label>
                    <Input
                      type="number"
                      value={categoryForm.sort_order}
                      onChange={e => setCategoryForm({ ...categoryForm, sort_order: parseInt(e.target.value) || 0 })}
                      min="0"
                      disabled={isSavingCategory}
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <Switch
                      checked={categoryForm.is_active}
                      onCheckedChange={v => setCategoryForm({ ...categoryForm, is_active: v })}
                      disabled={isSavingCategory}
                    />
                    <Label>Active</Label>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setCategoryDialogOpen(false)} disabled={isSavingCategory}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveCategory} disabled={isSavingCategory} className="bg-gradient-primary hover:opacity-90">
                    {isSavingCategory ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    {editingCategory ? 'Update' : 'Create'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Categories Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {categories.map(category => {
              const itemCount = menuItems.filter(i => i.category_id === category.id).length;
              return (
                <Card key={category.id} className={!category.is_active ? 'opacity-60' : ''}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-base">{category.name}</CardTitle>
                          {!category.is_active && <Badge variant="secondary">Inactive</Badge>}
                        </div>
                        <CardDescription className="text-xs">{itemCount} items</CardDescription>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openCategoryDialog(category)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Category?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete "{category.name}". Items in this category will become uncategorized.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteCategory(category.id)} className="bg-destructive text-destructive-foreground">
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardHeader>
                  {category.description && (
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{category.description}</p>
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>

          {categories.length === 0 && (
            <div className="flex flex-col items-center justify-center h-64">
              <FolderOpen className="w-16 h-16 text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold">No Categories Found</h2>
              <p className="text-muted-foreground">Create your first category to organize menu items.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
