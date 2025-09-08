import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MissionCard } from "@/components/MissionCard";
import { ProgressCard } from "@/components/ProgressCard";
import { LeaderboardCard } from "@/components/LeaderboardCard";
import { WeeklyChallengeCard } from "@/components/WeeklyChallengeCard";
import { 
  Trophy, 
  MapPin, 
  Users, 
  Camera, 
  Settings,
  Bell,
  Search
} from "lucide-react";
import heroImage from "@/assets/eco-hero.jpg";

const mockMissions = [
  {
    id: "1",
    title: "Plant Trees in Central Park",
    description: "Join the community tree planting event and help green our city!",
    points: 150,
    difficulty: "medium" as const,
    category: "Tree Planting",
    timeEstimate: "2-3 hours",
    participants: 24,
    location: "Central Park, Zone A"
  },
  {
    id: "2", 
    title: "Recycle Electronics",
    description: "Properly dispose of old electronics at certified recycling centers.",
    points: 100,
    difficulty: "easy" as const,
    category: "Recycling",
    timeEstimate: "30 min",
    participants: 156,
    location: "Any Electronics Store"
  },
  {
    id: "3",
    title: "Clean Beach Cleanup",
    description: "Help remove plastic waste from our beautiful coastline.",
    points: 200,
    difficulty: "hard" as const,
    category: "Clean-up",
    timeEstimate: "4-5 hours",
    participants: 89,
    location: "Sunset Beach"
  }
];

const mockLeaderboard = [
  { id: "1", name: "EcoMaster Sarah", points: 2450, rank: 1, level: 12, badgeCount: 15 },
  { id: "2", name: "GreenGuardian Mike", points: 2380, rank: 2, level: 11, badgeCount: 13 },
  { id: "3", name: "TreeHugger Emma", points: 2200, rank: 3, level: 10, badgeCount: 12 },
  { id: "4", name: "CleanQueen Alex", points: 1950, rank: 4, level: 9, badgeCount: 10 },
];

const mockBadges = [
  { id: "1", name: "Tree Planter", icon: "🌱", rarity: "gold" as const },
  { id: "2", name: "Recycling Pro", icon: "♻️", rarity: "silver" as const },
  { id: "3", name: "First Mission", icon: "🎯", rarity: "bronze" as const },
];

export const Dashboard = () => {
  const [activeTab, setActiveTab] = useState("missions");

  const handleStartMission = (missionId: string) => {
    console.log(`Starting mission: ${missionId}`);
    // TODO: Navigate to mission detail page
  };

  const handleJoinChallenge = () => {
    console.log("Joining weekly challenge");
    // TODO: Join challenge logic
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-primary to-accent rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">EQ</span>
            </div>
            <div>
              <h1 className="font-bold text-lg text-foreground">EcoQuest</h1>
              <p className="text-xs text-muted-foreground">San Francisco</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" className="p-2">
              <Search className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="ghost" className="p-2">
              <Bell className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="ghost" className="p-2">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/20 via-accent/10 to-success/20">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/30 to-transparent" />
        <img 
          src={heroImage} 
          alt="EcoQuest Community" 
          className="absolute inset-0 w-full h-full object-cover opacity-20"
        />
        <div className="relative px-4 py-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-foreground mb-2">
              Make a Difference Today! 🌍
            </h2>
            <p className="text-muted-foreground mb-4">
              Join thousands of eco-champions in your city
            </p>
            <Button className="btn-eco-hero">
              Start Your First Mission
            </Button>
          </div>
        </div>
      </section>

      {/* Navigation Tabs */}
      <nav className="bg-card border-b border-border px-4 py-2">
        <div className="flex gap-1">
          {[
            { id: "missions", label: "Missions", icon: MapPin },
            { id: "leaderboard", label: "Leaderboard", icon: Trophy },
            { id: "community", label: "Community", icon: Users },
            { id: "profile", label: "Profile", icon: Camera }
          ].map((tab) => (
            <Button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              variant={activeTab === tab.id ? "default" : "ghost"}
              size="sm"
              className={`flex items-center gap-2 ${
                activeTab === tab.id 
                  ? "bg-primary text-primary-foreground" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </Button>
          ))}
        </div>
      </nav>

      {/* Content */}
      <main className="p-4 space-y-6">
        {activeTab === "missions" && (
          <>
            {/* Weekly Challenge */}
            <WeeklyChallengeCard
              title="Plant 1000 Trees Together!"
              description="Our city-wide tree planting challenge. Every tree counts toward cleaner air and a greener future."
              goal={1000}
              currentProgress={743}
              participants={2341}
              timeLeft="3 days left"
              reward="Special Badge + Local Store Discounts"
              isParticipating={false}
              onJoinChallenge={handleJoinChallenge}
            />

            {/* User Progress */}
            <ProgressCard
              level={5}
              currentXP={1240}
              nextLevelXP={1500}
              totalMissions={12}
              completedMissions={8}
              badges={mockBadges}
            />

            {/* Available Missions */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-foreground">Available Missions</h3>
                <Badge className="bg-primary text-primary-foreground">
                  {mockMissions.length} active
                </Badge>
              </div>
              <div className="grid gap-4">
                {mockMissions.map((mission) => (
                  <MissionCard
                    key={mission.id}
                    {...mission}
                    onStartMission={handleStartMission}
                  />
                ))}
              </div>
            </div>
          </>
        )}

        {activeTab === "leaderboard" && (
          <LeaderboardCard
            title="Weekly Champions"
            entries={mockLeaderboard}
            currentUserId="4"
          />
        )}

        {activeTab === "community" && (
          <Card className="p-6 text-center">
            <h3 className="text-xl font-bold mb-2">Community Features</h3>
            <p className="text-muted-foreground mb-4">
              Chat, team challenges, and verification coming soon!
            </p>
            <Button className="btn-eco-secondary">Join the Discussion</Button>
          </Card>
        )}

        {activeTab === "profile" && (
          <Card className="p-6 text-center">
            <h3 className="text-xl font-bold mb-2">Your Eco Profile</h3>
            <p className="text-muted-foreground mb-4">
              View your achievements, upload mission photos, and track your impact!
            </p>
            <Button className="btn-eco-secondary">Edit Profile</Button>
          </Card>
        )}
      </main>
    </div>
  );
};