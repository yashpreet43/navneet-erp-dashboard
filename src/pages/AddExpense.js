import { useState } from "react";
import { useNavigate } from "react-router-dom";

import Sidebar from "../components/Sidebar";
import { supabase } from "../supabaseClient";

function AddExpense() {

    const navigate = useNavigate();

    const [date, setDate] = useState("");
    const [category, setCategory] = useState("");
    const [description, setDescription] = useState("");
    const [amount, setAmount] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("");
    const [remarks, setRemarks] = useState("");

    async function saveExpense() {

        const { error } =
            await supabase
                .from("expenses")
                .insert([{

                    expense_date: date,
                    category,
                    description,
                    amount,
                    payment_method: paymentMethod,
                    status: "Pending",
                    remarks

                }]);

        if (error) {
            console.log(error);
            alert("Error saving expense");
            return;
        }

        alert("Expense Added Successfully");

        navigate("/expenses");
    }

    return (

        <div className="layout">

            <Sidebar />

            <div className="main-content">

                <h1>Add Expense</h1>

                <div className="dashboard-card">

                    <input
                        type="date"
                        value={date}
                        onChange={(e) =>
                            setDate(e.target.value)
                        }
                    />

                    <br /><br />

                    <select
                        value={category}
                        onChange={(e) =>
                            setCategory(e.target.value)
                        }
                    >
                        <option value="">
                            Select Category
                        </option>

                        <option>
                            Electricity
                        </option>

                        <option>
                            Labour
                        </option>

                        <option>
                            GST
                        </option>

                        <option>
                            Raw Material
                        </option>

                        <option>
                            Maintenance
                        </option>

                    </select>

                    <br /><br />

                    <input
                        type="text"
                        placeholder="Description"
                        value={description}
                        onChange={(e) =>
                            setDescription(
                                e.target.value
                            )
                        }
                    />

                    <br /><br />

                    <input
                        type="number"
                        placeholder="Amount"
                        value={amount}
                        onChange={(e) =>
                            setAmount(
                                e.target.value
                            )
                        }
                    />

                    <br /><br />

                    <input
                        type="text"
                        placeholder="Payment Method"
                        value={paymentMethod}
                        onChange={(e) =>
                            setPaymentMethod(
                                e.target.value
                            )
                        }
                    />

                    <br /><br />

                    <textarea
                        placeholder="Remarks"
                        value={remarks}
                        onChange={(e) =>
                            setRemarks(
                                e.target.value
                            )
                        }
                    />

                    <br /><br />

                    <button
                        onClick={saveExpense}
                    >
                        Save Expense
                    </button>

                </div>

            </div>

        </div>

    );
}

export default AddExpense;