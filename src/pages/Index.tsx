import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingBag, ChevronRight, Star, Truck, Shield, Percent } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';

const heroSlides = [
  { title: 'Fresh Groceries\nDelivered to Your Door', subtitle: 'Save up to 30% on daily essentials', bg: 'from-primary/20 to-accent/10' },
  { title: 'Quality Products\nAt Best Prices', subtitle: 'MRP vs Our Price — you always save!', bg: 'from-accent/20 to-primary/10' },
  { title: 'Your Local\nHyper Market Online', subtitle: 'Vaduthala Hyper Shopee — trusted by families', bg: 'from-primary/10 to-secondary' },
];

const features = [
  { icon: Truck, title: 'Home Delivery', desc: 'Delivered right to your doorstep' },
  { icon: Shield, title: 'Quality Assured', desc: 'Only the freshest products' },
  { icon: Percent, title: 'Best Prices', desc: 'Save more with our prices' },
  { icon: Star, title: 'Trusted Service', desc: 'Serving families with care' },
];

const Index = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [categories, setCategories] = useState<any[]>([]);
  const [bestSelling, setBestSelling] = useState<any[]>([]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % heroSlides.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    supabase.from('categories').select('*').then(({ data }) => {
      if (data) setCategories(data);
    });
    supabase.from('products').select('*').limit(8).then(({ data }) => {
      if (data) setBestSelling(data);
    });
  }, []);

  return (
    <div className="min-h-screen">
      {/* Hero Slider */}
      <section className="relative overflow-hidden h-[70vh] min-h-[500px]">
        {heroSlides.map((slide, i) => (
          <motion.div
            key={i}
            initial={false}
            animate={{ opacity: currentSlide === i ? 1 : 0, scale: currentSlide === i ? 1 : 1.05 }}
            transition={{ duration: 0.8 }}
            className={`absolute inset-0 flex items-center justify-center bg-gradient-to-br ${slide.bg}`}
            style={{ pointerEvents: currentSlide === i ? 'auto' : 'none' }}
          >
            <div className="text-center px-4 max-w-2xl">
              <motion.h1
                initial={{ y: 30, opacity: 0 }}
                animate={currentSlide === i ? { y: 0, opacity: 1 } : {}}
                transition={{ delay: 0.2, duration: 0.6 }}
                className="text-4xl md:text-6xl font-extrabold text-foreground whitespace-pre-line leading-tight"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                {slide.title}
              </motion.h1>
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={currentSlide === i ? { y: 0, opacity: 1 } : {}}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="mt-4 text-lg text-muted-foreground"
              >
                {slide.subtitle}
              </motion.p>
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={currentSlide === i ? { y: 0, opacity: 1 } : {}}
                transition={{ delay: 0.6 }}
              >
                <Link to="/shop">
                  <Button size="lg" className="mt-8 text-base font-semibold gap-2 shadow-lg">
                    <ShoppingBag className="h-5 w-5" /> Start Shopping <ChevronRight className="h-4 w-4" />
                  </Button>
                </Link>
              </motion.div>
            </div>
          </motion.div>
        ))}

        {/* Slide indicators */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
          {heroSlides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentSlide(i)}
              className={`h-2 rounded-full transition-all ${currentSlide === i ? 'w-8 bg-primary' : 'w-2 bg-muted-foreground/30'}`}
            />
          ))}
        </div>
      </section>

      {/* Features Strip */}
      <section className="border-y bg-card">
        <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-2 md:grid-cols-4 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="flex items-center gap-3"
            >
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <f.icon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-sm">{f.title}</p>
                <p className="text-xs text-muted-foreground">{f.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 py-12">
          <h2 className="text-2xl font-bold mb-6">Shop by Category</h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
            {categories.map((cat, i) => (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <Link to={`/shop?category=${cat.id}`}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer group">
                    <CardContent className="p-4 text-center">
                      <div className="h-12 w-12 mx-auto mb-2 rounded-full bg-primary/10 flex items-center justify-center text-2xl group-hover:bg-primary/20 transition-colors">
                        {cat.icon || '🛒'}
                      </div>
                      <p className="text-xs font-medium truncate">{cat.name}</p>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Best Selling */}
      {bestSelling.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 py-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Best Selling</h2>
            <Link to="/shop" className="text-primary text-sm font-medium flex items-center gap-1 hover:underline">
              View All <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {bestSelling.map((product, i) => (
              <ProductCard key={product.id} product={product} index={i} />
            ))}
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="bg-primary text-primary-foreground py-16">
        <div className="max-w-3xl mx-auto text-center px-4">
          <h2 className="text-3xl font-bold mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
            Ready to Save on Groceries?
          </h2>
          <p className="text-primary-foreground/80 mb-8">Join thousands of happy families shopping at Vaduthala Hyper Shopee</p>
          <Link to="/register">
            <Button size="lg" variant="secondary" className="font-semibold">
              Create Your Account
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2025 Vaduthala Hyper Shopee. All rights reserved.</p>
          <div className="flex items-center justify-center gap-4 mt-3">
            <Link to="/about" className="hover:text-primary transition-colors">About Us</Link>
            <Link to="/shop" className="hover:text-primary transition-colors">Shop</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

const ProductCard = ({ product, index }: { product: any; index: number }) => {
  const saved = product.mrp - product.our_price;
  const discount = Math.round((saved / product.mrp) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.05 }}
    >
      <Card className="overflow-hidden group hover:shadow-lg transition-all">
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
        <CardContent className="p-3">
          <p className="font-medium text-sm truncate">{product.name}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-primary font-bold text-sm">₹{product.our_price}</span>
            {saved > 0 && (
              <span className="text-muted-foreground text-xs line-through">₹{product.mrp}</span>
            )}
          </div>
          {product.is_weight_based && (
            <p className="text-xs text-muted-foreground mt-0.5">per {product.unit}</p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default Index;
