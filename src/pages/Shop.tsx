import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useCart } from '@/contexts/CartContext';
import { toast } from '@/hooks/use-toast';

const Shop = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(searchParams.get('category'));
  const { addItem } = useCart();

  useEffect(() => {
    supabase.from('categories').select('*').order('name').then(({ data }) => {
      if (data) setCategories(data);
    });
  }, []);

  useEffect(() => {
    let query = supabase.from('products').select('*').eq('in_stock', true).order('name');
    if (selectedCategory) query = query.eq('category_id', selectedCategory);
    query.then(({ data }) => {
      if (data) setProducts(data);
    });
  }, [selectedCategory]);

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleAddToCart = (product: any) => {
    addItem({
      product_id: product.id,
      name: product.name,
      photo_url: product.photo_url,
      mrp: product.mrp,
      our_price: product.our_price,
      unit: product.unit,
      is_weight_based: product.is_weight_based,
    });
    toast({ title: 'Added to cart', description: `${product.name} added to your cart` });
  };

  return (
    <div className="min-h-screen max-w-7xl mx-auto px-4 py-8">
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-bold mb-6"
        style={{ fontFamily: "'Playfair Display', serif" }}
      >
        Shop Products
      </motion.h1>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search products..."
          className="pl-10"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Category filters */}
      <div className="flex flex-wrap gap-2 mb-8">
        <Badge
          variant={!selectedCategory ? 'default' : 'outline'}
          className="cursor-pointer"
          onClick={() => { setSelectedCategory(null); setSearchParams({}); }}
        >
          All
        </Badge>
        {categories.map(cat => (
          <Badge
            key={cat.id}
            variant={selectedCategory === cat.id ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => { setSelectedCategory(cat.id); setSearchParams({ category: cat.id }); }}
          >
            {cat.icon} {cat.name}
          </Badge>
        ))}
      </div>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <p className="text-lg">No products found</p>
          <p className="text-sm mt-1">Check back soon or try a different category</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredProducts.map((product, i) => {
            const saved = product.mrp - product.our_price;
            const discount = Math.round((saved / product.mrp) * 100);
            return (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <Card className="overflow-hidden group hover:shadow-lg transition-all h-full flex flex-col">
                  <div className="relative aspect-square bg-muted overflow-hidden">
                    {product.photo_url ? (
                      <img src={product.photo_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl">🛒</div>
                    )}
                    {discount > 0 && (
                      <span className="absolute top-2 left-2 bg-accent text-accent-foreground text-xs font-bold px-2 py-0.5 rounded-full">
                        {discount}% OFF
                      </span>
                    )}
                  </div>
                  <CardContent className="p-3 flex-1 flex flex-col">
                    <p className="font-medium text-sm truncate">{product.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-primary font-bold">₹{product.our_price}</span>
                      {saved > 0 && (
                        <span className="text-muted-foreground text-xs line-through">₹{product.mrp}</span>
                      )}
                    </div>
                    {product.is_weight_based && (
                      <p className="text-xs text-muted-foreground">per {product.unit}</p>
                    )}
                    <Button
                      size="sm"
                      className="mt-auto w-full gap-1 text-xs"
                      onClick={() => handleAddToCart(product)}
                    >
                      <Plus className="h-3 w-3" /> Add to Cart
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Shop;
