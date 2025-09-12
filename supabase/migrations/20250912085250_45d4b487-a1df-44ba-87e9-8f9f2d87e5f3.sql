-- Create communities table
CREATE TABLE public.communities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  member_count INTEGER DEFAULT 0,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN DEFAULT true
);

-- Create reviews table
CREATE TABLE public.reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  author_id UUID NOT NULL,
  target_type TEXT NOT NULL, -- 'product', 'community', 'test', etc.
  target_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create products table for shop
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  image_url TEXT,
  category TEXT DEFAULT 'general',
  stock_quantity INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create library materials table
CREATE TABLE public.library_materials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  content_type TEXT NOT NULL, -- 'pdf', 'article', 'video', etc.
  file_url TEXT,
  category TEXT DEFAULT 'general',
  author TEXT,
  is_active BOOLEAN DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create tests table
CREATE TABLE public.tests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  instructions TEXT,
  time_limit INTEGER, -- in minutes
  max_attempts INTEGER DEFAULT 1,
  passing_score INTEGER DEFAULT 70,
  is_active BOOLEAN DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create test questions table
CREATE TABLE public.test_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  test_id UUID NOT NULL REFERENCES public.tests(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL DEFAULT 'multiple_choice', -- 'multiple_choice', 'true_false', 'short_answer'
  correct_answer TEXT NOT NULL,
  options JSONB, -- for multiple choice options
  points INTEGER DEFAULT 1,
  order_index INTEGER NOT NULL
);

-- Create test attempts table
CREATE TABLE public.test_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  test_id UUID NOT NULL REFERENCES public.tests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  answers JSONB NOT NULL,
  score INTEGER NOT NULL,
  percentage DECIMAL(5,2) NOT NULL,
  passed BOOLEAN NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  time_taken INTEGER -- in seconds
);

-- Create user roles table for admin access
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'user', -- 'admin', 'moderator', 'user'
  granted_by UUID,
  granted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.library_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = is_admin.user_id 
    AND role = 'admin'
  );
$$;

-- RLS Policies for communities
CREATE POLICY "Anyone can view active communities" ON public.communities
  FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage communities" ON public.communities
  FOR ALL USING (public.is_admin(auth.uid()));

-- RLS Policies for reviews
CREATE POLICY "Anyone can view reviews" ON public.reviews
  FOR SELECT USING (true);
CREATE POLICY "Users can create reviews" ON public.reviews
  FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Users can update their own reviews" ON public.reviews
  FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Admins can manage all reviews" ON public.reviews
  FOR ALL USING (public.is_admin(auth.uid()));

-- RLS Policies for products
CREATE POLICY "Anyone can view active products" ON public.products
  FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage products" ON public.products
  FOR ALL USING (public.is_admin(auth.uid()));

-- RLS Policies for library materials
CREATE POLICY "Anyone can view active library materials" ON public.library_materials
  FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage library materials" ON public.library_materials
  FOR ALL USING (public.is_admin(auth.uid()));

-- RLS Policies for tests
CREATE POLICY "Anyone can view active tests" ON public.tests
  FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage tests" ON public.tests
  FOR ALL USING (public.is_admin(auth.uid()));

-- RLS Policies for test questions
CREATE POLICY "Anyone can view test questions" ON public.test_questions
  FOR SELECT USING (true);
CREATE POLICY "Admins can manage test questions" ON public.test_questions
  FOR ALL USING (public.is_admin(auth.uid()));

-- RLS Policies for test attempts
CREATE POLICY "Users can view their own test attempts" ON public.test_attempts
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own test attempts" ON public.test_attempts
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all test attempts" ON public.test_attempts
  FOR SELECT USING (public.is_admin(auth.uid()));

-- RLS Policies for user roles
CREATE POLICY "Admins can view all user roles" ON public.user_roles
  FOR SELECT USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can manage user roles" ON public.user_roles
  FOR ALL USING (public.is_admin(auth.uid()));

-- Create triggers for updated_at columns
CREATE TRIGGER update_communities_updated_at
  BEFORE UPDATE ON public.communities
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_library_materials_updated_at
  BEFORE UPDATE ON public.library_materials
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tests_updated_at
  BEFORE UPDATE ON public.tests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample admin user role (you'll need to replace with actual user ID)
-- INSERT INTO public.user_roles (user_id, role) VALUES ('your-user-id-here', 'admin');

-- Create storage buckets for file uploads
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('products', 'products', true),
  ('library', 'library', false),
  ('communities', 'communities', true);

-- Storage policies for products
CREATE POLICY "Anyone can view product images" ON storage.objects
  FOR SELECT USING (bucket_id = 'products');
CREATE POLICY "Admins can upload product images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'products' AND public.is_admin(auth.uid()));

-- Storage policies for library
CREATE POLICY "Anyone can view library files" ON storage.objects
  FOR SELECT USING (bucket_id = 'library');
CREATE POLICY "Admins can upload library files" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'library' AND public.is_admin(auth.uid()));

-- Storage policies for communities
CREATE POLICY "Anyone can view community images" ON storage.objects
  FOR SELECT USING (bucket_id = 'communities');
CREATE POLICY "Admins can upload community images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'communities' AND public.is_admin(auth.uid()));