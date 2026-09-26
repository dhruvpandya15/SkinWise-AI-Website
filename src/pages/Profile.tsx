import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, User, Mail, Save, Loader2 } from 'lucide-react';
import { z } from 'zod';

const profileSchema = z.object({
  fullName: z.string().trim().max(100, 'Name must be less than 100 characters').optional(),
});

export default function Profile() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('user_id', user!.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setFullName(data.full_name || '');
        setEmail(data.email || user!.email || '');
      } else {
        setEmail(user!.email || '');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to load profile data.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setError('');
    
    // Validate input
    const result = profileSchema.safeParse({ fullName });
    if (!result.success) {
      setError(result.error.errors[0].message);
      return;
    }

    setIsSaving(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          user_id: user!.id,
          email: user!.email || null,
          full_name: fullName.trim() || null,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

      if (error) throw error;

      toast({
        title: 'Profile Updated',
        description: 'Your profile has been saved successfully.',
      });
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to save profile. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen gradient-skinwise-subtle p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-skinwise-subtle relative texture-grain">
      {/* Header */}
      <header className="sticky top-0 z-10 backdrop-blur-md bg-card/80 border-b border-border/50">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/')}
              className="rounded-full hover:bg-skinwise-terracotta/10 hover:text-skinwise-terracotta"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-display font-semibold text-foreground">Profile Settings</h1>
              <p className="text-sm text-muted-foreground font-body">Manage your account</p>
            </div>
          </div>
          <div className="w-12" /> {/* Right spacer */}
        </div>
      </header>

      <main className="relative max-w-2xl mx-auto px-6 py-8 space-y-6 animate-fade-up">
        
        <Card className="shadow-soft-lg rounded-2xl border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-display text-xl">
              <User className="h-5 w-5 text-skinwise-terracotta" />
              Personal Information
            </CardTitle>
            <CardDescription className="font-body">
              Update your profile details. Your email is linked to your account.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="fullName" className="font-medium text-sm">Full Name</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
                maxLength={100}
                className="rounded-xl border-border/70 focus:border-skinwise-terracotta focus:ring-skinwise-terracotta/20"
              />
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2 font-medium text-sm">
                <Mail className="h-4 w-4 text-skinwise-sage" />
                Email Address
              </Label>
              <Input
                id="email"
                value={email}
                disabled
                className="bg-muted/50 rounded-xl"
              />
              <p className="text-xs text-muted-foreground font-body">
                Email cannot be changed. Contact support if needed.
              </p>
            </div>

            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full sm:w-auto rounded-full px-6 shadow-warm"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Account Info Card */}
        <Card className="shadow-soft rounded-2xl border-border/50">
          <CardHeader>
            <CardTitle className="font-display text-xl">Account Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground space-y-3 font-body">
              <p>
                <span className="font-medium text-foreground">User ID:</span>{' '}
                <code className="bg-muted/50 px-2 py-1 rounded-lg text-xs">{user?.id}</code>
              </p>
              <p>
                <span className="font-medium text-foreground">Member since:</span>{' '}
                {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
