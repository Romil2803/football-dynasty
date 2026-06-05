import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export default function AuthPage() {
  const { signIn, signUp, continueAsGuest } = useAuth();
  const nav = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState(''); const [pw, setPw] = useState(''); const [name, setName] = useState('');

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    const { error } = await signIn(email, pw); setLoading(false);
    if (error) toast.error(error); else { toast.success('Welcome back'); nav('/career'); }
  };
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    const { error } = await signUp(email, pw, name); setLoading(false);
    if (error) toast.error(error); else { toast.success('Account created — check email to confirm'); nav('/career'); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm glass rounded-2xl p-6 shadow-elegant animate-fade-in">
        <Link to="/" className="block text-center font-display text-3xl font-bold mb-1">FOOTBALL <span className="text-gradient-gold">DYNASTY</span></Link>
        <p className="text-center text-xs text-muted-foreground mb-6">Save careers to the cloud across devices.</p>

        <Tabs defaultValue="in">
          <TabsList className="grid grid-cols-2 w-full"><TabsTrigger value="in">Sign In</TabsTrigger><TabsTrigger value="up">Sign Up</TabsTrigger></TabsList>
          <TabsContent value="in" className="space-y-3 mt-4">
            <form onSubmit={handleSignIn} className="space-y-3">
              <div><Label>Email</Label><Input type="email" required value={email} onChange={e => setEmail(e.target.value)} /></div>
              <div><Label>Password</Label><Input type="password" required value={pw} onChange={e => setPw(e.target.value)} /></div>
              <Button type="submit" disabled={loading} className="w-full bg-gradient-pitch">Sign In</Button>
            </form>
          </TabsContent>
          <TabsContent value="up" className="space-y-3 mt-4">
            <form onSubmit={handleSignUp} className="space-y-3">
              <div><Label>Display name</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="Manager Name" required /></div>
              <div><Label>Email</Label><Input type="email" required value={email} onChange={e => setEmail(e.target.value)} /></div>
              <div><Label>Password</Label><Input type="password" required minLength={6} value={pw} onChange={e => setPw(e.target.value)} /></div>
              <Button type="submit" disabled={loading} className="w-full bg-gradient-pitch">Create account</Button>
            </form>
          </TabsContent>
        </Tabs>

        <div className="text-center mt-5">
          <button onClick={() => { continueAsGuest(); nav('/career'); }} className="text-xs text-muted-foreground hover:text-primary underline underline-offset-2">
            or continue as guest
          </button>
        </div>
      </div>
    </div>
  );
}
