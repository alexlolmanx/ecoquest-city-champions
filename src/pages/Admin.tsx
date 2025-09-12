import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Users, 
  Package, 
  BookOpen, 
  ClipboardList, 
  Star, 
  Plus,
  Edit,
  Trash2,
  Upload
} from "lucide-react";
import { toast } from "sonner";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  category: string;
  stock_quantity: number;
  is_active: boolean;
}

interface Test {
  id: string;
  title: string;
  description: string;
  instructions: string;
  time_limit: number;
  passing_score: number;
  is_active: boolean;
}

interface LibraryMaterial {
  id: string;
  title: string;
  description: string;
  content_type: string;
  file_url: string;
  category: string;
  author: string;
  is_active: boolean;
}

interface Community {
  id: string;
  name: string;
  description: string;
  image_url: string;
  member_count: number;
  is_active: boolean;
}

interface Review {
  id: string;
  title: string;
  content: string;
  rating: number;
  target_type: string;
  target_id: string;
  author_id: string;
  created_at: string;
}

export default function Admin() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // State for different sections
  const [products, setProducts] = useState<Product[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
  const [libraryMaterials, setLibraryMaterials] = useState<LibraryMaterial[]>([]);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);

  // Form states
  const [newProduct, setNewProduct] = useState({
    name: "", description: "", price: 0, category: "general", stock_quantity: 0
  });
  const [newTest, setNewTest] = useState({
    title: "", description: "", instructions: "", time_limit: 60, passing_score: 70
  });
  const [newLibraryMaterial, setNewLibraryMaterial] = useState({
    title: "", description: "", content_type: "pdf", category: "general", author: ""
  });
  const [newCommunity, setNewCommunity] = useState({
    name: "", description: ""
  });

  useEffect(() => {
    if (user) {
      checkAdminStatus();
    }
  }, [user]);

  const checkAdminStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user?.id)
        .eq('role', 'admin')
        .single();

      if (data) {
        setIsAdmin(true);
        loadAllData();
      }
    } catch (error) {
      console.log('Not an admin user');
    }
    setLoading(false);
  };

  const loadAllData = async () => {
    await Promise.all([
      loadProducts(),
      loadTests(),
      loadLibraryMaterials(),
      loadCommunities(),
      loadReviews()
    ]);
  };

  const loadProducts = async () => {
    const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    if (data) setProducts(data);
  };

  const loadTests = async () => {
    const { data, error } = await supabase.from('tests').select('*').order('created_at', { ascending: false });
    if (data) setTests(data);
  };

  const loadLibraryMaterials = async () => {
    const { data, error } = await supabase.from('library_materials').select('*').order('created_at', { ascending: false });
    if (data) setLibraryMaterials(data);
  };

  const loadCommunities = async () => {
    const { data, error } = await supabase.from('communities').select('*').order('created_at', { ascending: false });
    if (data) setCommunities(data);
  };

  const loadReviews = async () => {
    const { data, error } = await supabase.from('reviews').select('*').order('created_at', { ascending: false });
    if (data) setReviews(data);
  };

  const createProduct = async () => {
    const { error } = await supabase.from('products').insert({
      ...newProduct,
      created_by: user?.id
    });
    
    if (error) {
      toast.error('Failed to create product');
    } else {
      toast.success('Product created successfully');
      setNewProduct({ name: "", description: "", price: 0, category: "general", stock_quantity: 0 });
      loadProducts();
    }
  };

  const createTest = async () => {
    const { error } = await supabase.from('tests').insert({
      ...newTest,
      created_by: user?.id
    });
    
    if (error) {
      toast.error('Failed to create test');
    } else {
      toast.success('Test created successfully');
      setNewTest({ title: "", description: "", instructions: "", time_limit: 60, passing_score: 70 });
      loadTests();
    }
  };

  const createLibraryMaterial = async () => {
    const { error } = await supabase.from('library_materials').insert({
      ...newLibraryMaterial,
      created_by: user?.id
    });
    
    if (error) {
      toast.error('Failed to create library material');
    } else {
      toast.success('Library material created successfully');
      setNewLibraryMaterial({ title: "", description: "", content_type: "pdf", category: "general", author: "" });
      loadLibraryMaterials();
    }
  };

  const createCommunity = async () => {
    const { error } = await supabase.from('communities').insert({
      ...newCommunity,
      created_by: user?.id
    });
    
    if (error) {
      toast.error('Failed to create community');
    } else {
      toast.success('Community created successfully');
      setNewCommunity({ name: "", description: "" });
      loadCommunities();
    }
  };

  const deleteItem = async (table: 'products' | 'tests' | 'library_materials' | 'communities' | 'reviews', id: string, reloadFn: () => void) => {
    const { error } = await supabase.from(table).delete().eq('id', id);
    
    if (error) {
      toast.error(`Failed to delete ${table.slice(0, -1)}`);
    } else {
      toast.success(`${table.slice(0, -1)} deleted successfully`);
      reloadFn();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-eco-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground">
              You don't have admin privileges to access this panel.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-eco-primary/5 to-eco-secondary/10 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <Card className="border-eco-accent/20">
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-eco-primary to-eco-secondary">
              Admin Panel
            </CardTitle>
          </CardHeader>
        </Card>

        <Tabs defaultValue="products" className="space-y-6">
          <TabsList className="grid grid-cols-5 w-full">
            <TabsTrigger value="products" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              Shop
            </TabsTrigger>
            <TabsTrigger value="library" className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Library
            </TabsTrigger>
            <TabsTrigger value="tests" className="flex items-center gap-2">
              <ClipboardList className="w-4 h-4" />
              Tests
            </TabsTrigger>
            <TabsTrigger value="communities" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Communities
            </TabsTrigger>
            <TabsTrigger value="reviews" className="flex items-center gap-2">
              <Star className="w-4 h-4" />
              Reviews
            </TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  Add New Product
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="product-name">Product Name</Label>
                    <Input
                      id="product-name"
                      value={newProduct.name}
                      onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                      placeholder="Enter product name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="product-price">Price</Label>
                    <Input
                      id="product-price"
                      type="number"
                      value={newProduct.price}
                      onChange={(e) => setNewProduct({...newProduct, price: parseFloat(e.target.value)})}
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="product-description">Description</Label>
                  <Textarea
                    id="product-description"
                    value={newProduct.description}
                    onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                    placeholder="Enter product description"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="product-category">Category</Label>
                    <Select value={newProduct.category} onValueChange={(value) => setNewProduct({...newProduct, category: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">General</SelectItem>
                        <SelectItem value="eco-friendly">Eco-Friendly</SelectItem>
                        <SelectItem value="accessories">Accessories</SelectItem>
                        <SelectItem value="books">Books</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="product-stock">Stock Quantity</Label>
                    <Input
                      id="product-stock"
                      type="number"
                      value={newProduct.stock_quantity}
                      onChange={(e) => setNewProduct({...newProduct, stock_quantity: parseInt(e.target.value)})}
                      placeholder="0"
                    />
                  </div>
                </div>
                <Button onClick={createProduct} className="w-full">
                  Create Product
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Products ({products.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {products.map((product) => (
                    <div key={product.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <h3 className="font-semibold">{product.name}</h3>
                        <p className="text-sm text-muted-foreground">{product.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="secondary">${product.price}</Badge>
                          <Badge variant="outline">{product.category}</Badge>
                          <Badge variant={product.stock_quantity > 0 ? "default" : "destructive"}>
                            Stock: {product.stock_quantity}
                          </Badge>
                        </div>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteItem('products', product.id, loadProducts)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="library" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  Add Library Material
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="material-title">Title</Label>
                    <Input
                      id="material-title"
                      value={newLibraryMaterial.title}
                      onChange={(e) => setNewLibraryMaterial({...newLibraryMaterial, title: e.target.value})}
                      placeholder="Enter material title"
                    />
                  </div>
                  <div>
                    <Label htmlFor="material-author">Author</Label>
                    <Input
                      id="material-author"
                      value={newLibraryMaterial.author}
                      onChange={(e) => setNewLibraryMaterial({...newLibraryMaterial, author: e.target.value})}
                      placeholder="Enter author name"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="material-description">Description</Label>
                  <Textarea
                    id="material-description"
                    value={newLibraryMaterial.description}
                    onChange={(e) => setNewLibraryMaterial({...newLibraryMaterial, description: e.target.value})}
                    placeholder="Enter material description"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="material-type">Content Type</Label>
                    <Select value={newLibraryMaterial.content_type} onValueChange={(value) => setNewLibraryMaterial({...newLibraryMaterial, content_type: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pdf">PDF</SelectItem>
                        <SelectItem value="article">Article</SelectItem>
                        <SelectItem value="video">Video</SelectItem>
                        <SelectItem value="audio">Audio</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="material-category">Category</Label>
                    <Select value={newLibraryMaterial.category} onValueChange={(value) => setNewLibraryMaterial({...newLibraryMaterial, category: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">General</SelectItem>
                        <SelectItem value="environment">Environment</SelectItem>
                        <SelectItem value="science">Science</SelectItem>
                        <SelectItem value="education">Education</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button onClick={createLibraryMaterial} className="w-full">
                  Create Library Material
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Library Materials ({libraryMaterials.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {libraryMaterials.map((material) => (
                    <div key={material.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <h3 className="font-semibold">{material.title}</h3>
                        <p className="text-sm text-muted-foreground">By {material.author}</p>
                        <p className="text-sm text-muted-foreground">{material.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="secondary">{material.content_type}</Badge>
                          <Badge variant="outline">{material.category}</Badge>
                        </div>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteItem('library_materials', material.id, loadLibraryMaterials)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tests" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  Add New Test
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="test-title">Test Title</Label>
                  <Input
                    id="test-title"
                    value={newTest.title}
                    onChange={(e) => setNewTest({...newTest, title: e.target.value})}
                    placeholder="Enter test title"
                  />
                </div>
                <div>
                  <Label htmlFor="test-description">Description</Label>
                  <Textarea
                    id="test-description"
                    value={newTest.description}
                    onChange={(e) => setNewTest({...newTest, description: e.target.value})}
                    placeholder="Enter test description"
                  />
                </div>
                <div>
                  <Label htmlFor="test-instructions">Instructions</Label>
                  <Textarea
                    id="test-instructions"
                    value={newTest.instructions}
                    onChange={(e) => setNewTest({...newTest, instructions: e.target.value})}
                    placeholder="Enter test instructions"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="test-time">Time Limit (minutes)</Label>
                    <Input
                      id="test-time"
                      type="number"
                      value={newTest.time_limit}
                      onChange={(e) => setNewTest({...newTest, time_limit: parseInt(e.target.value)})}
                      placeholder="60"
                    />
                  </div>
                  <div>
                    <Label htmlFor="test-passing">Passing Score (%)</Label>
                    <Input
                      id="test-passing"
                      type="number"
                      value={newTest.passing_score}
                      onChange={(e) => setNewTest({...newTest, passing_score: parseInt(e.target.value)})}
                      placeholder="70"
                    />
                  </div>
                </div>
                <Button onClick={createTest} className="w-full">
                  Create Test
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tests ({tests.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {tests.map((test) => (
                    <div key={test.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <h3 className="font-semibold">{test.title}</h3>
                        <p className="text-sm text-muted-foreground">{test.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="secondary">{test.time_limit} min</Badge>
                          <Badge variant="outline">{test.passing_score}% to pass</Badge>
                        </div>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteItem('tests', test.id, loadTests)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="communities" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  Add New Community
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="community-name">Community Name</Label>
                  <Input
                    id="community-name"
                    value={newCommunity.name}
                    onChange={(e) => setNewCommunity({...newCommunity, name: e.target.value})}
                    placeholder="Enter community name"
                  />
                </div>
                <div>
                  <Label htmlFor="community-description">Description</Label>
                  <Textarea
                    id="community-description"
                    value={newCommunity.description}
                    onChange={(e) => setNewCommunity({...newCommunity, description: e.target.value})}
                    placeholder="Enter community description"
                  />
                </div>
                <Button onClick={createCommunity} className="w-full">
                  Create Community
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Communities ({communities.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {communities.map((community) => (
                    <div key={community.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <h3 className="font-semibold">{community.name}</h3>
                        <p className="text-sm text-muted-foreground">{community.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="secondary">{community.member_count} members</Badge>
                        </div>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteItem('communities', community.id, loadCommunities)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reviews" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Reviews ({reviews.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {reviews.map((review) => (
                    <div key={review.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <h3 className="font-semibold">{review.title}</h3>
                        <p className="text-sm text-muted-foreground">{review.content}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="secondary">{review.rating} stars</Badge>
                          <Badge variant="outline">{review.target_type}</Badge>
                        </div>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteItem('reviews', review.id, loadReviews)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}