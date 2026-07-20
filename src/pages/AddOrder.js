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
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

// Exclude list for component names to prevent header text from being treated as component name
const excludeHeaders = [
  "description", "hsn", "hsn/sac", "uom", "order qty", "qty", "rate", "value", 
  "serial", "sl.no", "sl no", "material", "material description", "item", "total",
  "grand total", "subtotal", "sub total", "purchasing document", "document date", 
  "plant", "unit rate", "basic amount", "final value"
];

const isHeader = (name) => {
  if (!name) return true;
  const lower = name.toLowerCase().trim();
  return excludeHeaders.some(h => lower.includes(h) || h.includes(lower)) || lower.length < 3;
};

// Clean component name from extra metadata and collapse duplicate names
function cleanComponentName(name) {
  if (!name) return "";
  
  // 1. Stop at markers
  const markersRegex = /Delivery Within|Delivery At|Indent No|GST|Basic Amount|Total|CGST|SGST|Freight|Remarks|Terms and Conditions/i;
  let cleaned = name.split(markersRegex)[0].trim();
  
  // 2. Collapse duplicates based on first word repetition
  const words = cleaned.split(/\s+/).filter(w => w.length > 0);
  if (words.length > 2) {
    const firstWord = words[0].toLowerCase();
    if (firstWord.length >= 3) {
      const lower = cleaned.toLowerCase();
      const secondIdx = lower.indexOf(firstWord, words[0].length);
      if (secondIdx !== -1) {
        const charBefore = lower[secondIdx - 1];
        const charAfter = lower[secondIdx + firstWord.length];
        const isWordBoundaryBefore = !charBefore || /\s/.test(charBefore);
        const isWordBoundaryAfter = !charAfter || /\s/.test(charAfter);
        
        if (isWordBoundaryBefore && isWordBoundaryAfter) {
          cleaned = cleaned.substring(0, secondIdx).trim();
        }
      }
    }
  }
  
  return cleaned;
}

// Robust table parser for structured rows (Serial No, Component, UOM, Qty, Rate, Value)
function extractRKCLTableRows(text) {
  const extractedItems = [];
  const lines = text.split("\n").map(l => l.trim()).filter(l => l.length > 0);
  const tokens = text.split(/\s+/).filter(t => t.length > 0);
  
  let lastMatchEndIndex = -1;
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (/^(EA|NOS|PCS)$/i.test(token)) {
      if (i + 3 < tokens.length) {
        const qtyStr = tokens[i+1];
        const rateStr = tokens[i+2];
        const valStr = tokens[i+3];
        
        const isQty = /^[\d,]+(?:\.\d+)?$/.test(qtyStr);
        const isRate = /^[\d,]+(?:\.\d+)?$/.test(rateStr);
        const isVal = /^[\d,]+(?:\.\d+)?$/.test(valStr);
        
        if (isQty && isRate && isVal) {
          let componentStartIdx = lastMatchEndIndex + 1;
          
          for (let j = i - 1; j > lastMatchEndIndex; j--) {
            if (/^\d{1,3}$/.test(tokens[j])) {
              componentStartIdx = j + 1;
              break;
            }
          }
          
          if (componentStartIdx < i) {
            const componentName = cleanComponentName(tokens.slice(componentStartIdx, i).join(" "));
            if (!isHeader(componentName)) {
              extractedItems.push({
                componentName: componentName.trim(),
                orderedQty: Math.round(parseFloat(qtyStr.replace(/,/g, ""))).toString(),
                rate: parseFloat(rateStr.replace(/,/g, "")).toString(),
                amount: parseFloat(valStr.replace(/,/g, "")).toString()
              });
              lastMatchEndIndex = i + 3;
            }
          }
        }
      }
    }
  }

  // Fallback: If no items found by token scanning, use the global regex (without newlines in component name)
  if (extractedItems.length === 0) {
    const globalRegex = /\b(\d{1,3})\s+([A-Z0-9 \t./()#*+-]{3,70}?)\s+\b(EA|NOS|PCS)\b\s+([\d,]+(?:\.\d+)?)\s+([\d,]+(?:\.\d+)?)\s+([\d,]+(?:\.\d+)?)\b/gi;
    let match;
    while ((match = globalRegex.exec(text)) !== null) {
      const name = cleanComponentName(match[2]);
      if (!isHeader(name)) {
        extractedItems.push({
          componentName: name,
          orderedQty: Math.round(parseFloat(match[4].replace(/,/g, ""))).toString(),
          rate: parseFloat(match[5].replace(/,/g, "")).toString(),
          amount: parseFloat(match[6].replace(/,/g, "")).toString()
        });
      }
    }
  }

  const matches = extractedItems.map(item => item.componentName);
  console.log("ALL OCR LINES:", lines);
  console.log("COMPONENT MATCHES:", matches);
  console.log("FINAL ITEMS:", extractedItems);

  console.log("Detected PO line items:", extractedItems);
  console.log("Total extracted items:", extractedItems.length);

  return extractedItems;
}



const matchOrRegisterComponents = (items, currentDbComponents) => {
  let updatedDbComponents = [...currentDbComponents];
  const processedItems = items.map(item => {
    const normalizedExtracted = normalizeComponentName(item.componentName);
    const matchedComp = updatedDbComponents.find(
      (c) => normalizeComponentName(c.component_name) === normalizedExtracted
    );

    let finalComponentName = item.componentName;
    if (matchedComp) {
      finalComponentName = matchedComp.component_name;
    } else {
      const tempComp = {
        id: `temp-${Date.now()}-${Math.random()}`,
        component_name: item.componentName,
        status: "Auto Created",
        isTemp: true,
      };
      updatedDbComponents.push(tempComp);
    }
    
    return {
      ...item,
      componentName: finalComponentName
    };
  });

  return { processedItems, updatedDbComponents };
};

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
  const [extractedComponents, setExtractedComponents] = useState([]);

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
      let updatedDb = [...dbComponents];
      let resolvedItems = [];

      if (parsedData.extractedComponents && parsedData.extractedComponents.length > 0) {
        const matchResult = matchOrRegisterComponents(parsedData.extractedComponents, dbComponents);
        resolvedItems = matchResult.processedItems;
        updatedDb = matchResult.updatedDbComponents;
        setDbComponents(updatedDb);
        setExtractedComponents(resolvedItems);
        
        // Use the first resolved item
        componentName = resolvedItems[0].componentName;
        parsedData.orderedQty = resolvedItems[0].orderedQty;
        parsedData.rate = resolvedItems[0].rate;
      } else {
        setExtractedComponents([]);
        if (componentName) {
          const normalizedExtracted = normalizeComponentName(componentName);
          const matchedComp = dbComponents.find(
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
      }

      const candidates = parsedData.extractedComponents && parsedData.extractedComponents.length > 0
        ? parsedData.extractedComponents.map(c => c.componentName)
        : (componentName && componentName !== "No component identified" ? [componentName] : []);

      console.log("RAW PDF TEXT:", extractedText);
      console.log("COMPONENT CANDIDATES:", candidates);
      console.log("SELECTED COMPONENT:", componentName);

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

    // Prioritize structured table extraction
    const extractedComponents = extractRKCLTableRows(text);
    if (extractedComponents.length > 0) {
      component = extractedComponents[0].componentName;
      orderedQty = extractedComponents[0].orderedQty;
      rate = extractedComponents[0].rate;
      confidences.component = 100;
      confidences.orderedQty = 100;
      confidences.rate = 100;
    } else {
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
          const guessedName = cleanComponentName(descMatch[1]);
          if (!isHeader(guessedName)) {
            component = guessedName;
            confidences.component = 55;
          }
        }
      }
    }

    if (!component || isHeader(component)) {
      component = "No component identified";
      confidences.component = 0;
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

    return { poNumber, poDate, company, component, orderedQty, rate, plant, extractedComponents, confidences };
  }

  const resolveOrCreateComponentId = async (compName, rate, companyName, poNumber) => {
    let matchedComp = dbComponents.find(
      (c) => normalizeComponentName(c.component_name) === normalizeComponentName(compName)
    );

    if (matchedComp && !matchedComp.id.toString().startsWith("temp")) {
      return matchedComp.id;
    }

    // Auto-create component
    const insertObj = {
      component_name: compName,
      rate: rate ? Number(rate) : null,
      status: "Auto Created",
      created_source: "PO OCR",
      discovered_at: new Date().toISOString(),
      first_customer: companyName,
      first_po_number: poNumber
    };

    const { data: newComp, error: compErr } = await supabase
      .from("components")
      .insert([insertObj])
      .select()
      .single();

    if (compErr) {
      console.warn("Full metadata component insert failed, falling back to basic columns:", compErr.message);
      const fallbackObj = {
        component_name: compName,
        rate: rate ? Number(rate) : null
      };

      const { data: fallbackComp, error: fallbackErr } = await supabase
        .from("components")
        .insert([fallbackObj])
        .select()
        .single();

      if (fallbackErr) {
        console.error("Component creation failed completely:", fallbackErr);
        throw new Error("Error auto-creating component: " + fallbackErr.message);
      }
      return fallbackComp.id;
    }
    return newComp.id;
  };

  const handlePreviewChange = (index, field, value) => {
    setExtractedComponents((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handlePreviewDelete = (index) => {
    setExtractedComponents((prev) => prev.filter((_, idx) => idx !== index));
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsUploading(true);
    setUploadStatus("Saving order data to database...");

    try {
      const { data: company } = await supabase
        .from("companies")
        .select("id")
        .eq("company_name", formData.company)
        .single();

      if (!company) {
        alert("Company not found");
        setIsUploading(false);
        setUploadStatus("");
        return;
      }

      // Check if we are submitting multiple extracted components
      if (extractedComponents.length > 0) {
        console.log("Saving multiple PO items in batch:", extractedComponents);
        
        // Filter out invalid items
        const validItems = extractedComponents.filter(
          (item) => item.componentName && item.componentName !== "No component identified"
        );

        if (validItems.length === 0) {
          alert("No valid components to save.");
          setIsUploading(false);
          setUploadStatus("");
          return;
        }

        // 1. Prepare and insert purchase_orders rows in one operation
        const poRows = validItems.map(() => ({
          po_number: formData.poNumber,
          company_id: company.id,
          po_date: formData.poDate,
          plant: formData.plant
        }));

        const { data: insertedPOs, error: poError } = await supabase
          .from("purchase_orders")
          .insert(poRows)
          .select();

        if (poError) {
          console.error("Error creating POs in batch:", poError);
          throw new Error("Error creating POs in batch: " + poError.message);
        }

        if (!insertedPOs || insertedPOs.length !== validItems.length) {
          throw new Error("Batch PO insertion mismatch or empty result.");
        }

        // 2. Resolve component IDs and construct purchase_order_items rows
        const itemRows = [];
        for (let i = 0; i < validItems.length; i++) {
          const item = validItems[i];
          const componentId = await resolveOrCreateComponentId(
            item.componentName,
            item.rate,
            formData.company,
            formData.poNumber
          );

          itemRows.push({
            purchase_order_id: insertedPOs[i].id,
            component_id: componentId,
            ordered_qty: Number(item.orderedQty),
            rate: Number(item.rate)
          });
        }

        // 3. Batch insert purchase_order_items rows in one operation
        const { error: itemsError } = await supabase
          .from("purchase_order_items")
          .insert(itemRows);

        if (itemsError) {
          console.error("Error creating PO Items in batch:", itemsError);
          throw new Error("Error creating PO Items in batch: " + itemsError.message);
        }

        // 4. Optionally insert doc urls linked to each inserted PO
        if (uploadedDocUrl) {
          const docRows = insertedPOs.map((po) => ({
            purchase_order_id: po.id,
            file_name: uploadedDocName,
            file_url: uploadedDocUrl
          }));
          try {
            await supabase.from("po_documents").insert(docRows);
          } catch (err) {
            console.warn("po_documents batch insert bypassed:", err);
          }
        }
      } else {
        // Fallback: single item manual submission
        if (!formData.component || formData.component === "No component identified") {
          alert("Please select or enter a valid component");
          setIsUploading(false);
          setUploadStatus("");
          return;
        }

        // 1. Resolve or create component
        const componentId = await resolveOrCreateComponentId(
          formData.component,
          formData.rate,
          formData.company,
          formData.poNumber
        );

        // 2. Insert PO
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
          throw new Error("Error creating PO: " + poError.message);
        }

        // 3. Insert PO Item
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
          throw new Error("Error creating PO Item: " + itemError.message);
        }

        // 4. Save doc url
        if (purchaseOrder && uploadedDocUrl) {
          try {
            await supabase.from("po_documents").insert([
              {
                purchase_order_id: purchaseOrder.id,
                file_name: uploadedDocName,
                file_url: uploadedDocUrl
              }
            ]);
          } catch (err) {
            console.warn("po_documents insert bypassed:", err);
          }
        }
      }

      setIsUploading(false);
      setUploadStatus("");
      alert("All purchase orders saved successfully!");
      
      setFormData({
        poNumber: "",
        company: "",
        component: "",
        plant: "",
        orderedQty: "",
        rate: "",
        poDate: "",
      });

      setExtractedComponents([]);
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
      console.error("Submission failed:", err);
      alert(err.message || "Error submitting purchase orders");
      setIsUploading(false);
      setUploadStatus("");
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
                  <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                    <span style={{ fontSize: "14px", color: "#4ade80" }}>
                      📎 {uploadedDocName}
                    </span>
                    {extractedComponents.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setExtractedComponents([]);
                          setFormData(prev => ({
                            ...prev,
                            component: "",
                            orderedQty: "",
                            rate: ""
                          }));
                          setUploadedDocName("");
                          setUploadedDocUrl("");
                        }}
                        style={{
                          background: "rgba(255,255,255,0.05)",
                          border: "1px solid rgba(255,255,255,0.1)",
                          color: "#cbd5e1",
                          padding: "4px 10px",
                          borderRadius: "6px",
                          cursor: "pointer",
                          fontSize: "12px"
                        }}
                      >
                        Clear Extracted Items
                      </button>
                    )}
                  </div>
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

              {extractedComponents.length === 0 && (
                <>
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
                </>
              )}

              {extractedComponents.length > 0 && (
                <div style={{ gridColumn: "span 2", marginTop: "20px" }}>
                  <h3 style={{ fontSize: "16px", color: "#60a5fa", marginBottom: "15px", fontWeight: 600 }}>
                    PO Line Items Preview ({extractedComponents.length} items)
                  </h3>
                  <div style={{ overflowX: "auto", background: "rgba(255, 255, 255, 0.02)", borderRadius: "8px", border: "1px solid rgba(255, 255, 255, 0.05)" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", color: "#e2e8f0" }}>
                      <thead>
                        <tr style={{ background: "rgba(255, 255, 255, 0.04)", borderBottom: "1px solid rgba(255, 255, 255, 0.08)" }}>
                          <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "13px", fontWeight: 600 }}>Component Name</th>
                          <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "13px", fontWeight: 600, width: "130px" }}>Qty</th>
                          <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "13px", fontWeight: 600, width: "120px" }}>Rate (₹)</th>
                          <th style={{ padding: "12px 16px", textAlign: "center", fontSize: "13px", fontWeight: 600, width: "80px" }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {extractedComponents.map((item, idx) => (
                          <tr key={idx} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", background: idx % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)" }}>
                            <td style={{ padding: "10px 16px" }}>
                              <input
                                type="text"
                                value={item.componentName}
                                onChange={(e) => handlePreviewChange(idx, "componentName", e.target.value)}
                                style={{
                                  background: "rgba(255, 255, 255, 0.05)",
                                  border: "1px solid rgba(255, 255, 255, 0.1)",
                                  borderRadius: "6px",
                                  padding: "6px 10px",
                                  color: "#ffffff",
                                  fontSize: "13px",
                                  width: "100%",
                                  outline: "none"
                                }}
                              />
                            </td>
                            <td style={{ padding: "10px 16px" }}>
                              <input
                                type="number"
                                value={item.orderedQty}
                                onChange={(e) => handlePreviewChange(idx, "orderedQty", e.target.value)}
                                style={{
                                  background: "rgba(255, 255, 255, 0.05)",
                                  border: "1px solid rgba(255, 255, 255, 0.1)",
                                  borderRadius: "6px",
                                  padding: "6px 10px",
                                  color: "#ffffff",
                                  fontSize: "13px",
                                  width: "100%",
                                  outline: "none"
                                }}
                              />
                            </td>
                            <td style={{ padding: "10px 16px" }}>
                              <input
                                type="number"
                                step="0.01"
                                value={item.rate}
                                onChange={(e) => handlePreviewChange(idx, "rate", e.target.value)}
                                style={{
                                  background: "rgba(255, 255, 255, 0.05)",
                                  border: "1px solid rgba(255, 255, 255, 0.1)",
                                  borderRadius: "6px",
                                  padding: "6px 10px",
                                  color: "#ffffff",
                                  fontSize: "13px",
                                  width: "100%",
                                  outline: "none"
                                }}
                              />
                            </td>
                            <td style={{ padding: "10px 16px", textAlign: "center" }}>
                              <button
                                type="button"
                                onClick={() => handlePreviewDelete(idx)}
                                style={{
                                  background: "rgba(239, 68, 68, 0.15)",
                                  border: "1px solid rgba(239, 68, 68, 0.3)",
                                  color: "#f87171",
                                  padding: "5px 10px",
                                  borderRadius: "6px",
                                  cursor: "pointer",
                                  fontSize: "12px",
                                  outline: "none"
                                }}
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div style={{ gridColumn: "span 2", display: "flex", justifyContent: "flex-end", marginTop: "10px" }}>
                <FormButton type="submit" variant="primary" style={{ width: "100%" }}>
                  {extractedComponents.length > 0 ? "Save All PO Line Items" : "Save Purchase Order"}
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