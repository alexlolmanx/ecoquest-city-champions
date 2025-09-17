import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAdmin } from "@/hooks/useAdmin";
import { toast } from "sonner";
import { Plus, Edit, Trash2, ExternalLink } from "lucide-react";

interface Sponsor {
  id: string;
  name: string;
  logo_url?: string;
  website_url?: string;
  description?: string;
  display_order: number;
}

export const SponsorsSection = () => {
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSponsor, setEditingSponsor] = useState<Sponsor | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    logo_url: "",
    website_url: "",
    description: "",
    display_order: 0
  });
  const { isAdmin } = useAdmin();

  useEffect(() => {
    fetchSponsors();
  }, []);

  const fetchSponsors = async () => {
    try {
      const { data, error } = await supabase
        .from('sponsors')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      setSponsors(data || []);
    } catch (error) {
      console.error('Error fetching sponsors:', error);
    } finally {
      setLoading(false);
    }
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
          .insert([formData]);

        if (error) throw error;
        toast.success("Sponsor added successfully!");
      }

      fetchSponsors();
      setDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving sponsor:', error);
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
      console.error('Error deleting sponsor:', error);
      toast.error("Failed to remove sponsor");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      logo_url: "",
      website_url: "",
      description: "",
      display_order: 0
    });
    setEditingSponsor(null);
  };

  const openEditDialog = (sponsor: Sponsor) => {
    setEditingSponsor(sponsor);
    setFormData({
      name: sponsor.name,
      logo_url: sponsor.logo_url || "",
      website_url: sponsor.website_url || "",
      description: sponsor.description || "",
      display_order: sponsor.display_order
    });
    setDialogOpen(true);
  };

  if (loading) return <div>Loading sponsors...</div>;

  return (
    <section className="py-12 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-2">Our Partners</h2>
            <p className="text-muted-foreground">
              Supporting organizations helping us make a difference
            </p>
          </div>
          
          {isAdmin && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm} className="bg-primary hover:bg-primary/90">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Partner
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingSponsor ? "Edit Partner" : "Add New Partner"}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="logo_url">Logo URL</Label>
                    <Input
                      id="logo_url"
                      type="url"
                      value={formData.logo_url}
                      onChange={(e) => setFormData({...formData, logo_url: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="website_url">Website URL</Label>
                    <Input
                      id="website_url"
                      type="url"
                      value={formData.website_url}
                      onChange={(e) => setFormData({...formData, website_url: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="display_order">Display Order</Label>
                    <Input
                      id="display_order"
                      type="number"
                      value={formData.display_order}
                      onChange={(e) => setFormData({...formData, display_order: parseInt(e.target.value)})}
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    {editingSponsor ? "Update Partner" : "Add Partner"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {sponsors.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No partners yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {sponsors.map((sponsor) => (
              <Card key={sponsor.id} className="relative group hover:shadow-lg transition-shadow">
                <CardContent className="p-6 text-center">
                  {sponsor.logo_url && (
                    <img
                      src={sponsor.logo_url}
                      alt={sponsor.name}
                      className="w-20 h-20 mx-auto mb-4 object-contain rounded-lg"
                    />
                  )}
                  <h3 className="font-semibold text-lg mb-2">{sponsor.name}</h3>
                  {sponsor.description && (
                    <p className="text-sm text-muted-foreground mb-4">{sponsor.description}</p>
                  )}
                  {sponsor.website_url && (
                    <a
                      href={sponsor.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-primary hover:text-primary/80 text-sm"
                    >
                      Visit Website
                      <ExternalLink className="w-3 h-3 ml-1" />
                    </a>
                  )}
                  
                  {isAdmin && (
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditDialog(sponsor)}
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(sponsor.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};