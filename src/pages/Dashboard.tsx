import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Users, Package, ShoppingCart, MessageSquare, Upload, UserPlus, Bell, X, Pencil, ChevronDown, ChevronUp, Tag } from 'lucide-react';
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
  const [orderItems, setOrderItems] = useState<Record<string, any[]>>({});
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
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
  const [editPhotoFile, setEditPhotoFile] = useState<File | null>(null);

  // Offer batch
  const [offerBatchOn, setOfferBatchOn] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || (role !== 'admin' && role !== 'superadmin'))) {
      navigate('/login');
    }
  }, [user, role, authLoading, navigate]);

  useEffect(() => {
    if (role === 'admin' || role === 'superadmin') {
      fetchData();

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
    if (productsRes.data) {
      setProducts(productsRes.data);
      // Check if any product is on offer to set batch toggle
      const anyOffer = productsRes.data.some((p: any) => p.is_on_offer);
      setOfferBatchOn(anyOffer);
    }
    if (categoriesRes.data) setCategories(categoriesRes.data);
    if (suggestionsRes.data) setSuggestions(suggestionsRes.data);

    if (role === 'superadmin' || role === 'admin') {
      const { data: profilesData } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      if (profilesData) setUsers(profilesData);
    }
  };

  const toggleOrderExpand = async (orderId: string) => {
    if (expandedOrder === orderId) {
      setExpandedOrder(null);
      return;
    }
    setExpandedOrder(orderId);
    if (!orderItems[orderId]) {
      const { data } = await supabase.from('order_items').select('*').eq('order_id', orderId);
      if (data) {
        setOrderItems(prev => ({ ...prev, [orderId]: data }));
      }
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
    setEditPhotoFile(null);
    setEditDialogOpen(true);
  };

  const handleEditProduct = async () => {
    if (!editingProduct) return;

    let photoUrl = editingProduct.photo_url;

    if (editPhotoFile) {
      const ext = editPhotoFile.name.split('.').pop();
      const path = `${crypto.randomUUID()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('product-images').upload(path, editPhotoFile);
      if (uploadError) {
        toast({ title: 'Upload failed', description: uploadError.message, variant: 'destructive' });
        return;
      }
      const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(path);
      photoUrl = publicUrl;
    }

    const { error } = await supabase.from('products').update({
      name: editProduct.name,
      mrp: parseFloat(editProduct.mrp),
      our_price: parseFloat(editProduct.our_price),
      category_id: editProduct.category_id || null,
      unit: editProduct.unit,
      is_weight_based: editProduct.is_weight_based,
      in_stock: editProduct.in_stock,
      photo_url: photoUrl,
    }).eq('id', editingProduct.id);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Product updated!' });
      setEditDialogOpen(false);
      setEditingProduct(null);
      setEditPhotoFile(null);
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
    toast({ title: 'Admin invitation', description: `To add an admin, create their account first, then assign the admin role via Supabase dashboard or SQL.` });
    setNewAdminEmail('');
  };

  // Offer batch functions
  const handleToggleOfferBatch = async (on: boolean) => {
    setOfferBatchOn(on);
    if (!on) {
      // Turn off all offers
      await supabase.from('products').update({ is_on_offer: false, offer_price: null }).neq('id', '00000000-0000-0000-0000-000000000000');
      toast({ title: 'Offers closed', description: 'All product offers have been turned off.' });
      fetchData();
    }
  };

  const handleToggleProductOffer = async (productId: string, isOn: boolean) => {
    const product = products.find(p => p.id === productId);
    if (isOn && !product?.offer_price) {
      // Set offer price to current our_price by default
      await supabase.from('products').update({ is_on_offer: true, offer_price: product?.our_price }).eq('id', productId);
    } else {
      await supabase.from('products').update({ is_on_offer: isOn, offer_price: isOn ? product?.offer_price : null }).eq('id', productId);
    }
    fetchData();
  };

  const handleUpdateOfferPrice = async (productId: string, price: string) => {
    const numPrice = parseFloat(price);
    if (isNaN(numPrice)) return;
    await supabase.from('products').update({ offer_price: numPrice }).eq('id', productId);
    fetchData();
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
                      <div key={n.id} className={`p-3 border-b last:border-0 text-sm cursor-pointer ${!n.read ? 'bg-primary/5' : ''}`}
                        onClick={() => {
                          setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x));
                          setActiveTab('orders');
                          setExpandedOrder(n.id);
                          setShowNotifications(false);
                          toggleOrderExpand(n.id);
                        }}>
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
          <TabsTrigger value="offers" className="text-xs sm:text-sm">Offers</TabsTrigger>
          <TabsTrigger value="categories" className="text-xs sm:text-sm">Categories</TabsTrigger>
          {(role === 'superadmin' || role === 'admin') && <TabsTrigger value="users" className="text-xs sm:text-sm">Users</TabsTrigger>}
          {role === 'superadmin' && <TabsTrigger value="admins" className="text-xs sm:text-sm">Admins</TabsTrigger>}
          <TabsTrigger value="suggestions" className="text-xs sm:text-sm">Suggestions</TabsTrigger>
        </TabsList>

        {/* ORDERS TAB */}
        <TabsContent value="orders">
          <Card>
            <CardHeader><CardTitle>All Orders</CardTitle></CardHeader>
            <CardContent>
              {orders.length === 0 ? (
                <p className="text-sm text-muted-foreground">No orders yet.</p>
              ) : (
                <div className="space-y-2">
                  {orders.map(order => (
                    <div key={order.id} className="border rounded-lg overflow-hidden">
                      <div 
                        className="p-4 flex flex-wrap items-center gap-3 cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => toggleOrderExpand(order.id)}
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {expandedOrder === order.id ? <ChevronUp className="h-4 w-4 shrink-0" /> : <ChevronDown className="h-4 w-4 shrink-0" />}
                          <span className="font-mono text-xs text-muted-foreground">#{order.id.slice(0, 8)}</span>
                          <span className="font-medium text-sm truncate">{order.customer_name || '—'}</span>
                        </div>
                        <span className="text-sm font-bold">₹{order.total_amount}</span>
                        <span className={`text-xs px-2 py-1 rounded-full ${order.status === 'pending' ? 'bg-accent/20 text-accent-foreground' : order.status === 'delivered' ? 'bg-primary/20 text-primary' : order.status === 'out_for_delivery' ? 'bg-yellow-100 text-yellow-800' : order.status === 'cancelled' ? 'bg-destructive/20 text-destructive' : 'bg-muted text-muted-foreground'}`}>
                          {order.status}
                        </span>
                        <span className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleDateString()}</span>
                      </div>
                      
                      <AnimatePresence>
                        {expandedOrder === order.id && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="px-4 pb-4 border-t bg-muted/30">
                              {/* Customer Details */}
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 py-3 text-sm">
                                <div>
                                  <p className="text-xs text-muted-foreground">Customer</p>
                                  <p className="font-medium">{order.customer_name || '—'}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground">Phone</p>
                                  <p className="font-medium">{order.customer_phone || '—'}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground">Address</p>
                                  <p className="font-medium">{order.delivery_address || '—'}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground">Place/Landmark</p>
                                  <p className="font-medium">{order.delivery_landmark || '—'}</p>
                                </div>
                              </div>

                              {/* Order Items */}
                              <div className="mb-3">
                                <p className="text-xs font-semibold text-muted-foreground mb-2">ORDER ITEMS</p>
                                {orderItems[order.id] ? (
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead className="text-xs">Product</TableHead>
                                        <TableHead className="text-xs">Qty</TableHead>
                                        <TableHead className="text-xs">Price</TableHead>
                                        <TableHead className="text-xs">MRP</TableHead>
                                        <TableHead className="text-xs">Subtotal</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {orderItems[order.id].map((item: any) => (
                                        <TableRow key={item.id}>
                                          <TableCell className="text-sm">{item.product_name}</TableCell>
                                          <TableCell className="text-sm">{item.quantity} {item.unit}</TableCell>
                                          <TableCell className="text-sm">₹{item.price}</TableCell>
                                          <TableCell className="text-sm text-muted-foreground">₹{item.mrp}</TableCell>
                                          <TableCell className="text-sm font-medium">₹{(item.price * item.quantity).toFixed(2)}</TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                ) : (
                                  <p className="text-sm text-muted-foreground">Loading items...</p>
                                )}
                              </div>

                              {/* Status Update */}
                              <div className="flex items-center gap-3">
                                <span className="text-sm font-medium">Update Status:</span>
                                <Select onValueChange={(v) => handleUpdateOrderStatus(order.id, v)}>
                                  <SelectTrigger className="w-40 h-8 text-xs">
                                    <SelectValue placeholder={order.status} />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="confirmed">Confirmed</SelectItem>
                                    <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
                                    <SelectItem value="delivered">Delivered</SelectItem>
                                    <SelectItem value="cancelled">Cancelled</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
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
                <div>
                  <label className="text-sm font-medium mb-1 block">Change Product Photo</label>
                  {editingProduct?.photo_url && !editPhotoFile && (
                    <img src={editingProduct.photo_url} alt="Current" className="h-20 w-20 rounded object-cover mb-2" />
                  )}
                  {editPhotoFile && (
                    <img src={URL.createObjectURL(editPhotoFile)} alt="New" className="h-20 w-20 rounded object-cover mb-2" />
                  )}
                  <Input type="file" accept="image/*" onChange={e => setEditPhotoFile(e.target.files?.[0] || null)} />
                </div>
                </div>
                <Button onClick={handleEditProduct} className="w-full">Save Changes</Button>
              </div>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* OFFERS TAB */}
        <TabsContent value="offers">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Tag className="h-5 w-5" /> Offer Batch
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {offerBatchOn ? '🟢 Offers are LIVE — customers see offer prices' : '🔴 Offers are OFF'}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium">{offerBatchOn ? 'ON' : 'OFF'}</span>
                <Switch checked={offerBatchOn} onCheckedChange={handleToggleOfferBatch} />
              </div>
            </CardHeader>
            <CardContent>
              {offerBatchOn ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>MRP</TableHead>
                        <TableHead>Our Price</TableHead>
                        <TableHead>Offer Price</TableHead>
                        <TableHead>On Offer</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {products.map(p => (
                        <TableRow key={p.id} className={p.is_on_offer ? 'bg-primary/5' : ''}>
                          <TableCell className="font-medium">{p.name}</TableCell>
                          <TableCell className="text-muted-foreground">₹{p.mrp}</TableCell>
                          <TableCell>₹{p.our_price}</TableCell>
                          <TableCell>
                            {p.is_on_offer ? (
                              <Input
                                type="number"
                                className="w-24 h-8 text-sm"
                                defaultValue={p.offer_price || p.our_price}
                                onBlur={(e) => handleUpdateOfferPrice(p.id, e.target.value)}
                              />
                            ) : (
                              <span className="text-muted-foreground text-sm">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Switch
                              checked={p.is_on_offer || false}
                              onCheckedChange={(v) => handleToggleProductOffer(p.id, v)}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Tag className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
                  <p className="text-muted-foreground">Turn on the Offer Batch switch to start adding products to the offer.</p>
                  <p className="text-xs text-muted-foreground mt-2">When ON, you can select products, set offer prices, and customers will see the discounted prices.</p>
                </div>
              )}
            </CardContent>
          </Card>
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
                        <TableHead>Place</TableHead>
                        <TableHead>Landmark</TableHead>
                        <TableHead>Joined</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map(u => (
                        <TableRow key={u.id}>
                          <TableCell className="font-medium">{u.full_name}</TableCell>
                          <TableCell>{u.email}</TableCell>
                          <TableCell>{u.phone || '—'}</TableCell>
                          <TableCell>{u.location || '—'}</TableCell>
                          <TableCell>{u.place || '—'}</TableCell>
                          <TableCell>{u.landmark || '—'}</TableCell>
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
