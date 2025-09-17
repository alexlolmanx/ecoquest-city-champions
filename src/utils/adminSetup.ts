import { supabase } from "@/integrations/supabase/client";

export const setupAdminRole = async () => {
  try {
    // This function is kept for potential future use
    // The admin role is now automatically created in the auth hook
    console.log("Admin setup function called");
  } catch (error) {
    console.error("Error in admin setup:", error);
  }
};

// Function to manually create admin role for a specific user
export const createAdminRole = async (userId: string) => {
  try {
    const { error } = await supabase
      .from('user_roles')
      .insert({
        user_id: userId,
        role: 'admin'
      });

    if (error) {
      console.error("Error creating admin role:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error in createAdminRole:", error);
    return false;
  }
};