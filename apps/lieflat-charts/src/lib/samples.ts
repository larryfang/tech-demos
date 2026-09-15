export type Sample = {
  id: string
  label: string
  text: string
}

export const SAMPLES: Sample[] = [
  {
    id: "plans",
    label: "Plan MRR",
    text: `plan,mrr_k,note
Enterprise,184,renewals held
Growth,96,self-serve upsell
Starter,41,new logos
Hobby,12,free-to-paid`,
  },
  {
    id: "trees",
    label: "Trees planted",
    text: `{
  "title": "Trees planted, year by year",
  "subtitle": "reforestation program · thousands of trees",
  "source": "GREEN OPS · SAMPLE",
  "unit": "k trees",
  "rows": [
    { "year": 2019, "trees": 12, "note": "pilot plots" },
    { "year": 2020, "trees": 18, "note": "two new sites" },
    { "year": 2021, "trees": 27, "note": "school partners" },
    { "year": 2022, "trees": 31, "note": "dry season dip" },
    { "year": 2023, "trees": 44, "note": "city grants" },
    { "year": 2024, "trees": 52, "note": "volunteer weekends" },
    { "year": 2025, "trees": 61, "note": "nursery online" }
  ]
}`,
  },
  {
    id: "queues",
    label: "Support queues",
    text: `queue,tickets,note
Billing,142,invoice mismatches
Login,98,SSO outage week
Shipping,76,carrier delays
Returns,54,size exchanges
Other,21,one-off asks`,
  },
]
