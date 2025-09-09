import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Upload, User } from 'lucide-react';
import { toast } from 'sonner';

interface AvatarUploadProps {
  userId: string;
  currentAvatarUrl?: string | null;
  onAvatarUpdate?: (url: string) => void;
}

export const AvatarUpload = ({ userId, currentAvatarUrl, onAvatarUpdate }: AvatarUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadAvatar = async (file: File) => {
    try {
      setUploading(true);

      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;

      // Upload file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const avatarUrl = data.publicUrl;

      // Update user profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: avatarUrl })
        .eq('user_id', userId);

      if (updateError) {
        throw updateError;
      }

      onAvatarUpdate?.(avatarUrl);
      toast.success('Avatar updated successfully!');
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('Error uploading avatar. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (2MB limit)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('File size must be less than 2MB');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    uploadAvatar(file);
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="relative">
        <Avatar className="w-24 h-24 border-4 border-eco-accent/20">
          <AvatarImage src={currentAvatarUrl || undefined} />
          <AvatarFallback className="bg-eco-light text-eco-primary">
            <User className="w-8 h-8" />
          </AvatarFallback>
        </Avatar>
        
        <Button
          size="sm"
          variant="outline"
          className="absolute -bottom-2 -right-2 rounded-full w-8 h-8 p-0 bg-background border-eco-accent/20"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          <Upload className="w-4 h-4" />
        </Button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {uploading && (
        <p className="text-sm text-muted-foreground">Uploading avatar...</p>
      )}
    </div>
  );
};