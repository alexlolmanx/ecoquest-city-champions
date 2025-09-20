-- Fix critical security vulnerability in test system
-- Issue: test_questions table is publicly readable with correct answers

-- First, drop the existing overly permissive policy
DROP POLICY IF EXISTS "Anyone can view test questions" ON public.test_questions;

-- Create secure policies for test_questions
-- Only admins can see questions with correct answers
CREATE POLICY "Admins can view test questions with answers" 
ON public.test_questions 
FOR SELECT 
USING (is_admin(auth.uid()));

-- Create a secure function to get questions WITHOUT answers for test takers
CREATE OR REPLACE FUNCTION public.get_test_questions_for_attempt(test_id_param uuid)
RETURNS TABLE (
  id uuid,
  question_text text,
  question_type text,
  options jsonb,
  order_index integer,
  points integer
) 
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  -- Only return questions without correct answers for authenticated users
  -- taking an active test
  SELECT 
    tq.id,
    tq.question_text,
    tq.question_type,
    tq.options,
    tq.order_index,
    tq.points
  FROM public.test_questions tq
  JOIN public.tests t ON t.id = tq.test_id
  WHERE tq.test_id = test_id_param
    AND t.is_active = true
    AND auth.uid() IS NOT NULL
  ORDER BY tq.order_index;
$$;

-- Create a function to validate test answers (only returns score, not correct answers)
CREATE OR REPLACE FUNCTION public.submit_test_attempt(
  test_id_param uuid,
  answers_param jsonb
)
RETURNS TABLE (
  attempt_id uuid,
  score integer,
  percentage numeric,
  passed boolean,
  total_questions integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_attempt_id uuid;
  v_score integer := 0;
  v_total_questions integer;
  v_percentage numeric;
  v_passed boolean;
  v_passing_score integer;
  question_record RECORD;
  user_answer text;
BEGIN
  -- Verify user is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Get test info
  SELECT passing_score INTO v_passing_score
  FROM public.tests 
  WHERE id = test_id_param AND is_active = true;
  
  IF v_passing_score IS NULL THEN
    RAISE EXCEPTION 'Test not found or inactive';
  END IF;

  -- Count total questions
  SELECT COUNT(*) INTO v_total_questions
  FROM public.test_questions
  WHERE test_id = test_id_param;

  -- Calculate score by comparing answers
  FOR question_record IN 
    SELECT id, correct_answer, points
    FROM public.test_questions
    WHERE test_id = test_id_param
    ORDER BY order_index
  LOOP
    -- Get user's answer for this question
    SELECT (answers_param ->> question_record.id::text) INTO user_answer;
    
    -- Check if answer is correct
    IF user_answer = question_record.correct_answer THEN
      v_score := v_score + question_record.points;
    END IF;
  END LOOP;

  -- Calculate percentage
  v_percentage := CASE 
    WHEN v_total_questions > 0 THEN (v_score::numeric / v_total_questions::numeric) * 100
    ELSE 0
  END;
  
  -- Determine if passed
  v_passed := v_percentage >= v_passing_score;

  -- Insert test attempt record
  INSERT INTO public.test_attempts (
    user_id,
    test_id,
    answers,
    score,
    percentage,
    passed
  ) VALUES (
    auth.uid(),
    test_id_param,
    answers_param,
    v_score,
    v_percentage,
    v_passed
  ) RETURNING id INTO v_attempt_id;

  -- Return results
  RETURN QUERY SELECT 
    v_attempt_id,
    v_score,
    v_percentage,
    v_passed,
    v_total_questions;
END;
$$;

-- Create policy for the new secure functions
-- Users can only access questions through the secure function
CREATE POLICY "Users can access test questions via secure function"
ON public.test_questions
FOR SELECT
USING (false); -- Direct access is blocked, must use function

-- Grant execute permissions on the new functions
GRANT EXECUTE ON FUNCTION public.get_test_questions_for_attempt(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.submit_test_attempt(uuid, jsonb) TO authenticated;