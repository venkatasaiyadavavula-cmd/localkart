import { useState, useEffect } from "react";

export interface Dispute {
  id: string;
  orderId: string;
  customerName: string;
  vendorName: string;
  reason: string;
  status: "open" | "resolved" | "rejected";
  createdAt: string;
}

export function useAdminDisputes() {
  const [disputes, setDisputes] = useState<Dispute[]>([
    {
      id: "1",
      orderId: "ORD-010",
      customerName: "Ravi Kumar",
      vendorName: "Fresh Mart",
      reason: "Item not delivered",
      status: "open",
      createdAt: "2026-04-11",
    },
    {
      id: "2",
      orderId: "ORD-015",
      customerName: "Priya Sharma",
      vendorName: "Green Grocery",
      reason: "Wrong item received",
      status: "resolved",
      createdAt: "2026-04-09",
    },
  ]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(false);
  }, []);

  return { disputes, loading };
}
