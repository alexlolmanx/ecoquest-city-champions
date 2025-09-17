import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Leaf, Users, Trophy, Star, Edit2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { SponsorsPanel } from "@/components/SponsorsPanel";
import { MainPostEditor } from "@/components/MainPostEditor";

interface MainPost {
  id: string;
  title: string;
  content: string;
  image_url?: string;
  is_featured: boolean;
  display_order: number;
}

const LandingPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [posts, setPosts] = useState<MainPost[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showEditor, setShowEditor] = useState(false);

  useEffect(() => {
    fetchPosts();
    if (user) {
      checkAdminStatus();
    }
  }, [user]);

  const fetchPosts = async () => {
    const { data, error } = await supabase
      .from('main_posts')
      .select('*')
      .eq('is_active', true)
      .order('display_order');
    
    if (!error && data) {
      setPosts(data);
    }
  };

  const checkAdminStatus = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();
    
    setIsAdmin(!error && !!data);
  };

  const handleGetStarted = () => {
    if (user) {
      navigate("/dashboard");
    } else {
      navigate("/auth");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-primary/10">
      {/* Header */}
      <header className="container mx-auto px-4 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
            <Leaf className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-bold text-primary">EcoQuest</h1>
        </div>
        
        <div className="flex items-center gap-4">
          {isAdmin && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowEditor(!showEditor)}
            >
              <Edit2 className="w-4 h-4 mr-2" />
              Edit Content
            </Button>
          )}
          {user ? (
            <Button onClick={() => navigate("/dashboard")}>
              Go to Dashboard
            </Button>
          ) : (
            <Button onClick={() => navigate("/auth")}>
              Sign In
            </Button>
          )}
        </div>
      </header>

      {/* Admin Editor */}
      {showEditor && isAdmin && (
        <div className="container mx-auto px-4 mb-8">
          <MainPostEditor onUpdate={fetchPosts} />
        </div>
      )}

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Save the Planet, One Mission at a Time
          </h1>
          <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
            Join thousands of eco-warriors in our gamified environmental platform. 
            Complete missions, earn points, and make a real difference for our planet.
          </p>
          <Button 
            onClick={handleGetStarted}
            size="lg"
            className="bg-gradient-to-r from-primary to-accent text-white px-8 py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
          >
            Start Your Eco Journey
          </Button>
        </div>
      </section>

      {/* Main Posts Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {posts.map((post) => (
            <Card key={post.id} className={`${post.is_featured ? 'ring-2 ring-primary/50' : ''} hover:shadow-lg transition-shadow`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {post.is_featured && <Star className="w-5 h-5 text-primary" />}
                  {post.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed">
                  {post.content}
                </CardDescription>
                {post.image_url && (
                  <img 
                    src={post.image_url} 
                    alt={post.title}
                    className="w-full h-48 object-cover rounded-lg mt-4"
                  />
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12 text-primary">Why Choose EcoQuest?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="text-center p-6">
            <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center mx-auto mb-4">
              <Trophy className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Gamified Experience</h3>
            <p className="text-muted-foreground">Earn points, badges, and climb leaderboards while making a positive environmental impact.</p>
          </Card>
          
          <Card className="text-center p-6">
            <div className="w-16 h-16 bg-gradient-to-br from-accent to-primary rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Community Driven</h3>
            <p className="text-muted-foreground">Connect with like-minded eco-warriors and participate in team challenges.</p>
          </Card>
          
          <Card className="text-center p-6">
            <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center mx-auto mb-4">
              <Leaf className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Real Impact</h3>
            <p className="text-muted-foreground">Every completed mission contributes to measurable environmental improvements.</p>
          </Card>
        </div>
      </section>

      {/* Sponsors Panel */}
      <SponsorsPanel />

      {/* Footer */}
      <footer className="bg-muted/50 py-12 mt-20">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
              <Leaf className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-semibold text-primary">EcoQuest</span>
          </div>
          <p className="text-muted-foreground">Making the world a better place, one mission at a time.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;