import { useState, useEffect } from "react";

import Sidebar from "../components/Sidebar";

import { supabase } from "../supabaseClient";

function Employees() {

    const [employees, setEmployees] = useState([]);

    useEffect(() => {
        fetchEmployees();
    }, []);

    async function fetchEmployees() {

        const { data, error } =
            await supabase
                .from("employees")
                .select("*");

        if (error) {
            console.log(error);
            return;
        }

        setEmployees(data);
    }

    async function paySalary(id) {

        const { error } =
            await supabase
                .from("employees")
                .update({
                    payment_status: "Paid",
                    payment_date:
                        new Date()
                            .toISOString()
                            .split("T")[0]
                })
                .eq("id", id);

        if (!error) {
            fetchEmployees();
        }
    }

    return (

        <div className="layout">

            <Sidebar />

            <div className="main-content">

                <h1>
                    Employee Management
                </h1>

                <div className="dashboard-card">

                    <table className="machine-table">

                        <thead>

                            <tr>
                                <th>Name</th>
                                <th>Designation</th>
                                <th>Salary</th>
                                <th>Type</th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr>

                        </thead>

                        <tbody>

                            {employees.map((emp) => (

                                <tr key={emp.id}>

                                    <td>
                                        {emp.employee_name}
                                    </td>

                                    <td>
                                        {emp.designation}
                                    </td>

                                    <td>
                                        ₹{emp.salary}
                                    </td>

                                    <td>
                                        {emp.type}
                                    </td>

                                    <td>
                                        {emp.payment_status}
                                    </td>

                                    <td>

                                        {emp.payment_status === "Pending" && (

                                            <button
                                                className="dashboard-btn"
                                                onClick={() =>
                                                    paySalary(emp.id)
                                                }
                                            >
                                                Pay
                                            </button>

                                        )}

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

export default Employees;