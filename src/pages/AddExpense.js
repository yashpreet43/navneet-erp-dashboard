import { useState } from "react";
import { useNavigate } from "react-router-dom";
import * as pdfjsLib from "pdfjs-dist";
import Tesseract from "tesseract.js";

import Sidebar from "../components/Sidebar";
import PageHeader from "../components/common/PageHeader";
import FadeContent from "../components/animations/FadeContent";
import GlassCard from "../components/common/GlassCard";
import { FormInput, FormSelect, FormTextarea, FormDatePicker, FormButton } from "../components/common/FormComponents";
import { supabase } from "../supabaseClient";

// Set worker source for pdfjsLib using CDN
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

function AddExpense() {
  const navigate = useNavigate();

  const [date, setDate] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [remarks, setRemarks] = useState("");
  
  // OCR & upload states
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [uploadedDocUrl, setUploadedDocUrl] = useState("");
  const [uploadedDocName, setUploadedDocName] = useState("");
  const [entryType, setEntryType] = useState("manual");

  async function handleFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    setUploadStatus("Uploading file to Supabase storage...");
    setErrorMessage("");

    const fileName = `${Date.now()}_${file.name}`;
    let publicUrl = "";

    // 1. Upload to Supabase Storage (bucket: expense-bills)
    try {
      const { error } = await supabase.storage
        .from("expense-bills")
        .upload(fileName, file);

      if (error) {
        console.warn("Storage upload failed (running local extraction only):", error.message);
        setUploadStatus("Upload bypassed (running local extraction)...");
      } else {
        // Get public URL
        const { data: urlData } = supabase.storage
          .from("expense-bills")
          .getPublicUrl(fileName);
        publicUrl = urlData?.publicUrl || "";
        setUploadedDocUrl(publicUrl);
        setUploadedDocName(file.name);
      }
    } catch (err) {
      console.warn("Storage upload exception:", err);
      setUploadStatus("Upload bypassed (running local extraction)...");
    }

    setUploadStatus("Extracting text from bill...");

    let extractedText = "";

    try {
      if (file.type === "application/pdf") {
        extractedText = await extractTextFromPDF(file);
      } else if (file.type.startsWith("image/")) {
        extractedText = await extractTextFromImage(file);
      } else {
        throw new Error("Unsupported file type. Please upload a PDF or image.");
      }

      setUploadStatus("Analyzing bill content...");
      const parsedData = extractInvoiceData(extractedText);

      if (parsedData.category === "Electricity" || parsedData.category === "Water") {
        // Prefill form
        if (parsedData.date) setDate(parsedData.date);
        if (parsedData.category) setCategory(parsedData.category);
        if (parsedData.amount) setAmount(parsedData.amount);
        
        let desc = `Extracted bill from ${parsedData.vendor || "Utility Vendor"}`;
        setDescription(desc);
        setRemarks(`OCR extracted. Vendor: ${parsedData.vendor || "N/A"}`);
        setEntryType("automatic");
        
        setUploadStatus("");
        setIsUploading(false);
        alert(`Successfully parsed ${parsedData.category} bill! Form prefilled.`);
      } else {
        // Not electricity or water bill
        setEntryType("manual");
        setUploadStatus("");
        setIsUploading(false);
        alert("Uploaded bill is not classified as an Electricity or Water bill. OCR extraction is only supported for utility bills. Please fill out details manually.");
      }
    } catch (err) {
      console.error("Text extraction failed:", err);
      setErrorMessage("Failed to extract text from bill: " + err.message);
      setEntryType("manual");
      setIsUploading(false);
      setUploadStatus("");
    }
  }

  // Client-side PDF text parser using pdfjs-dist
  async function extractTextFromPDF(file) {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    let fullText = "";

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item) => item.str).join(" ");
      fullText += pageText + "\n";
    }
    return fullText;
  }

  // Client-side image OCR parser using Tesseract.js
  async function extractTextFromImage(file) {
    const { data: { text } } = await Tesseract.recognize(file, "eng");
    return text;
  }

  // Heuristics invoice extraction
  function extractInvoiceData(text) {
    let amount = "";
    let date = "";
    let vendor = "";
    let category = "";

    // 1. Extract Amount
    const amountMatch = text.match(/(?:total|amount|due|net|sum|₹|rs\.?)\s*(?::|)?\s*(?:rs\.?|₹)?\s*([\d,]+(?:\.\d{2})?)/i);
    if (amountMatch) {
      amount = amountMatch[1].replace(/,/g, "");
    } else {
      const decimalMatch = text.match(/\b\d+[.,]\d{2}\b/);
      if (decimalMatch) {
        amount = decimalMatch[0].replace(/,/g, "");
      }
    }

    // 2. Extract Date
    const dateMatch = text.match(/\b(\d{4}[-/.]\d{2}[-/.]\d{2})|(\d{2}[-/.]\d{2}[-/.]\d{4})\b/);
    if (dateMatch) {
      let rawDate = dateMatch[0];
      if (rawDate.includes("/") || rawDate.includes("-") || rawDate.includes(".")) {
        const parts = rawDate.split(/[-/.]/);
        if (parts[0].length === 2 && parts[2].length === 4) {
          // DD/MM/YYYY -> YYYY-MM-DD
          date = `${parts[2]}-${parts[1]}-${parts[0]}`;
        } else if (parts[0].length === 4) {
          // YYYY/MM/DD -> YYYY-MM-DD
          date = `${parts[0]}-${parts[1]}-${parts[2]}`;
        }
      }
    } else {
      date = new Date().toISOString().split("T")[0];
    }

    // 3. Extract Vendor Name
    const vendorMatch = text.match(/(?:vendor|supplier|company|seller|billed\s+from|issued\s+by)\s*(?::|)?\s*([^\n\r,]+)/i);
    if (vendorMatch) {
      vendor = vendorMatch[1].trim();
    } else {
      const lines = text.split("\n").map((l) => l.trim()).filter((l) => l.length > 0);
      if (lines.length > 0) {
        vendor = lines[0].substring(0, 50);
      }
    }

    // 4. Classify Category
    const lowerText = text.toLowerCase();
    if (lowerText.includes("electric") || lowerText.includes("power") || lowerText.includes("energy") || lowerText.includes("light")) {
      category = "Electricity";
    } else if (lowerText.includes("water") || lowerText.includes("sewer") || lowerText.includes("supply")) {
      category = "Water";
    }

    return { amount, date, vendor, category };
  }

  async function saveExpense() {
    if (!date || !category || !amount) {
      alert("Please fill in Date, Category, and Amount");
      return;
    }

    const { data: expenseData, error: expenseError } = await supabase
      .from("expenses")
      .insert([
        {
          expense_date: date,
          category,
          description,
          amount: Number(amount),
          payment_method: paymentMethod,
          status: "Pending",
          remarks,
          entry_type: entryType
        }
      ])
      .select();

    if (expenseError) {
      console.log(expenseError);
      alert("Error saving expense");
      return;
    }

    const newExpense = expenseData?.[0];

    // Save metadata if file upload was successful
    if (newExpense && uploadedDocUrl) {
      const { error: docError } = await supabase
        .from("expense_documents")
        .insert([
          {
            expense_id: newExpense.id,
            file_name: uploadedDocName,
            file_url: uploadedDocUrl
          }
        ]);

      if (docError) {
        console.error("Error saving document metadata:", docError);
        alert("Expense saved, but failed to link uploaded bill.");
      }
    }

    alert("Expense Added Successfully");
    navigate("/expenses");
  }

  return (
    <div className="layout">
      <Sidebar />

      <div className="main-content">
        <FadeContent blur={true} duration={800} initialOpacity={0}>
          <PageHeader
            title="Add Expense"
            subtitle="Log operational expenses manually or auto-extract utility bills."
          />

          <GlassCard style={{ maxWidth: "600px", margin: "0 auto" }}>
            {/* Upload Bill Component */}
            <div style={{ marginBottom: "25px", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "20px" }}>
              <label style={{ display: "block", fontSize: "14px", color: "#cbd5e1", marginBottom: "10px", fontWeight: 600 }}>
                Upload Bill (PDF or Image - Electricity & Water only)
              </label>
              <div style={{ display: "flex", gap: "15px", alignItems: "center" }}>
                <input
                  type="file"
                  accept=".pdf,image/*"
                  id="bill-upload"
                  style={{ display: "none" }}
                  onChange={handleFileChange}
                  disabled={isUploading}
                />
                <label
                  htmlFor="bill-upload"
                  className="dashboard-btn"
                  style={{
                    cursor: "pointer",
                    display: "inline-block",
                    margin: 0,
                    textAlign: "center"
                  }}
                >
                  {isUploading ? "Processing..." : "Upload Bill"}
                </label>
                {uploadedDocName && (
                  <span style={{ fontSize: "14px", color: "#4ade80" }}>
                    📎 {uploadedDocName}
                  </span>
                )}
              </div>
              {isUploading && (
                <div style={{ marginTop: "10px", fontSize: "13px", color: "#60a5fa" }}>
                  ⏳ {uploadStatus}
                </div>
              )}
              {errorMessage && (
                <div style={{ marginTop: "10px", fontSize: "13px", color: "#f87171" }}>
                  ❌ {errorMessage}
                </div>
              )}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <FormDatePicker
                label="Bill Date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />

              <FormSelect
                label="Category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="">Select Category</option>
                <option value="Electricity">Electricity</option>
                <option value="Water">Water</option>
                <option value="Labour">Labour</option>
                <option value="GST">GST</option>
                <option value="Raw Material">Raw Material</option>
                <option value="Maintenance">Maintenance</option>
              </FormSelect>

              <FormInput
                label="Description"
                placeholder="Enter description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />

              <FormInput
                label="Amount (₹)"
                type="number"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />

              <FormSelect
                label="Payment Method"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <option value="">Select Payment Method</option>
                <option value="Cash">Cash</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="UPI">UPI</option>
                <option value="Cheque">Cheque</option>
              </FormSelect>

              <FormTextarea
                label="Remarks"
                placeholder="Add comments or remarks..."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
              />

              <FormButton
                variant="primary"
                onClick={saveExpense}
                style={{ marginTop: "10px", width: "100%" }}
              >
                Save Expense
              </FormButton>
            </div>
          </GlassCard>
        </FadeContent>
      </div>
    </div>
  );
}

export default AddExpense;