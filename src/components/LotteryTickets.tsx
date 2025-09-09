import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Ticket, Trophy, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface LotteryTicket {
  id: string;
  ticket_number: string;
  created_at: string;
  expires_at: string;
  is_used: boolean;
  missions: {
    title: string;
  };
}

interface LotteryDraw {
  id: string;
  draw_date: string;
  prize_description: string;
  prize_value: number;
  is_completed: boolean;
}

interface LotteryTicketsProps {
  userId: string;
}

export const LotteryTickets = ({ userId }: LotteryTicketsProps) => {
  const [tickets, setTickets] = useState<LotteryTicket[]>([]);
  const [recentDraws, setRecentDraws] = useState<LotteryDraw[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTickets();
    fetchRecentDraws();
  }, [userId]);

  const fetchTickets = async () => {
    try {
      const { data, error } = await supabase
        .from('lottery_tickets')
        .select(`
          *,
          missions (
            title
          )
        `)
        .eq('user_id', userId)
        .eq('is_used', false)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTickets(data || []);
    } catch (error) {
      console.error('Error fetching tickets:', error);
      toast.error('Failed to load lottery tickets');
    }
  };

  const fetchRecentDraws = async () => {
    try {
      const { data, error } = await supabase
        .from('lottery_draws')
        .select('*')
        .order('draw_date', { ascending: false })
        .limit(5);

      if (error) throw error;
      setRecentDraws(data || []);
    } catch (error) {
      console.error('Error fetching draws:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getDaysUntilExpiry = (expiryDate: string) => {
    const days = Math.ceil(
      (new Date(expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
    return days;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">Loading lottery tickets...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Active Tickets */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ticket className="w-5 h-5 text-eco-primary" />
            Your Lottery Tickets ({tickets.length})
          </CardTitle>
          <CardDescription>
            Complete missions to earn lottery tickets. Each ticket gives you a chance to win prizes!
          </CardDescription>
        </CardHeader>
        <CardContent>
          {tickets.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Ticket className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No active lottery tickets</p>
              <p className="text-sm">Complete missions to earn tickets!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tickets.map((ticket) => {
                const daysLeft = getDaysUntilExpiry(ticket.expires_at);
                return (
                  <div
                    key={ticket.id}
                    className="p-4 border border-eco-accent/20 rounded-lg bg-gradient-to-br from-eco-light/20 to-eco-surface/20"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="text-sm font-mono text-eco-primary">
                        #{ticket.ticket_number.split('_').pop()?.slice(-6)}
                      </div>
                      <Badge
                        variant={daysLeft <= 7 ? "destructive" : "secondary"}
                        className="text-xs"
                      >
                        <Clock className="w-3 h-3 mr-1" />
                        {daysLeft}d left
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground mb-1">
                      From: {ticket.missions.title}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Earned: {formatDate(ticket.created_at)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Lottery Draws */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            Recent Lottery Draws
          </CardTitle>
          <CardDescription>
            See the latest lottery results and prizes awarded
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentDraws.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No lottery draws yet</p>
              <p className="text-sm">Check back soon for exciting prizes!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentDraws.map((draw) => (
                <div
                  key={draw.id}
                  className="flex justify-between items-center p-3 border border-eco-accent/20 rounded-lg"
                >
                  <div>
                    <div className="font-medium text-sm">{draw.prize_description}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatDate(draw.draw_date)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-eco-primary">
                      ${draw.prize_value}
                    </div>
                    <Badge
                      variant={draw.is_completed ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {draw.is_completed ? "Awarded" : "Pending"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lottery Rules */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Lottery Rules</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <div>• Earn 1 lottery ticket for each completed mission</div>
          <div>• Tickets expire after 30 days</div>
          <div>• Monthly lottery draws award random prizes</div>
          <div>• Lottery prizes are separate from leaderboard rewards</div>
          <div>• Winners will be notified via email</div>
        </CardContent>
      </Card>
    </div>
  );
};