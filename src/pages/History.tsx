import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ToastAction } from '@/components/ui/toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { 
  ArrowLeft, 
  Calendar, 
  ChevronRight, 
  Sparkles,
  Droplets,
  Sun,
  Trash2
} from 'lucide-react';
import { BrandLogo } from '@/components/BrandLogo';
import { format } from 'date-fns';
import { Product } from '@/types/skincare';

interface AssessmentWithRecommendation {
  id: string;
  user_id: string;
  created_at: string;
  skin_type: string;
  skin_concerns: string[];
  age_range: string;
  climate: string | null;
  budget_range: string | null;
  recommendation?: {
    id: string;
    ai_summary: string | null;
    products: Product[];
  };
}

const UNDO_DELAY = 8;

function Countdown({ seconds }: { seconds: number }) {
  const [remaining, setRemaining] = useState(seconds);
  useEffect(() => {
    if (remaining <= 0) return;
    const id = setInterval(() => setRemaining((r) => Math.max(0, r - 1)), 1000);
    return () => clearInterval(id);
  }, [remaining]);
  return <>{remaining}s</>;
}

export default function History() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [assessments, setAssessments] = useState<AssessmentWithRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<{ items: AssessmentWithRecommendation[]; type: 'single' | 'all' } | null>(null);
  const pendingDeleteTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingDeleteRef = useRef<{ items: AssessmentWithRecommendation[] } | null>(null);
  const isCommittedRef = useRef(false);
  const isMounted = useRef(true);
  const { toast, dismiss } = useToast();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (user) {
      fetchHistory();
    }
  }, [user]);

  const fetchHistory = async () => {
    try {
      const { data: assessmentsData, error: assessmentsError } = await supabase
        .from('skin_assessments')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (assessmentsError) throw assessmentsError;

      const assessmentsWithRecs: AssessmentWithRecommendation[] = [];
      
      for (const assessment of assessmentsData || []) {
        const { data: recData } = await supabase
          .from('recommendations')
          .select('id, ai_summary, products')
          .eq('assessment_id', assessment.id)
          .maybeSingle();

        assessmentsWithRecs.push({
          ...assessment,
          recommendation: recData ? {
            ...recData,
            products: recData.products as unknown as Product[]
          } : undefined
        });
      }

      setAssessments(assessmentsWithRecs);
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const commitDelete = useCallback(async (items: AssessmentWithRecommendation[]) => {
    if (!items.length) return;
    try {
      for (const item of items) {
        await supabase.from('recommendations').delete().eq('assessment_id', item.id);
        await supabase.from('skin_assessments').delete().eq('id', item.id);
      }
      isCommittedRef.current = true;
    } catch (err) {
      console.error('Delete commit exception:', err);
    }
  }, []);

  const undoPendingDelete = useCallback(async () => {
    const pending = pendingDeleteRef.current;
    if (!pending) return;

    if (pendingDeleteTimer.current) {
      clearTimeout(pendingDeleteTimer.current);
      pendingDeleteTimer.current = null;
    }

    const itemsToRestore = [...pending.items];

    if (isCommittedRef.current) {
      try {
        for (const item of itemsToRestore) {
          const { recommendation, ...assessmentData } = item;
          const { error: aError } = await supabase.from('skin_assessments').insert(assessmentData);
          if (aError) {
            if (aError.code === '23505') {
              console.log('Assessment already exists, skipping insert.');
            } else {
              throw aError;
            }
          }
          if (recommendation) {
            const { error: rError } = await supabase.from('recommendations').insert({
              id: recommendation.id,
              assessment_id: item.id,
              user_id: item.user_id,
              ai_summary: recommendation.ai_summary,
              products: recommendation.products,
            });
            if (rError) {
              if (rError.code === '23505') {
                console.log('Recommendation already exists, skipping insert.');
              } else {
                throw rError;
              }
            }
          }
        }
        isCommittedRef.current = false;
      } catch (err) {
        console.error('Error undoing delete from Supabase:', err);
        toast({ 
          title: 'Error', 
          description: 'Could not restore assessment from database.',
          variant: 'destructive' 
        });
        return;
      }
    }

    if (isMounted.current) {
      setAssessments((prev) => {
        const existingIds = new Set(prev.map((a) => a.id));
        const restored = itemsToRestore.filter((a) => !existingIds.has(a.id));
        return [...restored, ...prev].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      });
      setPendingDelete(null);
    }

    pendingDeleteRef.current = null;
    toast({ title: 'Restored', description: 'Your assessments have been restored.' });
  }, [toast]);

  useEffect(() => {
    return () => {
      if (pendingDeleteTimer.current) {
        clearTimeout(pendingDeleteTimer.current);
        pendingDeleteTimer.current = null;
      }
      dismiss(); // Dismiss active toasts when leaving the history page so they don't linger
    };
  }, [dismiss]);

  const deleteAssessment = (assessmentId: string) => {
    if (pendingDeleteTimer.current) {
      clearTimeout(pendingDeleteTimer.current);
      pendingDeleteTimer.current = null;
    }

    const deleted = assessments.find((a) => a.id === assessmentId);
    if (!deleted) return;

    setAssessments((prev) => prev.filter((a) => a.id !== assessmentId));
    if (expandedId === assessmentId) setExpandedId(null);

    isCommittedRef.current = true;
    const pending = { items: [deleted] };
    pendingDeleteRef.current = pending;
    setPendingDelete({ items: [deleted], type: 'single' });

    // Execute deletion from the database immediately
    void commitDelete([deleted]);

    toast({
      title: 'Assessment deleted',
      description: <span>Permanently removed in <Countdown seconds={UNDO_DELAY} /></span>,
      action: (
        <ToastAction altText="Undo delete" onClick={undoPendingDelete}>
          Undo
        </ToastAction>
      ),
      duration: UNDO_DELAY * 1000,
    });

    pendingDeleteTimer.current = setTimeout(() => {
      pendingDeleteRef.current = null;
      pendingDeleteTimer.current = null;
      if (isMounted.current) {
        setPendingDelete(null);
      }
    }, UNDO_DELAY * 1000);
  };

  const deleteAllAssessments = () => {
    if (pendingDeleteTimer.current) {
      clearTimeout(pendingDeleteTimer.current);
      pendingDeleteTimer.current = null;
    }

    const allItems = [...assessments];
    setAssessments([]);
    setExpandedId(null);

    isCommittedRef.current = true;
    const pending = { items: allItems };
    pendingDeleteRef.current = pending;
    setPendingDelete({ items: allItems, type: 'all' });

    // Execute deletion from the database immediately
    void commitDelete(allItems);

    toast({
      title: 'All assessments deleted',
      description: <span>{allItems.length} assessment{allItems.length !== 1 ? 's' : ''} — permanently removed in <Countdown seconds={UNDO_DELAY} /></span>,
      action: (
        <ToastAction altText="Undo delete all" onClick={undoPendingDelete}>
          Undo
        </ToastAction>
      ),
      duration: UNDO_DELAY * 1000,
    });

    pendingDeleteTimer.current = setTimeout(() => {
      pendingDeleteRef.current = null;
      pendingDeleteTimer.current = null;
      if (isMounted.current) {
        setPendingDelete(null);
      }
    }, UNDO_DELAY * 1000);
  };

  const getSkinTypeIcon = (skinType: string) => {
    switch (skinType) {
      case 'oily': return <Droplets className="h-4 w-4 text-skinwise-sage" />;
      case 'dry': return <Sun className="h-4 w-4 text-skinwise-terracotta" />;
      default: return <Sparkles className="h-4 w-4 text-skinwise-moss" />;
    }
  };

  const formatBudget = (budget: string | null) => {
    if (!budget) return null;
    const budgetMap: Record<string, string> = {
      'budget': 'Budget',
      'mid': 'Mid-range',
      'premium': 'Premium',
      'luxury': 'Luxury'
    };
    return budgetMap[budget] || budget;
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen gradient-skinwise-subtle p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-10 w-48 rounded-xl" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 w-full rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-skinwise-subtle relative texture-grain">
      {/* Header */}
      <header className="sticky top-0 z-10 backdrop-blur-md bg-card/80 border-b border-border/50">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
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
              <h1 className="text-xl font-display font-semibold text-foreground">Assessment History</h1>
              <p className="text-sm text-muted-foreground font-body">Manage your skin data</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button onClick={() => navigate('/quiz')} className="rounded-full shadow-warm text-xs sm:text-sm">
              New Assessment
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="relative max-w-4xl mx-auto px-6 py-8 animate-fade-up">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <p className="text-muted-foreground font-body">
              Showing {assessments.length} assessment{assessments.length !== 1 ? 's' : ''}
            </p>
          </div>
          
          {assessments.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10 rounded-full h-9" disabled={deletingId === 'all'}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear History
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="rounded-2xl">
                <AlertDialogHeader>
                  <AlertDialogTitle className="font-display">Delete all assessments?</AlertDialogTitle>
                  <AlertDialogDescription className="font-body">
                    This will permanently delete all {assessments.length} assessment{assessments.length !== 1 ? 's' : ''} and their recommendations.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="rounded-full">Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={deleteAllAssessments}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-full"
                  >
                    Delete All
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
        {assessments.length === 0 ? (
          <Card className="text-center py-12 rounded-2xl shadow-soft-lg border-border/50 animate-scale-in">
            <CardContent>
              <h3 className="text-lg font-display font-medium text-foreground mb-2">No assessments yet</h3>
              <p className="text-muted-foreground font-body mb-6">
                Take your first skin assessment to get personalized recommendations.
              </p>
              <Button onClick={() => navigate('/quiz')} className="rounded-full shadow-warm">
                Start Assessment
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4 stagger-children">
            {assessments.map((assessment) => (
              <Card 
                key={assessment.id}
                className="overflow-hidden transition-all duration-300 hover:shadow-soft-lg rounded-2xl border-border/50 feature-card"
              >
                <CardHeader 
                  className="cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => setExpandedId(expandedId === assessment.id ? null : assessment.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground font-body">
                        <Calendar className="h-4 w-4 text-skinwise-sage" />
                        {format(new Date(assessment.created_at), 'MMMM d, yyyy • h:mm a')}
                      </div>
                      <CardTitle className="text-lg flex items-center gap-2 font-display">
                        {getSkinTypeIcon(assessment.skin_type)}
                        <span className="capitalize">{assessment.skin_type} Skin</span>
                        <span className="text-muted-foreground font-normal">•</span>
                        <span className="text-muted-foreground font-normal text-base font-body">
                          {assessment.age_range}
                        </span>
                      </CardTitle>
                      <div className="flex flex-wrap gap-2">
                        {assessment.skin_concerns.slice(0, 3).map((concern) => (
                          <Badge key={concern} variant="secondary" className="text-xs rounded-full bg-skinwise-sage/10 text-skinwise-moss border-0 font-body">
                            {concern}
                          </Badge>
                        ))}
                        {assessment.skin_concerns.length > 3 && (
                          <Badge variant="outline" className="text-xs rounded-full border-skinwise-sage/30 font-body">
                            +{assessment.skin_concerns.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {assessment.budget_range && (
                        <Badge variant="outline" className="flex items-center gap-1 rounded-full border-skinwise-terracotta/30 text-skinwise-terracotta font-body px-3 py-1 bg-skinwise-terracotta/5">
                          {formatBudget(assessment.budget_range)}
                        </Badge>
                      )}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-destructive rounded-full h-8 w-8"
                            onClick={(e) => e.stopPropagation()}
                            disabled={deletingId === assessment.id}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="rounded-2xl">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="font-display">Delete assessment?</AlertDialogTitle>
                            <AlertDialogDescription className="font-body">
                              This will permanently delete this assessment and its recommendations.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="rounded-full">Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteAssessment(assessment.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-full"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                      <ChevronRight 
                        className={`h-5 w-5 text-muted-foreground transition-transform duration-300 ${
                          expandedId === assessment.id ? 'rotate-90' : ''
                        }`} 
                      />
                    </div>
                  </div>
                </CardHeader>

                {expandedId === assessment.id && (
                  <CardContent className="border-t border-border/50 pt-4 space-y-4 animate-fade-up">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-muted/50 rounded-xl p-3">
                        <p className="text-xs text-muted-foreground font-body mb-1">Skin Type</p>
                        <p className="text-sm font-medium font-body capitalize">{assessment.skin_type}</p>
                      </div>
                      <div className="bg-muted/50 rounded-xl p-3">
                        <p className="text-xs text-muted-foreground font-body mb-1">Age Range</p>
                        <p className="text-sm font-medium font-body">{assessment.age_range}</p>
                      </div>
                      {assessment.climate && (
                        <div className="bg-muted/50 rounded-xl p-3">
                          <p className="text-xs text-muted-foreground font-body mb-1">Climate</p>
                          <p className="text-sm font-medium font-body capitalize">{assessment.climate}</p>
                        </div>
                      )}
                      {assessment.budget_range && (
                        <div className="bg-muted/50 rounded-xl p-3">
                          <p className="text-xs text-muted-foreground font-body mb-1">Budget</p>
                          <p className="text-sm font-medium font-body capitalize">{formatBudget(assessment.budget_range)}</p>
                        </div>
                      )}
                    </div>
                    
                    {assessment.recommendation ? (
                      <>
                        {assessment.recommendation.ai_summary && (
                          <div className="bg-skinwise-sage/5 rounded-xl p-4 border border-skinwise-sage/10">
                            <h4 className="font-display font-semibold text-skinwise-bark mb-2">AI Summary</h4>
                            <p className="text-sm text-muted-foreground font-body">
                              {assessment.recommendation.ai_summary}
                            </p>
                          </div>
                        )}

                        <div>
                          <h4 className="font-display font-semibold text-skinwise-bark mb-3">
                            Recommended Products ({assessment.recommendation.products.length})
                          </h4>
                          <div className="grid gap-3">
                            {assessment.recommendation.products.map((product, idx) => (
                              <div 
                                key={idx}
                                className="flex items-center justify-between p-3 bg-card border border-border/50 rounded-xl"
                              >
                                <div>
                                  <p className="font-medium text-sm font-body">{product.name}</p>
                                  <p className="text-xs text-muted-foreground font-body uppercase tracking-wider mt-0.5">{product.brand}</p>
                                </div>
                                <Badge variant="secondary" className="bg-background/80 font-body">{product.priceRange}</Badge>
                              </div>
                            ))}
                          </div>
                        </div>

                        <Button 
                          className="w-full rounded-full shadow-warm bg-skinwise-bark hover:bg-skinwise-bark/90 text-white mt-2"
                          onClick={() => navigate(`/results/${assessment.id}`)}
                        >
                          View Full Results
                        </Button>
                      </>
                    ) : (
                      <div className="text-center py-6 bg-skinwise-cream/30 rounded-xl border border-dashed border-border/50">
                        <p className="text-sm text-muted-foreground font-body mb-3">
                          No recommendations generated for this assessment.
                        </p>
                        <Button 
                          variant="outline"
                          className="rounded-full bg-white/50 backdrop-blur-sm"
                          onClick={() => navigate(`/results/${assessment.id}`)}
                        >
                          Generate Recommendations
                        </Button>
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
