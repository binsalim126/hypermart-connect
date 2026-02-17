import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Menu, X, User, LogOut, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const { totalItems } = useCart();
  const { user, role, profile, signOut } = useAuth();
  const navigate = useNavigate();

  const links = [
    { label: 'Home', to: '/' },
    { label: 'Shop', to: '/shop' },
    { label: 'About', to: '/about' },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-card/80 backdrop-blur-lg border-b shadow-sm">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <img src="/logo.png" alt="Vaduthala Hyper Shopee" className="h-10 w-10 rounded-full object-cover" />
          <span className="font-bold text-sm sm:text-lg text-foreground leading-tight">
            Vaduthala<br className="sm:hidden" />{' '}
            <span className="text-primary">Hyper Shopee</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-6">
          {links.map(l => (
            <Link key={l.to} to={l.to} className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
              {l.label}
            </Link>
          ))}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          <Link to="/cart" className="relative p-2 hover:bg-secondary rounded-full transition-colors">
            <ShoppingCart className="h-5 w-5" />
            {totalItems > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-0.5 -right-0.5 h-5 w-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center font-bold"
              >
                {totalItems}
              </motion.span>
            )}
          </Link>

          {user ? (
            <div className="hidden md:flex items-center gap-2">
              {(role === 'admin' || role === 'superadmin') && (
                <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
                  <LayoutDashboard className="h-4 w-4 mr-1" /> Dashboard
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={() => navigate('/profile')}>
                <User className="h-4 w-4 mr-1" /> {profile?.full_name || 'Profile'}
              </Button>
              <Button variant="ghost" size="sm" onClick={signOut}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>
                Admin Login
              </Button>
              <Button size="sm" onClick={() => navigate('/register')}>
                Sign Up
              </Button>
            </div>
          )}

          {/* Burger */}
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden border-t overflow-hidden bg-card"
          >
            <div className="px-4 py-4 space-y-2">
              {user && profile && (
                <div className="pb-3 mb-3 border-b">
                  <p className="font-semibold text-sm">{profile.full_name}</p>
                  <p className="text-xs text-muted-foreground">{profile.phone}</p>
                  <p className="text-xs text-muted-foreground">{profile.location}{profile.landmark ? `, ${profile.landmark}` : ''}</p>
                </div>
              )}
              {links.map(l => (
                <Link key={l.to} to={l.to} onClick={() => setMenuOpen(false)} className="block py-2 text-sm font-medium hover:text-primary transition-colors">
                  {l.label}
                </Link>
              ))}
              {user ? (
                <>
                  {(role === 'admin' || role === 'superadmin') && (
                    <Link to="/dashboard" onClick={() => setMenuOpen(false)} className="block py-2 text-sm font-medium hover:text-primary">Dashboard</Link>
                  )}
                  <Link to="/profile" onClick={() => setMenuOpen(false)} className="block py-2 text-sm font-medium hover:text-primary">Profile</Link>
                  <button onClick={() => { signOut(); setMenuOpen(false); }} className="block py-2 text-sm font-medium text-destructive">Sign Out</button>
                </>
              ) : (
                <>
                  <Link to="/login" onClick={() => setMenuOpen(false)} className="block py-2 text-sm font-medium hover:text-primary">Admin Login</Link>
                  <Link to="/register" onClick={() => setMenuOpen(false)} className="block py-2 text-sm font-medium text-primary font-semibold">Sign Up</Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
