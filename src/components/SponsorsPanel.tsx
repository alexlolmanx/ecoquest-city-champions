import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Edit2, Trash2, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface Sponsor {
  id: string;
  name: string;
  logo_url?: string;
  website_url?: string;
  description?: string;
  display_order: number;
}

export const SponsorsPanel = () => {
  const { user } = useAuth();
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingSponsor, setEditingSponsor] = useState<Sponsor | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    logo_url: "",
    website_url: "",
    description: "",
  });

  useEffect(() => {
    fetchSponsors();
    if (user) {
      checkAdminStatus();
    }
  }, [user]);

  const fetchSponsors = async () => {
    const { data, error } = await supabase
      .from('sponsors')
      .select('*')
      .eq('is_active', true)
      .order('display_order');
    
    if (!error && data) {
      setSponsors(data);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingSponsor) {
        const { error } = await supabase
          .from('sponsors')
          .update(formData)
          .eq('id', editingSponsor.id);
        
        if (error) throw error;
        toast.success("Sponsor updated successfully!");
      } else {
        const { error } = await supabase
          .from('sponsors')
          .insert({
            ...formData,
            created_by: user?.id,
            display_order: sponsors.length
          });
        
        if (error) throw error;
        toast.success("Sponsor added successfully!");
      }
      
      fetchSponsors();
      resetForm();
    } catch (error) {
      toast.error("Failed to save sponsor");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('sponsors')
        .update({ is_active: false })
        .eq('id', id);
      
      if (error) throw error;
      toast.success("Sponsor removed successfully!");
      fetchSponsors();
    } catch (error) {
      toast.error("Failed to remove sponsor");
    }
  };

  const resetForm = () => {
    setFormData({ name: "", logo_url: "", website_url: "", description: "" });
    setEditingSponsor(null);
    setShowForm(false);
  };

  const startEdit = (sponsor: Sponsor) => {
    setEditingSponsor(sponsor);
    setFormData({
      name: sponsor.name,
      logo_url: sponsor.logo_url || "",
      website_url: sponsor.website_url || "",
      description: sponsor.description || "",
    });
    setShowForm(true);
  };

  if (sponsors.length === 0 && !isAdmin) {
    return null;
  }

  return (
    <section className="container mx-auto px-4 py-16">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-bold text-primary">Our Partners</h2>
        {isAdmin && (
          <Button onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Partner
          </Button>
        )}
      </div>

      {/* Admin Form */}
      {showForm && isAdmin && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{editingSponsor ? 'Edit Partner' : 'Add New Partner'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Partner Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="website_url">Website URL</Label>
                  <Input
                    id="website_url"
                    type="url"
                    value={formData.website_url}
                    onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="logo_url">Logo URL</Label>
                <Input
                  id="logo_url"
                  type="url"
                  value={formData.logo_url}
                  onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                />
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
              
              <div className="flex gap-2">
                <Button type="submit">
                  {editingSponsor ? 'Update' : 'Add'} Partner
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Sponsors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {sponsors.map((sponsor) => (
          <Card key={sponsor.id} className="text-center p-6 hover:shadow-lg transition-shadow">
            <CardContent className="p-0">
              {sponsor.logo_url && (
                <img
                  src={sponsor.logo_url}
                  alt={sponsor.name}
                  className="w-20 h-20 object-contain mx-auto mb-4"
                />
              )}
              <h3 className="font-semibold text-lg mb-2">{sponsor.name}</h3>
              {sponsor.description && (
                <p className="text-sm text-muted-foreground mb-4">{sponsor.description}</p>
              )}
              
              <div className="flex justify-center gap-2">
                {sponsor.website_url && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(sponsor.website_url, '_blank')}
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                )}
                
                {isAdmin && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => startEdit(sponsor)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(sponsor.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
};