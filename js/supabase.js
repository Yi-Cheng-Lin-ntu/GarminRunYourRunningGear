const SUPABASE_URL = "";
const SUPABASE_ANON_KEY = "";

let clientPromise;

export async function getSupabaseClient() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error("Supabase 尚未設定，請填入公開專案 URL 與 anon/publishable key。");
  }

  if (!clientPromise) {
    clientPromise = import("https://esm.sh/@supabase/supabase-js@2")
      .then(({ createClient }) => createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false
        }
      }))
      .catch((error) => {
        clientPromise = null;
        throw error;
      });
  }

  return clientPromise;
}