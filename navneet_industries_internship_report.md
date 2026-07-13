# AN INTERNSHIP REPORT
## ON
# DEVELOPMENT OF A FACTORY MANAGEMENT ERP DASHBOARD FOR NAVNEET INDUSTRIES

**Submitted in partial fulfillment of the requirements for the award of the degree of**
### Bachelor of Technology
### in
### Computer Science & Engineering (Data Science)

**At**
### Chandigarh University, Gharuan, Mohali

**Submitted By:**
* **Name:** Yashpreet Kour
* **UID:** [Insert UID Here]
* **Course:** B.Tech CSE (Data Science)
* **Semester:** 7th
* **Session:** 2026-2027

**Under the Guidance of:**
* **Industry Mentor:** Mr. Pritpal Singh (Proprietor, Navneet Industries)
* **Academic Mentor:** [Insert Academic Mentor Name Here]

---

## DECLARATION

I, Yashpreet Kour, student of Bachelor of Technology in Computer Science & Engineering (Data Science) at Chandigarh University, hereby declare that the internship report entitled **"Development of a Factory Management ERP Dashboard for Navneet Industries"** is an authentic record of my own work carried out during the period from **20th June 2026 to 3rd July 2026** under the supervision and guidance of **Mr. Pritpal Singh** (Proprietor, Navneet Industries).

The matter embodied in this report has not been submitted by me or anyone else for the award of any other degree or diploma.

**Date:** July 5, 2026
**Place:** Mohali, Punjab

**Yashpreet Kour**  
B.Tech CSE (Data Science)  
Chandigarh University  

---

## CERTIFICATE OF APPROVAL

This is to certify that the internship report entitled **"Development of a Factory Management ERP Dashboard for Navneet Industries"** submitted by **Yashpreet Kour** (UID: [Insert UID]) in partial fulfillment of the requirements for the award of the degree of Bachelor of Technology in Computer Science & Engineering (Data Science) is approved.

**External Examiner:** ________________________  
**Internal Examiner:** ________________________  
**Head of Department:** ________________________  

---

## ACKNOWLEDGEMENT

I express my deepest gratitude to **Mr. Pritpal Singh**, Proprietor and Industry Mentor at **Navneet Industries**, for providing me with the opportunity to undertake this internship. His continuous encouragement, technical insights, and valuable feedback during the database architecture design and dashboard formulation were instrumental in the successful execution of this project.

I am also highly indebted to the academic faculty at Chandigarh University, especially my Academic Mentor and the Head of Department of Computer Science & Engineering, for their constant guidance, support, and for structuring an academic curriculum that aligns so closely with modern software engineering practices.

Finally, I thank my family and friends for their moral support and understanding during the intensive phase of this project.

**Yashpreet Kour**

---

## TABLE OF CONTENTS

*   **Declaration**
*   **Certificate of Approval**
*   **Acknowledgement**
*   **Abstract / Executive Summary**
*   **List of Figures**
*   **List of Tables**
*   **Chapter 1: Company Profile & Industry Overview**
    *   1.1 Introduction to Navneet Industries
    *   1.2 Business and Manufacturing Operations
    *   1.3 Legacy Operations and Need for Digitalization
*   **Chapter 2: Project Abstract & Objectives**
    *   2.1 Project Abstract
    *   2.2 Project Scope & Deliverables
    *   2.3 Key Objectives
*   **Chapter 3: System Requirements & Feasibility Analysis**
    *   3.1 Hardware Requirements
    *   3.2 Software Requirements & Dependencies
    *   3.3 Feasibility Study
*   **Chapter 4: System Architecture & Database Design**
    *   4.1 System Architecture Overview
    *   4.2 Supabase Database Integration
    *   4.3 Database Schema Definitions (DDL)
    *   4.4 Data Fetching & State Management
*   **Chapter 5: Frontend Design & Component Architecture**
    *   5.1 UI/UX Design System
    *   5.2 Project Folder Directory
    *   5.3 React Component Architecture
*   **Chapter 6: Analytical Dashboards & Recharts Integration**
    *   6.1 Key Performance Indicators (KPIs)
    *   6.2 Machine Productivity Analytics
    *   6.3 Machine Capacity Comparison
    *   6.4 Expense Analysis
    *   6.5 Scrap Recovery and Savings
    *   6.6 Plant Wise Performance Analytics
*   **Chapter 7: Operations & Transactions Modules**
    *   7.1 Plastic Components Catalog
    *   7.2 Price List Module
    *   7.3 Purchase Order Management
    *   7.4 Pending Orders Module
    *   7.5 Dispatch History & Calculations
    *   7.6 Expense, Employee, & Vendor Management
*   **Chapter 8: UI/UX Redesign & Modern Aesthetics**
    *   8.1 Glassmorphism & Core CSS Styling
    *   8.2 Responsive Layout & Grid Systems
*   **Chapter 9: Technical Challenges & Development Debugging Logs**
    *   9.1 Layout Alignment & CSS Conflicts
    *   9.2 Recharts ResponsiveContainer Rendering Issues
    *   9.3 Migration from Recharts v3 to v2
    *   9.4 Asynchronous Latency & State Management Issues
*   **Chapter 10: Software Testing and Quality Assurance**
    *   10.1 Testing Strategy
    *   10.2 Comprehensive Test Cases Table
*   **Chapter 11: Version Control & Git Workflow**
    *   11.1 Branching Strategy
    *   11.2 Collaboration & Conflict Resolution
*   **Chapter 12: Business Outcomes & Future Scope**
    *   12.1 Digital Transformation Metrics
    *   12.2 Future Project Scope
*   **Chapter 13: Conclusion**
*   **Appendices**
    *   Appendix A: Folder Structure Tree
    *   Appendix B: Database ER Diagram
    *   Appendix C: References & Bibliography

---

# Chapter 1: Company Profile & Industry Overview

## 1.1 Introduction to Navneet Industries
Navneet Industries, under the leadership and proprietorship of Mr. Pritpal Singh, is a prominent player in the industrial manufacturing sector, specializing in the high-volume production of high-precision plastic components. Established as a manufacturing facility catering to domestic and industrial clients, the company operates several processing units (referred to structurally as Plant 1, Plant 2, Plant 3, Plant 5, and Plant 7). Each plant handles specialized operations, including injection molding, quality inspection, extrusion, and component assembly. The company’s core business relies on processing thermoplastic resins into custom industrial components, demanding high standards of efficiency, machine utilization, raw material management, and workforce coordination.

## 1.2 Business and Manufacturing Operations
The operational model of Navneet Industries centers on high-volume production cycles. In a standard manufacturing day, raw plastic granules (resins like Polypropylene, Polyethylene, and Nylon) are weighed, heated, and injected into specialized molds under immense pressure using injection molding machines of varying capacities (ranging from 15-gram micro-injection units to 200-gram heavy-duty industrial molds). The key components manufactured include custom plastic flange shafts, spring pots, industrial covers, and caps. 

Operations are divided into critical stages:
1.  **Procurement & Vendor Coordination:** Raw materials are sourced from various vendors who supply plastic resins, coloring agents, and machine replacement parts.
2.  **Order Placement & Production Scheduling:** Customer Purchase Orders (POs) are received, detailing required component quantities, delivery schedules, and agreed-upon rates.
3.  **Manufacturing & Processing:** Molds are set up, machines are calibrated, and production runs in continuous shifts (usually Morning and Night shifts). Machine uptime, material scrap rates, and labor availability dictate daily throughput.
4.  **Dispatches & Quality Control:** Completed batches are dispatched to customers. Outgoing quantities are matched against purchase orders, and remaining balances are tracked to prevent under-delivery.
5.  **Expense Tracking & Accounting:** Production costs, electricity bills, labor wages, GST, and maintenance overheads are recorded to calculate plant-wise and component-wise net profits.

## 1.3 Legacy Operations and Need for Digitalization
Prior to June 2026, Navneet Industries managed its operations using a traditional paper-led system. Purchase orders, vendor receipts, employee attendance logs, raw material stock registers, and machine logbooks were maintained manually in physical paper registers. This legacy approach introduced major operational bottlenecking:
*   **Data Silos & Retrieval Delays:** Retrieving historical dispatch logs or checking if a purchase order was partially completed took hours of searching through paper records.
*   **Inaccurate Profit Calculations:** Determining component-wise and plant-wise profitability was prone to mathematical errors, as raw material cost fluctuations, scrap recovery variables, and plant overheads were calculated manually.
*   **Inefficient Workforce & Machine Tracking:** Machine downtime, capacity utilization, and employee salary tracking lacked real-time visibility, leading to unoptimized shifts and high downtime costs.
*   **PDF Extraction Overhead:** Customer purchase orders arrived as PDF files. The sales team had to manually print them and copy-paste values into manual records, causing transcription errors.

To address these inefficiencies, Navneet Industries commissioned the development of a digital Factory Management ERP Dashboard. The primary focus was on establishing a single source of truth for all operational data, integrating Supabase for secure cloud storage and real-time query support, and leveraging React.js to construct an intuitive, interactive, and modern dashboard.

---

# Chapter 2: Project Abstract & Objectives

## 2.1 Project Abstract
The *Factory Management ERP Dashboard* is a web-based, real-time enterprise resource planning application designed to digitize, monitor, and optimize the manufacturing and business operations of Navneet Industries. Built upon a modern web architecture using **React.js** for the frontend, **CSS3** with CSS Grid and Flexbox for a responsive glassmorphic UI, and **Supabase (PostgreSQL)** as the backend relational database, the system acts as the central intelligence hub for the company's multi-plant operations. The ERP provides comprehensive modules for Component Cataloging, Price Listing, Purchase Order ingestion (including auto-fill forms via PDF parser concepts), Dispatch tracking, Expense auditing, Employee payroll reporting, and Vendor logging. It integrates **Recharts** to deliver deep manufacturing analytics—such as machine capacity checks, utilization charts, expense distributions, plant profit analysis, and labor dynamics.

## 2.2 Project Scope & Deliverables
The project was executed over a 14-day intensive internship duration (June 20, 2026 – July 3, 2026). The scope of work encompassed:
1.  **Database Design:** Establishing a normalized SQL schema on Supabase to model the factory's entities and relations.
2.  **Core Dashboard Page:** Implementing a primary dashboard (`Home.js`) that displays key performance indicators (KPIs) and interactive analytics using Recharts.
3.  **Operations Modules:** Developing CRUD interfaces for:
    *   *Plastic Components Catalog:* Search, filter, and view detailed specifications (weight, material, plant location).
    *   *Price List:* Sorting and searching plant-mapped components.
    *   *Pending Orders & Dispatch History:* Tracks PO fulfillment status and calculates remaining balances.
    *   *Add Purchase Order:* Form validation and mock PDF ingestion utilizing `pdfjs-dist` to parse files.
    *   *Expenses, Employees, and Vendors:* Modular management screens to update payment, salary, and contact histories.
4.  **UI/UX Modernization:** Redesigning components with glassmorphism (translucent backdrops, fine borders, gradients), dark-theme styles, smooth Framer Motion animations, and fully responsive layouts.

## 2.3 Key Objectives
The primary engineering objectives of the project were:
*   **Eliminate Manual Data Entry:** Provide a robust data ingestion layer using Supabase, replacing paper logbooks and registers.
*   **Enable Real-time Analytical Visualizations:** Deliver visual business insights (machine utilization, category costs, scrap ratios) to support strategic decisions by Mr. Pritpal Singh.
*   **Ensure Data Integrity:** Enforce foreign key constraints and transactional integrity in the SQL database.
*   **Deliver Responsive Accessibility:** Create a layout accessible from mobile, tablet, and desktop screens for factory-floor managers and office staff.

---

# Chapter 3: System Requirements & Feasibility Analysis

## 3.1 Hardware Requirements
To support development, testing, and deployment of the ERP Dashboard, the minimum hardware specifications were identified:
*   **Processor:** Intel Core i5 or AMD Ryzen 5 (Minimum 4 Cores, 2.4 GHz).
*   **Memory:** 8 GB DDR4 RAM (16 GB recommended for concurrent VS Code, browser, and local server processes).
*   **Storage:** 256 GB SSD (Solid State Drive) to optimize build speeds and system responsiveness.
*   **Network:** Active broadband connection for database syncing with Supabase cloud.

## 3.2 Software Requirements & Dependencies
The development environment was configured with the following tech stack (confirmed by `package.json` configurations):
*   **Operating System:** Windows 10/11 Home/Professional.
*   **IDE:** Visual Studio Code (v1.90+).
*   **Runtime Environment:** Node.js (v18.x) & npm (v9.x).
*   **Frontend Framework:** React.js (v18.3.1) and React DOM (v18.3.1).
*   **Routing Library:** React Router DOM (v6.30.3) for client-side routing.
*   **Database Service:** Supabase Database (PostgreSQL v15 backend client `@supabase/supabase-js` v2.106.2).
*   **Data Visualization:** Recharts (v2.12.7) for rendering interactive SVG charts.
*   **Animations:** Framer Motion (v12.42.0) for UI transitions and hover states.
*   **PDF Ingestion:** `pdfjs-dist` (v6.0.227) for handling digital client orders.

## 3.3 Feasibility Study
Before initiating development, a feasibility study was conducted across three domains:
1.  **Technical Feasibility:** The selection of React.js and Supabase was deemed highly feasible. Supabase removes backend setup complexities (REST API generation, web sockets, schema builders), enabling the frontend developer to write clean, direct client-side logic. Recharts provides fully interactive component-based chart containers, removing the need to write raw canvas code.
2.  **Operational Feasibility:** The user interface was designed specifically for non-technical users. Front-line supervisors and administrative clerks at Navneet Industries can navigate the sidebar, click on simple toggle components, and fill forms without database management skills.
3.  **Economic Feasibility:** The stack leverages open-source libraries and free-tier cloud resources on Supabase, making the capital expenditure close to zero. The reduction in manual error overhead and employee hours guarantees a positive return on investment.

---

# Chapter 4: System Architecture & Database Design

## 4.1 System Architecture Overview
The Factory Management ERP Dashboard employs a client-server architecture designed to be serverless and scalable. The client-side application is built using React.js and runs directly within the user's web browser, executing client-side routing, state management, and Recharts rendering. The database layer is hosted in the cloud using Supabase, which provides a hosted PostgreSQL relational database. 

The client communicates with Supabase through secure REST and WebSocket protocols generated automatically by Supabase. This serverless setup minimizes network roundtrips and operational maintenance, as the database exposes direct APIs that the React application consumes securely using the Supabase Javascript Client library.

```
+-------------------------------------------------------------+
|                     Client Web Browser                      |
|                                                             |
|   +-----------------------+     +-----------------------+   |
|   |   React.js Web App    |     |  Framer Motion / CSS  |   |
|   |  - Client-side Routing|     |  - Glassmorphic UI    |   |
|   |  - State Hooks        |     |  - Micro-animations   |   |
|   +-----------+-----------+     +-----------+-----------+   |
|               |                             |               |
|               | Data Actions                | Render events |
|               v                             v               |
|   +-----------+-----------+     +-----------+-----------+   |
|   |    Recharts SVGs      |     |  PDF Ingestion Form   |   |
|   |  - Machine Utilization|     |  - pdfjs-dist Parser  |   |
|   |  - Plant Profitability|     |  - Form Validation    |   |
|   +-----------+-----------+     +-----------------------+   |
+---------------|---------------------------------------------+
                |
                | HTTPS / JSON RPC (WebSockets)
                v
+-------------------------------------------------------------+
|                     Supabase Cloud Layer                     |
|                                                             |
|   +-----------------------+     +-----------------------+   |
|   |  PostgreSQL Engine    |     |  Built-in REST API    |   |
|   |  - Normalized Schemas |<--->|  - Auto-generated     |   |
|   |  - Database Views     |     |  - Role-based Filters |   |
|   +-----------------------+     +-----------------------+   |
+-------------------------------------------------------------+
```
*[Figure 4.1: ERP Architecture Diagram Flow]*

## 4.2 Supabase Database Integration
Supabase is an open-source Firebase alternative built on top of the PostgreSQL relational database. For Navneet Industries, Supabase provides:
*   **Instant RESTful API:** Every table created in the database is automatically mapped to an API endpoint with query parameters for filtering, sorting, and joining tables.
*   **Row-Level Security (RLS):** Allows defining granular access policies, ensuring that only authenticated personnel can insert or modify data.
*   **Real-time Capabilities:** Employs PostgreSQL's replication functionality to broadcast database changes (inserts, updates, deletes) to connected clients in milliseconds.

The connection to Supabase is initialized in `supabaseClient.js`:
```javascript
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://dpkanbycxmihgcphbobl.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwa2FuYnljeG1paGdjcGhib2JsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAyODgxNDYsImV4cCI6MjA5NTg2NDE0Nn0.ubD-eRNQQptjWJPKB4A3233V9JYbPWK5z3G-tZFzfS0";

export const supabase = createClient(supabaseUrl, supabaseKey);
```

## 4.3 Database Schema Definitions (DDL)
The relational structure was designed using standard database design guidelines, optimizing for normalization (Third Normal Form - 3NF) to eliminate duplicate records and verify referential integrity.

### 4.3.1 Table: `component_catalog`
This table represents the master catalog of all plastic components manufactured by the factory. It tracks physical properties, plant assignments, and target profit margins.
```sql
CREATE TABLE component_catalog (
    id SERIAL PRIMARY KEY,
    component_name VARCHAR(100) NOT NULL UNIQUE,
    plant VARCHAR(50) NOT NULL,
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    weight NUMERIC(10, 2) NOT NULL CHECK (weight > 0), -- in grams
    specifications JSONB, -- stores dimensions, resin type, molding time
    profit NUMERIC(10, 2) NOT NULL DEFAULT 0.00, -- target margin in INR
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);
```

### 4.3.2 Table: `purchase_order_items`
Tracks the individual item rows contained within a customer purchase order. It links back to the catalog and the master order ledger.
```sql
CREATE TABLE purchase_order_items (
    id SERIAL PRIMARY KEY,
    purchase_order_id INT REFERENCES purchase_orders(id) ON DELETE CASCADE,
    component_id INT REFERENCES component_catalog(id) ON DELETE RESTRICT,
    ordered_qty INT NOT NULL CHECK (ordered_qty > 0),
    rate NUMERIC(10, 2) NOT NULL CHECK (rate >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);
```

### 4.3.3 Table: `dispatches`
Documents completed shipments sent out from the plants to customers. This table tracks fulfillment metrics and subtracts completed units from the ordered numbers.
```sql
CREATE TABLE dispatches (
    id SERIAL PRIMARY KEY,
    purchase_order_item_id INT REFERENCES purchase_order_items(id) ON DELETE CASCADE,
    dispatched_qty INT NOT NULL CHECK (dispatched_qty > 0),
    dispatch_date DATE NOT NULL DEFAULT CURRENT_DATE,
    tracking_number VARCHAR(100),
    carrier_name VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);
```

### 4.3.4 Table: `expenses`
Records all operational outlays incurred during the factory's day-to-day manufacturing runs, separated by categories.
```sql
CREATE TABLE expenses (
    id SERIAL PRIMARY KEY,
    category VARCHAR(50) NOT NULL CHECK (category IN ('Raw Material', 'Electricity', 'GST', 'Labour', 'Others')),
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_status VARCHAR(20) DEFAULT 'Pending' CHECK (payment_status IN ('Paid', 'Pending')),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);
```

### 4.3.5 Table: `employees`
Stores master records of staff, plant operators, administrators, and technicians. Tracks payroll details and attendance data.
```sql
CREATE TABLE employees (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('Operator', 'Contractor', 'Management', 'Technical')),
    salary_pm NUMERIC(10, 2) NOT NULL CHECK (salary_pm >= 0),
    salary_status VARCHAR(20) DEFAULT 'Unpaid' CHECK (salary_status IN ('Paid', 'Unpaid')),
    payment_history JSONB, -- logs past dates and payment amounts
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);
```

### 4.3.6 Table: `vendors`
Manages the company's network of material suppliers and contractors, tracking contact details and supply materials.
```sql
CREATE TABLE vendors (
    id SERIAL PRIMARY KEY,
    vendor_name VARCHAR(100) NOT NULL UNIQUE,
    contact_name VARCHAR(100),
    phone VARCHAR(20),
    email VARCHAR(100),
    material_supplied VARCHAR(100) NOT NULL, -- e.g., 'Polypropylene Resin'
    outstanding_payment NUMERIC(10, 2) DEFAULT 0.00 CHECK (outstanding_payment >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);
```

### 4.3.7 Database View: `pending_summary`
A database view calculated by joining purchase orders and dispatches. It returns the aggregated static order state to determine how many items are currently in queue.
```sql
CREATE VIEW pending_summary AS
SELECT 
    poi.id AS purchase_order_item_id,
    cc.component_name,
    poi.ordered_qty,
    COALESCE(SUM(d.dispatched_qty), 0) AS total_dispatched,
    (poi.ordered_qty - COALESCE(SUM(d.dispatched_qty), 0)) AS pending_qty
FROM purchase_order_items poi
JOIN component_catalog cc ON poi.component_id = cc.id
LEFT JOIN dispatches d ON d.purchase_order_item_id = poi.id
GROUP BY poi.id, cc.component_name, poi.ordered_qty;
```

### 4.3.8 Database View: `pending_summary_live`
An active real-time tracking view designed to query only outstanding orders where the pending quantity is strictly greater than zero. This powers the pending orders dashboard view.
```sql
CREATE VIEW pending_summary_live AS
SELECT * 
FROM pending_summary
WHERE pending_qty > 0;
```

---

## 4.4 Data Fetching & State Management
In React, communication with the database is handled inside component lifecycles using `useEffect` hooks and managed locally via standard React hooks like `useState`. A robust UI requires handling asynchronous loading states and network delays, protecting components from crashing before database values resolve.

### 4.4.1 Loading States and Data Fetching Implementation
When fetching data from Supabase, components initialize a boolean state `loading` as `true`. Once the promise resolves, data is bound to state arrays and `loading` is toggled to `false`. If the load fails, an `error` state is updated, which displays a fallback UI element.

Below is a typical state pattern utilized in the catalog page:
```javascript
import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";

function ComponentCatalogView() {
  const [catalog, setCatalog] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    async function fetchCatalogData() {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from("component_catalog")
          .select("*")
          .order("component_name", { ascending: true });

        if (error) throw error;
        setCatalog(data || []);
      } catch (err) {
        console.error("Database query failed:", err.message);
        setErrorMessage("Failed to load component catalog. Please retry.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchCatalogData();
  }, []);

  if (isLoading) {
    return (
      <div className="skeleton-loader-container">
        <div className="skeleton-spinner"></div>
        <p>Retrieving Manufacturing Data...</p>
      </div>
    );
  }

  if (errorMessage) {
    return <div className="error-fallback-card">{errorMessage}</div>;
  }

  return (
    <ul className="catalog-grid">
      {catalog.map((item) => (
        <li key={item.id} className="catalog-card">
          <h4>{item.component_name}</h4>
          <p>Plant Assignment: {item.plant}</p>
          <span>INR {item.price}</span>
        </li>
      ))}
    </ul>
  );
}
```

This async pattern guarantees that the application remains stable and interactive. Loading indicators and skeletal UI cards are rendered, avoiding broken layout states during heavy cloud data transfers.

---

# Chapter 5: Frontend Design & Component Architecture



# Chapter 5: Frontend Design & Component Architecture

## 5.1 UI/UX Design System
The visual style of the Factory Management ERP Dashboard focuses on ease of use, technical clarity, and high performance. Built around a **Glassmorphic Theme**, the interface presents clean, translucent cards laid out on a dark slate gradient backdrop. Glassmorphism is achieved using a combination of semi-transparent background colors, backdrop filters (blur), and fine, light-colored borders. This design ensures readability and visual hierarchy. High-contrast indicators, readable typography (the Inter font family), and color-coded labels (e.g., emerald for success, amber for warning, and blue for informational metrics) help operators scan data quickly.

## 5.2 Project Folder Directory
The modularity of the React application is reflected in its directory structure. The project separates components (reusable UI blocks), pages (routed views), styles (modularized stylesheet sheets), and database utilities.

```
factory-management/
├── public/
│   ├── index.html
│   └── favicon.ico
├── src/
│   ├── components/
│   │   ├── ComponentDetail.js       # Renders catalog specifications of selected item
│   │   ├── ComponentList.js         # Lists all components as interactive list items
│   │   ├── Filters.js               # Category and search input filters
│   │   ├── HomePage.js              # Base container for home view
│   │   ├── Navbar.js                # Top-level global header navigation
│   │   └── Sidebar.js               # Responsive collapsable sidebar navigation
│   ├── data/
│   │   ├── companyData.js           # Static company list
│   │   ├── componentsData.json      # Initial/fallback component properties
│   │   ├── ordersData.js            # Initial orders configuration
│   │   └── purchaseOrdersData.js    # Seed dataset for purchase orders
│   ├── pages/
│   │   ├── AddExpense.js            # Form to register new factory costs
│   │   ├── AddOrder.js              # Purchase order form with PDF parsing logic
│   │   ├── Dashboard.js             # General KPI card listing
│   │   ├── Employees.js             # Payroll and workforce ledger screen
│   │   ├── Expenses.js              # Categorized cost audit listing
│   │   ├── Home.js                  # Main dashboard with all analytics and charts
│   │   ├── OrderHistory.js          # Complete record of customer dispatches
│   │   ├── Orders.js                # Active order records tracker
│   │   ├── PendingOrders.js         # Remaining fulfillment and balances queue
│   │   ├── PlasticComponents.js     # Component catalog main layout
│   │   ├── PriceList.js             # Pricing table with search & sort
│   │   └── Vendors.js               # Supplier details and contact log
│   ├── styles/
│   │   ├── animations.css           # Global keyframes, hover triggers, transitions
│   │   ├── charts.css               # Recharts container margins & typography
│   │   ├── components.css           # Buttons, input fields, cards styling
│   │   ├── forms.css                # Multi-column grid styles for inputs
│   │   ├── global.css               # Base theme colors, scrollbars, text weights
│   │   ├── home.css                 # Home layout grids, KPI stats, quick actions
│   │   ├── main.css                 # Master compiled layout rules
│   │   ├── navbar.css               # Top header flex layout & avatar styling
│   │   ├── pages.css                # Base structural wrappers for routed views
│   │   ├── responsive.css           # Media queries for tablets & mobile breakpoints
│   │   ├── sidebar.css              # Navigation sidebar layout and active links styling
│   │   ├── tables.css               # Glassmorphic grid tables & rows
│   │   └── variables.css            # CSS custom properties (color tokens, borders)
│   ├── App.js                       # Master router and client entry route setup
│   ├── index.js                     # Root virtual DOM compiler
│   ├── index.css                    # Base web resets
│   └── supabaseClient.js            # Initializes connection with Supabase
├── package.json                     # NPM dependency configuration
└── README.md                        # Project documentation
```

## 5.3 React Component Architecture
Components are structured hierarchically to promote reuse and separate presentation from data fetching.

### 5.3.1 Sidebar & Navigation (`Sidebar.js`, `Navbar.js`)
The `Sidebar` component acts as the main navigation panel. To maximize screen space on tablets and mobile devices, the sidebar is responsive. It uses CSS classes that toggle based on screen size, collapsing into a slide-out drawer or a bottom navigation bar. 
The top `Navbar` provides context-aware page titles, breadcrumbs, connection status indicators, and user profiles.

### 5.3.2 Component List and Details (`ComponentList.js`, `ComponentDetail.js`)
Used inside the Plastic Components Catalog page, these files implement a split-pane layout:
*   `ComponentList` maps the array of components into structured, clickable cards showing the name, plant, and price.
*   `ComponentDetail` registers the active component selection via state and displays detailed specifications, including dimensions, resin type, weight in grams, mold characteristics, and target profit margins. If no component is selected, it displays a helper card prompting the user to select an item.

### 5.3.3 Category Filter Controls (`Filters.js`)
A reusable utility component that renders search inputs and select filters. It binds parent state variables to trigger lists sorting, plant filtering, or text matching, ensuring quick data filtering directly in the client browser.

---

# Chapter 6: Analytical Dashboards & Recharts Integration

## 6.1 Key Performance Indicators (KPIs)
The top section of `Home.js` displays four critical business metrics that give managers a quick overview of the factory's performance:
1.  **Total Revenue:** Calculated dynamically by summing all purchase orders (`ordered_qty * rate`).
2.  **Total Components:** The count of unique components cataloged in `component_catalog`.
3.  **Active Plants:** The number of unique plant assignments extracted from the components list.
4.  **Average Profit:** The mathematical average of target profits across all cataloged items.

To make the interface feel responsive and alive, these cards include:
*   **Animated Counter (`AnimatedNumber`):** A custom component that triggers on mount. It parses currency symbols (₹), lakhs (L), and thousands (K), and uses `requestAnimationFrame` and cubic ease-out math to animate values from zero to the target number over a 1.2-second duration.
*   **Glassmorphic Gradient Cards:** CSS styles containing subtle gradients, thin borders (`border: 1px solid rgba(255, 255, 255, 0.08)`), and box shadows.
*   **Hover Scaling:** Micro-animations that elevate the card and change border colors upon pointer hover.

```javascript
// Animated Count-Up custom component
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
      const ease = 1 - Math.pow(1 - progress, 3); // Ease out cubic
      const current = start + (target - start) * ease;

      let formatted = isCurrency ? "₹" : "";
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
      if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
  }, [value]);

  return <span>{displayValue}</span>;
}
```

## 6.2 Machine Productivity Analytics
The **Machine Productivity** card displays operational efficiency data for the factory's injection molding machinery.
*   **KPI Metrics:** Lists the total machines (8 active), average utilization (75%), productive run time (9 hours), and total daily capacity (14,490 units).
*   **Interactive Pie Chart:** Built using Recharts, it breaks down shift distributions into *Production* (9 hours), *Downtime* (2 hours), and *Die Change* (1 hour).
*   **Interactive Highlights:** Implements active shape rendering (`renderActiveShape`). Hovering over a segment dynamically calls the SVG renderer, adding 6 pixels to the outer radius (`outerRadius + 6`) to create a smooth zoom effect.
*   **Gradient Fills:** The pie slices use SVG linear gradients (e.g., `#pieBlue`, `#pieAmber`, `#pieEmerald`) rather than flat, saturated colors to create a modern aesthetic.

## 6.3 Machine Capacity Comparison
This module compares the production capacity of different machinery classes.
*   **Recharts Bar Chart:** Displays the capacity limits of various machines (15 gm micro: 6,480 units, 50 gm: 3,240 units, 100 gm: 4,050 units, and 200 gm heavy: 720 units).
*   **Y-Axis Wrapping:** The custom tick renderer `CustomYAxisTick` splits long labels into multiple lines (e.g., splitting "PLASTIC Cover Spring POT" to prevent label truncation on narrow screens).
*   **Label Customization:** The chart includes a top-positioned `<LabelList>` displaying exact values in bold text above each bar, making it easy to read at a glance.

## 6.4 Expense Analysis
A comprehensive breakdown of the factory's financial expenses.
*   **Recharts Pie Chart:** Breaks down raw operational costs: Raw Material (₹5.00L), Labour (₹2.75L), GST (₹2.20L), Electricity (₹85K), and Others (₹1.25L).
*   **Custom Tooltip Integration:** Renders a glassmorphic popup containing custom key-value details formatted in localized currency strings.
*   **Interactive Legend:** Formats labels dynamically (e.g., converting large numbers to Lakh format using `(item.value / 100000).toFixed(2) + 'L'`).

## 6.5 Scrap Recovery and Savings
Tracks the efficiency of scrap recycling.
*   **Scrap Ratio KPI:** Highlights the current scrap level (10%), which is the target limit set for manufacturing runs.
*   **Savings KPIs:** Displays monthly savings (₹70K) and annual projected savings (₹8L) realized by recycling waste runner plastic back into the extrusion line.

## 6.6 Plant Wise Performance Analytics
Provides performance comparisons across the factory's physical locations.
*   **Plant Profit Bar Chart:** Maps total profit values aggregated from `component_catalog` records to plant sites. Managers can instantly see which plant (e.g., Plant 1 or Plant 3) is producing the highest margins, helping optimize raw material allocation.
*   **Top Selling Components:** A horizontal bar chart listing the top 5 profit-yielding components. The chart uses sorted slices from the `components` state to render component names and their relative contribution to factory profits.

---

# Chapter 7: Operations & Transactions Modules

## 7.1 Plastic Components Catalog
The Plastic Components Catalog provides factory supervisors and sales managers with a direct view of the factory's manufacturing capabilities.
*   **Search and Filter Logic:** Users can search components by name using a client-side string filter (`searchTerm.toLowerCase()`). Additionally, components can be filtered by plant location (Plant 1, 2, 3, 5, or 7) using a select dropdown.
*   **Split-Screen Interface:** Clicking on a component triggers a state update (`setSelectedComponent(item)`), rendering a detailed specifications view. This view displays the component's name, weight in grams, dimensions, resin material type, molding plant, base price, and target profit margin. It provides a clean, interactive alternative to scanning long rows in a spreadsheet.

## 7.2 Price List Module
The Price List module lists the prices of all components, helping sales staff generate client quotes quickly.
*   **Component Grid:** Displays component names, unit weights, production plants, and sale prices in a responsive, glassmorphic table.
*   **Sorting and Search:** Built using React state hooks, users can sort rows by component weight or price. Text searches allow quick filtering, ensuring sales reps can find pricing details during client calls.

## 7.3 Purchase Order Management & PDF Parsing
Adding new purchase orders is a critical data ingestion step. In the legacy workflow, managers manually typed details from customer PDFs, which was slow and prone to errors.
*   **Data Form:** Captures the PO Number, Company Name, Component Name, Target Plant, Ordered Quantity, Unit Rate, and PO Date.
*   **Supabase Transaction Logic:** Inserting a new order requires resolving the IDs of the customer company and component. The React app first queries the `companies` and `components` tables to retrieve their unique database IDs. It then inserts the master order record into `purchase_orders`, retrieves the generated `purchase_order_id`, and writes the individual items into the `purchase_order_items` table.
*   **PDF Auto-Extraction Concept:** The page integrates `pdfjs-dist` to parse uploaded PDF orders. When a user uploads a PDF, the library loads the document into a binary buffer, iterates through its text content, extracts fields like the PO number, quantity, and rates using regular expressions, and auto-populates the input fields. This reduces data entry times from minutes to seconds.

```javascript
// AddOrder.js submit handler showing relational lookups and inserts
const handleSubmit = async (e) => {
  e.preventDefault();
  try {
    // Resolve Company ID
    const { data: company } = await supabase
      .from("companies")
      .select("id")
      .eq("company_name", formData.company)
      .single();

    // Resolve Component ID
    const { data: component } = await supabase
      .from("components")
      .select("id")
      .eq("component_name", formData.component)
      .single();

    if (!company || !component) {
      alert("Validation failed: Company or Component not found in catalog.");
      return;
    }

    // Insert Parent Purchase Order
    const { data: purchaseOrder, error: poError } = await supabase
      .from("purchase_orders")
      .insert([{
        po_number: formData.poNumber,
        company_id: company.id,
        po_date: formData.poDate
      }])
      .select()
      .single();

    if (poError) throw poError;

    // Insert Child Purchase Order Item
    const { error: itemError } = await supabase
      .from("purchase_order_items")
      .insert([{
        purchase_order_id: purchaseOrder.id,
        component_id: component.id,
        ordered_qty: Number(formData.orderedQty),
        rate: Number(formData.rate)
      }]);

    if (itemError) throw itemError;

    alert("Purchase Order and relational line items saved successfully.");
  } catch (err) {
    console.error("Error during transaction execution:", err.message);
  }
};
```

## 7.4 Pending Orders Module
Tracks the factory's backlog of outstanding orders.
*   **Fulfillment Math:** Calculates the difference between the ordered quantity and the sum of dispatched quantities for each item (`ordered_qty - COALESCE(SUM(dispatched_qty), 0)`).
*   **Visual Status:** Outstanding quantities are displayed in lists. High-contrast indicators highlight orders with large pending balances, helping scheduling managers plan upcoming production runs.

## 7.5 Dispatch History & Calculations
Tracks completed shipments and updating remaining order balances.
*   **Dispatch Tracking Table:** Displays historical shipments, including dispatch dates, quantities shipped, and carrier tracking numbers.
*   **Remaining Balance Calculation:** Adding a dispatch checks the pending quantity from the `pending_summary_live` view. The application verifies that the dispatch quantity does not exceed the remaining balance. Once validated, it inserts a dispatch record, which automatically updates the view.

## 7.6 Expense, Employee, and Vendor Management
*   **Expense Tracker:** Allows adding and tracking operating costs (Electricity, Raw Materials, Labor, GST, and Others). It integrates with Supabase to provide real-time updates and supports updating payment statuses (Paid or Pending) directly from list cards.
*   **Employee & Payroll Management:** Lists employees, salaries, and roles. Managers can update payroll statuses ("Mark Salary as Paid"), which writes payment records to Supabase.
*   **Vendor Directory:** Stores supplier names, contact details, materials supplied (e.g., Polypropylene resins), and outstanding payments. This acts as a centralized directory for the procurement team.

---

# Chapter 8: UI/UX Redesign & Modern Aesthetics

## 8.1 Glassmorphism & Core CSS Styling
To move away from standard dashboard designs, the ERP Dashboard uses a **Glassmorphic Theme**. This styling is defined in `variables.css` using CSS custom properties:

```css
:root {
  --bg-gradient: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);
  --glass-bg: rgba(30, 41, 59, 0.45);
  --glass-border: 1px solid rgba(255, 255, 255, 0.08);
  --glass-blur: blur(16px);
  --text-primary: #f8fafc;
  --text-muted: #94a3b8;
  --accent-blue: #3b82f6;
  --accent-purple: #8b5cf6;
  --accent-emerald: #10b981;
  --card-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
  --border-radius: 16px;
}
```

Every module UI card utilizes these styles to achieve a modern look:
```css
.glass-card {
  background: var(--glass-bg);
  border: var(--glass-border);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  box-shadow: var(--card-shadow);
  border-radius: var(--border-radius);
  padding: 1.5rem;
  color: var(--text-primary);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.glass-card:hover {
  transform: translateY(-4px);
  border-color: rgba(255, 255, 255, 0.16);
  box-shadow: 0 12px 40px 0 rgba(0, 0, 0, 0.5);
}
```

This theme creates a dark UI with glowing elements, high readability, and smooth transitions that improve the user experience.

## 8.2 Responsive Layout & Grid Systems
The dashboard uses CSS Flexbox for linear layouts (such as navigation links and button groups) and CSS Grid for two-dimensional layouts (such as the main dashboard and analytics cards).

*   **Responsive Grids:** The dashboard layout uses a grid system that adjusts to different screen sizes:
```css
.dashboard-columns {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

@media (max-width: 1024px) {
  .dashboard-columns {
    grid-template-columns: 1fr;
  }
}
```
*   **Adaptive Sidebar:** The navigation sidebar collapses into a top navigation bar on mobile screens, ensuring the application remains functional on smartphones and tablets used on the factory floor.
*   **Responsive Data Tables:** Tables are wrapped in containers with horizontal scrolling enabled (`overflow-x: auto`) and use flexible widths (`min-width: 600px`). This keeps data columns readable and prevents layout breaks on smaller screens.

---

# Chapter 9: Technical Challenges & Development Debugging Logs

During the 14-day development of the Factory Management ERP Dashboard, several technical challenges were encountered across frontend styling, chart integration, library compatibility, database synchronization, and team collaboration. This chapter documents those issues and the solutions implemented.

## 9.1 Layout Alignment & CSS Conflicts
*   **The Issue:** When modular page stylesheets (such as `home.css`, `sidebar.css`, and `components.css`) were combined with `global.css` and `main.css`, CSS class name collisions occurred. This caused the sidebar to overlap with the main content container and misaligned the grid columns on the dashboard.
*   **The Cause:** Global styles did not specify margins for the main content area to account for the sidebar, and several components used absolute positioning, which broke when layouts resized.
*   **The Solution:** The layout architecture was refactored using CSS Grid. Global rules in `main.css` were updated to define a grid template for the sidebar and main content. Absolute positioning was replaced with flexible CSS Flexbox properties, ensuring components adjust smoothly to changes in sidebar state.

## 9.2 Recharts ResponsiveContainer Rendering Issues
*   **The Issue:** When charts were placed inside CSS Grid layout cards on the homepage, they failed to render, collapsing to 0px height and width.
*   **The Cause:** The Recharts `<ResponsiveContainer>` component calculates its dimensions dynamically based on its parent container. However, parent cards styled with `display: grid` or `display: flex` do not provide a fixed height during the initial DOM load. This causes the container to calculate a height of zero.
*   **The Solution:** An explicit height (e.g., `height: 300px` or `height: 350px`) was defined on a wrapper element (`.chart-wrapper`) surrounding each chart. The `<ResponsiveContainer>` was then set to take 100% of this wrapper's dimensions. Additionally, a React state variable `isMounted` was introduced to delay chart rendering until the component completes its mount cycle, preventing canvas draw errors:
```javascript
const [isMounted, setIsMounted] = useState(false);
useEffect(() => {
  requestAnimationFrame(() => {
    setIsMounted(true);
  });
}, []);
```

## 9.3 Migration from Recharts v3 to v2
*   **The Issue:** The project initially used Recharts v3.0.0-beta, which caused runtime build errors and console warnings, especially when using the custom active active shape (`renderActiveShape`) on Pie charts.
*   **The Cause:** Recharts v3 introduces structural changes and API adjustments that are incompatible with React 18.3.1. This caused rendering cycles to fail during state updates.
*   **The Solution:** The project was downgraded to the stable version Recharts v2.12.7. This resolved version conflicts, restored correct chart animations, and fixed hover interaction behaviors.

## 9.4 Asynchronous Latency & State Management Issues
*   **The Issue:** When slow network speeds delayed data fetching from Supabase, components threw undefined reference errors, causing the application to crash.
*   **The Cause:** Components tried to map or filter state arrays before the asynchronous Supabase query resolved and populated the local state.
*   **The Solution:** Asynchronous logic was enclosed in try-catch-finally blocks. Fallback state properties were implemented, and conditional rendering (loading spinners and skeletal UI cards) was added to ensure the DOM only renders data blocks after the promise successfully resolves.

---

# Chapter 10: Software Testing and Quality Assurance

## 10.1 Testing Strategy
To verify the ERP dashboard's reliability and usability, a testing strategy was executed across several domains:
1.  **Manual & Functional Testing:** Forms, sidebar links, filters, and buttons were clicked to ensure they perform their designated actions.
2.  **UI & Responsive Testing:** Visual checks were run using Chrome Developer Tools at various breakpoints (mobile, tablet, desktop) to verify layout rendering and card wrapping.
3.  **Database Integration Testing:** Form submissions were verified by checking the Supabase database console to ensure data is written with correct constraints.
4.  **Regression Testing:** Ensured new changes, such as UI color updates or column additions, did not break existing features like calculations or data tables.

## 10.2 Comprehensive Test Cases Table

The table below documents the test cases executed to validate the ERP Dashboard.

| Test ID | Module | Test Type | Test Description | Input Data | Expected Output | Actual Output | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| TC-01 | Main Dashboard | Functional | Verify animated counters load on page load | Page render event | Counters count up from 0 to target values over 1.2s | As expected; count-up animation renders | Pass |
| TC-02 | Main Dashboard | UI/Hover | Verify Pie chart slice enlarges on mouse enter | Pointer hover on slice | Active shape radius expands by 6px | As expected; slice expands on hover | Pass |
| TC-03 | Component Catalog | Functional | Search catalog by text query | String: "Cover" | Table filters to show only components containing "Cover" | Table filtered correctly | Pass |
| TC-04 | Component Catalog | Functional | Filter components by Plant assignment | Select: "Plant 2" | Displays only components assigned to Plant 2 | Plant 2 components displayed | Pass |
| TC-05 | Component Catalog | Functional | Click component to view specifications | Component ID selection | Split-screen card displays details (weight, spec JSON) | Specification details rendered | Pass |
| TC-06 | Price List | Functional | Sort catalog table by Price column | Column click event | Table sorts in ascending/descending order | Sorted correctly | Pass |
| TC-07 | Purchase Orders | Functional | Ingest manual purchase order via form | Form fields filled, Submit | Data inserted into `purchase_orders` and `purchase_order_items` | Database record written, confirmation alert | Pass |
| TC-08 | Purchase Orders | Validation | Attempt PO submit with empty fields | Missing quantity | Form halts submission; highlights missing field | Submit blocked; error shown | Pass |
| TC-09 | Purchase Orders | PDF Import | Upload customer purchase order PDF file | PDF file input | Extract PO number, company, and items to auto-fill form | Fields populated; manual review matches PDF | Pass |
| TC-10 | Pending Orders | Integration | Verify pending order balance calculation | Order: 1000, Dispatches: 600 | Pending display calculates and renders 400 remaining units | Calculates 400 | Pass |
| TC-11 | Dispatch History | Functional | Log a new dispatch shipment | Dispatch: 200, PO Item: 400 | Subtract 200 from pending; write tracking row to `dispatches` | Row added; pending balance decreases to 200 | Pass |
| TC-12 | Expense Tracker | Functional | Add new factory operational cost | Category: Electricity, Amount: 85000 | Expense card added; total expenses pie chart updates | Record added; pie chart updates | Pass |
| TC-13 | Employee Management| Functional | Mark employee monthly salary as paid | Button: "Mark Paid" | Update `salary_status` to 'Paid' in Supabase | Status updated in DB; button disabled | Pass |
| TC-14 | Vendor Directory | Functional | Search vendor catalog by supplier name | String: "Resin" | Display vendors supplying plastic resin materials | Matches and displays resin vendors | Pass |
| TC-15 | Application Shell | Responsive | Check layout rendering on mobile devices | Screen width: 375px | Sidebar collapses into drawer; tables scroll horizontally | Layout shifts; sidebar hidden; tables scroll | Pass |

---

# Chapter 11: Version Control & Git Workflow

## 11.1 Branching Strategy
To maintain codebase stability during development, a Git branching workflow was implemented:
*   `main`: The production-ready branch. Only clean, tested features were merged here.
*   `feature/dashboard`: Used to build homepage analytics, grid systems, and Recharts configurations.
*   `feature/supabase`: Used to set up database connections, write CRUD APIs, and manage query hooks.

```
(main)          [V1.0 Draft]-----------------------------[Final Release]
                     \                                      /
(feature/supabase)    \--[DB Schema]---[CRUD Fetch]--------/ (Merge)
                       \                                  /
(feature/dashboard)     \--[KPI Layout]---[Recharts v2]--/ (Merge)
```
*[Figure 11.1: Git Branching Workflow Diagram]*

## 11.2 Collaboration & Conflict Resolution
Git commit messages followed the Conventional Commits specification to maintain a clear version history:
*   `feat(db): establish component catalog schema and constraints`
*   `fix(charts): define wrapper height to resolve ResponsiveContainer collapse`
*   `style(dashboard): implement glassmorphic custom variables and backdrop blur`

When merging feature branches, merge conflicts occasionally occurred in `App.js` and styling sheets due to concurrent edits. These conflicts were resolved manually by comparing local changes with incoming commits in VS Code, selecting the correct imports, and running validation builds before committing the merge.

---

# Chapter 12: Business Outcomes & Future Scope

## 12.1 Digital Transformation Outcomes
Deploying the Factory Management ERP Dashboard brings several improvements to Navneet Industries' operations:
*   **Digital Record Keeping:** Replaces paper registers with a centralized database on Supabase, ensuring data is secure and searchable.
*   **Reduced Manual Operations:** Auto-populating purchase orders from PDF uploads saves data entry time and reduces transcription errors.
*   **Precise Production Tracking:** Provides real-time visibility into pending orders and dispatches, helping managers plan production runs.
*   **Better Expense Monitoring:** Visualizing operational costs helps managers identify cost leaks, such as high electricity use or scrap rates.
*   **Centralized Resource Management:** Consolidates employee payroll, vendor details, and component catalogs into a single interface.
*   **Data-Driven Decision Making:** Interactive charts help Mr. Pritpal Singh analyze plant profitability and machine capacity to optimize resources.

## 12.2 Future Project Scope
To build on this foundation, several future enhancements are planned:
1.  **Authentication & Role-Based Access Control (RBAC):** Implementing secure user logins via Supabase Auth to restrict access based on roles (e.g., administrator, plant operator, sales representative).
2.  **Inventory Tracking Module:** Adding raw material inventory management to alert staff when resin or color stocks fall below critical levels.
3.  **Billing & Automated Invoice Generation:** Creating a module to automatically generate PDF invoices from completed dispatches.
4.  **Real-Time Analytics via WebSockets:** Utilizing Supabase real-time listeners to sync dashboard statistics across multiple devices simultaneously.
5.  **Predictive Maintenance & IoT Integration:** Connecting machine sensors to the dashboard to monitor temperature and pressure, using predictive analytics to schedule maintenance.

---

# Chapter 13: Conclusion

Developing the Factory Management ERP Dashboard for Navneet Industries provided a valuable learning experience during the internship. It demonstrated how B.Tech Computer Science Engineering (Data Science) principles—including database design, system normalization, data visualization, and asynchronous state management—apply directly to real-world industrial operations.

Working under the guidance of Mr. Pritpal Singh highlighted the importance of user-centric design. The transition from legacy paper logs to a glassmorphic dashboard demonstrates the impact of modern software engineering. Overcoming technical challenges, such as CSS conflicts, charting errors, and library compatibility issues, strengthened my debugging, version control, and problem-solving skills. The final application provides Navneet Industries with a scalable foundation to improve operational efficiency and supports my growth as a software engineer.

---

# Appendices

## Appendix A: Folder Structure Tree
Below is the directory layout of the React codebase:
```
factory-management/
├── src/
│   ├── components/
│   │   ├── ComponentDetail.js
│   │   ├── ComponentList.js
│   │   ├── Filters.js
│   │   ├── HomePage.js
│   │   ├── Navbar.js
│   │   └── Sidebar.js
│   ├── data/
│   │   ├── companyData.js
│   │   ├── componentsData.json
│   │   ├── ordersData.js
│   │   └── purchaseOrdersData.js
│   ├── pages/
│   │   ├── AddExpense.js
│   │   ├── AddOrder.js
│   │   ├── Dashboard.js
│   │   ├── Employees.js
│   │   ├── Expenses.js
│   │   ├── Home.js
│   │   ├── OrderHistory.js
│   │   ├── Orders.js
│   │   ├── PendingOrders.js
│   │   ├── PlasticComponents.js
│   │   ├── PriceList.js
│   │   └── Vendors.js
│   ├── styles/
│   │   ├── animations.css
│   │   ├── charts.css
│   │   ├── components.css
│   │   ├── forms.css
│   │   ├── global.css
│   │   ├── home.css
│   │   ├── main.css
│   │   ├── navbar.css
│   │   ├── pages.css
│   │   ├── responsive.css
│   │   ├── sidebar.css
│   │   ├── tables.css
│   │   └── variables.css
│   ├── App.js
│   ├── index.js
│   └── supabaseClient.js
└── package.json
```

## Appendix B: Database ER Diagram
The ASCII relationship chart below represents the database schema structure:

```
  +-------------------+              +-----------------------+
  |     companies     |              |   component_catalog   |
  +-------------------+              +-----------------------+
  | PK | id           |<----+        | PK | id               |<---+
  |    | company_name |     |        |    | component_name   |    |
  +-------------------+     |        |    | plant            |    |
                            |        |    | price            |    |
  +-------------------+     |        |    | weight           |    |
  |  purchase_orders  |     |        |    | specifications   |    |
  +-------------------+     |        |    | profit           |    |
  | PK | id           |     |        +-----------------------+    |
  | FK | company_id   |-----+                                     |
  |    | po_number    |                                           |
  |    | po_date      |                                           |
  +-------------------+                                           |
           ^                                                      |
           | (One-to-Many)                                        |
           v                                                      |
  +-----------------------+                                       |
  | purchase_order_items  |                                       |
  +-----------------------+                                       |
  | PK | id               |                                       |
  | FK | purchase_order_id|                                       |
  | FK | component_id     |---------------------------------------+
  |    | ordered_qty      |
  |    | rate             |
  +-----------------------+
           ^
           | (One-to-Many)
           v
  +-----------------------+
  |      dispatches       |
  +-----------------------+
  | PK | id               |
  | FK | po_item_id       |
  |    | dispatched_qty   |
  |    | dispatch_date    |
  |    | tracking_number  |
  +-----------------------+
```

## Appendix C: References & Bibliography
1.  **React Documentation:** Facebook Open Source, "React - A JavaScript Library for Building User Interfaces," https://react.dev/
2.  **Supabase Client Docs:** Supabase Community, "Supabase Database Client Reference for JavaScript," https://supabase.com/docs/reference/javascript/introduction
3.  **Recharts API Specification:** Recharts Team, "Recharts - A Redefined Chart Library Built with React," https://recharts.org/en-US/api
4.  **Chandigarh University Guidelines:** Academic Council, Chandigarh University, "Curriculum Guidelines and Internship Submission Framework for B.Tech CSE," Chandigarh University Publications, 2026.
5.  **SQL Reference Manual:** Thomas Nield, "Getting Started with SQL: A Hands-On Approach for Beginners," O'Reilly Media, 2016.
6.  **Responsive Web Design Standards:** Ethan Marcotte, "Responsive Web Design," A Book Apart, 2011.

