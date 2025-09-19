// src/lib/subscriptionMetrics.ts
export type Sub = {
  id: string;
  amount: number;                       // price typed into the plan
  frequency: "Monthly" | "Annual" | "Weekly";
  status: "active" | "pending" | "denied";
};

export function computeMetrics(subs: Sub[]) {
  const active = subs.filter(s => s.status === "active");
  const pending = subs.filter(s => s.status === "pending");

  const monthlySpend = active.reduce((sum, s) => {
    const amt = Number(s.amount) || 0;
    switch (s.frequency) {
      case "Monthly": return sum + amt;
      case "Annual":  return sum + amt / 12;
      case "Weekly":  return sum + amt * 4.345; // avg weeks per month
      default:        return sum;
    }
  }, 0);

  return {
    activeCount: active.length,
    pendingCount: pending.length,
    monthlySpend: Math.round(monthlySpend * 100) / 100, // 2 decimals
  };
}
