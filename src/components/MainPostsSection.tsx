import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useAdmin } from "@/hooks/useAdmin";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Star } from "lucide-react";

interface MainPost {
  id: string;
  title: string;
  content: string;
  image_url?: string;
  is_featured: boolean;
  display_order: number;
}

export const MainPostsSection = () => {
  const [posts, setPosts] = useState<MainPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<MainPost | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    image_url: "",
    is_featured: false,
    display_order: 0
  });
  const { isAdmin } = useAdmin();

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('main_posts')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingPost) {
        const { error } = await supabase
          .from('main_posts')
          .update(formData)
          .eq('id', editingPost.id);

        if (error) throw error;
        toast.success("Post updated successfully!");
      } else {
        const { error } = await supabase
          .from('main_posts')
          .insert([formData]);

        if (error) throw error;
        toast.success("Post added successfully!");
      }

      fetchPosts();
      setDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving post:', error);
      toast.error("Failed to save post");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('main_posts')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
      toast.success("Post removed successfully!");
      fetchPosts();
    } catch (error) {
      console.error('Error deleting post:', error);
      toast.error("Failed to remove post");
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      content: "",
      image_url: "",
      is_featured: false,
      display_order: 0
    });
    setEditingPost(null);
  };

  const openEditDialog = (post: MainPost) => {
    setEditingPost(post);
    setFormData({
      title: post.title,
      content: post.content,
      image_url: post.image_url || "",
      is_featured: post.is_featured,
      display_order: post.display_order
    });
    setDialogOpen(true);
  };

  if (loading) return <div>Loading posts...</div>;

  return (
    <section className="py-16 bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-12">
          <div className="text-center w-full">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-4">
              EcoQuest
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Join the Environmental Revolution
            </p>
          </div>
          
          {isAdmin && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm} className="bg-primary hover:bg-primary/90 absolute top-4 right-4">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Post
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingPost ? "Edit Post" : "Add New Post"}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="content">Content</Label>
                    <Textarea
                      id="content"
                      value={formData.content}
                      onChange={(e) => setFormData({...formData, content: e.target.value})}
                      required
                      rows={4}
                    />
                  </div>
                  <div>
                    <Label htmlFor="image_url">Image URL</Label>
                    <Input
                      id="image_url"
                      type="url"
                      value={formData.image_url}
                      onChange={(e) => setFormData({...formData, image_url: e.target.value})}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_featured"
                      checked={formData.is_featured}
                      onCheckedChange={(checked) => setFormData({...formData, is_featured: checked})}
                    />
                    <Label htmlFor="is_featured">Featured Post</Label>
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
                    {editingPost ? "Update Post" : "Add Post"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {posts.map((post) => (
            <Card key={post.id} className={`relative group hover:shadow-xl transition-all duration-300 ${post.is_featured ? 'ring-2 ring-primary/50' : ''}`}>
              {post.is_featured && (
                <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground rounded-full p-2">
                  <Star className="w-4 h-4" />
                </div>
              )}
              
              {post.image_url && (
                <div className="h-48 overflow-hidden rounded-t-lg">
                  <img
                    src={post.image_url}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              )}
              
              <CardHeader>
                <CardTitle className={post.is_featured ? 'text-primary' : ''}>
                  {post.title}
                </CardTitle>
              </CardHeader>
              
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  {post.content}
                </p>
                
                {isAdmin && (
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditDialog(post)}
                        className="bg-background/80 backdrop-blur-sm"
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(post.id)}
                        className="bg-background/80 backdrop-blur-sm"
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
      </div>
    </section>
  );
};