import { useAuth } from "@/hooks/useAuth";
import { Dashboard } from "./Dashboard";
import { MainPostsSection } from "@/components/MainPostsSection";
import { SponsorsSection } from "@/components/SponsorsSection";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Index = () => {
  const { user } = useAuth();

  if (user) {
    return <Dashboard />;
  }

  return (
    <div className="min-h-screen">
      <MainPostsSection />
      <SponsorsSection />
      
      <div className="fixed bottom-8 right-8">
        <Link to="/auth">
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300">
            Join EcoQuest
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default Index;
