import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  "https://dpkanbycxmihgcphbobl.supabase.co";

const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwa2FuYnljeG1paGdjcGhib2JsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAyODgxNDYsImV4cCI6MjA5NTg2NDE0Nn0.ubD-eRNQQptjWJPKB4A3233V9JYbPWK5z3G-tZFzfS0";

export const supabase =
  createClient(
    supabaseUrl,
    supabaseKey
  );