import { useState, useEffect } from "react";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf";
import Tesseract from "tesseract.js";

import Sidebar from "../components/Sidebar";
import PageHeader from "../components/common/PageHeader";
import FadeContent from "../components/animations/FadeContent";
import GlassCard from "../components/common/GlassCard";
import { FormInput, FormSelect, FormDatePicker, FormButton } from "../components/common/FormComponents";
import companyData from "../data/companyData";
import { supabase } from "../supabaseClient";

// Set worker source for pdfjsLib using legacy unpkg build
pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://unpkg.com/pdfjs-dist@4.8.69/legacy/build/pdf.worker.min.mjs";

// Component name normalization helper
function normalizeComponentName(name) {
  if (!name) return "";
  let norm = name.toUpperCase().trim();
  norm = norm.replace(/\s+/g, " "); // remove multiple spaces
  norm = norm.replace(/([.,-])\1+/g, "$1"); // remove duplicate punctuation
  norm = norm.replace(/(\d+)\s*X\s*(\d+)/g, "$1X$2"); // standardize x/X spacing
  return norm.trim();
}

function AddOrder() {
  const [formData, setFormData] = useState({
    poNumber: "",
    company: "",
    component: "",
    plant: "",
    orderedQty: "",
    rate: "",
    poDate: "",
  });

  const [dbComponents, setDbComponents] = useState([]);

  // OCR, upload, and confidence states
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [uploadedDocUrl, setUploadedDocUrl] = useState("");
  const [uploadedDocName, setUploadedDocName] = useState("");

  const [confidence, setConfidence] = useState({
    poNumber: 0,
    poDate: 0,
    company: 0,
    component: 0,
    orderedQty: 0,
    rate: 0,
    plant: 0
  });

  useEffect(() => {
    async function loadInitialData() {
      // Fetch plants
      await supabase.from("plants").select("*");

      // Fetch components from database
      const { data: compData, error: compErr } = await supabase
        .from("components")
        .select("*")
        .order("component_name", { ascending: true });

      if (compErr) {
        console.error("Error loading components:", compErr);
      } else {
        setDbComponents(compData || []);
      }
    }

    loadInitialData();
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  async function handleFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    setUploadStatus("Uploading file to Supabase storage...");
    setErrorMessage("");
    setConfidence({
      poNumber: 0,
      poDate: 0,
      company: 0,
      component: 0,
      orderedQty: 0,
      rate: 0,
      plant: 0
    });

    const fileName = `${Date.now()}_${file.name}`;
    let publicUrl = "";

    // 1. Upload to Supabase Storage (bucket: purchase-orders)
    try {
      const { error } = await supabase.storage
        .from("purchase-orders")
        .upload(fileName, file);

      if (error) {
        console.warn("Storage upload failed (running local extraction only):", error.message);
        setUploadStatus("Upload bypassed (running local extraction)...");
      } else {
        // Get public URL
        const { data: urlData } = supabase.storage
          .from("purchase-orders")
          .getPublicUrl(fileName);
        publicUrl = urlData?.publicUrl || "";
        setUploadedDocUrl(publicUrl);
        setUploadedDocName(file.name);
      }
    } catch (err) {
      console.warn("Storage upload exception:", err);
      setUploadStatus("Upload bypassed (running local extraction)...");
    }

    setUploadStatus("Extracting text from Purchase Order...");

    let extractedText = "";

    try {
      if (file.type === "application/pdf") {
        extractedText = await extractTextFromPDF(file);
      } else if (file.type.startsWith("image/")) {
        extractedText = await extractTextFromImage(file);
      } else {
        throw new Error("Unsupported file type. Please upload a PDF or image.");
      }

      setUploadStatus("Analyzing PO content...");
      const parsedData = extractPOData(extractedText);

      // Perform dynamic component matching
      let componentName = parsedData.component || formData.component;
      let matchedComp = null;

      if (componentName) {
        const normalizedExtracted = normalizeComponentName(componentName);
        matchedComp = dbComponents.find(
          (c) => normalizeComponentName(c.component_name) === normalizedExtracted
        );

        if (matchedComp) {
          console.log("Fuzzy match found existing component:", matchedComp);
          componentName = matchedComp.component_name;
        } else {
          console.log("No fuzzy match found. Creating temporary component option...");
          const tempComp = {
            id: `temp-${Date.now()}`,
            component_name: componentName,
            status: "Auto Created",
            isTemp: true,
          };
          setDbComponents((prev) => [...prev.filter((c) => !c.isTemp), tempComp]);
          alert("New component detected and added automatically.");
        }
      }

      // Prefill form values
      setFormData({
        poNumber: parsedData.poNumber || formData.poNumber,
        company: parsedData.company || formData.company,
        component: componentName,
        plant: parsedData.plant || formData.plant,
        orderedQty: parsedData.orderedQty || formData.orderedQty,
        rate: parsedData.rate || formData.rate,
        poDate: parsedData.poDate || formData.poDate
      });

      setConfidence({
        ...parsedData.confidences,
        component: componentName ? 100 : 0,
      });

      setUploadStatus("");
      setIsUploading(false);
      alert("Purchase Order parsed successfully! Form prefilled.");
    } catch (err) {
      console.error("Text extraction failed:", err);
      setErrorMessage("Failed to extract text from PO: " + err.message);
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

  // Heuristics PO extraction
  function extractPOData(text) {
    let poNumber = "";
    let poDate = "";
    let company = "";
    let component = "";
    let orderedQty = "";
    let rate = "";
    let plant = "";

    let confidences = {
      poNumber: 0,
      poDate: 0,
      company: 0,
      component: 0,
      orderedQty: 0,
      rate: 0,
      plant: 0
    };

    const lowerText = text.toLowerCase();

    // 1. Extract Company Name
    const matchedCompany = companyData.find(c => lowerText.includes(c.toLowerCase()));
    if (matchedCompany) {
      company = matchedCompany;
      confidences.company = 100;
    } else {
      const firstLine = text.split("\n")[0]?.trim() || "";
      if (firstLine.length > 3 && firstLine.length < 50) {
        company = firstLine;
        confidences.company = 35;
      }
    }

    // 2. Extract Component Name (Fuzzy Match inside handleFileChange)
    // We scan text for any of our existing components in DB
    const matchedComponent = dbComponents.find(c => lowerText.includes(c.component_name.toLowerCase()));
    if (matchedComponent) {
      component = matchedComponent.component_name;
      confidences.component = 100;
      if (matchedComponent.rate) {
        rate = matchedComponent.rate.toString();
        confidences.rate = 75;
      }
    } else {
      // Guess based on common component keywords if not found
      const descMatch = text.match(/(?:material|component|item|description|part)\s*(?::|)?\s*([A-Z0-9\s.-]{6,50})/i);
      if (descMatch) {
        component = descMatch[1].trim();
        confidences.component = 55;
      }
    }

    // 3. Extract PO Number
    const poNumMatch = text.match(/(?:po\s*number|purchase\s*order\s*no\.?|po\s*no\.?|order\s*#|po\s*#)\s*(?::|)?\s*([a-z0-9-_/]+)/i);
    if (poNumMatch) {
      poNumber = poNumMatch[1].trim();
      confidences.poNumber = 95;
    } else {
      const firstWordMatch = text.match(/\b[a-z0-9]{6,12}\b/i);
      if (firstWordMatch) {
        poNumber = firstWordMatch[0].trim();
        confidences.poNumber = 40;
      }
    }

    // 4. Extract PO Date
    const dateMatch = text.match(/(?:po\s*date|order\s*date|issue\s*date|date)\s*(?::|)?\s*\b(\d{4}[-/.]\d{2}[-/.]\d{2}|\d{2}[-/.]\d{2}[-/.]\d{4})\b/i);
    if (dateMatch) {
      let rawDate = dateMatch[1] || dateMatch[0];
      if (rawDate.includes("/") || rawDate.includes("-") || rawDate.includes(".")) {
        const parts = rawDate.split(/[-/.]/);
        if (parts[0].length === 2 && parts[2].length === 4) {
          poDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
        } else if (parts[0].length === 4) {
          poDate = `${parts[0]}-${parts[1]}-${parts[2]}`;
        }
        confidences.poDate = 95;
      }
    } else {
      const anyDateMatch = text.match(/\b(\d{4}[-/.]\d{2}[-/.]\d{2}|\d{2}[-/.]\d{2}[-/.]\d{4})\b/);
      if (anyDateMatch) {
        let rawDate = anyDateMatch[0];
        const parts = rawDate.split(/[-/.]/);
        if (parts[0].length === 2 && parts[2].length === 4) {
          poDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
        } else if (parts[0].length === 4) {
          poDate = `${parts[0]}-${parts[1]}-${parts[2]}`;
        }
        confidences.poDate = 70;
      } else {
        poDate = new Date().toISOString().split("T")[0];
        confidences.poDate = 50;
      }
    }

    // 5. Extract Quantity & Rate (RKFL Custom Parser with Fallback)
    const isRKFL = company.toLowerCase() === "rkfl" || lowerText.includes("rkfl") || lowerText.includes("ramkrishna");
    if (isRKFL) {
      console.log("Dedicated RKFL parser active.");
      const rkflRegex = /EA\s+([\d,]+\.\d+)\s+([\d.]+)\s+([\d,]+\.\d+)\s+([\d,]+\.\d+)\s+([\d,]+\.\d+)/i;
      const rkflMatch = text.match(rkflRegex);

      if (rkflMatch) {
        console.log("RKFL Regex Match Succeeded:", rkflMatch);
        orderedQty = Math.round(parseFloat(rkflMatch[1].replace(/,/g, ""))).toString();
        rate = parseFloat(rkflMatch[2]).toString();
        confidences.orderedQty = 100;
        confidences.rate = 100;
      } else {
        console.log("RKFL Regex Match Failed. Running fallback parser...");
        if (component) {
          const compIndex = lowerText.indexOf(component.toLowerCase());
          if (compIndex !== -1) {
            const afterCompText = text.substring(compIndex + component.length);
            const lines = afterCompText.split("\n").map((l) => l.trim()).filter((l) => l.length > 0);
            const nextLine = lines[0] || "";
            console.log("RKFL Fallback parsing line:", nextLine);

            const numbers = nextLine.match(/[\d,]+(?:\.\d+)?/g) || [];
            console.log("Numbers found in fallback line:", numbers);

            let foundQty = "";
            let foundRate = "";

            for (let i = 0; i < numbers.length; i++) {
              const numVal = parseFloat(numbers[i].replace(/,/g, ""));
              if (!foundQty && numVal > 100) {
                foundQty = Math.round(numVal).toString();
              } else if (foundQty && !foundRate && numVal > 0 && numVal <= 1000) {
                foundRate = numVal.toString();
              }
            }

            if (foundQty) {
              orderedQty = foundQty;
              confidences.orderedQty = 85;
            }
            if (foundRate) {
              rate = foundRate;
              confidences.rate = 85;
            }
          }
        }
      }
    }

    if (!orderedQty) {
      const qtyMatch = text.match(/(?:qty|quantity|ordered\s*qty|volume|quantity\s*ordered)\s*(?::|)?\s*(\d+)/i);
      if (qtyMatch) {
        orderedQty = qtyMatch[1];
        confidences.orderedQty = 90;
      }
    }

    if (!rate) {
      const rateMatch = text.match(/(?:rate|price|unit\s*price|cost)\s*(?::|)?\s*(?:rs\.?|₹)?\s*([\d,]+(?:\.\d{2})?)/i);
      if (rateMatch) {
        rate = rateMatch[1].replace(/,/g, "");
        confidences.rate = 95;
      }
    }

    // 7. Extract Plant
    const knownPlants = ["Plant 1", "Plant 2", "Plant 3", "Plant 5", "Plant 7"];
    const matchedPlant = knownPlants.find(p => lowerText.includes(p.toLowerCase()));
    if (matchedPlant) {
      plant = matchedPlant.replace(/\D/g, ""); // Extract only digit (e.g., "5")
      confidences.plant = 100;
    }

    return { poNumber, poDate, company, component, orderedQty, rate, plant, confidences };
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const { data: company } = await supabase
        .from("companies")
        .select("id")
        .eq("company_name", formData.company)
        .single();

      if (!company) {
        alert("Company not found");
        return;
      }

      // 1. Fuzzy match or auto-create component
      let componentId = null;
      let matchedComp = dbComponents.find(
        (c) => normalizeComponentName(c.component_name) === normalizeComponentName(formData.component)
      );

      if (matchedComp && !matchedComp.isTemp) {
        componentId = matchedComp.id;
        console.log("Using existing component:", matchedComp);
      } else {
        console.log("Component needs auto-creation:", formData.component);
        // Attempt insert with full metadata schema
        const insertObj = {
          component_name: formData.component,
          rate: formData.rate ? Number(formData.rate) : null,
          status: "Auto Created",
          created_source: "PO OCR",
          discovered_at: new Date().toISOString(),
          first_customer: formData.company,
          first_po_number: formData.poNumber
        };

        const { data: newComp, error: compErr } = await supabase
          .from("components")
          .insert([insertObj])
          .select()
          .single();

        if (compErr) {
          console.warn("Full metadata component insert failed, falling back to basic columns:", compErr.message);
          // Fallback schema (only columns verified by DB live checks)
          const fallbackObj = {
            component_name: formData.component,
            rate: formData.rate ? Number(formData.rate) : null
          };

          const { data: fallbackComp, error: fallbackErr } = await supabase
            .from("components")
            .insert([fallbackObj])
            .select()
            .single();

          if (fallbackErr) {
            console.error("Component creation failed completely:", fallbackErr);
            alert("Error auto-creating component: " + fallbackErr.message);
            return;
          }
          componentId = fallbackComp.id;
          console.log("Component created successfully with basic schema:", fallbackComp);
        } else {
          componentId = newComp.id;
          console.log("Component created successfully with metadata schema:", newComp);
        }

        // Add newly created component to dbComponents state
        const refreshedComp = {
          id: componentId,
          component_name: formData.component,
          status: "Auto Created"
        };
        setDbComponents((prev) => [...prev.filter((c) => c.component_name !== formData.component), refreshedComp]);
        alert("New component detected and added automatically.");
      }

      // Save PO and fix bug where plant was not stored
      const { data: purchaseOrder, error: poError } = await supabase
        .from("purchase_orders")
        .insert([
          {
            po_number: formData.poNumber,
            company_id: company.id,
            po_date: formData.poDate,
            plant: formData.plant
          }
        ])
        .select()
        .single();

      if (poError) {
        console.log(poError);
        alert("Error creating PO");
        return;
      }

      const { error: itemError } = await supabase
        .from("purchase_order_items")
        .insert([
          {
            purchase_order_id: purchaseOrder.id,
            component_id: componentId,
            ordered_qty: Number(formData.orderedQty),
            rate: Number(formData.rate)
          }
        ]);

      if (itemError) {
        console.log(itemError);
        alert("Error creating PO Item");
        return;
      }

      console.log("Successfully inserted Purchase Order:", purchaseOrder);
      console.log("Successfully inserted Purchase Order Item:", {
        purchase_order_id: purchaseOrder.id,
        component_id: componentId,
        ordered_qty: Number(formData.orderedQty),
        rate: Number(formData.rate)
      });

      // Save metadata to po_documents (table might be missing, catch error gracefully)
      if (purchaseOrder && uploadedDocUrl) {
        try {
          const { error: docError } = await supabase
            .from("po_documents")
            .insert([
              {
                purchase_order_id: purchaseOrder.id,
                file_name: uploadedDocName,
                file_url: uploadedDocUrl
              }
            ]);

          if (docError) {
            console.warn("po_documents save bypassed:", docError.message);
          }
        } catch (docErr) {
          console.warn("po_documents exception:", docErr);
        }
      }

      alert("Purchase Order Saved Successfully");
      
      setFormData({
        poNumber: "",
        company: "",
        component: "",
        plant: "",
        orderedQty: "",
        rate: "",
        poDate: "",
      });

      setUploadedDocName("");
      setUploadedDocUrl("");
      setConfidence({
        poNumber: 0,
        poDate: 0,
        company: 0,
        component: 0,
        orderedQty: 0,
        rate: 0,
        plant: 0
      });

    } catch (err) {
      console.log(err);
      alert("Unexpected Error");
    }
  };

  return (
    <div className="layout">
      <Sidebar />

      <div className="main-content">
        <FadeContent blur={true} duration={800} initialOpacity={0}>
          <PageHeader
            title="Add Purchase Order"
            subtitle="Enter new purchase orders received from customers."
          />

          <GlassCard style={{ maxWidth: "800px", margin: "0 auto" }}>
            {/* Upload PO Component */}
            <div style={{ marginBottom: "25px", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "20px" }}>
              <label style={{ display: "block", fontSize: "14px", color: "#cbd5e1", marginBottom: "10px", fontWeight: 600 }}>
                Upload PO File (PDF or Image)
              </label>
              <div style={{ display: "flex", gap: "15px", alignItems: "center" }}>
                <input
                  type="file"
                  accept=".pdf,image/*"
                  id="po-upload"
                  style={{ display: "none" }}
                  onChange={handleFileChange}
                  disabled={isUploading}
                />
                <label
                  htmlFor="po-upload"
                  className="dashboard-btn"
                  style={{
                    cursor: "pointer",
                    display: "inline-block",
                    margin: 0,
                    textAlign: "center"
                  }}
                >
                  {isUploading ? "Extracting..." : "Upload PO"}
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

            <form onSubmit={handleSubmit} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
              <FormInput
                label={
                  <span>
                    PO Number
                    {formData.poNumber && confidence.poNumber > 0 && (
                      <span style={{ fontSize: "11px", marginLeft: "8px", color: confidence.poNumber >= 80 ? "#4ade80" : "#fbbf24" }}>
                        ({confidence.poNumber}% match)
                      </span>
                    )}
                  </span>
                }
                name="poNumber"
                value={formData.poNumber}
                onChange={handleChange}
                required
              />

              <FormSelect
                label={
                  <span>
                    Company
                    {formData.company && confidence.company > 0 && (
                      <span style={{ fontSize: "11px", marginLeft: "8px", color: confidence.company >= 80 ? "#4ade80" : "#fbbf24" }}>
                        ({confidence.company}% match)
                      </span>
                    )}
                  </span>
                }
                name="company"
                value={formData.company}
                onChange={handleChange}
                required
              >
                <option value="">Select Company</option>
                {companyData.map((company) => (
                  <option key={company} value={company}>
                    {company}
                  </option>
                ))}
              </FormSelect>

              <FormSelect
                label={
                  <span>
                    Component
                    {formData.component && confidence.component > 0 && (
                      <span style={{ fontSize: "11px", marginLeft: "8px", color: confidence.component >= 80 ? "#4ade80" : "#fbbf24" }}>
                        ({confidence.component}% match)
                      </span>
                    )}
                    {(() => {
                      const selected = dbComponents.find(c => c.component_name === formData.component);
                      if (selected && (selected.status === "Auto Created" || selected.isTemp)) {
                        return (
                          <span style={{
                            background: "linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)",
                            color: "#ffffff",
                            fontSize: "10px",
                            padding: "2px 6px",
                            borderRadius: "6px",
                            marginLeft: "10px",
                            fontWeight: "bold"
                          }}>
                            AI Discovered
                          </span>
                        );
                      }
                      return null;
                    })()}
                  </span>
                }
                name="component"
                value={formData.component}
                onChange={handleChange}
                required
              >
                <option value="">Select Component</option>
                {dbComponents.map((item) => (
                  <option key={item.id} value={item.component_name}>
                    {item.component_name} {item.status === "Auto Created" || item.isTemp ? "[AI Discovered]" : ""}
                  </option>
                ))}
              </FormSelect>

              <FormSelect
                label={
                  <span>
                    Plant
                    {formData.plant && confidence.plant > 0 && (
                      <span style={{ fontSize: "11px", marginLeft: "8px", color: confidence.plant >= 80 ? "#4ade80" : "#fbbf24" }}>
                        ({confidence.plant}% match)
                      </span>
                    )}
                  </span>
                }
                name="plant"
                value={formData.plant}
                onChange={handleChange}
                required
              >
                <option value="">Select Plant</option>
                <option value="1">Plant 1</option>
                <option value="2">Plant 2</option>
                <option value="3">Plant 3</option>
                <option value="5">Plant 5</option>
                <option value="7">Plant 7</option>
              </FormSelect>

              <FormInput
                label={
                  <span>
                    Ordered Quantity
                    {formData.orderedQty && confidence.orderedQty > 0 && (
                      <span style={{ fontSize: "11px", marginLeft: "8px", color: confidence.orderedQty >= 80 ? "#4ade80" : "#fbbf24" }}>
                        ({confidence.orderedQty}% match)
                      </span>
                    )}
                  </span>
                }
                type="number"
                name="orderedQty"
                value={formData.orderedQty}
                onChange={handleChange}
                required
              />

              <FormInput
                label={
                  <span>
                    Rate
                    {formData.rate && confidence.rate > 0 && (
                      <span style={{ fontSize: "11px", marginLeft: "8px", color: confidence.rate >= 80 ? "#4ade80" : "#fbbf24" }}>
                        ({confidence.rate}% match)
                      </span>
                    )}
                  </span>
                }
                type="number"
                step="0.01"
                name="rate"
                value={formData.rate}
                onChange={handleChange}
                required
              />

              <div style={{ gridColumn: "span 2" }}>
                <FormDatePicker
                  label={
                    <span>
                      PO Date
                      {formData.poDate && confidence.poDate > 0 && (
                        <span style={{ fontSize: "11px", marginLeft: "8px", color: confidence.poDate >= 80 ? "#4ade80" : "#fbbf24" }}>
                          ({confidence.poDate}% match)
                        </span>
                      )}
                    </span>
                  }
                  name="poDate"
                  value={formData.poDate}
                  onChange={handleChange}
                  required
                />
              </div>

              <div style={{ gridColumn: "span 2", display: "flex", justifyContent: "flex-end", marginTop: "10px" }}>
                <FormButton type="submit" variant="primary" style={{ width: "100%" }}>
                  Save Purchase Order
                </FormButton>
              </div>
            </form>
          </GlassCard>
        </FadeContent>
      </div>
    </div>
  );
}

export default AddOrder;