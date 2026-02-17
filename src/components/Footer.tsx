import { Link } from 'react-router-dom';
import { Phone, MapPin, Clock } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-card border-t mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
          {/* Brand */}
          <div className="flex items-start gap-3 col-span-2 sm:col-span-1">
            <img src="/logo.png" alt="Vaduthala Hyper Shopee" className="h-10 w-10 object-contain mt-0.5" />
            <div>
              <h3 className="font-bold text-foreground">Vaduthala Hyper Shopee</h3>
              <p className="text-xs text-muted-foreground mt-1">Quality groceries at the best prices, delivered to your door.</p>
            </div>
          </div>

          {/* Quick Links */}
          <div className="flex flex-col gap-1.5">
            <h4 className="text-sm font-semibold text-foreground mb-1">Quick Links</h4>
            <Link to="/" className="text-xs text-muted-foreground hover:text-primary transition-colors">Home</Link>
            <Link to="/shop" className="text-xs text-muted-foreground hover:text-primary transition-colors">Shop</Link>
            <Link to="/about" className="text-xs text-muted-foreground hover:text-primary transition-colors">About Us</Link>
          </div>

          {/* Contact */}
          <div className="flex flex-col gap-1.5">
            <h4 className="text-sm font-semibold text-foreground mb-1">Contact</h4>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
              <span>Vaduthala, Kochi, Kerala</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Phone className="h-3.5 w-3.5 text-primary shrink-0" />
              <span>Payment on delivery</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5 text-primary shrink-0" />
              <span>Open daily</span>
            </div>
          </div>
        </div>

        <div className="border-t mt-6 pt-4 text-center">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Vaduthala Hyper Shopee. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
