const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = "https://dpkanbycxmihgcphbobl.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwa2FuYnljeG1paGdjcGhib2JsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAyODgxNDYsImV4cCI6MjA5NTg2NDE0Nn0.ubD-eRNQQptjWJPKB4A3233V9JYbPWK5z3G-tZFzfS0";

const supabase = createClient(supabaseUrl, supabaseKey);

async function probe() {
  const candidateTables = [
    "po_docs",
    "purchase_order_docs",
    "order_docs",
    "po_document_records",
    "po_files_metadata"
  ];
  
  for (const table of candidateTables) {
    const { error } = await supabase
      .from(table)
      .select("*")
      .limit(1);
    
    if (error) {
      console.log(`Table '${table}': DOES NOT exist (Error: ${error.message})`);
    } else {
      console.log(`Table '${table}': EXISTS!`);
    }
  }
}

probe();
