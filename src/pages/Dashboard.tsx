import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Users, Package, ShoppingCart, MessageSquare, Upload, UserPlus, Bell, X, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const { user, role, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('orders');
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const prevOrderCountRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // New product form
  const [newProduct, setNewProduct] = useState({ name: '', mrp: '', our_price: '', category_id: '', unit: 'piece', is_weight_based: false, photo_url: '' });
  const [newCategory, setNewCategory] = useState({ name: '', icon: '' });
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editProduct, setEditProduct] = useState({ name: '', mrp: '', our_price: '', category_id: '', unit: 'piece', is_weight_based: false, in_stock: true });

  useEffect(() => {
    if (!authLoading && (!user || (role !== 'admin' && role !== 'superadmin'))) {
      navigate('/login');
    }
  }, [user, role, authLoading, navigate]);

  useEffect(() => {
    if (role === 'admin' || role === 'superadmin') {
      fetchData();

      // Real-time subscription for new orders
      const channel = supabase
        .channel('orders-realtime')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, (payload) => {
          const newOrder = payload.new as any;
          const notif = {
            id: newOrder.id,
            message: `🛒 New order from ${newOrder.customer_name || 'Customer'}! ₹${newOrder.total_amount}`,
            time: new Date().toLocaleTimeString(),
            read: false,
          };
          setNotifications(prev => [notif, ...prev]);
          setOrders(prev => [newOrder, ...prev]);
          toast({ title: '🔔 New Order!', description: `${newOrder.customer_name || 'Customer'} placed an order for ₹${newOrder.total_amount}` });
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [role]);

  const fetchData = async () => {
    const [ordersRes, productsRes, categoriesRes, suggestionsRes] = await Promise.all([
      supabase.from('orders').select('*').order('created_at', { ascending: false }),
      supabase.from('products').select('*').order('name'),
      supabase.from('categories').select('*').order('name'),
      supabase.from('suggestions').select('*').order('created_at', { ascending: false }),
    ]);
    if (ordersRes.data) setOrders(ordersRes.data);
    if (productsRes.data) setProducts(productsRes.data);
    if (categoriesRes.data) setCategories(categoriesRes.data);
    if (suggestionsRes.data) setSuggestions(suggestionsRes.data);

    if (role === 'superadmin' || role === 'admin') {
      const { data: profilesData } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      if (profilesData) setUsers(profilesData);
    }
  };

  const handleAddProduct = async () => {
    let photoUrl = newProduct.photo_url;

    if (photoFile) {
      const ext = photoFile.name.split('.').pop();
      const path = `${crypto.randomUUID()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('product-images').upload(path, photoFile);
      if (uploadError) {
        toast({ title: 'Upload failed', description: uploadError.message, variant: 'destructive' });
        return;
      }
      const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(path);
      photoUrl = publicUrl;
    }

    const { error } = await supabase.from('products').insert({
      name: newProduct.name,
      mrp: parseFloat(newProduct.mrp),
      our_price: parseFloat(newProduct.our_price),
      category_id: newProduct.category_id || null,
      unit: newProduct.unit,
      is_weight_based: newProduct.is_weight_based,
      photo_url: photoUrl || null,
      created_by: user?.id,
    });

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Product added!' });
      setNewProduct({ name: '', mrp: '', our_price: '', category_id: '', unit: 'piece', is_weight_based: false, photo_url: '' });
      setPhotoFile(null);
      setProductDialogOpen(false);
      fetchData();
    }
  };

  const handleAddCategory = async () => {
    const { error } = await supabase.from('categories').insert({ name: newCategory.name, icon: newCategory.icon || null });
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Category added!' });
      setNewCategory({ name: '', icon: '' });
      setCategoryDialogOpen(false);
      fetchData();
    }
  };

  const handleDeleteProduct = async (id: string) => {
    await supabase.from('products').delete().eq('id', id);
    fetchData();
  };

  const openEditProduct = (p: any) => {
    setEditingProduct(p);
    setEditProduct({
      name: p.name,
      mrp: String(p.mrp),
      our_price: String(p.our_price),
      category_id: p.category_id || '',
      unit: p.unit,
      is_weight_based: p.is_weight_based,
      in_stock: p.in_stock,
    });
    setEditDialogOpen(true);
  };

  const handleEditProduct = async () => {
    if (!editingProduct) return;
    const { error } = await supabase.from('products').update({
      name: editProduct.name,
      mrp: parseFloat(editProduct.mrp),
      our_price: parseFloat(editProduct.our_price),
      category_id: editProduct.category_id || null,
      unit: editProduct.unit,
      is_weight_based: editProduct.is_weight_based,
      in_stock: editProduct.in_stock,
    }).eq('id', editingProduct.id);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Product updated!' });
      setEditDialogOpen(false);
      setEditingProduct(null);
      fetchData();
    }
  };

  const handleUpdateOrderStatus = async (id: string, status: string) => {
    await supabase.from('orders').update({ status }).eq('id', id);
    fetchData();
    toast({ title: `Order ${status}` });
  };

  const handleAddAdmin = async () => {
    if (!newAdminEmail) return;
    // Create a new user with admin role via signup — superadmin would set role after
    toast({ title: 'Admin invitation', description: `To add an admin, create their account first, then assign the admin role via Supabase dashboard or SQL.` });
    setNewAdminEmail('');
  };

  if (authLoading) return <div className="min-h-screen flex items-center justify-center"><p>Loading...</p></div>;

  const stats = [
    { label: 'Total Orders', value: orders.length, icon: ShoppingCart },
    { label: 'Products', value: products.length, icon: Package },
    { label: 'Users', value: users.length, icon: Users },
    { label: 'Suggestions', value: suggestions.length, icon: MessageSquare },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>Dashboard</h1>
          <p className="text-sm text-muted-foreground mb-6">
            Welcome back! You are logged in as <span className="text-primary font-semibold capitalize">{role}</span>
          </p>
        </div>
        {/* Notification Bell */}
        <div className="relative">
          <Button variant="ghost" size="icon" className="relative" onClick={() => setShowNotifications(!showNotifications)}>
            <Bell className="h-5 w-5" />
            {notifications.filter(n => !n.read).length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 h-5 w-5 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center font-bold animate-pulse">
                {notifications.filter(n => !n.read).length}
              </span>
            )}
          </Button>
          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                className="absolute right-0 top-12 w-80 bg-card border rounded-xl shadow-lg z-50 overflow-hidden"
              >
                <div className="p-3 border-b flex items-center justify-between">
                  <h3 className="font-semibold text-sm">Notifications</h3>
                  {notifications.length > 0 && (
                    <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => {
                      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
                    }}>
                      Mark all read
                    </Button>
                  )}
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-6">No notifications yet</p>
                  ) : (
                    notifications.map(n => (
                      <div key={n.id} className={`p-3 border-b last:border-0 text-sm ${!n.read ? 'bg-primary/5' : ''}`}>
                        <p className="text-sm">{n.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">{n.time}</p>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {stats.map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <s.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4 flex flex-wrap h-auto gap-1">
          <TabsTrigger value="orders" className="text-xs sm:text-sm">Orders</TabsTrigger>
          <TabsTrigger value="products" className="text-xs sm:text-sm">Products</TabsTrigger>
          <TabsTrigger value="categories" className="text-xs sm:text-sm">Categories</TabsTrigger>
          {(role === 'superadmin' || role === 'admin') && <TabsTrigger value="users" className="text-xs sm:text-sm">Users</TabsTrigger>}
          {role === 'superadmin' && <TabsTrigger value="admins" className="text-xs sm:text-sm">Admins</TabsTrigger>}
          <TabsTrigger value="suggestions" className="text-xs sm:text-sm">Suggestions</TabsTrigger>
        </TabsList>

        {/* ORDERS TAB */}
        <TabsContent value="orders">
          <Card>
            <CardHeader><CardTitle>Recent Orders</CardTitle></CardHeader>
            <CardContent>
              {orders.length === 0 ? (
                <p className="text-sm text-muted-foreground">No orders yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order ID</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Address</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orders.map(order => (
                        <TableRow key={order.id}>
                          <TableCell className="font-mono text-xs">{order.id.slice(0, 8)}</TableCell>
                          <TableCell>{order.customer_name}</TableCell>
                          <TableCell>{order.customer_phone}</TableCell>
                          <TableCell className="max-w-[200px] truncate">{order.delivery_address} {order.delivery_landmark ? `(${order.delivery_landmark})` : ''}</TableCell>
                          <TableCell className="font-bold">₹{order.total_amount}</TableCell>
                          <TableCell>
                            <span className={`text-xs px-2 py-1 rounded-full ${order.status === 'pending' ? 'bg-accent/20 text-accent' : order.status === 'delivered' ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
                              {order.status}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Select onValueChange={(v) => handleUpdateOrderStatus(order.id, v)}>
                              <SelectTrigger className="w-32 h-8 text-xs">
                                <SelectValue placeholder="Update" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="confirmed">Confirmed</SelectItem>
                                <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
                                <SelectItem value="delivered">Delivered</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* PRODUCTS TAB */}
        <TabsContent value="products">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Products</CardTitle>
              <Dialog open={productDialogOpen} onOpenChange={setProductDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-1"><Plus className="h-4 w-4" /> Add Product</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Add New Product</DialogTitle></DialogHeader>
                  <div className="space-y-3">
                    <Input placeholder="Product Name *" value={newProduct.name} onChange={e => setNewProduct(p => ({ ...p, name: e.target.value }))} />
                    <div className="grid grid-cols-2 gap-3">
                      <Input placeholder="MRP *" type="number" value={newProduct.mrp} onChange={e => setNewProduct(p => ({ ...p, mrp: e.target.value }))} />
                      <Input placeholder="Our Price *" type="number" value={newProduct.our_price} onChange={e => setNewProduct(p => ({ ...p, our_price: e.target.value }))} />
                    </div>
                    <Select value={newProduct.category_id} onValueChange={v => setNewProduct(p => ({ ...p, category_id: v }))}>
                      <SelectTrigger><SelectValue placeholder="Select Category" /></SelectTrigger>
                      <SelectContent>
                        {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <div className="flex items-center gap-3">
                      <span className="text-sm">Weight-based?</span>
                      <Switch checked={newProduct.is_weight_based} onCheckedChange={v => setNewProduct(p => ({ ...p, is_weight_based: v, unit: v ? 'kg' : 'piece' }))} />
                    </div>
                    {newProduct.is_weight_based && (
                      <Input placeholder="Unit (e.g., kg)" value={newProduct.unit} onChange={e => setNewProduct(p => ({ ...p, unit: e.target.value }))} />
                    )}
                    <div>
                      <label className="text-sm font-medium mb-1 block">Product Photo</label>
                      <Input type="file" accept="image/*" onChange={e => setPhotoFile(e.target.files?.[0] || null)} />
                    </div>
                    <Button onClick={handleAddProduct} className="w-full">Add Product</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Photo</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>MRP</TableHead>
                      <TableHead>Our Price</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map(p => (
                      <TableRow key={p.id}>
                        <TableCell>
                          {p.photo_url ? (
                            <img src={p.photo_url} alt={p.name} className="h-10 w-10 rounded object-cover" />
                          ) : (
                            <div className="h-10 w-10 rounded bg-muted flex items-center justify-center text-lg">🛒</div>
                          )}
                        </TableCell>
                        <TableCell className="font-medium">{p.name}</TableCell>
                        <TableCell>₹{p.mrp}</TableCell>
                        <TableCell className="text-primary font-bold">₹{p.our_price}</TableCell>
                        <TableCell>{p.unit}</TableCell>
                        <TableCell>{p.in_stock ? '✅' : '❌'}</TableCell>
                        <TableCell className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEditProduct(p)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeleteProduct(p.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Edit Product Dialog */}
          <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
            <DialogContent>
              <DialogHeader><DialogTitle>Edit Product</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <Input placeholder="Product Name *" value={editProduct.name} onChange={e => setEditProduct(p => ({ ...p, name: e.target.value }))} />
                <div className="grid grid-cols-2 gap-3">
                  <Input placeholder="MRP *" type="number" value={editProduct.mrp} onChange={e => setEditProduct(p => ({ ...p, mrp: e.target.value }))} />
                  <Input placeholder="Our Price *" type="number" value={editProduct.our_price} onChange={e => setEditProduct(p => ({ ...p, our_price: e.target.value }))} />
                </div>
                <Select value={editProduct.category_id} onValueChange={v => setEditProduct(p => ({ ...p, category_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select Category" /></SelectTrigger>
                  <SelectContent>
                    {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-3">
                  <span className="text-sm">Weight-based?</span>
                  <Switch checked={editProduct.is_weight_based} onCheckedChange={v => setEditProduct(p => ({ ...p, is_weight_based: v, unit: v ? 'kg' : 'piece' }))} />
                </div>
                {editProduct.is_weight_based && (
                  <Input placeholder="Unit (e.g., kg)" value={editProduct.unit} onChange={e => setEditProduct(p => ({ ...p, unit: e.target.value }))} />
                )}
                <div className="flex items-center gap-3">
                  <span className="text-sm">In Stock?</span>
                  <Switch checked={editProduct.in_stock} onCheckedChange={v => setEditProduct(p => ({ ...p, in_stock: v }))} />
                </div>
                <Button onClick={handleEditProduct} className="w-full">Save Changes</Button>
              </div>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* CATEGORIES TAB */}
        <TabsContent value="categories">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Categories</CardTitle>
              <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-1"><Plus className="h-4 w-4" /> Add Category</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Add Category</DialogTitle></DialogHeader>
                  <div className="space-y-3">
                    <Input placeholder="Category Name" value={newCategory.name} onChange={e => setNewCategory(p => ({ ...p, name: e.target.value }))} />
                    <Input placeholder="Icon (emoji)" value={newCategory.icon} onChange={e => setNewCategory(p => ({ ...p, icon: e.target.value }))} />
                    <Button onClick={handleAddCategory} className="w-full">Add Category</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {categories.map(c => (
                  <Card key={c.id}>
                    <CardContent className="p-4 text-center">
                      <span className="text-2xl">{c.icon || '📦'}</span>
                      <p className="text-sm font-medium mt-1">{c.name}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* USERS TAB */}
        {(role === 'superadmin' || role === 'admin') && (
          <TabsContent value="users">
            <Card>
              <CardHeader><CardTitle>Registered Users</CardTitle></CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Landmark</TableHead>
                        <TableHead>Joined</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map(u => (
                        <TableRow key={u.id}>
                          <TableCell className="font-medium">{u.full_name}</TableCell>
                          <TableCell>{u.email}</TableCell>
                          <TableCell>{u.phone}</TableCell>
                          <TableCell>{u.location}</TableCell>
                          <TableCell>{u.landmark}</TableCell>
                          <TableCell className="text-xs">{new Date(u.created_at).toLocaleDateString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* MANAGE ADMINS (superadmin only) */}
        {role === 'superadmin' && (
          <TabsContent value="admins">
            <Card>
              <CardHeader><CardTitle>Manage Admins</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  To add an admin, first have them register as a customer. Then assign the admin role using the Supabase SQL editor:
                </p>
                <pre className="bg-muted p-3 rounded-lg text-xs overflow-x-auto">
{`INSERT INTO user_roles (user_id, role)
SELECT id, 'admin'
FROM auth.users
WHERE email = 'admin@example.com';`}
                </pre>
                <div className="flex gap-2">
                  <Input placeholder="Admin email" value={newAdminEmail} onChange={e => setNewAdminEmail(e.target.value)} />
                  <Button onClick={handleAddAdmin} className="gap-1 shrink-0"><UserPlus className="h-4 w-4" /> Add</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* SUGGESTIONS TAB */}
        <TabsContent value="suggestions">
          <Card>
            <CardHeader><CardTitle>Customer Suggestions</CardTitle></CardHeader>
            <CardContent>
              {suggestions.length === 0 ? (
                <p className="text-sm text-muted-foreground">No suggestions yet.</p>
              ) : (
                <div className="space-y-3">
                  {suggestions.map(s => (
                    <div key={s.id} className="p-3 border rounded-lg">
                      <p className="text-sm">{s.message}</p>
                      <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
                        {s.name && <span>From: {s.name}</span>}
                        {s.email && <span>{s.email}</span>}
                        <span>{new Date(s.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;
