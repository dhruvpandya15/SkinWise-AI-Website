-- Add DELETE Row Level Security (RLS) policies for skin_assessments and recommendations

-- For skin_assessments:
CREATE POLICY "Users can delete their own assessments" 
ON public.skin_assessments 
FOR DELETE 
TO authenticated 
USING (auth.uid() = user_id);

-- For recommendations:
CREATE POLICY "Users can delete their own recommendations" 
ON public.recommendations 
FOR DELETE 
TO authenticated 
USING (auth.uid() = user_id);
