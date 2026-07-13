const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = "https://dpkanbycxmihgcphbobl.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwa2FuYnljeG1paGdjcGhib2JsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAyODgxNDYsImV4cCI6MjA5NTg2NDE0Nn0.ubD-eRNQQptjWJPKB4A3233V9JYbPWK5z3G-tZFzfS0";

const supabase = createClient(supabaseUrl, supabaseKey);

async function probe() {
  const testColumns = [
    "po_file_url",
    "po_file_name",
    "po_document",
    "bill_url",
    "attachment_url",
    "attachment_name",
    "file",
    "url",
    "po_pdf",
    "po_file"
  ];
  
  for (const col of testColumns) {
    const { error } = await supabase
      .from("purchase_orders")
      .select(col)
      .limit(1);
      
    if (error) {
      console.log(`Column '${col}': DOES NOT exist (Error: ${error.message})`);
    } else {
      console.log(`Column '${col}': EXISTS!`);
    }
  }
}

probe();
