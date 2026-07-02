import { useState, useEffect } from "react";

import Navbar from "../components/Navbar";

import { supabase } from "../supabaseClient";

function Orders() {

  const [orders, setOrders] =
    useState([]);

  const [dispatchQty, setDispatchQty] =
    useState({});

  useEffect(() => {

    fetchOrders();

  }, []);

  const fetchOrders = async () => {

    const { data, error } =

      await supabase

        .from("pending_summary")

        .select("*");

    if (error) {

      console.log(error);

      return;
    }

    setOrders(data);
  };

  const handleDispatch =
    async (row) => {

      const qty =
        Number(

          dispatchQty[
            row.purchase_order_item_id
          ]
        );

      if (
        !qty ||
        qty <= 0
      ) {

        alert(
          "Enter valid quantity"
        );

        return;
      }

      if (
        qty >
        row.pending_qty
      ) {

        alert(
          "Dispatch quantity exceeds pending balance"
        );

        return;
      }

      const { error } =

        await supabase

          .from("dispatches")

          .insert([

            {

              purchase_order_item_id:

                row.purchase_order_item_id,

              dispatch_date:

                new Date()

                  .toISOString()

                  .split("T")[0],

              dispatched_qty:
                qty

            }

          ]);

      if (error) {

        console.log(error);

        alert(
          "Error creating dispatch"
        );

        return;
      }

      alert(
        "Bill Created Successfully"
      );

      fetchOrders();
    };

  return (

    <div>

      <Navbar />

      <div className="orders-page">

        <h1>
          Orders & Billing
        </h1>

        <div className="table-container">

          <table>

            <thead>

              <tr>

                <th>
                  PO Number
                </th>

                <th>
                  Component
                </th>

                <th>
                  Ordered
                </th>

                <th>
                  Dispatched
                </th>

                <th>
                  Pending
                </th>

                <th>
                  Dispatch Qty
                </th>

                <th>
                  Action
                </th>

              </tr>

            </thead>

            <tbody>

              {orders.map(
                (order) => (

                  <tr
                    key={
                      order.purchase_order_item_id
                    }
                  >

                    <td>
                      {order.po_number}
                    </td>

                    <td>
                      {order.component_name}
                    </td>

                    <td>
                      {order.ordered_qty}
                    </td>

                    <td>
                      {order.dispatched_qty}
                    </td>

                    <td>
                      {order.pending_qty}
                    </td>

                    <td>

                      <input

                        type="number"

                        value={

                          dispatchQty[
                            order.purchase_order_item_id
                          ] || ""

                        }

                        onChange={(e) =>

                          setDispatchQty({

                            ...dispatchQty,

                            [

                              order.purchase_order_item_id

                            ]:

                              e.target.value

                          })

                        }

                      />

                    </td>

                    <td>

                      <button

                        onClick={() =>

                          handleDispatch(
                            order
                          )

                        }

                      >

                        Create Bill

                      </button>

                    </td>

                  </tr>
                )
              )}

            </tbody>

          </table>

        </div>

      </div>

    </div>
  );
}

export default Orders;