import { useState, useEffect } from "react";

import Sidebar from "../components/Sidebar";

import { supabase } from "../supabaseClient";

function Vendors() {

    const [vendors, setVendors] = useState([]);

    useEffect(() => {
        fetchVendors();
    }, []);

    async function fetchVendors() {

        const { data, error } =
            await supabase
                .from("vendors")
                .select("*");

        if (!error) {
            setVendors(data);
        }
    }

    return (

        <div className="layout">

            <Sidebar />

            <div className="main-content">

                <h1>
                    Vendor Management
                </h1>

                <div className="stats-grid">

                    <div className="stat-card">
                        <h3>5</h3>
                        <p>Suppliers</p>
                    </div>

                    <div className="stat-card">
                        <h3>9.5 T</h3>
                        <p>Monthly Material</p>
                    </div>

                    <div className="stat-card">
                        <h3>₹52</h3>
                        <p>Average Rate</p>
                    </div>

                    <div className="stat-card">
                        <h3>ASG</h3>
                        <p>Top Supplier</p>
                    </div>

                </div>

                <div className="dashboard-card">

                    <h2>
                        Vendors 
                    </h2>

                    <table className="machine-table">

                        <thead>

                            <tr>
                                <th>Vendor</th>
                                <th>Quantity</th>
                                <th>Rate</th>
                                <th>Frequency</th>
                                <th>Material</th>
                                <th>Status</th>
                            </tr>

                        </thead>

                        <tbody>

                            {vendors.map((vendor) => (

                                <tr key={vendor.id}>

                                    <td>
                                        {vendor.vendor_name}
                                    </td>

                                    <td>
                                        {vendor.quantity} Ton
                                    </td>

                                    <td>
                                        ₹{vendor.rate}/kg
                                    </td>

                                    <td>
                                        {vendor.frequency}
                                    </td>

                                    <td>
                                        {vendor.material}
                                    </td>

                                    <td>
                                        {vendor.status}
                                    </td>

                                </tr>

                            ))}

                        </tbody>

                    </table>

                </div>

            </div>

        </div>

    );
}

export default Vendors;