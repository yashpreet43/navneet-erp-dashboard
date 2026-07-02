import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import { supabase } from "../supabaseClient";

function Expenses() {

    const [expenses, setExpenses] = useState([]);

    useEffect(() => {
        fetchExpenses();
    }, []);

    async function fetchExpenses() {

        const { data, error } =
            await supabase
                .from("expenses")
                .select("*")
                .order(
                    "expense_date",
                    { ascending: false }
                );

        if (error) {
            console.log(error);
            return;
        }

        setExpenses(data);
    }

    async function markPaid(id) {

        const { error } =
            await supabase
                .from("expenses")
                .update({
                    status: "Paid",
                    paid_date:
                        new Date()
                            .toISOString()
                            .split("T")[0]
                })
                .eq("id", id);

        if (!error) {
            fetchExpenses();
        }
    }

    const totalExpense =
        expenses.reduce(
            (sum, item) =>
                sum + Number(item.amount),
            0
        );

    return (

        <div className="layout">

            <Sidebar />

            <div className="main-content">

                <h1>
                    Expense Management
                </h1>

                <div className="stats-grid">

                    <div className="stat-card">
                        <h3>
                            ₹{totalExpense}
                        </h3>

                        <p>Total Expenses</p>
                    </div>

                    <div className="stat-card">
                        <h3>
                            {expenses.length}
                        </h3>

                        <p>Total Entries</p>
                    </div>

                </div>

                <div className="table-container">
                    <table className="history-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Category</th>
                                <th>Amount</th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {expenses.map((item) => (
                                <tr key={item.id}>
                                    <td>
                                        {item.expense_date}
                                    </td>
                                    <td>
                                        {item.category}
                                    </td>
                                    <td>
                                        ₹{item.amount}
                                    </td>
                                    <td>
                                        {item.status}
                                    </td>
                                    <td>
                                        {item.status === "Pending" && (
                                            <button
                                                onClick={() =>
                                                    markPaid(item.id)
                                                }
                                            >
                                                Mark Paid
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

export default Expenses;