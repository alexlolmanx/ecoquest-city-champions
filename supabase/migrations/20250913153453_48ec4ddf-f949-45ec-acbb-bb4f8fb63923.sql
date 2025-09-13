-- Create comprehensive system with roles, points, transactions, and all features

-- 1. Create app_role enum
CREATE TYPE public.app_role AS ENUM ('user', 'admin', 'moderator', 'sponsor');

-- 2. Update user_roles table to use enum
ALTER TABLE public.user_roles 
ALTER COLUMN role TYPE public.app_role USING role::public.app_role,
ALTER COLUMN role SET DEFAULT 'user'::public.app_role;

-- 3. Create points_transactions table for ledger system
CREATE TABLE public.points_transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  amount integer NOT NULL, -- Can be positive or negative
  source_type text NOT NULL, -- 'mission', 'quiz', 'shop', 'manual', 'refund', 'bonus'
  source_id uuid NULL, -- Reference to mission, quiz, shop_order, etc.
  admin_id uuid NULL, -- If manual adjustment
  reason text NULL,
  metadata jsonb DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- 4. Create money_transactions table for monetary ledger
CREATE TABLE public.money_transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  amount_cents integer NOT NULL, -- Amount in smallest currency unit
  currency_code text NOT NULL DEFAULT 'GEL',
  source_type text NOT NULL,
  source_id uuid NULL,
  admin_id uuid NULL,
  reason text NULL,
  metadata jsonb DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- 5. Update profiles table with balance fields
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS points_balance integer NOT NULL DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS money_balance_cents integer NOT NULL DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS currency_code text NOT NULL DEFAULT 'GEL';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS balance_updated_at timestamp with time zone NOT NULL DEFAULT now();

-- 6. Create shop_categories table
CREATE TABLE public.shop_categories (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- 7. Update products table for shop
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS points_cost integer NOT NULL DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS money_cost_cents integer NOT NULL DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES public.shop_categories(id);
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS stock_available boolean NOT NULL DEFAULT true;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS max_per_user integer NULL;

-- 8. Create shop_orders table
CREATE TABLE public.shop_orders (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  product_id uuid NOT NULL REFERENCES public.products(id),
  quantity integer NOT NULL DEFAULT 1,
  points_paid integer NOT NULL DEFAULT 0,
  money_paid_cents integer NOT NULL DEFAULT 0,
  currency_code text NOT NULL DEFAULT 'GEL',
  status text NOT NULL DEFAULT 'pending', -- 'pending', 'completed', 'cancelled', 'refunded'
  delivered_at timestamp with time zone NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- 9. Create events table
CREATE TABLE public.events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text NOT NULL,
  event_type text NOT NULL DEFAULT 'individual', -- 'individual', 'team'
  start_date timestamp with time zone NOT NULL,
  end_date timestamp with time zone NOT NULL,
  points_reward integer NOT NULL DEFAULT 0,
  max_participants integer NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- 10. Create event_participants table
CREATE TABLE public.event_participants (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  joined_at timestamp with time zone NOT NULL DEFAULT now(),
  completed_at timestamp with time zone NULL,
  points_earned integer NOT NULL DEFAULT 0,
  proof_url text NULL,
  verification_status text NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  verified_by uuid NULL,
  verified_at timestamp with time zone NULL,
  UNIQUE(event_id, user_id)
);

-- 11. Create forums table
CREATE TABLE public.forums (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text NOT NULL,
  category text NOT NULL DEFAULT 'general',
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- 12. Create forum_posts table
CREATE TABLE public.forum_posts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  forum_id uuid NOT NULL REFERENCES public.forums(id) ON DELETE CASCADE,
  author_id uuid NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  image_url text NULL,
  is_pinned boolean NOT NULL DEFAULT false,
  is_locked boolean NOT NULL DEFAULT false,
  upvotes integer NOT NULL DEFAULT 0,
  downvotes integer NOT NULL DEFAULT 0,
  reply_count integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- 13. Create forum_replies table
CREATE TABLE public.forum_replies (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id uuid NOT NULL REFERENCES public.forum_posts(id) ON DELETE CASCADE,
  author_id uuid NOT NULL,
  content text NOT NULL,
  image_url text NULL,
  upvotes integer NOT NULL DEFAULT 0,
  downvotes integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- 14. Create forum_votes table
CREATE TABLE public.forum_votes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  target_type text NOT NULL, -- 'post' or 'reply'
  target_id uuid NOT NULL,
  vote_type text NOT NULL, -- 'up' or 'down'
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, target_type, target_id)
);

-- 15. Create partners table
CREATE TABLE public.partners (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  logo_url text,
  website_url text,
  contact_email text,
  is_active boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- 16. Create uploads table for mission/event verification
CREATE TABLE public.uploads (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  file_url text NOT NULL,
  file_type text NOT NULL, -- 'image', 'video'
  file_size integer NOT NULL,
  source_type text NOT NULL, -- 'mission', 'event', 'forum'
  source_id uuid NOT NULL,
  verification_status text NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  ai_verification_result jsonb DEFAULT '{}',
  verified_by uuid NULL,
  verified_at timestamp with time zone NULL,
  rejection_reason text NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- 17. Create audit_logs table for tracking admin actions
CREATE TABLE public.audit_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id uuid NOT NULL,
  action_type text NOT NULL, -- 'create', 'update', 'delete', 'points_adjust', etc.
  target_type text NOT NULL, -- 'user', 'mission', 'product', etc.
  target_id uuid NULL,
  old_values jsonb DEFAULT '{}',
  new_values jsonb DEFAULT '{}',
  reason text NULL,
  ip_address text NULL,
  user_agent text NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- 18. Create quizzes table (replacing tests)
CREATE TABLE public.quizzes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text,
  instructions text,
  time_limit integer NULL, -- in seconds
  max_attempts integer NOT NULL DEFAULT 1,
  passing_score integer NOT NULL DEFAULT 70,
  points_reward integer NOT NULL DEFAULT 10,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- 19. Create quiz_questions table
CREATE TABLE public.quiz_questions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_id uuid NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  question_text text NOT NULL,
  question_type text NOT NULL DEFAULT 'multiple_choice',
  options jsonb NOT NULL DEFAULT '[]',
  correct_answer text NOT NULL,
  points integer NOT NULL DEFAULT 1,
  order_index integer NOT NULL,
  explanation text NULL
);

-- 20. Create quiz_attempts table
CREATE TABLE public.quiz_attempts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_id uuid NOT NULL REFERENCES public.quizzes(id),
  user_id uuid NOT NULL,
  answers jsonb NOT NULL DEFAULT '{}',
  score integer NOT NULL DEFAULT 0,
  percentage numeric NOT NULL DEFAULT 0,
  passed boolean NOT NULL DEFAULT false,
  time_taken integer NULL, -- in seconds
  points_earned integer NOT NULL DEFAULT 0,
  started_at timestamp with time zone NOT NULL DEFAULT now(),
  completed_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.points_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.money_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forums ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;

-- Create updated is_admin function using the enum
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = is_admin.user_id 
    AND role = 'admin'::public.app_role
  );
$$;

-- Create function to check user role
CREATE OR REPLACE FUNCTION public.has_role(user_id uuid, role_name public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = has_role.user_id 
    AND role = role_name
  );
$$;

-- Create function to update points balance
CREATE OR REPLACE FUNCTION public.update_points_balance()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles 
  SET 
    points_balance = points_balance + NEW.amount,
    balance_updated_at = now()
  WHERE user_id = NEW.user_id;
  
  RETURN NEW;
END;
$$;

-- Create function to update money balance
CREATE OR REPLACE FUNCTION public.update_money_balance()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles 
  SET 
    money_balance_cents = money_balance_cents + NEW.amount_cents,
    balance_updated_at = now()
  WHERE user_id = NEW.user_id;
  
  RETURN NEW;
END;
$$;

-- Create triggers for balance updates
CREATE TRIGGER update_points_balance_trigger
  AFTER INSERT ON public.points_transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_points_balance();

CREATE TRIGGER update_money_balance_trigger
  AFTER INSERT ON public.money_transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_money_balance();

-- Create triggers for updated_at columns
CREATE TRIGGER update_points_transactions_updated_at
  BEFORE UPDATE ON public.points_transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_money_transactions_updated_at
  BEFORE UPDATE ON public.money_transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_shop_categories_updated_at
  BEFORE UPDATE ON public.shop_categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_shop_orders_updated_at
  BEFORE UPDATE ON public.shop_orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_forums_updated_at
  BEFORE UPDATE ON public.forums
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_forum_posts_updated_at
  BEFORE UPDATE ON public.forum_posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_forum_replies_updated_at
  BEFORE UPDATE ON public.forum_replies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_partners_updated_at
  BEFORE UPDATE ON public.partners
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_uploads_updated_at
  BEFORE UPDATE ON public.uploads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_quizzes_updated_at
  BEFORE UPDATE ON public.quizzes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies

-- Points Transactions
CREATE POLICY "Users can view their own points transactions" ON public.points_transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all points transactions" ON public.points_transactions
  FOR SELECT USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can insert points transactions" ON public.points_transactions
  FOR INSERT WITH CHECK (public.is_admin(auth.uid()));

-- Money Transactions
CREATE POLICY "Users can view their own money transactions" ON public.money_transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all money transactions" ON public.money_transactions
  FOR SELECT USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can insert money transactions" ON public.money_transactions
  FOR INSERT WITH CHECK (public.is_admin(auth.uid()));

-- Shop Categories
CREATE POLICY "Anyone can view active shop categories" ON public.shop_categories
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage shop categories" ON public.shop_categories
  FOR ALL USING (public.is_admin(auth.uid()));

-- Shop Orders
CREATE POLICY "Users can view their own orders" ON public.shop_orders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own orders" ON public.shop_orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all orders" ON public.shop_orders
  FOR SELECT USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update orders" ON public.shop_orders
  FOR UPDATE USING (public.is_admin(auth.uid()));

-- Events
CREATE POLICY "Anyone can view active events" ON public.events
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage events" ON public.events
  FOR ALL USING (public.is_admin(auth.uid()));

-- Event Participants
CREATE POLICY "Users can view their own event participation" ON public.event_participants
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can join events" ON public.event_participants
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own participation" ON public.event_participants
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all event participants" ON public.event_participants
  FOR SELECT USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update event participants" ON public.event_participants
  FOR UPDATE USING (public.is_admin(auth.uid()));

-- Forums
CREATE POLICY "Anyone can view active forums" ON public.forums
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage forums" ON public.forums
  FOR ALL USING (public.is_admin(auth.uid()));

-- Forum Posts
CREATE POLICY "Anyone can view forum posts" ON public.forum_posts
  FOR SELECT USING (true);

CREATE POLICY "Users can create forum posts" ON public.forum_posts
  FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own posts" ON public.forum_posts
  FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Admins can manage all forum posts" ON public.forum_posts
  FOR ALL USING (public.is_admin(auth.uid()));

-- Forum Replies
CREATE POLICY "Anyone can view forum replies" ON public.forum_replies
  FOR SELECT USING (true);

CREATE POLICY "Users can create forum replies" ON public.forum_replies
  FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own replies" ON public.forum_replies
  FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Admins can manage all forum replies" ON public.forum_replies
  FOR ALL USING (public.is_admin(auth.uid()));

-- Forum Votes
CREATE POLICY "Users can view their own votes" ON public.forum_votes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own votes" ON public.forum_votes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own votes" ON public.forum_votes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own votes" ON public.forum_votes
  FOR DELETE USING (auth.uid() = user_id);

-- Partners
CREATE POLICY "Anyone can view active partners" ON public.partners
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage partners" ON public.partners
  FOR ALL USING (public.is_admin(auth.uid()));

-- Uploads
CREATE POLICY "Users can view their own uploads" ON public.uploads
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own uploads" ON public.uploads
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all uploads" ON public.uploads
  FOR SELECT USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update uploads" ON public.uploads
  FOR UPDATE USING (public.is_admin(auth.uid()));

-- Audit Logs
CREATE POLICY "Admins can view audit logs" ON public.audit_logs
  FOR SELECT USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can create audit logs" ON public.audit_logs
  FOR INSERT WITH CHECK (public.is_admin(auth.uid()));

-- Quizzes
CREATE POLICY "Anyone can view active quizzes" ON public.quizzes
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage quizzes" ON public.quizzes
  FOR ALL USING (public.is_admin(auth.uid()));

-- Quiz Questions
CREATE POLICY "Anyone can view quiz questions" ON public.quiz_questions
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage quiz questions" ON public.quiz_questions
  FOR ALL USING (public.is_admin(auth.uid()));

-- Quiz Attempts
CREATE POLICY "Users can view their own quiz attempts" ON public.quiz_attempts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own quiz attempts" ON public.quiz_attempts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all quiz attempts" ON public.quiz_attempts
  FOR SELECT USING (public.is_admin(auth.uid()));

-- Create storage policies for additional buckets
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('uploads', 'uploads', false),
  ('partners', 'partners', true),
  ('forums', 'forums', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for uploads bucket
CREATE POLICY "Users can upload their own files"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own uploads"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Admins can view all uploads"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'uploads' AND public.is_admin(auth.uid()));

-- Storage policies for partners bucket
CREATE POLICY "Anyone can view partner images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'partners');

CREATE POLICY "Admins can upload partner images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'partners' AND public.is_admin(auth.uid()));

CREATE POLICY "Admins can update partner images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'partners' AND public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete partner images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'partners' AND public.is_admin(auth.uid()));

-- Storage policies for forums bucket
CREATE POLICY "Anyone can view forum images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'forums');

CREATE POLICY "Users can upload forum images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'forums' AND auth.uid() IS NOT NULL);

-- Insert admin user (this will be the seeded admin)
-- We'll do this after the migration is approved

-- Create initial shop categories
INSERT INTO public.shop_categories (name, description) VALUES
  ('Digital Rewards', 'Digital badges, certificates, and virtual items'),
  ('Physical Items', 'T-shirts, stickers, and eco-friendly products'),
  ('Experiences', 'Events, workshops, and special access'),
  ('Donations', 'Environmental causes and charity contributions')
ON CONFLICT DO NOTHING;