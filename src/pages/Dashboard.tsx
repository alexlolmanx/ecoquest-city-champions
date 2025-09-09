import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MissionCard } from "@/components/MissionCard";
import { ProgressCard } from "@/components/ProgressCard";
import { LeaderboardCard } from "@/components/LeaderboardCard";
import { WeeklyChallengeCard } from "@/components/WeeklyChallengeCard";
import { PixelGame } from "@/components/PixelGame";
import { AvatarUpload } from "@/components/AvatarUpload";
import { LotteryTickets } from "@/components/LotteryTickets";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Leaf, 
  Trophy, 
  Users, 
  User, 
  MapPin, 
  Target,
  Zap,
  Calendar,
  Settings,
  LogOut,
  Gamepad2,
  Ticket
} from "lucide-react";

const mockLeaderboard = [
  { id: "1", name: "EcoMaster Sarah", avatar: "", points: 2450, rank: 1, level: 12, badgeCount: 15 },
  { id: "2", name: "GreenGuardian Mike", avatar: "", points: 2380, rank: 2, level: 11, badgeCount: 13 },
  { id: "3", name: "TreeHugger Emma", avatar: "", points: 2200, rank: 3, level: 10, badgeCount: 12 },
  { id: "4", name: "CleanQueen Alex", avatar: "", points: 1950, rank: 4, level: 9, badgeCount: 10 },
];

const mockBadges = [
  { id: "1", name: "Tree Planter", icon: "🌱", rarity: "gold" as const },
  { id: "2", name: "Recycling Pro", icon: "♻️", rarity: "silver" as const },
  { id: "3", name: "First Mission", icon: "🎯", rarity: "bronze" as const },
];

export const Dashboard = () => {
  const [activeTab, setActiveTab] = useState("missions");
  const [missions, setMissions] = useState<any[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { user, signOut } = useAuth();

  useEffect(() => {
    if (user) {
      fetchMissions();
      fetchUserProfile();
    }
  }, [user]);

  const fetchMissions = async () => {
    try {
      const { data, error } = await supabase
        .from('missions')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMissions(data || []);
    } catch (error) {
      console.error('Error fetching missions:', error);
      toast.error('Failed to load missions');
    }
  };

  const fetchUserProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;
      setUserProfile(data);
    } catch (error) {
      console.error('Error fetching user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartMission = async (missionId: string) => {
    if (!user || !userProfile) return;

    try {
      const mission = missions.find(m => m.id === missionId);
      if (!mission) return;

      // Check if mission is already completed
      const { data: existingCompletion } = await supabase
        .from('user_missions')
        .select('id')
        .eq('user_id', user.id)
        .eq('mission_id', missionId)
        .single();

      if (existingCompletion) {
        toast.error('Mission already completed!');
        return;
      }

      // Complete the mission
      const { error } = await supabase
        .from('user_missions')
        .insert({
          user_id: user.id,
          mission_id: missionId,
          points_earned: mission.points
        });

      if (error) throw error;

      toast.success(`Mission completed! Earned ${mission.points} points and 1 lottery ticket!`);
      fetchUserProfile(); // Refresh profile to show updated stats
    } catch (error) {
      console.error('Error completing mission:', error);
      toast.error('Failed to complete mission');
    }
  };

  const handleJoinChallenge = () => {
    console.log("Joining weekly challenge");
    // TODO: Implement challenge joining logic
  };

  const handleSignOut = async () => {
    await signOut();
    toast.success('Signed out successfully');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-eco-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your eco-journey...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-eco-light/20 via-background to-eco-surface/30">
      <header className="border-b border-eco-accent/20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-eco-primary to-eco-secondary rounded-full flex items-center justify-center">
                <Leaf className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-eco-primary to-eco-secondary bg-clip-text text-transparent">
                  EcoQuest
                </h1>
                <p className="text-sm text-muted-foreground">Welcome back, {userProfile?.username || 'Eco-Warrior'}!</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm" className="border-eco-accent/20" onClick={handleSignOut}>
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
              <Avatar className="w-8 h-8 border-2 border-eco-accent/20">
                <AvatarImage src={userProfile?.avatar_url} />
                <AvatarFallback className="bg-eco-light text-eco-primary">
                  {userProfile?.username?.[0]?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="space-y-6">
          <div className="flex space-x-1 p-1 bg-muted rounded-lg">
            <Button
              variant={activeTab === "missions" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("missions")}
              className={activeTab === "missions" ? "bg-eco-primary text-white" : ""}
            >
              <Target className="w-4 h-4 mr-2" />
              Missions
            </Button>
            <Button
              variant={activeTab === "game" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("game")}
              className={activeTab === "game" ? "bg-eco-primary text-white" : ""}
            >
              <Gamepad2 className="w-4 h-4 mr-2" />
              Game
            </Button>
            <Button
              variant={activeTab === "lottery" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("lottery")}
              className={activeTab === "lottery" ? "bg-eco-primary text-white" : ""}
            >
              <Ticket className="w-4 h-4 mr-2" />
              Lottery
            </Button>
            <Button
              variant={activeTab === "leaderboard" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("leaderboard")}
              className={activeTab === "leaderboard" ? "bg-eco-primary text-white" : ""}
            >
              <Trophy className="w-4 h-4 mr-2" />
              Leaderboard
            </Button>
            <Button
              variant={activeTab === "profile" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("profile")}
              className={activeTab === "profile" ? "bg-eco-primary text-white" : ""}
            >
              <User className="w-4 h-4 mr-2" />
              Profile
            </Button>
          </div>

          {activeTab === "missions" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {missions.map((mission) => (
                <MissionCard
                  key={mission.id}
                  mission={mission}
                  onStart={() => handleStartMission(mission.id)}
                />
              ))}
            </div>
          )}

          {activeTab === "game" && (
            <div className="space-y-6">
              <Card className="border-eco-accent/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Gamepad2 className="w-5 h-5 text-eco-primary" />
                    EcoQuest Adventure Game
                  </CardTitle>
                  <CardDescription>
                    Control your eco-warrior character and collect environmental rewards!
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <PixelGame onScoreUpdate={(score) => console.log('Game score:', score)} />
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "lottery" && user && (
            <LotteryTickets userId={user.id} />
          )}

          {activeTab === "leaderboard" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <LeaderboardCard
                title="Global Leaderboard"
                entries={mockLeaderboard}
                currentUserId={user?.id}
              />
              <LeaderboardCard
                title="Weekly Champions"
                entries={mockLeaderboard.slice(0, 5)}
                currentUserId={user?.id}
              />
            </div>
          )}

          {activeTab === "profile" && userProfile && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1 space-y-6">
                <Card className="border-eco-accent/20">
                  <CardHeader>
                    <CardTitle>Profile</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center">
                    <AvatarUpload
                      userId={user?.id || ''}
                      currentAvatarUrl={userProfile.avatar_url}
                      onAvatarUpdate={(url) => setUserProfile(prev => ({ ...prev, avatar_url: url }))}
                    />
                    <div className="mt-4">
                      <h3 className="text-lg font-semibold">{userProfile.username}</h3>
                      <p className="text-sm text-muted-foreground">Level {userProfile.level} Eco-Warrior</p>
                    </div>
                  </CardContent>
                </Card>

                <ProgressCard
                  level={userProfile.level}
                  currentXP={userProfile.current_xp}
                  nextLevelXP={userProfile.next_level_xp}
                  totalMissions={userProfile.total_missions}
                  completedMissions={userProfile.completed_missions}
                  badges={mockBadges}
                />
              </div>
              <div className="lg:col-span-2">
                <Card className="border-eco-accent/20">
                  <CardHeader>
                    <CardTitle>Achievement Gallery</CardTitle>
                    <CardDescription>Your environmental impact milestones</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {mockBadges.map((badge) => (
                        <div key={badge.id} className="text-center p-4 border border-eco-accent/20 rounded-lg">
                          <div className="text-2xl mb-2">{badge.icon}</div>
                          <p className="text-sm font-medium">{badge.name}</p>
                          <Badge variant="outline" className="mt-1 text-xs">
                            {badge.rarity}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};