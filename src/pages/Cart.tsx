import { motion } from 'framer-motion';
import { Trash2, Plus, Minus, ShoppingBag } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useState } from 'react';

const weightOptions = [0.5, 1, 1.5, 2, 2.5, 3, 4, 5];

const Cart = () => {
  const { items, removeItem, updateQuantity, clearCart, totalAmount, totalSaved } = useCart();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [placing, setPlacing] = useState(false);

  const handlePlaceOrder = async () => {
    if (!user) {
      toast({ title: 'Please sign up first', description: 'You need an account to place orders.', variant: 'destructive' });
      navigate('/register');
      return;
    }
    if (items.length === 0) return;

    setPlacing(true);
    const { data: order, error: orderError } = await supabase.from('orders').insert({
      user_id: user.id,
      total_amount: totalAmount,
      saved_amount: totalSaved,
      status: 'pending',
      delivery_address: profile?.location || '',
      delivery_landmark: profile?.landmark || '',
      customer_phone: profile?.phone || '',
      customer_name: profile?.full_name || '',
    }).select().single();

    if (orderError || !order) {
      toast({ title: 'Order failed', description: 'Something went wrong. Please try again.', variant: 'destructive' });
      setPlacing(false);
      return;
    }

    const orderItems = items.map(item => ({
      order_id: order.id,
      product_id: item.product_id,
      product_name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      price: item.our_price,
      mrp: item.mrp,
    }));

    const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
    setPlacing(false);

    if (itemsError) {
      toast({ title: 'Order items error', description: 'Order created but items failed.', variant: 'destructive' });
      return;
    }

    clearCart();
    toast({ 
      title: '🎉 Order Placed Successfully!', 
      description: `Thank you${profile?.full_name ? `, ${profile.full_name}` : ''}! Your order of ₹${totalAmount.toFixed(2)} has been received. We will contact you at ${profile?.phone || 'your number'} shortly for delivery. Payment on delivery only.`,
    });
    navigate('/');
  };

  if (items.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
          <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
          <h2 className="text-2xl font-bold mb-2">Your cart is empty</h2>
          <p className="text-muted-foreground mb-6">Add some products to get started</p>
          <Link to="/shop">
            <Button>Start Shopping</Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-3xl font-bold mb-6" style={{ fontFamily: "'Playfair Display', serif" }}>
        Your Cart
      </motion.h1>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-3">
          {items.map((item, i) => (
            <motion.div key={item.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
              <Card>
                <CardContent className="p-4 flex gap-4">
                  <div className="h-20 w-20 rounded-lg bg-muted overflow-hidden shrink-0">
                    {item.photo_url ? (
                      <img src={item.photo_url} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl">🛒</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{item.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-primary font-bold text-sm">₹{item.our_price}</span>
                      {item.mrp > item.our_price && (
                        <span className="text-xs text-muted-foreground line-through">₹{item.mrp}</span>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      {item.is_weight_based ? (
                        <Select
                          value={String(item.quantity)}
                          onValueChange={(v) => updateQuantity(item.id, parseFloat(v))}
                        >
                          <SelectTrigger className="w-28 h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {weightOptions.map(w => (
                              <SelectItem key={w} value={String(w)}>{w} {item.unit}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.id, item.quantity - 1)}>
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                          <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeItem(item.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Order Summary */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="sticky top-20">
            <CardHeader>
              <CardTitle className="text-lg">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {items.map(item => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="truncate flex-1 mr-2">{item.name} × {item.quantity}</span>
                  <span className="font-medium">₹{(item.our_price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              <div className="border-t pt-3 space-y-2">
                <div className="flex justify-between font-semibold">
                  <span>Grand Total</span>
                  <span className="text-primary">₹{totalAmount.toFixed(2)}</span>
                </div>
                {totalSaved > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">You saved</span>
                    <span className="text-primary font-semibold">₹{totalSaved.toFixed(2)}</span>
                  </div>
                )}
              </div>
              <Button className="w-full mt-4" size="lg" onClick={handlePlaceOrder} disabled={placing}>
                {placing ? 'Placing Order...' : 'Place Order'}
              </Button>
              <p className="text-xs text-center text-muted-foreground">Payment on delivery only</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default Cart;
