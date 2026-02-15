import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Phone, MapPin, Landmark, Mail, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

const Register = () => {
  const [form, setForm] = useState({
    full_name: '', phone: '', email: '', password: '',
    location: '', place: '', landmark: '',
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const update = (key: string, value: string) => setForm(prev => ({ ...prev, [key]: value }));

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.full_name || !form.phone || !form.email || !form.password || !form.location) {
      toast({ title: 'Missing fields', description: 'Please fill all required fields.', variant: 'destructive' });
      return;
    }
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: form.full_name },
      },
    });

    if (error) {
      toast({ title: 'Registration failed', description: error.message, variant: 'destructive' });
      setLoading(false);
      return;
    }

    // Update profile with additional details
    if (data.user) {
      await supabase.from('profiles').update({
        phone: form.phone,
        location: form.location,
        place: form.place,
        landmark: form.landmark,
      }).eq('id', data.user.id);
    }

    setLoading(false);
    toast({ title: '🎉 Welcome!', description: 'Your account has been created successfully.' });
    navigate('/');
  };

  const fields = [
    { key: 'full_name', label: 'Full Name', icon: User, type: 'text', required: true },
    { key: 'phone', label: 'Phone Number', icon: Phone, type: 'tel', required: true },
    { key: 'email', label: 'Email', icon: Mail, type: 'email', required: true },
    { key: 'password', label: 'Password', icon: Lock, type: 'password', required: true },
    { key: 'location', label: 'Location / Address', icon: MapPin, type: 'text', required: true },
    { key: 'place', label: 'Place', icon: MapPin, type: 'text', required: false },
    { key: 'landmark', label: 'Landmark (near your location)', icon: Landmark, type: 'text', required: false },
  ];

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            <img src="/logo.jpg" alt="Logo" className="h-16 w-16 rounded-full mx-auto mb-2 object-cover" />
            <CardTitle>Create Your Account</CardTitle>
            <CardDescription>Join Vaduthala Hyper Shopee to start shopping</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRegister} className="space-y-3">
              {fields.map(f => (
                <div key={f.key} className="relative">
                  <f.icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={f.label + (f.required ? ' *' : '')}
                    type={f.type}
                    className="pl-10"
                    value={(form as any)[f.key]}
                    onChange={e => update(f.key, e.target.value)}
                    required={f.required}
                  />
                </div>
              ))}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Creating Account...' : 'Sign Up'}
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                Already have an account?{' '}
                <Link to="/login" className="text-primary hover:underline">Sign in</Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default Register;
