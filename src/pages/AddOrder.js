import { useState, useEffect } from "react";

import Navbar from "../components/Navbar";

import componentsData from "../data/componentsData";
import companyData from "../data/companyData";

import { supabase } from "../supabaseClient";

import * as pdfjsLib from "pdfjs-dist";


function AddOrder() {


  const [formData, setFormData] =
    useState({

      poNumber: "",

      company: "",

      component: "",

      plant: "",

      orderedQty: "",

      rate: "",

      poDate: "",
    });

  useEffect(() => {

    async function testConnection() {

      const { data, error } =

        await supabase
          .from("plants")
          .select("*");

      console.log("Plants:", data);

      if (error) {

        console.log(error);
      }
    }

    testConnection();

  }, []);

  const handleChange = (e) => {

    setFormData({

      ...formData,

      [e.target.name]:
        e.target.value,
    });
  };


  const handleSubmit =
    async (e) => {

      e.preventDefault();

      try {

        const {
          data: company
        } = await supabase

          .from("companies")

          .select("id")

          .eq(
            "company_name",
            formData.company
          )

          .single();

        const {
          data: component
        } = await supabase

          .from("components")

          .select("id")

          .eq(
            "component_name",
            formData.component
          )

          .single();

        if (!company) {

          alert(
            "Company not found"
          );

          return;
        }

        if (!component) {

          alert(
            "Component not found"
          );

          return;
        }

        const {

          data: purchaseOrder,

          error: poError

        } = await supabase

          .from("purchase_orders")

          .insert([

            {

              po_number:
                formData.poNumber,

              company_id:
                company.id,

              po_date:
                formData.poDate

            }

          ])

          .select()

          .single();

        if (poError) {

          console.log(poError);

          alert(
            "Error creating PO"
          );

          return;
        }

        const {

          error: itemError

        } = await supabase

          .from(
            "purchase_order_items"
          )

          .insert([

            {

              purchase_order_id:
                purchaseOrder.id,

              component_id:
                component.id,

              ordered_qty:
                Number(
                  formData.orderedQty
                ),

              rate:
                Number(
                  formData.rate
                )

            }

          ]);

        if (itemError) {

          console.log(itemError);

          alert(
            "Error creating PO Item"
          );

          return;
        }

        alert(
          "Purchase Order Saved Successfully"
        );

        setFormData({

          poNumber: "",

          company: "",

          component: "",

          plant: "",

          orderedQty: "",

          rate: "",

          poDate: "",
        });

      } catch (err) {

        console.log(err);

        alert(
          "Unexpected Error"
        );
      }
    };

  return (

    <div>

      <Navbar />

      <div className="add-order-page">

        <h1>
          Add Purchase Order
        </h1>

        <p className="add-order-subtitle">

          Enter new purchase orders
          received from customers.

        </p>

        <form
          className="order-form"
          onSubmit={handleSubmit}
        >


          <div className="form-group">

            <label>
              PO Number
            </label>

            <input
              type="text"
              name="poNumber"
              value={
                formData.poNumber
              }
              onChange={
                handleChange
              }
              required
            />

          </div>

          <div className="form-group">

            <label>
              Company
            </label>

            <select
              name="company"
              value={
                formData.company
              }
              onChange={
                handleChange
              }
              required
            >

              <option value="">
                Select Company
              </option>

              {companyData.map(
                (company) => (

                  <option
                    key={company}
                    value={company}
                  >

                    {company}

                  </option>
                )
              )}

            </select>

          </div>

          <div className="form-group">

            <label>
              Component
            </label>

            <select
              name="component"
              value={
                formData.component
              }
              onChange={
                handleChange
              }
              required
            >

              <option value="">
                Select Component
              </option>

              {componentsData.map(
                (item) => (

                  <option
                    key={item.id}
                    value={item.name}
                  >

                    {item.name}

                  </option>
                )
              )}

            </select>

          </div>

          <div className="form-group">

            <label>
              Plant
            </label>

            <select
              name="plant"
              value={
                formData.plant
              }
              onChange={
                handleChange
              }
              required
            >

              <option value="">
                Select Plant
              </option>

              <option value="Plant 1">
                Plant 1
              </option>

              <option value="Plant 2">
                Plant 2
              </option>

              <option value="Plant 3">
                Plant 3
              </option>

              <option value="Plant 5">
                Plant 5
              </option>

              <option value="Plant 7">
                Plant 7
              </option>

            </select>

          </div>

          <div className="form-group">

            <label>
              Ordered Quantity
            </label>

            <input
              type="number"
              name="orderedQty"
              value={
                formData.orderedQty
              }
              onChange={
                handleChange
              }
              required
            />

          </div>

          <div className="form-group">

            <label>
              Rate
            </label>

            <input
              type="number"
              step="0.01"
              name="rate"
              value={
                formData.rate
              }
              onChange={
                handleChange
              }
              required
            />

          </div>

          <div className="form-group">

            <label>
              PO Date
            </label>

            <input
              type="date"
              name="poDate"
              value={
                formData.poDate
              }
              onChange={
                handleChange
              }
              required
            />

          </div>

          <button
            type="submit"
            className="submit-order-btn"
          >

            Save Purchase Order

          </button>

        </form>

      </div>

    </div>
  );
}

export default AddOrder;