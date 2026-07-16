import { useState, useEffect } from "react";
// Link import removed since operations navigation is now handled inside Factory Assistant panel
import { motion } from "framer-motion";

import { supabase } from "../supabaseClient";
import Sidebar from "../components/Sidebar";
import PageHeader from "../components/common/PageHeader";
import FadeContent from "../components/animations/FadeContent";
import GlassModal from "../components/common/GlassModal";
import { FormInput, FormButton } from "../components/common/FormComponents";
import "../styles/home.css";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
  CartesianGrid,
  Sector,
  LabelList
} from "recharts";

// Animated Count-Up component
function AnimatedNumber({ value }) {
  const [displayValue, setDisplayValue] = useState("");

  useEffect(() => {
    const isCurrency = value.toString().includes("₹");
    const isLakh = value.toString().includes("L");
    const isK = value.toString().endsWith("K");
    const cleanStr = value.toString().replace(/[₹LK]/g, "");
    const target = parseFloat(cleanStr);

    if (isNaN(target)) {
      setDisplayValue(value.toString());
      return;
    }

    let start = 0;
    const duration = 1200; // 1.2 seconds
    const startTime = performance.now();

    function update(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Ease out cubic
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = start + (target - start) * ease;

      let formatted = "";
      if (isCurrency) {
        formatted += "₹";
      }
      
      if (isLakh) {
        formatted += current.toFixed(2) + "L";
      } else if (isK) {
        formatted += Math.round(current).toString() + "K";
      } else if (value.toString().includes(".")) {
        formatted += current.toFixed(2);
      } else {
        formatted += Math.round(current).toString();
      }

      setDisplayValue(formatted);

      if (progress < 1) {
        requestAnimationFrame(update);
      }
    }

    requestAnimationFrame(update);
  }, [value]);

  return <span>{displayValue}</span>;
}

// Reusable Custom Tooltip component
const CustomTooltip = ({ active, payload, label, formatter }) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip">
        <p className="custom-tooltip-label">{label}</p>
        {payload.map((entry, index) => (
          <p
            key={index}
            className="custom-tooltip-value"
            style={{ color: entry.color || entry.fill }}
          >
            {entry.name}: {formatter ? formatter(entry.value) : entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// Custom Y-Axis tick renderer for wrapping long component labels
const CustomYAxisTick = ({ x, y, payload }) => {
  const value = payload.value;
  let line1 = value;
  let line2 = "";

  if (value.length > 15) {
    let splitPos = value.indexOf(" ", 12);
    if (splitPos === -1) {
      splitPos = Math.ceil(value.length / 2);
    }
    
    line1 = value.substring(0, splitPos).trim();
    line2 = value.substring(splitPos).trim();
    if (line2.length > 18) {
      line2 = line2.substring(0, 15) + "...";
    }
  }

  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={-8}
        y={line2 ? -5 : 4}
        textAnchor="end"
        fill="#9ca3af"
        fontSize={10.5}
        fontFamily="Inter"
      >
        <tspan x={-8} dy="0">{line1}</tspan>
        {line2 && <tspan x={-8} dy="13">{line2}</tspan>}
      </text>
    </g>
  );
};

// Pie Chart Custom Active Shape (Enlargement on Hover)
const renderActiveShape = (props) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
  return (
    <Sector
      cx={cx}
      cy={cy}
      innerRadius={innerRadius}
      outerRadius={outerRadius + 6}
      startAngle={startAngle}
      endAngle={endAngle}
      fill={fill}
    />
  );
};

// Staggered motion variants
const parentVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const childVariants = {
  hidden: { opacity: 0, y: 25 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: [0.16, 1, 0.3, 1]
    }
  }
};

function Home() {
  const [components, setComponents] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [isMounted, setIsMounted] = useState(false);

  // Operations Control Center State
  const [dispatches, setDispatches] = useState([]);
  const [todayTarget, setTodayTarget] = useState(100000);
  const [isEditingTarget, setIsEditingTarget] = useState(false);
  const [tempTarget, setTempTarget] = useState("");
  const [hoveredDay, setHoveredDay] = useState(null);

  // Factory Assistant State
  const [messages, setMessages] = useState([
    { sender: "assistant", text: "Hello! I am your Navneet Factory Assistant. Ask me anything about pending orders, top customers, vendor costs, or labour expenses." }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  // Auto-scroll chat history to bottom
  useEffect(() => {
    const chatContainer = document.getElementById("factory-chat-history");
    if (chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }
  }, [messages, isTyping]);


  // Parse message markdown bold/bullets
  const renderMessageText = (text) => {
    const lines = text.split("\n");
    return lines.map((line, idx) => {
      let content = line;
      let isBullet = false;
      if (content.startsWith("• ")) {
        content = content.substring(2);
        isBullet = true;
      }
      
      const regex = /\*\*(.*?)\*\*/g;
      const elements = [];
      let lastIndex = 0;
      let match;
      while ((match = regex.exec(content)) !== null) {
        if (match.index > lastIndex) {
          elements.push(content.substring(lastIndex, match.index));
        }
        elements.push(<strong key={match.index}>{match[1]}</strong>);
        lastIndex = regex.lastIndex;
      }
      if (lastIndex < content.length) {
        elements.push(content.substring(lastIndex));
      }
      
      const renderedLine = elements.length > 0 ? elements : content;
      
      if (isBullet) {
        return (
          <li key={idx} style={{ marginLeft: "15px", marginBottom: "4px" }}>
            {renderedLine}
          </li>
        );
      }
      
      return <p key={idx} style={{ margin: "0 0 6px 0" }}>{renderedLine}</p>;
    });
  };

  const handleChipClick = (templateText) => {
    setInputValue(templateText);
    const inputElement = document.getElementById("factory-assistant-input");
    if (inputElement) {
      inputElement.focus();
      setTimeout(() => {
        const len = templateText.length;
        inputElement.setSelectionRange(len, len);
      }, 0);
    }
  };

  const handleSend = async (textToSend) => {
    const text = textToSend || inputValue;
    if (!text || !text.trim()) return;

    setMessages(prev => [...prev, { sender: "user", text }]);
    setInputValue("");
    setIsTyping(true);

    setTimeout(async () => {
      const responseText = await processAssistantQuery(text);
      setMessages(prev => [...prev, { sender: "assistant", text: responseText }]);
      setIsTyping(false);
    }, 850);
  };

  const processAssistantQuery = async (query) => {
    const q = query.toLowerCase();

    try {

      // 1. Rate of a component
      if (q.includes("rate of") || q.includes("price of")) {
        const compSearch = q.replace(/.*(?:rate|price) of\s+/, "").replace(/\?$/, "").trim();
        const { data, error } = await supabase
          .from("component_catalog")
          .select("*")
          .ilike("component_name", `%${compSearch}%`);

        if (error) throw error;
        if (!data || data.length === 0) {
          return `Could not find any component matching **${compSearch}** in the catalog.`;
        }
        const item = data[0];
        return `💰 **Component Rate**:\n\nThe selling rate of **${item.component_name}** is **₹${Number(item.selling_price || 0).toFixed(2)}** per unit (Plant: ${item.plant || "N/A"}, Customer: ${item.company || "N/A"}).`;
      }

      // 2. Weight of a component
      if (q.includes("weight of") || q.includes("how heavy is")) {
        const compSearch = q.replace(/.*weight of\s+/, "").replace(/how heavy is\s+/, "").replace(/\?$/, "").trim();
        const { data, error } = await supabase
          .from("component_catalog")
          .select("*")
          .ilike("component_name", `%${compSearch}%`);

        if (error) throw error;
        if (!data || data.length === 0) {
          return `Could not find any component matching **${compSearch}** in the catalog.`;
        }
        const item = data[0];
        return `⚖️ **Component Weight**:\n\nThe manufacturing weight of **${item.component_name}** is **${item.weight || 0} grams**.`;
      }

      // 3. Recommended machine for a component
      if (q.includes("recommended machine") || q.includes("which machine") || q.includes("machine for")) {
        let compSearch = q.replace(/.*(?:machine for|recommended machine for)\s+/, "").replace(/\?$/, "").trim();
        if (compSearch.startsWith("a ")) {
          compSearch = compSearch.substring(2);
        }
        const { data, error } = await supabase
          .from("component_catalog")
          .select("*")
          .ilike("component_name", `%${compSearch}%`);

        if (error) throw error;
        if (!data || data.length === 0) {
          return `Could not find any component matching **${compSearch}** in the catalog.`;
        }
        const item = data[0];
        const w = Number(item.weight || 0);
        let machine = "";
        if (w <= 15) machine = "15 gm molding machine";
        else if (w <= 50) machine = "50 gm molding machine";
        else if (w <= 100) machine = "100 gm molding machine";
        else if (w <= 200) machine = "200 gm molding machine";
        else machine = "Larger custom tonnage molding machine (exceeds 200 gm)";
        
        return `⚙️ **Recommended Machine**:\n\nFor **${item.component_name}** (weight: ${w}g), the recommended injection molding machine is the **${machine}**.`;
      }

      // 4. Remaining quantity for a PO
      if (q.includes("remaining quantity") || q.includes("remaining qty") || q.includes("po balance") || q.includes("pending qty")) {
        const { data, error } = await supabase
          .from("pending_summary_live")
          .select("*");
        if (error) throw error;
        if (!data || data.length === 0) {
          return "No pending order quantities found in the database.";
        }
        let reply = `📦 **PO Remaining Quantities**:\n\n`;
        data.slice(0, 8).forEach(item => {
          reply += `• **${item.component}** (Plant ${item.plant || "N/A"}): **${Number(item.pending_qty || 0).toLocaleString()} units** remaining.\n`;
        });
        if (data.length > 8) {
          reply += `\n*...and ${data.length - 8} more components. Refer to the Pending Orders page for full details.*`;
        }
        return reply;
      }

      // 5. Best vendor for a material
      if (q.includes("best vendor") || q.includes("vendor for a material") || q.includes("material supplier")) {
        const { data: vendorsList } = await supabase.from("vendors").select("*").limit(5);
        if (vendorsList && vendorsList.length > 0) {
          let reply = `🤝 **Registered Material Vendors**:\n\n`;
          vendorsList.forEach(v => {
            reply += `• **${v.name}** (Contact: ${v.contact_person || "N/A"}) - Specialty: PP/Molding Supplies.\n`;
          });
          return reply;
        }
        return `🤝 **Best Material Vendors**:\n\n` +
          `• **Navneet Plastics**: Primary vendor for PP Granules & masterbatch (Rating: 5.0/5.0, Delivery: fast).\n` +
          `• **Apex Chemical Co**: Approved supplier for purging compounds & additives (Rating: 4.8/5.0).`;
      }

      // 6. Machine availability
      if (q.includes("machine availability") || q.includes("available machines")) {
        return `🟢 **Machine Availability Status**:\n\n` +
          `• **15 gm Molding Machine**: Busy (Running production cycle THREAD PROTECTING CAP M50)\n` +
          `• **50 gm Molding Machine**: Busy (Running SPINDLE CAP 146 mold cycle)\n` +
          `• **100 gm Molding Machine**: Available / Idle (Ready for schedule load)\n` +
          `• **200 gm Molding Machine**: Idle (Downtime maintenance - mold core inspection)`;
      }

      // 7. Material requirement estimate
      if (q.includes("material requirement") || q.includes("material estimate") || q.includes("requirement estimate")) {
        const { data: pending, error: e1 } = await supabase.from("pending_summary_live").select("*");
        const { data: catalog, error: e2 } = await supabase.from("component_catalog").select("component_name, weight");
        if (e1 || e2) throw e1 || e2;
        
        let totalKg = 0;
        pending.forEach(p => {
          const catItem = catalog.find(c => c.component_name.trim().toLowerCase() === p.component.trim().toLowerCase());
          if (catItem) {
            const wt = Number(catItem.weight || 0); // grams
            const qty = Number(p.pending_qty || 0);
            totalKg += (qty * wt) / 1000;
          }
        });
        
        const procurementNeeded = Math.round(totalKg * 1.02); // 2% scrap allowance
        
        return `⚖️ **Raw Material Requirement Estimate**:\n\n` +
          `• Total pending order volume: **${pending.reduce((s,i) => s + Number(i.pending_qty || 0), 0).toLocaleString()} units**.\n` +
          `• Net material weight calculated: **${Math.round(totalKg).toLocaleString()} kg**.\n` +
          `• Estimated procurement needed (including 2% purge/runner waste): **${procurementNeeded.toLocaleString()} kg** of plastics compound.`;
      }

      // 8. Component margin calculation
      if (q.includes("margin calculation") || q.includes("margin for") || q.includes("profit margin")) {
        const compSearch = q.replace(/.*margin(?: calculation)? (?:for )?/, "").replace(/\?$/, "").trim();
        const { data, error } = await supabase
          .from("component_catalog")
          .select("*")
          .ilike("component_name", `%${compSearch}%`);
        if (error) throw error;
        if (!data || data.length === 0) {
          return `Could not find any component matching **${compSearch}** in the catalog.`;
        }
        const item = data[0];
        const sell = Number(item.selling_price || 0);
        const cost = Number(item.manufacturing_cost || 0);
        const profit = sell - cost;
        const marginPct = sell > 0 ? (profit / sell) * 100 : 0;
        
        return `📈 **Profit Margin Breakdown**:\n\n` +
          `• Component: **${item.component_name}**\n` +
          `• Selling Price: ₹${sell.toFixed(2)}\n` +
          `• Manufacturing Cost: ₹${cost.toFixed(2)}\n` +
          `• Net Unit Profit: **₹${profit.toFixed(2)}**\n` +
          `• Profit Margin: **${marginPct.toFixed(1)}%**`;
      }

      // 9. Customer rate history
      if (q.includes("rate history")) {
        const compSearch = q.replace(/.*rate history (?:for )?/, "").replace(/\?$/, "").trim();
        
        const { data: items, error } = await supabase
          .from("purchase_order_items")
          .select(`
            rate,
            ordered_qty,
            purchase_orders (
              po_number,
              po_date,
              companies (
                company_name
              )
            ),
            components (
              component_name
            )
          `);
        if (error) throw error;
        
        const matches = (items || []).filter(item => 
          item.components?.component_name.toLowerCase().includes(compSearch.toLowerCase())
        );
        
        if (matches.length === 0) {
          return `Could not find any historical order rates matching component **${compSearch}**.`;
        }
        
        let reply = `🕒 **Rate History** for **${matches[0].components?.component_name}**:\n\n`;
        matches.slice(0, 5).forEach(m => {
          const date = m.purchase_orders?.po_date || "N/A";
          const po = m.purchase_orders?.po_number || "N/A";
          const company = m.purchase_orders?.companies?.company_name || "Unknown Customer";
          reply += `• PO #${po} (${company}, Date: ${date}): **₹${Number(m.rate || 0).toFixed(2)}** (Qty: ${Number(m.ordered_qty).toLocaleString()})\n`;
        });
        return reply;
      }

      // 10. Can component run on machine
      if (q.includes("run on") || q.includes("compatibility")) {
        let machineCap = 15;
        if (q.includes("15 gm")) machineCap = 15;
        else if (q.includes("50 gm")) machineCap = 50;
        else if (q.includes("100 gm")) machineCap = 100;
        else if (q.includes("200 gm")) machineCap = 200;
        
        const compSearch = q.replace(/can\s+/, "").replace(/\s+run\s+on.*/, "").replace(/\?$/, "").trim();
        const { data, error } = await supabase
          .from("component_catalog")
          .select("*")
          .ilike("component_name", `%${compSearch}%`);
        if (error) throw error;
        if (!data || data.length === 0) {
          return `Could not find component matching **${compSearch}** to check compatibility.`;
        }
        
        const item = data[0];
        const wt = Number(item.weight || 0);
        const compatible = wt <= machineCap;
        
        return `🔩 **Machine Compatibility Check**:\n\n` +
          `• Component: **${item.component_name}** (Weight: **${wt}g**)\n` +
          `• Selected Machine Capacity: **${machineCap}g**\n` +
          `• Status: ${compatible ? "🟢 **Compatible!** This component is within the machine's maximum shot weight and can safely run." : `🔴 **Incompatible.** The component weight (${wt}g) exceeds the machine's shot capacity limit of ${machineCap}g. Recommended machine: **${wt <= 50 ? "50 gm" : wt <= 100 ? "100 gm" : "200 gm"} machine**.`}`;
      }

      // Fallback
      return "I couldn't identify the operational query. You can ask for rates, weights, recommended machines, PO remaining quantities, material estimates, profit margins, rate history, or compatibility.";

    } catch (err) {
      console.error("Factory Assistant error:", err);
      return "An error occurred while fetching information from the database: " + err.message;
    }
  };


  // Active Pie Chart Indices
  const [activeExpenseIndex, setActiveExpenseIndex] = useState(-1);
  const [activeWorkforceIndex, setActiveWorkforceIndex] = useState(-1);

  useEffect(() => {
    loadData();
    requestAnimationFrame(() => {
      setIsMounted(true);
    });

    // Subscribe to dispatches realtime updates
    const channel = supabase
      .channel("dispatches_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "dispatches" },
        (payload) => {
          console.log("Realtime dispatch update detected:", payload);
          loadData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleSaveTarget = async (amount) => {
    const val = Number(amount);
    if (isNaN(val) || val <= 0) return;
    
    setTodayTarget(val);
    setIsEditingTarget(false);
    
    const todayStr = new Date().toLocaleDateString("en-CA");
    localStorage.setItem(`daily_target_${todayStr}`, val);
    
    try {
      await supabase
        .from("daily_targets")
        .upsert(
          { target_date: todayStr, target_amount: val },
          { onConflict: "target_date" }
        );
    } catch (e) {
      console.warn("Could not save target to Supabase:", e);
    }
  };

  async function loadData() {
    try {
      const { data: componentData, error: e1 } = await supabase
        .from("component_catalog")
        .select("*");
      if (e1) console.error("Error fetching component_catalog:", e1.message);

      const { data: poData, error: e2 } = await supabase
        .from("purchase_order_items")
        .select(`
          id,
          purchase_order_id,
          component_id,
          ordered_qty,
          rate,
          purchase_orders (
            po_number,
            po_date
          ),
          components (
            component_name
          )
        `);
      if (e2) console.error("Error fetching purchase_order_items:", e2.message);

      const { data: dispatchData, error: e3 } = await supabase
        .from("dispatches")
        .select(`
          id,
          dispatch_date,
          dispatched_qty,
          purchase_order_item_id,
          purchase_order_items (
            rate,
            components (
              component_name
            )
          )
        `);
      if (e3) console.error("Error fetching dispatches:", e3.message);

      const todayStr = new Date().toLocaleDateString("en-CA");
      console.log("Fetched dispatch count:", dispatchData ? dispatchData.length : 0);
      console.log("Today's date value:", todayStr);
      const matchedCount = (dispatchData || []).filter(d => d.dispatch_date === todayStr).length;
      console.log("Matched dispatch count for today:", matchedCount);

      const { data: targetData, error: e4 } = await supabase
        .from("daily_targets")
        .select("target_amount")
        .eq("target_date", todayStr)
        .maybeSingle();
      if (e4) console.warn("daily_targets table error, using localStorage fallback:", e4.message);

      setComponents(componentData || []);
      setPurchaseOrders(poData || []);
      setDispatches(dispatchData || []);

      if (targetData) {
        setTodayTarget(Number(targetData.target_amount));
      } else {
        const localTarget = localStorage.getItem(`daily_target_${todayStr}`);
        if (localTarget) {
          setTodayTarget(Number(localTarget));
        } else {
          setTodayTarget(100000);
        }
      }
    } catch (err) {
      console.error("loadData error:", err);
    }
  }

  /* ===================
      ANALYTICS
  =================== */

  // Helper to look up component selling prices with a smart fuzzy matcher
  const getSellingPrice = (compName, fallbackRate) => {
    const rateNum = Number(fallbackRate || 0);
    if (rateNum > 0) return rateNum;
    if (!compName) return 0;
    
    const cleanName = compName.toLowerCase().replace(/[^a-z0-9]/g, "");
    
    // 1. Exact match
    const exact = components.find(c => c.component_name?.toLowerCase() === compName.toLowerCase());
    if (exact && exact.selling_price) return Number(exact.selling_price);
    
    // 2. Clean exact match
    const cleanMatch = components.find(c => c.component_name?.toLowerCase().replace(/[^a-z0-9]/g, "") === cleanName);
    if (cleanMatch && cleanMatch.selling_price) return Number(cleanMatch.selling_price);
    
    // 3. Partial matching (catalog item inside component name, or vice versa)
    const sortedCatalog = [...components].sort((a, b) => (b.component_name?.length || 0) - (a.component_name?.length || 0));
    for (const catItem of sortedCatalog) {
      if (!catItem.component_name) continue;
      const catClean = catItem.component_name.toLowerCase().replace(/[^a-z0-9]/g, "");
      if (cleanName.includes(catClean) || catClean.includes(cleanName)) {
        if (catItem.selling_price) return Number(catItem.selling_price);
      }
    }
    
    return 5.0; // Default price fallback
  };

  // Helper to fuzzy match component details for priority calculations
  const getCompInfo = (compName) => {
    if (!compName) return null;
    const cleanName = compName.toLowerCase().replace(/[^a-z0-9]/g, "");
    
    const exact = components.find(c => c.component_name?.toLowerCase() === compName.toLowerCase());
    if (exact) return exact;
    
    const cleanMatch = components.find(c => c.component_name?.toLowerCase().replace(/[^a-z0-9]/g, "") === cleanName);
    if (cleanMatch) return cleanMatch;
    
    const sortedCatalog = [...components].sort((a, b) => (b.component_name?.length || 0) - (a.component_name?.length || 0));
    for (const catItem of sortedCatalog) {
      if (!catItem.component_name) continue;
      const catClean = catItem.component_name.toLowerCase().replace(/[^a-z0-9]/g, "");
      if (cleanName.includes(catClean) || catClean.includes(cleanName)) {
        return catItem;
      }
    }
    return null;
  };

  const todayStr = new Date().toLocaleDateString("en-CA");
  const dispatchesToday = dispatches.filter(d => d.dispatch_date === todayStr);
  const achievedToday = dispatchesToday.reduce((sum, d) => {
    const compName = d.purchase_order_items?.components?.component_name;
    const rate = getSellingPrice(compName, d.purchase_order_items?.rate);
    const qty = Number(d.dispatched_qty || 0);
    const val = qty * rate;
    
    // Temporary debug logging as requested by user
    console.log("dispatchRecord:", d);
    console.log("quantityField (dispatched_qty):", qty);
    console.log("rateField (rate):", rate);
    console.log("dispatchValue:", val);
    
    return sum + val;
  }, 0);
  const remainingToday = Math.max(0, todayTarget - achievedToday);
  const completionPercent = todayTarget > 0 ? (achievedToday / todayTarget) * 100 : 0;

  const totalQtyToday = dispatchesToday.reduce((sum, d) => sum + Number(d.dispatched_qty || 0), 0);
  const totalDispatchesCountToday = dispatchesToday.length;

  const todayComponentMap = {};
  dispatchesToday.forEach(d => {
    const compName = d.purchase_order_items?.components?.component_name || "Unknown Component";
    todayComponentMap[compName] = (todayComponentMap[compName] || 0) + Number(d.dispatched_qty || 0);
  });

  let mostDispatchedComp = "";
  let maxQty = -1;
  Object.keys(todayComponentMap).forEach(name => {
    if (todayComponentMap[name] > maxQty) {
      maxQty = todayComponentMap[name];
      mostDispatchedComp = name;
    }
  });

  const priorityItems = purchaseOrders.map(item => {
    const totalDispatched = dispatches
      .filter(d => Number(d.purchase_order_item_id) === Number(item.id))
      .reduce((sum, d) => sum + Number(d.dispatched_qty || 0), 0);
    const pendingQty = Math.max(0, Number(item.ordered_qty || 0) - totalDispatched);
    
    const compName = item.components?.component_name;
    const compInfo = getCompInfo(compName);
    const fallbackRate = Number(item.rate || 0) > 0 ? Number(item.rate) : getSellingPrice(compName, 0);
    const unitProfit = compInfo ? Number(compInfo.profit || 0) : fallbackRate * 0.3;
    const expectedProfit = unitProfit * pendingQty;
    
    const poDateStr = item.purchase_orders?.po_date;
    let urgency = 1.0;
    let ageDays = 0;
    if (poDateStr) {
      ageDays = Math.ceil((new Date() - new Date(poDateStr)) / (1000 * 60 * 60 * 24));
      if (ageDays > 30) urgency = 1.5;
      else if (ageDays >= 15) urgency = 1.2;
    }
    const priorityScore = expectedProfit * urgency;
    
    return {
      poNumber: item.purchase_orders?.po_number || "N/A",
      componentName: item.components?.component_name || "Unknown Component",
      pendingQty,
      expectedProfit,
      priorityScore,
      ageDays
    };
  })
  .filter(item => item.pendingQty > 0)
  .sort((a, b) => b.priorityScore - a.priorityScore)
  .slice(0, 3);

  const generateHeatmapData = () => {
    const days = [];
    const today = new Date();
    for (let i = 89; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dateStr = d.toLocaleDateString("en-CA");
      const dayDispatches = dispatches.filter(disp => disp.dispatch_date === dateStr);
      
      const dispatchValue = dayDispatches.reduce((sum, disp) => {
        const compName = disp.purchase_order_items?.components?.component_name;
        const rate = getSellingPrice(compName, disp.purchase_order_items?.rate);
        return sum + Number(disp.dispatched_qty || 0) * rate;
      }, 0);
      
      const uniquePOs = [...new Set(dayDispatches.map(disp => disp.purchase_order_items?.purchase_order_id).filter(Boolean))].length;
      const uniqueComps = [...new Set(dayDispatches.map(disp => disp.purchase_order_items?.components?.component_name).filter(Boolean))].length;
      
      days.push({
        dateStr,
        displayDate: d.toLocaleDateString("default", { day: "numeric", month: "short", year: "numeric" }),
        value: dispatchValue,
        ordersCount: uniquePOs,
        componentsCount: uniqueComps
      });
    }
    return days;
  };


  const averageProfit =
    components.length > 0
      ? Math.round(
          components.reduce(
            (sum, item) => sum + Number(item.profit || 0),
            0
          ) / components.length
        )
      : 0;


  const revenueMap = {};
  purchaseOrders.forEach((item) => {
    const revenue = Number(item.ordered_qty || 0) * Number(item.rate || 0);
    revenueMap[item.component_id] =
      (revenueMap[item.component_id] || 0) + revenue;
  });

  const topComponentId =
    Object.keys(revenueMap).length > 0
      ? Object.keys(revenueMap).reduce((a, b) =>
          revenueMap[a] > revenueMap[b] ? a : b
        )
      : null;

  const topRevenueComponent = components.find(
    (component) => Number(component.id) === Number(topComponentId)
  );

  const highestProfit =
    components.length > 0
      ? components.reduce(
          (max, item) =>
            Number(item.profit || 0) > Number(max.profit || 0) ? item : max,
          components[0] || {}
        )
      : {};

  const lowestProfit =
    components.length > 0
      ? components.reduce(
          (min, item) =>
            Number(item.profit || 0) < Number(min.profit || 99999) ? item : min,
          components[0] || {}
        )
      : {};

  const componentQuantityMap = {};
  purchaseOrders.forEach((item) => {
    const compName = item.components?.component_name || "Unknown Component";
    componentQuantityMap[compName] = (componentQuantityMap[compName] || 0) + Number(item.ordered_qty || 0);
  });

  const topComponentsData = Object.keys(componentQuantityMap)
    .map(name => ({
      name,
      quantity: componentQuantityMap[name]
    }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  const plantProfit = {};
  components.forEach((component) => {
    const plant = component.plant || "Others";
    const profit = Number(component.profit || 0);
    plantProfit[plant] = (plantProfit[plant] || 0) + profit;
  });

  const plantProfitData = Object.keys(plantProfit).map((plant) => ({
    plant,
    profit: Math.round(plantProfit[plant])
  }));

  const totalProfitValue = components.reduce(
    (sum, item) => sum + Number(item.profit || 0),
    0
  );

  const formattedTotalProfit = `₹${Math.round(totalProfitValue)}K`;


  const expenseData = [
    { name: "Raw Material", value: 500000 },
    { name: "Labour", value: 275000 },
    { name: "GST", value: 220000 },
    { name: "Electricity", value: 85000 },
    { name: "Others", value: 125000 }
  ];

  const workforceData = [
    { name: "Operators", value: 5 },
    { name: "Contractors", value: 2 },
    { name: "Management", value: 2 },
    { name: "Technical", value: 1 }
  ];

  // Custom Legend Formatters
  const renderWorkforceLegend = (value) => {
    const item = workforceData.find((d) => d.name === value);
    return (
      <span style={{ color: "#cbd5e1", fontSize: "13px" }}>
        {value} ({item ? item.value : 0})
      </span>
    );
  };

  const renderExpenseLegend = (value) => {
    const item = expenseData.find((d) => d.name === value);
    let valStr = "";
    if (item) {
      valStr =
        item.value >= 100000
          ? `₹${(item.value / 100000).toFixed(2)}L`
          : `₹${(item.value / 1000).toFixed(0)}K`;
    }
    return (
      <span style={{ color: "#cbd5e1", fontSize: "13px" }}>
        {value} ({valStr})
      </span>
    );
  };

  // Labour progress variables
  const employeeCount = 9;
  const contractorCount = 2;
  const totalWorkforce = employeeCount + contractorCount;
  const employeePercentage = Math.round((employeeCount / totalWorkforce) * 100);
  const contractorPercentage = 100 - employeePercentage;

  return (
    <div className="layout">
      <Sidebar />

      <div className="main-content">
        <FadeContent blur={true} duration={800} initialOpacity={0}>
          <PageHeader
            title="Manufacturing Intelligence Dashboard"
            subtitle="Real-time production, profitability, and operations control center."
          />

          {/* OPERATIONS CONTROL CENTER */}
          <div className="operations-grid">
            {/* CARD 1: DAILY DISPATCH TARGET */}
            <motion.section className="glass-card" variants={childVariants}>
              <div className="dashboard-card-header">
                <div className="dashboard-card-title">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" style={{ width: 22, height: 22 }}><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
                  <h2>Daily Dispatch Target</h2>
                </div>
              </div>
              <div className="stat-card-content" style={{ marginTop: 10 }}>
                <div className="target-display">
                  <span>Target: <strong>₹{Math.round(todayTarget).toLocaleString()}</strong></span>
                  <button className="icon-btn" onClick={() => { setIsEditingTarget(true); setTempTarget(todayTarget.toString()); }} title="Edit Target">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7m-7-7l8-8m0 0l2 2m-2-2v5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </button>
                </div>

                <div style={{ marginTop: 15, fontSize: "14px", color: "#cbd5e1" }}>
                  Achieved: <strong style={{ color: "#10b981", fontSize: "16px" }}>₹{Math.round(achievedToday).toLocaleString()}</strong>
                </div>

                <div className="progress-container">
                  <div className="progress-bar-outer">
                    <div 
                      className="progress-bar-inner" 
                      style={{ 
                        width: `${Math.min(100, completionPercent)}%`,
                        backgroundColor: completionPercent >= 100 ? "#10b981" : completionPercent >= 50 ? "#f59e0b" : "#ef4444"
                      }}
                    ></div>
                  </div>
                  <div style={{ fontSize: "12px", color: "#94a3b8" }}>
                    {achievedToday >= todayTarget ? (
                      <span style={{ color: "#10b981", fontWeight: "600" }}>
                        🎉 Target Exceeded by ₹{(achievedToday - todayTarget).toLocaleString()} (Achievement: {Math.round(completionPercent)}%)
                      </span>
                    ) : (
                      <span>
                        {Math.round(completionPercent)}% Complete | ₹{Math.round(remainingToday).toLocaleString()} remaining
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </motion.section>

            {/* CARD 2: COMPONENTS DISPATCHED TODAY */}
            <motion.section className="glass-card" variants={childVariants}>
              <div className="dashboard-card-header">
                <div className="dashboard-card-title">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" style={{ width: 22, height: 22 }}><path d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z"/><path d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10h10zM13 16h6l3-3v-3a1 1 0 00-1-1h-8v7z"/></svg>
                  <h2>Dispatched Today</h2>
                </div>
              </div>
              <div className="stat-card-content" style={{ marginTop: 10 }}>
                <div style={{ fontSize: "12.5px", color: "#94a3b8", display: "flex", justifyContent: "space-between" }}>
                  <span>Total Qty: <strong>{totalQtyToday.toLocaleString()}</strong></span>
                  <span>Dispatches: <strong>{totalDispatchesCountToday}</strong></span>
                </div>
                
                <div className="dispatch-list">
                  {Object.keys(todayComponentMap).length > 0 ? (
                    Object.keys(todayComponentMap).map(compName => (
                      <div key={compName} className="dispatch-item">
                        <span className="comp-name" title={compName}>{compName}</span>
                        <span className="comp-val">→ {todayComponentMap[compName].toLocaleString()}</span>
                      </div>
                    ))
                  ) : (
                    <div className="empty-list-msg">No dispatches recorded today.</div>
                  )}
                </div>

                {mostDispatchedComp ? (
                  <div className="most-dispatched-banner">
                    <span>🏆 Most Dispatched:</span>
                    <strong style={{ fontSize: "12.5px" }}>{mostDispatchedComp} ({todayComponentMap[mostDispatchedComp].toLocaleString()} units)</strong>
                  </div>
                ) : null}
              </div>
            </motion.section>

            {/* CARD 3: PRIORITY PURCHASE ORDERS */}
            <motion.section className="glass-card" variants={childVariants}>
              <div className="dashboard-card-header">
                <div className="dashboard-card-title">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" style={{ width: 22, height: 22 }}><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  <h2>Priority Purchase Orders</h2>
                </div>
              </div>
              <div className="stat-card-content" style={{ marginTop: 10 }}>
                <div className="priority-orders-list">
                  {priorityItems.length > 0 ? (
                    priorityItems.map((item, idx) => {
                      let badgeColor = "#ef4444";
                      let badgeText = "HIGH";
                      if (item.ageDays > 30 || item.priorityScore >= 30000) {
                        badgeColor = "#ef4444";
                        badgeText = "HIGH";
                      } else if (item.ageDays >= 15 || item.priorityScore >= 10000) {
                        badgeColor = "#f59e0b";
                        badgeText = "MEDIUM";
                      } else {
                        badgeColor = "#3b82f6";
                        badgeText = "LOW";
                      }
                      
                      return (
                        <div key={idx} className="priority-order-item">
                          <div className="priority-order-header">
                            <span className="po-num">PO #{item.poNumber}</span>
                            <span className="priority-badge" style={{ backgroundColor: badgeColor }}>{badgeText}</span>
                          </div>
                          <div className="priority-order-body">
                            <div className="po-comp-name" title={item.componentName}>{item.componentName}</div>
                            <div className="po-stats">
                              <span>Pending: <strong>{item.pendingQty.toLocaleString()}</strong></span>
                              <span>Est. Profit: <strong>₹{Math.round(item.expectedProfit).toLocaleString()}</strong></span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="empty-list-msg">No pending orders to prioritize.</div>
                  )}
                </div>
              </div>
            </motion.section>
          </div>

          {/* ROW 2: EXPENSES AND SCRAP */}
          <div className="dashboard-columns">
            <div className="left-column">
              <motion.section className="glass-card" variants={childVariants}>
                <div className="dashboard-card-header">
                  <div className="dashboard-card-title">
                    <svg viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2" style={{ width: 22, height: 22 }}><path d="M11 3.055A9.003 9.003 0 1020.945 13H11V3.055z" strokeLinecap="round" strokeLinejoin="round"/><path d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    <h2>Expense Analysis</h2>
                  </div>
                  <div className="card-more-menu">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                      <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                    </svg>
                  </div>
                </div>

                <div className="chart-wrapper">
                  {isMounted && (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={expenseData}
                          dataKey="value"
                          outerRadius={100}
                          paddingAngle={3}
                          label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                          isAnimationActive={true}
                          animationDuration={1200}
                          animationBegin={200}
                          activeIndex={activeExpenseIndex}
                          activeShape={renderActiveShape}
                          onMouseEnter={(_, idx) => setActiveExpenseIndex(idx)}
                          onMouseLeave={() => setActiveExpenseIndex(-1)}
                        >
                          <Cell fill="#3b82f6" />
                          <Cell fill="#10b981" />
                          <Cell fill="#f59e0b" />
                          <Cell fill="#ef4444" />
                          <Cell fill="#8b5cf6" />
                        </Pie>
                        <Tooltip content={<CustomTooltip formatter={(val) => `₹${val.toLocaleString()}`} />} />
                        <Legend
                          layout="vertical"
                          align="right"
                          verticalAlign="middle"
                          iconType="circle"
                          formatter={renderExpenseLegend}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </motion.section>
            </div>

            <div className="right-column">
              <motion.section className="glass-card" variants={childVariants}>
                <div className="dashboard-card-header">
                  <div className="dashboard-card-title">
                    <svg viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" style={{ width: 22, height: 22 }}><path d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H18.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M21 3v5h-5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    <h2>Scrap Recovery</h2>
                  </div>
                  <div className="card-more-menu">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                      <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                    </svg>
                  </div>
                </div>

                <div className="stats-grid">
                  <div className="stat-card">
                    <div className="stat-card-icon">
                      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#3b82f6" strokeWidth="2"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </div>
                    <h3>
                      <AnimatedNumber value="10%" />
                    </h3>
                    <p>Current Scrap</p>
                  </div>

                  <div className="stat-card">
                    <div className="stat-card-icon">
                      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#8b5cf6" strokeWidth="2"><path d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5a2 2 0 10-2 2h2zm0 0H4m8 0h8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </div>
                    <h3>
                      <AnimatedNumber value="₹70K" />
                    </h3>
                    <p>Monthly Savings</p>
                  </div>

                  <div className="stat-card">
                    <div className="stat-card-icon">
                      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#10b981" strokeWidth="2"><path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </div>
                    <h3>
                      <AnimatedNumber value="₹8L" />
                    </h3>
                    <p>Annual Savings</p>
                  </div>
                </div>
              </motion.section>
            </div>
          </div>

          {/* ROW 3: FACTORY INSIGHTS AND PROFIT INTELLIGENCE */}
          <div className="dashboard-columns">
            <div className="left-column">
              <motion.section className="glass-card" variants={childVariants}>
                <div className="dashboard-card-header">
                  <div className="dashboard-card-title">
                    <svg viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" style={{ width: 22, height: 22 }}><path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    <h2>Dispatch Consistency Heatmap</h2>
                  </div>
                </div>
                
                {dispatches.length > 0 ? (
                  <div style={{ marginTop: 10 }}>
                    <div className="heatmap-grid">
                      {generateHeatmapData().map((day, idx) => {
                        let colorClass = "empty";
                        if (day.value >= 75000) colorClass = "exceptional";
                        else if (day.value >= 50000) colorClass = "high";
                        else if (day.value >= 25000) colorClass = "medium";
                        else if (day.value > 0) colorClass = "low";
                        
                        return (
                          <div 
                            key={idx} 
                            className={`heatmap-cell ${colorClass}`}
                            onMouseEnter={() => setHoveredDay(day)}
                            onMouseLeave={() => setHoveredDay(null)}
                          />
                        );
                      })}
                    </div>

                    <div className="heatmap-tooltip-panel">
                      {hoveredDay ? (
                        <div className="tooltip-details">
                          <span className="tooltip-date">{hoveredDay.displayDate}</span>
                          <span className="tooltip-divider">|</span>
                          <span>Dispatch Value: <strong>₹{Math.round(hoveredDay.value).toLocaleString()}</strong></span>
                          <span className="tooltip-divider">|</span>
                          <span>Orders: <strong>{hoveredDay.ordersCount}</strong></span>
                          <span className="tooltip-divider">|</span>
                          <span>Components: <strong>{hoveredDay.componentsCount}</strong></span>
                        </div>
                      ) : (
                        <div className="tooltip-placeholder">
                          Hover over a day square to view dispatch details
                        </div>
                      )}
                    </div>

                    <div className="heatmap-legend">
                      <span className="legend-label">Less</span>
                      <div className="legend-cells">
                        <div className="heatmap-cell empty" title="No Dispatch" />
                        <div className="heatmap-cell low" title="₹1 - ₹25k" />
                        <div className="heatmap-cell medium" title="₹25k - ₹50k" />
                        <div className="heatmap-cell high" title="₹50k - ₹75k" />
                        <div className="heatmap-cell exceptional" title="₹75k+" />
                      </div>
                      <span className="legend-label">More</span>
                    </div>
                  </div>
                ) : (
                  <div className="empty-heatmap-state">
                    Dispatch history will appear as orders are completed.
                  </div>
                )}
              </motion.section>
            </div>

            <div className="right-column">
              <motion.section className="glass-card" variants={childVariants}>
                <div className="dashboard-card-header">
                  <div className="dashboard-card-title">
                    <svg viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2" style={{ width: 22, height: 22 }}><path d="M13 10V3L4 14h7v7l9-11h-7z" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    <h2>Profit Intelligence</h2>
                  </div>
                  <div className="card-more-menu">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                      <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                    </svg>
                  </div>
                </div>

                <div className="profit-stats">
                  <div className="stat-card">
                    <h3>
                      <AnimatedNumber value={`₹${highestProfit?.profit || 0}`} />
                    </h3>
                    <p>Highest Profit</p>
                  </div>

                  <div className="stat-card">
                    <h3>
                      <AnimatedNumber value={`₹${lowestProfit?.profit || 0}`} />
                    </h3>
                    <p>Lowest Profit</p>
                  </div>

                  <div className="stat-card">
                    <h3>
                      <AnimatedNumber value={`₹${averageProfit}`} />
                    </h3>
                    <p>Average Profit</p>
                  </div>

                  <div className="stat-card">
                    <h3 style={{ fontSize: "16px", background: "none", WebkitTextFillColor: "unset", color: "#cbd5e1" }}>
                      {topRevenueComponent?.component_name || "No Data"}
                    </h3>
                    <p>Best Component</p>
                  </div>
                </div>
              </motion.section>
            </div>
          </div>

          {/* ROW 4: LABOUR AND WORKFORCE */}
          <div className="dashboard-columns">
            <div className="left-column">
              <motion.section className="glass-card" variants={childVariants}>
                <div className="dashboard-card-header">
                  <div className="dashboard-card-title">
                    <svg viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" style={{ width: 22, height: 22 }}><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2m8-10a4 4 0 100-8 4 4 0 000 8zm11 10v-2a4 4 0 00-3-3.87m-4-12a4 4 0 010 7.75" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    <h2>Labour Analysis</h2>
                  </div>
                  <div className="card-more-menu">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                      <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                    </svg>
                  </div>
                </div>

                <div className="stats-grid">
                  <div className="stat-card">
                    <div className="stat-card-icon">
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#3b82f6" strokeWidth="2"><path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </div>
                    <h3>
                      <AnimatedNumber value={totalWorkforce} />
                    </h3>
                    <p>Total Workforce</p>
                  </div>

                  <div className="stat-card">
                    <div className="stat-card-icon">
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#8b5cf6" strokeWidth="2"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </div>
                    <h3>
                      <AnimatedNumber value={employeeCount} />
                    </h3>
                    <p>Employees</p>
                  </div>

                  <div className="stat-card">
                    <div className="stat-card-icon">
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#10b981" strokeWidth="2"><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </div>
                    <h3>
                      <AnimatedNumber value={contractorCount} />
                    </h3>
                    <p>Contractors</p>
                  </div>

                  <div className="stat-card">
                    <div className="stat-card-icon">
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#3b82f6" strokeWidth="2"><path d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </div>
                    <h3>
                      <AnimatedNumber value="₹2.86L" />
                    </h3>
                    <p>Monthly Cost</p>
                  </div>
                </div>

                <div className="labour-progress-container">
                  <div className="labour-progress-header">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
                    <span>Employee vs Contractor Ratio</span>
                  </div>
                  <div className="labour-progress-bar-outer">
                    <div className="labour-progress-bar-inner" style={{ width: `${employeePercentage}%` }}></div>
                  </div>
                  <div className="labour-progress-labels">
                    <span>Employees: {employeePercentage}%</span>
                    <span>Contractors: {contractorPercentage}%</span>
                  </div>
                </div>
              </motion.section>
            </div>

            <div className="right-column">
              <motion.section className="glass-card" variants={childVariants}>
                <div className="dashboard-card-header">
                  <div className="dashboard-card-title">
                    <svg viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" style={{ width: 22, height: 22 }}><circle cx="12" cy="12" r="10"/><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    <h2>Workforce Distribution</h2>
                  </div>
                  <div className="card-more-menu">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                      <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                    </svg>
                  </div>
                </div>

                <div className="chart-wrapper">
                  {isMounted && (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={workforceData}
                          dataKey="value"
                          outerRadius={100}
                          paddingAngle={3}
                          label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                          isAnimationActive={true}
                          animationDuration={1200}
                          animationBegin={200}
                          activeIndex={activeWorkforceIndex}
                          activeShape={renderActiveShape}
                          onMouseEnter={(_, idx) => setActiveWorkforceIndex(idx)}
                          onMouseLeave={() => setActiveWorkforceIndex(-1)}
                        >
                          <Cell fill="#3b82f6" />
                          <Cell fill="#10b981" />
                          <Cell fill="#f59e0b" />
                          <Cell fill="#ef4444" />
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend
                          layout="vertical"
                          align="right"
                          verticalAlign="middle"
                          iconType="circle"
                          formatter={renderWorkforceLegend}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </motion.section>
            </div>
          </div>

          {/* ROW 5: TOP COMPONENTS AND PLANT PROFIT */}
          <div className="dashboard-columns">
            <div className="left-column">
              <motion.section className="glass-card top-components-card" variants={childVariants}>
                <div className="dashboard-card-header">
                  <div className="dashboard-card-title">
                    <svg viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" style={{ width: 22, height: 22 }}><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    <h2>Top Components</h2>
                  </div>
                  <div className="card-more-menu">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                      <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                    </svg>
                  </div>
                </div>

                <div className="chart-wrapper">
                  {isMounted && (
                    <ResponsiveContainer width="100%" height={330}>
                      <BarChart
                        data={topComponentsData}
                        layout="vertical"
                        barSize={20}
                        margin={{ top: 10, right: 50, bottom: 10, left: 110 }}
                      >
                        <defs>
                          <linearGradient id="barGradient" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="#44f7cf" />
                            <stop offset="100%" stopColor="#a855f7" />
                          </linearGradient>
                        </defs>
                        <CartesianGrid stroke="rgba(255,255,255,0.08)" strokeDasharray="4 4" />
                        <XAxis
                          type="number"
                          stroke="#374151"
                          tick={{ fill: "#9ca3af", fontSize: 11 }}
                          axisLine={{ stroke: "#374151" }}
                          tickLine={{ stroke: "#374151" }}
                          tickFormatter={(val) => Number(val).toLocaleString()}
                        />
                        <YAxis
                          type="category"
                          dataKey="name"
                          stroke="#374151"
                          axisLine={{ stroke: "#374151" }}
                          tickLine={{ stroke: "#374151" }}
                          tick={<CustomYAxisTick />}
                          width={110}
                        />
                        <Tooltip content={<CustomTooltip formatter={(val) => Number(val).toLocaleString()} />} />
                        <Bar
                          dataKey="quantity"
                          fill="url(#barGradient)"
                          radius={[0, 12, 12, 0]}
                          isAnimationActive={true}
                          animationDuration={1200}
                          animationBegin={200}
                        >
                          <LabelList dataKey="quantity" position="right" fill="#e5e7eb" fontSize={11} fontWeight={600} formatter={(val) => Number(val).toLocaleString()} />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </motion.section>
            </div>

            <div className="right-column">
              <motion.section className="glass-card plant-profit-card" variants={childVariants}>
                <div className="dashboard-card-header">
                  <div className="dashboard-card-title">
                    <svg viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" style={{ width: 22, height: 22 }}><path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    <h2>Plant Profit</h2>
                  </div>
                  <div className="card-more-menu">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                      <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                    </svg>
                  </div>
                </div>

                <div className="chart-wrapper">
                  {isMounted && (
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={plantProfitData}>
                        <defs>
                          <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#34d399" />
                            <stop offset="100%" stopColor="#10b981" />
                          </linearGradient>
                        </defs>
                        <CartesianGrid stroke="rgba(255,255,255,0.08)" strokeDasharray="4 4" />
                        <XAxis dataKey="plant" stroke="#9ca3af" tick={{ fill: "#d1d5db", fontSize: 12 }} />
                        <YAxis stroke="#9ca3af" tick={{ fill: "#9ca3af", fontSize: 12 }} tickFormatter={(val) => `₹${val}K`} />
                        <Tooltip content={<CustomTooltip formatter={(val) => `₹${val}K`} />} />
                        <Bar
                          dataKey="profit"
                          fill="url(#profitGradient)"
                          radius={[8, 8, 0, 0]}
                          isAnimationActive={true}
                          animationDuration={1200}
                          animationBegin={200}
                        >
                          <LabelList dataKey="profit" position="top" fill="#cbd5e1" fontSize={11} fontWeight={600} formatter={(val) => `₹${val}K`} />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>

                <div className="summary-box-container">
                  <div className="summary-box-icon">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                  <div className="summary-box-info">
                    <p>Total Estimated Profit</p>
                    <h4>
                      <AnimatedNumber value={formattedTotalProfit} />
                    </h4>
                  </div>
                </div>
              </motion.section>
            </div>
          </div>

          {/* ROW 6: FACTORY ASSISTANT */}
          <motion.section className="glass-card" variants={childVariants}>
            <style>{`
              .operations-grid {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 20px;
                margin-bottom: 25px;
              }
              @media (max-width: 1024px) {
                .operations-grid {
                  grid-template-columns: 1fr;
                }
              }
              .target-display {
                display: flex;
                align-items: center;
                gap: 8px;
                font-size: 15px;
                color: #cbd5e1;
              }
              .target-edit-mode {
                display: flex;
                align-items: center;
                gap: 8px;
              }
              .target-input {
                background: rgba(15, 23, 42, 0.6);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 6px;
                padding: 4px 8px;
                color: #ffffff;
                font-size: 14px;
                width: 110px;
                outline: none;
              }
              .target-input:focus {
                border-color: #3b82f6;
              }
              .icon-btn {
                background: none;
                border: none;
                color: #94a3b8;
                cursor: pointer;
                padding: 4px;
                display: flex;
                align-items: center;
                transition: color 0.2s;
              }
              .icon-btn:hover {
                color: #60a5fa;
              }
              .save-btn {
                background: #2563eb;
                border: none;
                border-radius: 4px;
                padding: 4px 10px;
                color: #fff;
                font-size: 12.5px;
                cursor: pointer;
              }
              .save-btn:hover {
                background: #1d4ed8;
              }
              .cancel-btn {
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid rgba(255, 255, 255, 0.08);
                border-radius: 4px;
                padding: 4px 10px;
                color: #cbd5e1;
                font-size: 12.5px;
                cursor: pointer;
              }
              .cancel-btn:hover {
                background: rgba(255, 255, 255, 0.1);
              }
              .progress-container {
                margin-top: 15px;
                margin-bottom: 12px;
              }
              .progress-bar-outer {
                height: 8px;
                background: rgba(255, 255, 255, 0.05);
                border-radius: 4px;
                overflow: hidden;
                margin-bottom: 8px;
              }
              .progress-bar-inner {
                height: 100%;
                border-radius: 4px;
                transition: width 0.4s ease, background-color 0.4s ease;
              }
              .dispatch-list {
                max-height: 120px;
                overflow-y: auto;
                margin: 10px 0;
                padding-right: 4px;
              }
              .dispatch-item {
                display: flex;
                justify-content: space-between;
                font-size: 12.5px;
                padding: 4px 0;
                border-bottom: 1px solid rgba(255, 255, 255, 0.03);
              }
              .comp-name {
                color: #cbd5e1;
                text-overflow: ellipsis;
                overflow: hidden;
                white-space: nowrap;
                max-width: 75%;
              }
              .comp-val {
                color: #3b82f6;
                font-weight: 600;
              }
              .most-dispatched-banner {
                background: rgba(59, 130, 246, 0.08);
                border: 1px solid rgba(59, 130, 246, 0.15);
                border-radius: 6px;
                padding: 8px 10px;
                font-size: 12px;
                margin-top: 10px;
                display: flex;
                flex-direction: column;
                color: #93c5fd;
              }
              .priority-orders-list {
                display: flex;
                flex-direction: column;
                gap: 10px;
              }
              .priority-order-item {
                background: rgba(255, 255, 255, 0.02);
                border: 1px solid rgba(255, 255, 255, 0.05);
                border-radius: 8px;
                padding: 8px 12px;
              }
              .priority-order-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 4px;
              }
              .po-num {
                font-size: 13.5px;
                font-weight: 600;
                color: #ffffff;
              }
              .priority-badge {
                font-size: 10px;
                font-weight: 700;
                color: #ffffff;
                padding: 2px 6px;
                border-radius: 4px;
              }
              .po-comp-name {
                font-size: 12px;
                color: #94a3b8;
                margin-bottom: 4px;
                text-overflow: ellipsis;
                overflow: hidden;
                white-space: nowrap;
              }
              .po-stats {
                display: flex;
                justify-content: space-between;
                font-size: 11px;
                color: #cbd5e1;
              }
              .heatmap-grid {
                display: grid;
                grid-template-columns: repeat(15, 1fr);
                gap: 6px;
                margin-bottom: 15px;
              }
              .heatmap-cell {
                aspect-ratio: 1;
                border-radius: 3px;
                cursor: pointer;
                transition: transform 0.1s ease, filter 0.1s ease;
              }
              .heatmap-cell:hover {
                transform: scale(1.2);
                filter: brightness(1.2);
              }
              .heatmap-cell.empty {
                background: rgba(255, 255, 255, 0.03);
                border: 1px solid rgba(255, 255, 255, 0.05);
              }
              .heatmap-cell.low {
                background: rgba(59, 130, 246, 0.2);
                border: 1px solid rgba(59, 130, 246, 0.3);
              }
              .heatmap-cell.medium {
                background: rgba(59, 130, 246, 0.5);
                border: 1px solid rgba(59, 130, 246, 0.6);
              }
              .heatmap-cell.high {
                background: rgba(37, 99, 235, 0.8);
                border: 1px solid rgba(37, 99, 235, 0.9);
              }
              .heatmap-cell.exceptional {
                background: #8b5cf6;
                border: 1px solid #a78bfa;
                box-shadow: 0 0 8px rgba(139, 92, 246, 0.5);
              }
              .heatmap-legend {
                display: flex;
                align-items: center;
                justify-content: flex-end;
                gap: 8px;
                font-size: 11px;
                color: #94a3b8;
                margin-top: 15px;
              }
              .legend-cells {
                display: flex;
                gap: 4px;
              }
              .legend-cells .heatmap-cell {
                width: 12px;
                height: 12px;
              }
              .heatmap-tooltip-panel {
                min-height: 32px;
                background: rgba(15, 23, 42, 0.4);
                border: 1px solid rgba(255, 255, 255, 0.05);
                border-radius: 6px;
                padding: 8px 12px;
                font-size: 12.5px;
                color: #cbd5e1;
                display: flex;
                align-items: center;
                justify-content: center;
              }
              .tooltip-details {
                display: flex;
                align-items: center;
                gap: 12px;
              }
              .tooltip-date {
                color: #ffffff;
                font-weight: 600;
              }
              .tooltip-divider {
                color: rgba(255, 255, 255, 0.15);
              }
              .tooltip-placeholder {
                color: #64748b;
                font-style: italic;
              }
              .empty-heatmap-state {
                display: flex;
                align-items: center;
                justify-content: center;
                min-height: 140px;
                color: #64748b;
                font-style: italic;
                font-size: 13.5px;
              }
              .empty-list-msg {
                color: #64748b;
                font-style: italic;
                font-size: 12.5px;
                padding: 10px 0;
                text-align: center;
              }
              @media (min-width: 1025px) {
                .top-components-card, .plant-profit-card {
                  height: 460px;
                  display: flex;
                  flex-direction: column;
                }
                .top-components-card {
                  justify-content: flex-start;
                }
                .plant-profit-card {
                  justify-content: flex-start;
                  padding-bottom: 30px !important;
                }
              }
              .plant-profit-card .chart-wrapper {
                min-height: 230px !important;
                height: 230px !important;
                flex: none !important;
              }
              .plant-profit-card .summary-box-container {
                margin-top: 28px !important;
                width: 100%;
                box-sizing: border-box;
              }
              .assistant-panel {
                display: flex;
                flex-direction: column;
                padding: 10px 0;
              }
              .chat-history {
                height: 280px;
                overflow-y: auto;
                padding: 15px;
                display: flex;
                flex-direction: column;
                gap: 12px;
                background: rgba(255, 255, 255, 0.02);
                border-radius: 12px;
                border: 1px solid rgba(255, 255, 255, 0.05);
                margin-bottom: 15px;
              }
              .chat-bubble {
                max-width: 85%;
                padding: 10px 14px;
                border-radius: 16px;
                font-size: 13.5px;
                line-height: 1.5;
                color: #e2e8f0;
                backdrop-filter: blur(8px);
              }
              .chat-bubble.assistant {
                align-self: flex-start;
                background: rgba(59, 130, 246, 0.12);
                border: 1px solid rgba(59, 130, 246, 0.2);
                border-top-left-radius: 4px;
              }
              .chat-bubble.user {
                align-self: flex-end;
                background: rgba(139, 92, 246, 0.16);
                border: 1px solid rgba(139, 92, 246, 0.25);
                border-top-right-radius: 4px;
              }
              .chips-container {
                display: flex;
                flex-wrap: wrap;
                gap: 6px;
                margin-bottom: 15px;
              }
              .prompt-chip {
                padding: 4px 10px;
                border-radius: 16px;
                border: 1px solid rgba(255, 255, 255, 0.06);
                background: rgba(255, 255, 255, 0.02);
                color: #cbd5e1;
                font-size: 11px;
                cursor: pointer;
                white-space: nowrap;
                transition: all 0.2s ease;
              }
              .prompt-chip:hover {
                background: rgba(59, 130, 246, 0.08);
                border-color: rgba(59, 130, 246, 0.2);
                color: #60a5fa;
                box-shadow: 0 0 8px rgba(59, 130, 246, 0.2);
              }
              .chat-input-bar {
                display: flex;
                gap: 10px;
              }
              .chat-input {
                flex: 1;
                background: rgba(15, 23, 42, 0.7);
                border: 1px solid rgba(255, 255, 255, 0.08);
                border-radius: 8px;
                padding: 10px 15px;
                color: #ffffff;
                font-size: 13.5px;
                outline: none;
              }
              .chat-input:focus {
                border-color: #3b82f6;
              }
              .typing-bubble {
                align-self: flex-start;
                background: rgba(59, 130, 246, 0.12);
                border: 1px solid rgba(59, 130, 246, 0.2);
                padding: 10px 20px;
                border-radius: 16px;
                border-top-left-radius: 4px;
                display: flex;
                gap: 4px;
                align-items: center;
              }
              .dot {
                width: 6px;
                height: 6px;
                background: #60a5fa;
                border-radius: 50%;
                animation: blink 1.4s infinite both;
              }
              .dot:nth-child(2) { animation-delay: .2s; }
              .dot:nth-child(3) { animation-delay: .4s; }
              @keyframes blink {
                0% { opacity: .2; }
                20% { opacity: 1; }
                100% { opacity: .2; }
              }
            `}</style>
            
            <div className="dashboard-card-header">
              <div className="dashboard-card-title">
                <svg viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2" style={{ width: 22, height: 22 }}><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" strokeLinecap="round" strokeLinejoin="round"/></svg>
                <h2>Factory Assistant</h2>
              </div>
            </div>

            <div className="assistant-panel">
              <div className="chat-history" id="factory-chat-history">
                {messages.map((m, idx) => (
                  <div key={idx} className={`chat-bubble ${m.sender}`}>
                    {renderMessageText(m.text)}
                  </div>
                ))}
                {isTyping && (
                  <div className="typing-bubble">
                    <span className="dot"></span>
                    <span className="dot"></span>
                    <span className="dot"></span>
                  </div>
                )}
              </div>

              {/* Quick Prompt Chips */}
              <div className="chips-container">
                {[
                  { label: "Rate of...", template: "Rate of " },
                  { label: "Weight of...", template: "Weight of " },
                  { label: "Machine for...", template: "Machine for " },
                  { label: "Margin for...", template: "Margin for " },
                  { label: "Best Vendor for...", template: "Best Vendor for " },
                  { label: "Material Estimate for...", template: "Material Estimate for " },
                  { label: "Remaining PO Quantity for...", template: "Remaining PO Quantity for " },
                  { label: "Machine Availability for...", template: "Machine Availability for " }
                ].map(chip => (
                  <button 
                    key={chip.label} 
                    className="prompt-chip"
                    onClick={() => handleChipClick(chip.template)}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>

              {/* Chat Input Bar */}
              <div className="chat-input-bar">
                <input 
                  id="factory-assistant-input"
                  type="text" 
                  className="chat-input"
                  placeholder="Ask about rates, machines, weights, margins, vendors or orders..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSend();
                  }}
                />
                <button 
                  className="dashboard-btn" 
                  style={{ margin: 0, padding: "10px 20px" }}
                  onClick={() => handleSend()}
                >
                  Send
                </button>
              </div>
            </div>
          </motion.section>
        </FadeContent>
      </div>

      <GlassModal
        isOpen={isEditingTarget}
        onClose={() => setIsEditingTarget(false)}
        title="Set Daily Dispatch Target"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
          <FormInput
            label="Target Amount (₹)"
            type="number"
            value={tempTarget}
            onChange={(e) => setTempTarget(e.target.value)}
            placeholder="e.g. 100,000"
            required
          />
          <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
            <FormButton variant="secondary" onClick={() => setIsEditingTarget(false)}>
              Cancel
            </FormButton>
            <FormButton variant="primary" onClick={() => handleSaveTarget(tempTarget)}>
              Save Target
            </FormButton>
          </div>
        </div>
      </GlassModal>
    </div>
  );
}

export default Home;