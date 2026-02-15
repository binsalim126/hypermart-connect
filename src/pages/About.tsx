import { useState } from 'react';
import { motion } from 'framer-motion';
import { Target, Award, Phone, Mail, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

const About = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSuggestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    setSending(true);
    const { error } = await supabase.from('suggestions').insert({ name: name || null, email: email || null, message });
    setSending(false);
    if (error) {
      toast({ title: 'Error', description: 'Failed to send. Please try again.', variant: 'destructive' });
    } else {
      toast({ title: 'Thank you!', description: 'Your suggestion has been received.' });
      setName(''); setEmail(''); setMessage('');
    }
  };

  const values = [
    { icon: Target, title: 'Our Goal', desc: 'To provide the freshest groceries and daily essentials at the most affordable prices, delivered right to your doorstep with care and reliability.' },
    { icon: Award, title: 'Product Quality', desc: 'We source directly from trusted suppliers and local farmers to ensure every product meets our high quality standards. Freshness guaranteed!' },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary/10 to-accent/5 py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-extrabold"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            About <span className="text-primary">Us</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-4 text-muted-foreground text-lg max-w-2xl mx-auto"
          >
            Vaduthala Hyper Shopee is your trusted neighborhood hypermarket, now online!
          </motion.p>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 py-12 space-y-12">
        {/* Values */}
        <div className="grid md:grid-cols-2 gap-6">
          {values.map((v, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: i === 0 ? -20 : 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <Card className="h-full">
                <CardHeader>
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-2">
                    <v.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>{v.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm leading-relaxed">{v.desc}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Contact */}
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <Card>
            <CardHeader>
              <CardTitle>Contact Us</CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Phone className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Customer Care</p>
                    <p className="text-sm text-muted-foreground">+91 XXXXX XXXXX</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Mail className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Email</p>
                    <p className="text-sm text-muted-foreground">contact@vaduthalahypershopee.com</p>
                  </div>
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                <p className="font-medium text-foreground mb-2">Our Location</p>
                <p>Vaduthala, Kochi, Kerala</p>
                <p className="mt-3">Working Hours: 8:00 AM - 10:00 PM</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Suggestion Box */}
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <Card>
            <CardHeader>
              <CardTitle>Suggestion Box</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSuggestion} className="space-y-4 max-w-lg">
                <Input placeholder="Your name (optional)" value={name} onChange={e => setName(e.target.value)} />
                <Input placeholder="Your email (optional)" type="email" value={email} onChange={e => setEmail(e.target.value)} />
                <Textarea placeholder="Write your suggestion or feedback..." value={message} onChange={e => setMessage(e.target.value)} required rows={4} />
                <Button type="submit" disabled={sending} className="gap-2">
                  <Send className="h-4 w-4" /> {sending ? 'Sending...' : 'Send Suggestion'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default About;
