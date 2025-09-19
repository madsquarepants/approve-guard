// src/lib/config.ts
export const API = import.meta.env.VITE_API_BASE_URL || "https://approve-guard.onrender.com";
// accounts fetch
const rA = await fetch(`${API}/v1/plaid/accounts`);
const { accounts } = await rA.json();

// transactions fetch
const rT = await fetch(`${API}/v1/plaid/transactions`);
const { transactions } = await rT.json();
