import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface MainPost {
  id: string;
  title: string;
  content: string;
  image_url?: string;
  is_featured: boolean;
  display_order: number;
}

interface MainPostEditorProps {
  onUpdate: () => void;
}

export const MainPostEditor = ({ onUpdate }: MainPostEditorProps) => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<MainPost[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingPost, setEditingPost] = useState<MainPost | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    image_url: "",
    is_featured: false,
  });

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    const { data, error } = await supabase
      .from('main_posts')
      .select('*')
      .order('display_order');
    
    if (!error && data) {
      setPosts(data);
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
          .insert({
            ...formData,
            created_by: user?.id,
            display_order: posts.length
          });
        
        if (error) throw error;
        toast.success("Post created successfully!");
      }
      
      fetchPosts();
      onUpdate();
      resetForm();
    } catch (error) {
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
      onUpdate();
    } catch (error) {
      toast.error("Failed to remove post");
    }
  };

  const resetForm = () => {
    setFormData({ title: "", content: "", image_url: "", is_featured: false });
    setEditingPost(null);
    setShowForm(false);
  };

  const startEdit = (post: MainPost) => {
    setEditingPost(post);
    setFormData({
      title: post.title,
      content: post.content,
      image_url: post.image_url || "",
      is_featured: post.is_featured,
    });
    setShowForm(true);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Manage Main Content</CardTitle>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Post
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Form */}
        {showForm && (
          <div className="mb-6 p-4 border rounded-lg">
            <h3 className="text-lg font-semibold mb-4">
              {editingPost ? 'Edit Post' : 'Create New Post'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={4}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="image_url">Image URL (optional)</Label>
                <Input
                  id="image_url"
                  type="url"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_featured"
                  checked={formData.is_featured}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
                />
                <Label htmlFor="is_featured">Featured Post</Label>
              </div>
              
              <div className="flex gap-2">
                <Button type="submit">
                  {editingPost ? 'Update' : 'Create'} Post
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Posts List */}
        <div className="space-y-4">
          {posts.map((post) => (
            <div key={post.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex-1">
                <h4 className="font-semibold">{post.title}</h4>
                <p className="text-sm text-muted-foreground line-clamp-2">{post.content}</p>
                {post.is_featured && (
                  <span className="inline-block bg-primary text-primary-foreground text-xs px-2 py-1 rounded mt-1">
                    Featured
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => startEdit(post)}>
                  <Edit2 className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleDelete(post.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};