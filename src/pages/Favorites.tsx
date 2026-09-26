import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Product } from '@/types/skincare';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, ExternalLink, ArrowLeft, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { BrandLogo } from '@/components/BrandLogo';

interface FavoriteItem {
  id: string;
  product_name: string;
  product_brand: string | null;
  product_data: Product;
  created_at: string;
}

export default function Favorites() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
      return;
    }
    if (user) {
      fetchFavorites();
    }
  }, [user, loading]);

  const fetchFavorites = async () => {
    try {
      const { data, error } = await supabase
        .from('favorites')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFavorites((data || []).map(item => ({
        ...item,
        product_data: item.product_data as unknown as Product,
      })));
    } catch (err) {
      console.error('Error fetching favorites:', err);
      toast({ title: 'Error', description: 'Failed to load favorites', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const removeFavorite = async (id: string) => {
    try {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setFavorites(favorites.filter(f => f.id !== id));
      toast({ title: 'Removed from favorites' });
    } catch (err) {
      console.error('Error removing favorite:', err);
      toast({ title: 'Error', description: 'Failed to remove', variant: 'destructive' });
    }
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-skinwise-subtle relative texture-grain p-4">
        <div className="animate-pulse text-muted-foreground font-body">Loading favorites...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-skinwise-subtle relative texture-grain py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-8 animate-fade-in relative">
        <div className="flex justify-center mb-8 cursor-pointer" onClick={() => navigate('/')}>
          <BrandLogo className="h-10 w-auto" />
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold flex items-center gap-2 text-skinwise-bark">
              <Heart className="w-8 h-8 text-skinwise-terracotta fill-skinwise-terracotta" />
              My Favorites
            </h1>
            <p className="text-muted-foreground font-body mt-1">Products you've saved for later</p>
          </div>
          <Button variant="outline" className="rounded-full bg-white/50 backdrop-blur-sm" asChild>
            <Link to="/"><ArrowLeft className="w-4 h-4 mr-2" /> Back Home</Link>
          </Button>
        </div>

        <div className="divider-warm" />

        {favorites.length === 0 ? (
          <Card className="shadow-soft-lg border-border/50 p-10 text-center rounded-2xl">
            <CardContent className="space-y-4">
              <Heart className="w-16 h-16 text-muted-foreground/30 mx-auto" />
              <h3 className="text-xl font-display font-semibold text-skinwise-bark">No favorites yet</h3>
              <p className="text-muted-foreground font-body">
                Take a quiz and save products you're interested in!
              </p>
              <Button asChild className="rounded-full shadow-warm mt-4">
                <Link to="/quiz">Take the Quiz</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {favorites.map((fav, index) => {
              const product = fav.product_data;
              return (
                <Card key={fav.id} className="shadow-soft-lg border-border/50 overflow-hidden feature-card rounded-2xl animate-fade-up" style={{ animationDelay: `${index * 50}ms` }}>
                  <CardHeader className="pb-3 bg-skinwise-cream/50">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm text-skinwise-terracotta font-semibold uppercase tracking-wider">{product.brand}</p>
                        <CardTitle className="text-xl font-display mt-1 text-skinwise-bark">{product.name}</CardTitle>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm">~{product.priceRange}</Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeFavorite(fav.id)}
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          title="Remove favorite"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-4">
                    <p className="text-sm text-muted-foreground font-body leading-relaxed">{product.whySuitable}</p>
                    
                    {product.keyIngredients?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-2">
                        {product.keyIngredients.map((ing, i) => (
                          <Badge key={i} variant="outline" className="text-[10px] uppercase tracking-wider border-border/60 text-muted-foreground bg-transparent">{ing}</Badge>
                        ))}
                      </div>
                    )}
                    
                    {product.productUrl && (
                      <Button className="w-full rounded-full shadow-sm mt-2" variant="outline" asChild>
                        <a href={product.productUrl} target="_blank" rel="noopener noreferrer" className="text-skinwise-bark hover:text-skinwise-terracotta transition-colors">
                          Shop Now <ExternalLink className="w-3 h-3 ml-2" />
                        </a>
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
