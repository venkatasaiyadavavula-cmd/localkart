import { useState, useEffect } from "react";

export interface Commission {
  id: string;
  vendorName: string;
  orderId: string;
  amount: number;
  commissionRate: number;
  commissionAmount: number;
  status: "pending" | "paid" | "cancelled";
  date: string;
}

export function useAdminCommissions() {
  const [commissions, setCommissions] = useState<Commission[]>([
    {
      id: "1",
      vendorName: "Fresh Mart",
      orderId: "ORD-001",
      amount: 1200,
      commissionRate: 10,
      commissionAmount: 120,
      status: "paid",
      date: "2026-04-10",
    },
    {
      id: "2",
      vendorName: "Green Grocery",
      orderId: "ORD-002",
      amount: 850,
      commissionRate: 10,
      commissionAmount: 85,
      status: "pending",
      date: "2026-04-12",
    },
    {
      id: "3",
      vendorName: "Daily Needs",
      orderId: "ORD-003",
      amount: 2000,
      commissionRate: 10,
      commissionAmount: 200,
      status: "paid",
      date: "2026-04-14",
    },
  ]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(false);
  }, []);

  return { commissions, loading };
}
