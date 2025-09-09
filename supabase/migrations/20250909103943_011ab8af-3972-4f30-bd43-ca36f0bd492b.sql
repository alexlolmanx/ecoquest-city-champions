-- Create storage bucket for avatars
INSERT INTO storage.buckets (id, name, public, allowed_mime_types, file_size_limit)
VALUES ('avatars', 'avatars', true, ARRAY['image/jpeg', 'image/png', 'image/webp'], 2097152);

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  level INTEGER NOT NULL DEFAULT 1,
  current_xp INTEGER NOT NULL DEFAULT 0,
  next_level_xp INTEGER NOT NULL DEFAULT 100,
  total_missions INTEGER NOT NULL DEFAULT 0,
  completed_missions INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create missions table
CREATE TABLE public.missions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  points INTEGER NOT NULL DEFAULT 10,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  location TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_missions table for tracking completion
CREATE TABLE public.user_missions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mission_id UUID NOT NULL REFERENCES public.missions(id) ON DELETE CASCADE,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  points_earned INTEGER NOT NULL DEFAULT 0,
  UNIQUE(user_id, mission_id)
);

-- Create lottery_tickets table
CREATE TABLE public.lottery_tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mission_id UUID NOT NULL REFERENCES public.missions(id) ON DELETE CASCADE,
  ticket_number TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '30 days'),
  is_used BOOLEAN NOT NULL DEFAULT false
);

-- Create lottery_draws table
CREATE TABLE public.lottery_draws (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  draw_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  winning_ticket_id UUID REFERENCES public.lottery_tickets(id),
  prize_description TEXT NOT NULL,
  prize_value DECIMAL(10,2),
  is_completed BOOLEAN NOT NULL DEFAULT false
);

-- Create leaderboard_rewards table
CREATE TABLE public.leaderboard_rewards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rank INTEGER NOT NULL,
  period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  reward_description TEXT NOT NULL,
  reward_value DECIMAL(10,2),
  awarded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lottery_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lottery_draws ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaderboard_rewards ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view all profiles" 
ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for missions
CREATE POLICY "Anyone can view active missions" 
ON public.missions FOR SELECT USING (is_active = true);

-- Create RLS policies for user_missions
CREATE POLICY "Users can view their own mission completions" 
ON public.user_missions FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own mission completions" 
ON public.user_missions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for lottery_tickets
CREATE POLICY "Users can view their own lottery tickets" 
ON public.lottery_tickets FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own lottery tickets" 
ON public.lottery_tickets FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for lottery_draws
CREATE POLICY "Anyone can view lottery draws" 
ON public.lottery_draws FOR SELECT USING (true);

-- Create RLS policies for leaderboard_rewards
CREATE POLICY "Users can view their own rewards" 
ON public.leaderboard_rewards FOR SELECT USING (auth.uid() = user_id);

-- Create storage policies for avatars
CREATE POLICY "Avatar images are publicly accessible" 
ON storage.objects FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar" 
ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'avatars' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own avatar" 
ON storage.objects FOR UPDATE USING (
  bucket_id = 'avatars' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own avatar" 
ON storage.objects FOR DELETE USING (
  bucket_id = 'avatars' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates on profiles
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, username)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'username', 'user_' || substr(new.id::text, 1, 8))
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to award lottery ticket when mission is completed
CREATE OR REPLACE FUNCTION public.award_lottery_ticket()
RETURNS TRIGGER AS $$
BEGIN
  -- Generate a unique ticket number
  INSERT INTO public.lottery_tickets (user_id, mission_id, ticket_number)
  VALUES (
    NEW.user_id,
    NEW.mission_id,
    'TICKET_' || NEW.user_id::text || '_' || NEW.mission_id::text || '_' || extract(epoch from now())::text
  );
  
  -- Update user profile stats
  UPDATE public.profiles 
  SET 
    completed_missions = completed_missions + 1,
    current_xp = current_xp + NEW.points_earned,
    total_missions = total_missions + 1
  WHERE user_id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for lottery ticket award
CREATE TRIGGER award_lottery_ticket_on_mission_completion
AFTER INSERT ON public.user_missions
FOR EACH ROW EXECUTE FUNCTION public.award_lottery_ticket();

-- Create function to clean up expired lottery tickets
CREATE OR REPLACE FUNCTION public.cleanup_expired_tickets()
RETURNS void AS $$
BEGIN
  DELETE FROM public.lottery_tickets 
  WHERE expires_at < now() AND is_used = false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Insert sample missions
INSERT INTO public.missions (title, description, points, difficulty, location, category) VALUES
('Plant a Tree', 'Plant a tree in your local area to help combat climate change', 50, 'medium', 'Local Park', 'environment'),
('Reduce Plastic Use', 'Go plastic-free for one day and document your experience', 25, 'easy', 'Home', 'sustainability'),
('Community Beach Cleanup', 'Participate in a beach cleanup event in your area', 75, 'medium', 'Beach', 'community'),
('Start Composting', 'Begin composting organic waste at home', 40, 'easy', 'Home', 'sustainability'),
('Use Public Transport', 'Use public transportation instead of driving for one week', 60, 'hard', 'City', 'transport'),
('Energy Audit', 'Conduct an energy audit of your home and implement improvements', 80, 'hard', 'Home', 'energy'),
('Grow Your Own Food', 'Start a small garden and grow your own vegetables', 45, 'medium', 'Home', 'sustainability'),
('Organize Recycling Drive', 'Organize a recycling drive in your neighborhood', 100, 'hard', 'Neighborhood', 'community');