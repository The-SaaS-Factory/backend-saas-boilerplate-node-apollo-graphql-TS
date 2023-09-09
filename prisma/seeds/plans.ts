export const capabilities = [
  {
    name: "Unlimited Storage",
    description: "Cloud storage with no limits",
    type: "PERMISSION",
  },
  {
    name: "24/7 Support",
    description: "24/7 technical support availability",
    type: "PERMISSION",
  },
  {
    name: "Advanced Analytics",
    description: "Advanced data analysis tools",
    type: "LIMIT",
  },
  {
    name: "API Integration",
    description: "Full API access for custom integrations",
    type: "LIMIT",
  },
];

export const plans = [
  {
    name: "Basic Plan",
    type: "month",
    description: "Basic access to the software",
    price: 20,
  },
  {
    name: "Premium Plan",
    type: "month",
    description: "Full access to all features",
    price: 49.99,
  },
  {
    name: "Standard Plan",
    type: "year",
    description: "Annual plan with standard access",
    price: 199.99,
  },
  {
    name: "Enterprise Plan",
    type: "year",
    description: "Annual plan with enterprise features",
    price: 499.99,
  },
];

export const planCapabilities = [
  //Plan 1
  {
    planId: 1,
    capabilitieId: 1,
    count: 1,
    name: "",
  },
  {
    planId: 1,
    capabilitieId: 2,
    count: 0,
    name: "",
  },
  {
    planId: 1,
    capabilitieId: 3,
    count: 0,
    name: "",
  },
  {
    planId: 1,
    capabilitieId: 4,
    count: 2,
    name: "",
  },
  //Plan 2
  {
    planId: 2,
    capabilitieId: 1,
    count: 1,
    name: "",
  },
  {
    planId: 2,
    capabilitieId: 2,
    count: 1,
    name: "",
  },
  {
    planId: 2,
    capabilitieId: 3,
    count: 1,
    name: "",
  },
  {
    planId: 2,
    capabilitieId: 4,
    count: 3,
    name: "",
  },
  //Plan 3
  {
    planId: 3,
    capabilitieId: 1,
    count: 1,
    name: "",
  },
  {
    planId: 3,
    capabilitieId: 2,
    count: 1,
    name: "",
  },
  {
    planId: 3,
    capabilitieId: 3,
    count: 1,
    name: "",
  },
  {
    planId: 3,
    capabilitieId: 4,
    count: 4,
    name: "",
  },
  //Plan 4
  {
    planId: 4,
    capabilitieId: 1,
    count: 1,
    name: "",
  },
  {
    planId: 4,
    capabilitieId: 2,
    count: 1,
    name: "",
  },
  {
    planId: 4,
    capabilitieId: 3,
    count: 1,
    name: "",
  },
  {
    planId: 4,
    capabilitieId: 4,
    count: 8,
    name: "",
  },
];
