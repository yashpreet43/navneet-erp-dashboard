const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = "https://dpkanbycxmihgcphbobl.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwa2FuYnljeG1paGdjcGhib2JsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAyODgxNDYsImV4cCI6MjA5NTg2NDE0Nn0.ubD-eRNQQptjWJPKB4A3233V9JYbPWK5z3G-tZFzfS0";

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data, error } = await supabase
    .from("purchase_orders")
    .select("*")
    .limit(1);

  if (error) {
    console.error("Fetch error:", error);
  } else {
    console.log("Purchase Orders row sample:");
    console.dir(data, { depth: null });
  }
}

test();
