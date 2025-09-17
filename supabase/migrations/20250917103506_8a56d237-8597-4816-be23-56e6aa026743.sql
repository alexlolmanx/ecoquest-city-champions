-- Create admin user account and default profile
INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    aud,
    role,
    raw_app_meta_data,
    raw_user_meta_data,
    email_change_token_new,
    email_change,
    email_change_token_current,
    email_change_confirm_status,
    banned_until,
    recovery_token,
    email_change_token_current,
    phone_change_token,
    phone_change,
    phone_change_sent_at,
    confirmed_at,
    invited_at,
    confirmation_token,
    confirmation_sent_at,
    recovery_sent_at,
    phone_change_token,
    phone_confirmed_at,
    phone,
    phone_change_sent_at,
    last_sign_in_at,
    is_super_admin,
    is_sso_user
) VALUES (
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000000',
    'patarashviligigi533@gmail.com',
    crypt('11223344', gen_salt('bf')),
    now(),
    now(),
    now(),
    'authenticated',
    'authenticated',
    '{"provider":"email","providers":["email"]}',
    '{"username":"admin"}',
    '',
    '',
    '',
    0,
    null,
    '',
    '',
    '',
    null,
    now(),
    null,
    '',
    null,
    null,
    '',
    null,
    null,
    null,
    null,
    false,
    false
);

-- Create sponsors table
CREATE TABLE public.sponsors (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    logo_url text,
    website_url text,
    description text,
    is_active boolean DEFAULT true,
    display_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid REFERENCES auth.users(id)
);

-- Enable RLS on sponsors
ALTER TABLE public.sponsors ENABLE ROW LEVEL SECURITY;

-- RLS policies for sponsors
CREATE POLICY "Anyone can view active sponsors" 
ON public.sponsors 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage sponsors" 
ON public.sponsors 
FOR ALL 
USING (is_admin(auth.uid()));

-- Create main menu posts table
CREATE TABLE public.main_posts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    content text NOT NULL,
    image_url text,
    is_featured boolean DEFAULT false,
    is_active boolean DEFAULT true,
    display_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid REFERENCES auth.users(id)
);

-- Enable RLS on main posts
ALTER TABLE public.main_posts ENABLE ROW LEVEL SECURITY;

-- RLS policies for main posts
CREATE POLICY "Anyone can view active main posts" 
ON public.main_posts 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage main posts" 
ON public.main_posts 
FOR ALL 
USING (is_admin(auth.uid()));

-- Update triggers for timestamps
CREATE TRIGGER update_sponsors_updated_at
    BEFORE UPDATE ON public.sponsors
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_main_posts_updated_at
    BEFORE UPDATE ON public.main_posts
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample main posts
INSERT INTO public.main_posts (title, content, is_featured, display_order) VALUES
('Welcome to EcoQuest!', 'Join our community of environmental warriors making a difference every day. Complete missions, earn points, and help save our planet!', true, 1),
('How It Works', 'Complete eco-friendly missions, upload proof of your actions, earn points and badges, and climb the leaderboard while making a real environmental impact.', false, 2),
('Join the Movement', 'Together we can create a sustainable future. Every small action counts towards a bigger change.', false, 3);