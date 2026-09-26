import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAssessment } from '@/hooks/useAssessment';
import { ProgressIndicator } from '@/components/quiz/ProgressIndicator';
import { StepBasicInfo } from '@/components/quiz/StepBasicInfo';
import { StepSkinType } from '@/components/quiz/StepSkinType';
import { StepConcerns } from '@/components/quiz/StepConcerns';
import { StepLifestyle } from '@/components/quiz/StepLifestyle';
import { StepPreferences } from '@/components/quiz/StepPreferences';
import { StepFacePhoto } from '@/components/quiz/StepFacePhoto';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, ArrowRight, Sparkles, Loader2 } from 'lucide-react';
import { BrandLogo } from '@/components/BrandLogo';

export default function Quiz() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [facePhoto, setFacePhoto] = useState<string | null>(null);
  
  const {
    assessment,
    currentStep,
    totalSteps,
    updateAssessment,
    toggleArrayField,
    nextStep,
    prevStep,
    canProceed,
    isStepValid,
  } = useAssessment();

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      let finalId = `mock-${Date.now()}`;

      // Only save to Supabase if the user is logged in
      if (user) {
        const { data, error } = await supabase
          .from('skin_assessments')
          .insert([
            {
              user_id: user.id,
              skin_type: assessment.skinType,
              skin_concerns: assessment.skinConcerns,
              age_range: assessment.ageRange,
              climate: assessment.climate,
              budget_range: assessment.budgetRange,
            },
          ])
          .select()
          .single();

        if (error) throw error;
        if (data) finalId = data.id;
      } else {
        // Fallback for demonstration if user is not logged in
        await new Promise(resolve => setTimeout(resolve, 800));
      }

      // Navigate to results with the actual or mock ID
      navigate(`/results/${finalId}`, {
        state: { facePhoto, assessment },
      });
    } catch (error) {
      console.error('Error saving assessment:', error);
      toast({
        title: 'Error',
        description: 'Failed to save your assessment. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <StepBasicInfo assessment={assessment} onUpdate={updateAssessment} />;
      case 2:
        return <StepSkinType assessment={assessment} onUpdate={updateAssessment} />;
      case 3:
        return <StepConcerns assessment={assessment} onToggle={toggleArrayField} />;
      case 4:
        return <StepLifestyle assessment={assessment} onUpdate={updateAssessment} onToggle={toggleArrayField} />;
      case 5:
        return <StepPreferences assessment={assessment} onUpdate={updateAssessment} />;
      case 6:
        return <StepFacePhoto onCapture={(img) => setFacePhoto(img)} captured={!!facePhoto} />;
      default:
        return null;
    }
  };

  const stepLabels = ['Basics', 'Skin Type', 'Concerns', 'Lifestyle', 'Preferences', 'Photo'];

  return (
    <div className="min-h-screen gradient-skinwise-subtle py-8 px-4 relative texture-grain">
      <div className="relative max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-up">
          <div className="flex justify-center mb-6 cursor-pointer" onClick={() => navigate('/')}>
            <BrandLogo className="h-10 w-auto" />
          </div>
          <h1 className="text-2xl md:text-3xl font-display font-semibold text-foreground">
            Skin Assessment
          </h1>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">
            Step {currentStep} of {totalSteps} — {stepLabels[currentStep - 1]}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="progress-warm h-full"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        <ProgressIndicator currentStep={currentStep} totalSteps={totalSteps} isStepValid={isStepValid} />
        
        <Card className="shadow-soft-lg border-border/50 rounded-2xl overflow-hidden animate-scale-in">
          <CardContent className="p-6 sm:p-8">
            {renderStep()}
            
            {/* Navigation */}
            <div className="flex justify-between mt-8 pt-6 border-t border-border/50">
              <Button
                variant="ghost"
                onClick={prevStep}
                disabled={currentStep === 1}
                className="gap-2 rounded-full text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              
              {currentStep < totalSteps ? (
                <Button 
                  onClick={nextStep} 
                  disabled={!canProceed} 
                  className="gap-2 rounded-full px-6 shadow-warm"
                >
                  Next
                  <ArrowRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button 
                  onClick={handleSubmit} 
                  disabled={!canProceed || isSubmitting} 
                  className="gap-2 rounded-full px-6 shadow-warm"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Get Recommendations
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
