import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Product } from '@/types/skincare';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Leaf, ExternalLink, AlertTriangle, ArrowLeft, RefreshCw, Heart, History } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ProductFeedback } from '@/components/ProductFeedback';
import { FavoriteButton } from '@/components/FavoriteButton';
import { BrandLogo } from '@/components/BrandLogo';

function createFallbackRecommendations(assessment: {
  skin_type: string;
  skin_concerns: string[] | null;
  budget_range: string | null;
}) {
  const concerns = assessment.skin_concerns?.join(', ') || 'your skin goals';
  const searchUrl = (brand: string, name: string) =>
    `https://www.amazon.in/s?k=${encodeURIComponent(`${brand} ${name}`)}`;

  const products: Product[] = [
    {
      name: 'Gentle Skin Cleanser',
      brand: 'Cetaphil',
      description: 'A gentle cleanser that removes dirt without stripping the skin.',
      keyIngredients: ['Glycerin', 'Niacinamide'],
      skinTypeSuitability: [assessment.skin_type],
      priceRange: '₹399–₹699',
      productUrl: searchUrl('Cetaphil', 'Gentle Skin Cleanser'),
      whySuitable: `A gentle starting cleanser for ${assessment.skin_type} skin and concerns such as ${concerns}.`,
      usageInstructions: 'Use morning and night on damp skin, then rinse.',
    },
    {
      name: 'Ceramide Moisturising Cream',
      brand: 'CeraVe',
      description: 'A barrier-supporting moisturizer for daily hydration.',
      keyIngredients: ['Ceramides', 'Hyaluronic Acid'],
      skinTypeSuitability: [assessment.skin_type],
      priceRange: '₹899–₹1,299',
      productUrl: searchUrl('CeraVe', 'Moisturising Cream'),
      whySuitable: 'Helps support the skin barrier and reduce dryness or irritation.',
      usageInstructions: 'Apply after cleansing, morning and night.',
    },
    {
      name: '10% Niacinamide Face Serum',
      brand: 'The Derma Co',
      description: 'A niacinamide serum for oil control and uneven-looking skin tone.',
      keyIngredients: ['Niacinamide', 'Zinc'],
      skinTypeSuitability: ['oily', 'combination', 'normal'],
      priceRange: '₹499–₹599',
      productUrl: searchUrl('The Derma Co', '10 Niacinamide Face Serum'),
      whySuitable: `May help with visible oiliness, pores, and uneven tone related to ${concerns}.`,
      usageInstructions: 'Apply 2–3 drops at night after cleansing, three times weekly initially.',
    },
    {
      name: 'Ultra Matte Sunscreen Gel SPF 50',
      brand: 'Re’equil',
      description: 'A broad-spectrum sunscreen for daily UV protection.',
      keyIngredients: ['UV Filters', 'Vitamin E'],
      skinTypeSuitability: [assessment.skin_type],
      priceRange: '₹695–₹795',
      productUrl: searchUrl('Reequil', 'Ultra Matte Sunscreen Gel SPF 50'),
      whySuitable: 'Daily sunscreen helps prevent darkening of spots and protects the overall routine.',
      usageInstructions: 'Apply generously as the last morning skincare step and reapply outdoors.',
    },
    {
      name: '2% Salicylic Acid Face Serum',
      brand: 'Minimalist',
      description: 'A targeted exfoliating serum for clogged pores and breakouts.',
      keyIngredients: ['Salicylic Acid'],
      skinTypeSuitability: ['oily', 'combination'],
      priceRange: '₹549–₹599',
      productUrl: searchUrl('Minimalist', '2 Salicylic Acid Face Serum'),
      whySuitable: 'A targeted option for congestion and breakouts when salicylic acid is suitable for you.',
      usageInstructions: 'Use at night once or twice weekly; do not combine with other strong actives.',
      safetyWarnings: 'Patch test first and stop if irritation occurs.',
    },
  ];

  return {
    summary: `Here is a starter routine for ${assessment.skin_type} skin focused on ${concerns}. The AI recommendation service is temporarily unavailable, so these general products are provided as a safe fallback. Patch test new products and consult a dermatologist for persistent concerns.`,
    products,
  };
}

export default function Results() {
  const { assessmentId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const facePhoto = (location.state as any)?.facePhoto as string | null;
  
  const [products, setProducts] = useState<Product[]>([]);
  const [aiSummary, setAiSummary] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recommendationId, setRecommendationId] = useState<string | null>(null);
  const [hasFetched, setHasFetched] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    if (!hasFetched) {
      fetchRecommendations();
    }
  }, [assessmentId, user, hasFetched]);

  const fetchRecommendations = async () => {
    if (!assessmentId) return;
    
    setError(null);

    try {
      const { data: existing } = await supabase
        .from('recommendations')
        .select('*')
        .eq('assessment_id', assessmentId)
        .maybeSingle();

      if (existing) {
        setRecommendationId(existing.id);
        setProducts(existing.products as unknown as Product[]);
        setAiSummary(existing.ai_summary || '');
        setHasFetched(true);
        return;
      }

      setIsLoading(true);
      setIsGenerating(true);

      const { data: assessment, error: assessmentError } = await supabase
        .from('skin_assessments')
        .select('*')
        .eq('id', assessmentId)
        .single();

      if (assessmentError) throw assessmentError;

      const { data, error: fnError } = await supabase.functions.invoke('get-recommendations', {
        body: { assessment, facePhoto },
      });

      const recommendationData = fnError || !data?.products?.length
        ? createFallbackRecommendations(assessment)
        : data;

      if (fnError) {
        console.warn('AI recommendation service unavailable; using fallback products:', fnError.message);
      }

      setProducts(recommendationData.products);
      setAiSummary(recommendationData.summary);

      const { data: savedRec, error: saveError } = await supabase.from('recommendations').insert({
        assessment_id: assessmentId,
        user_id: user!.id,
        products: recommendationData.products,
        ai_summary: recommendationData.summary,
      }).select('id').single();

      if (saveError) throw saveError;

      if (savedRec) {
        setRecommendationId(savedRec.id);
      }

    } catch (err) {
      console.error('Error fetching recommendations:', err);
      setError('Failed to generate recommendations. Please try again.');
      toast({ title: 'Error', description: 'Failed to load recommendations', variant: 'destructive' });
    } finally {
      setIsLoading(false);
      setIsGenerating(false);
      setHasFetched(true);
    }
  };

  if (isLoading || (!hasFetched && !error)) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-skinwise-subtle relative texture-grain p-4">
        <div className="relative text-center space-y-6 max-w-md w-full animate-scale-in">
          <div className="flex justify-center mb-8">
            <BrandLogo className="h-10 w-auto" />
          </div>
          <h2 className="text-2xl font-display font-semibold text-skinwise-bark">Analyzing Your Skin Profile</h2>
          <p className="text-muted-foreground font-body">Finding the perfect products for your unique needs...</p>
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-skinwise-terracotta" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-skinwise-subtle relative texture-grain p-4">
        <div className="relative max-w-lg w-full animate-scale-in">
          <div className="flex justify-center mb-8 cursor-pointer" onClick={() => navigate('/')}>
            <BrandLogo className="h-10 w-auto" />
          </div>
          <Card className="shadow-soft-lg border-border/50 rounded-2xl overflow-hidden">
            <CardContent className="p-10 text-center space-y-6">
              <div className="flex justify-center">
                <div className="p-4 rounded-full bg-destructive/10">
                  <AlertTriangle className="w-10 h-10 text-destructive" />
                </div>
              </div>
              <h2 className="text-2xl font-display font-semibold">Something went wrong</h2>
              <p className="text-muted-foreground font-body">{error}</p>
              <div className="divider-warm max-w-xs mx-auto" />
              <div className="flex gap-3 justify-center">
                <Button variant="outline" onClick={() => navigate('/quiz')} className="rounded-full">
                  <ArrowLeft className="w-4 h-4 mr-2" /> Retake Quiz
                </Button>
                <Button onClick={fetchRecommendations} className="rounded-full shadow-warm">
                  <RefreshCw className="w-4 h-4 mr-2" /> Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-skinwise-subtle relative texture-grain py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-10 animate-fade-in relative">
        <div className="flex justify-center mb-4 cursor-pointer" onClick={() => navigate('/')}>
          <BrandLogo className="h-10 w-auto" />
        </div>
        
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-display font-bold text-skinwise-bark">Your Personalized Routine</h1>
          {facePhoto && (
            <div className="inline-flex items-center gap-2 bg-skinwise-sage/10 text-skinwise-sage rounded-full px-4 py-1.5 text-sm font-medium">
              <Leaf className="w-4 h-4" />
              Enhanced with face photo analysis
            </div>
          )}
          <p className="text-lg text-muted-foreground font-body max-w-2xl mx-auto leading-relaxed">{aiSummary}</p>
        </div>

        <div className="divider-warm max-w-md mx-auto" />

        {products.length === 0 ? (
          <Card className="shadow-soft-lg border-border/50 p-10 text-center rounded-2xl">
            <CardContent className="space-y-4">
              <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
              <h3 className="text-xl font-display font-semibold">No Products Found</h3>
              <p className="text-muted-foreground font-body">We couldn't generate product recommendations. Please try again.</p>
              <Button onClick={fetchRecommendations} className="rounded-full shadow-warm mt-4">
                <RefreshCw className="w-4 h-4 mr-2" /> Retry
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-8 md:grid-cols-2">
            {products.map((product, index) => (
              <Card key={index} className="shadow-soft-lg border-border/50 overflow-hidden feature-card rounded-2xl animate-fade-up" style={{ animationDelay: `${index * 100}ms` }}>
                <CardHeader className="pb-3 bg-skinwise-cream/50">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm text-skinwise-terracotta font-semibold uppercase tracking-wider">{product.brand}</p>
                      <CardTitle className="text-xl font-display mt-1 text-skinwise-bark">{product.name}</CardTitle>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm">~{product.priceRange}</Badge>
                      {user && <FavoriteButton product={product} userId={user.id} />}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                  <p className="text-sm text-muted-foreground font-body leading-relaxed">{product.whySuitable}</p>
                  
                  {product.usageInstructions && (
                    <div className="bg-skinwise-sage/5 p-3 rounded-lg border border-skinwise-sage/10">
                      <p className="text-xs text-skinwise-bark font-medium mb-1">How to use:</p>
                      <p className="text-xs text-muted-foreground font-body">
                        {product.usageInstructions}
                      </p>
                    </div>
                  )}
                  
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
                        Shop Product <ExternalLink className="w-3 h-3 ml-2" />
                      </a>
                    </Button>
                  )}
                  
                  {recommendationId && user && (
                    <div className="pt-4 border-t border-border/30">
                      <ProductFeedback
                        recommendationId={recommendationId}
                        productName={product.name}
                        userId={user.id}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Card className="bg-skinwise-cream/30 border-dashed border-skinwise-sage/30 rounded-xl">
          <CardContent className="p-5 text-center text-sm text-muted-foreground space-y-2">
            <p className="font-body"><AlertTriangle className="w-4 h-4 inline mr-2 text-skinwise-terracotta" />These are AI-generated suggestions. Please consult a dermatologist for personalized medical advice.</p>
            <p className="text-xs opacity-80">Prices shown are approximate and may differ from actual prices on e-commerce platforms.</p>
          </CardContent>
        </Card>

        <div className="flex justify-center gap-4 flex-wrap pt-4">
          <Button variant="outline" asChild className="rounded-full bg-white/50 backdrop-blur-sm">
            <Link to="/quiz"><ArrowLeft className="w-4 h-4 mr-2" /> Take New Quiz</Link>
          </Button>
          <Button variant="outline" asChild className="rounded-full bg-white/50 backdrop-blur-sm">
            <Link to="/favorites"><Heart className="w-4 h-4 mr-2" /> View Favorites</Link>
          </Button>
          <Button variant="outline" asChild className="rounded-full bg-white/50 backdrop-blur-sm">
            <Link to="/history"><History className="w-4 h-4 mr-2" /> View History</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
