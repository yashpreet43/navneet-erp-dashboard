const purchaseOrdersData = [

  {
    id: 1,

    poNumber: "1500005619",

    company: "RKFL",

    component:
      "PLASTIC CAP DIA 115MM",

    plant: "Plant 3",

    orderedQty: 2000,

    rate: 3.30,

    poDate: "27-05-2026",

    dispatchHistory: [

      {
        date: "2026-05-20",

        qty: 500,
      },

      {
        date: "2026-05-25",

        qty: 300,
      }
    ]
  },

  {
    id: 2,

    poNumber: "1500005619",

    company: "RKFL",

    component:
      "PLASTIC CAP DIA 120MM",

    plant: "Plant 3",

    orderedQty: 1500,

    rate: 3.30,

    poDate: "27-05-2026",

    dispatchHistory: []
  },

  {
    id: 3,

    poNumber: "1500005619",

    company: "RKFL",

    component:
      "SAFETY CAP FOR FLANGE OD DIFF CASE-857",

    plant: "Plant 3",

    orderedQty: 1000,

    rate: 14.80,

    poDate: "27-05-2026",

    dispatchHistory: [

      {
        date: "2026-05-28",

        qty: 500,
      }
    ]
  }

];

export default purchaseOrdersData;