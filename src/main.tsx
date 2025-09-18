// --- BEGIN TEMP URL REWRITE PATCH ---
(() => {
  const OLD = "https://approve-guard-backend.onrender.com";
  const NEW = "https://approve-guard.onrender.com";

  const origFetch = window.fetch.bind(window);

  window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
    let url = typeof input === "string" ? input : input instanceof URL ? input.toString() : (input as Request).url;

    if (url.startsWith(OLD)) {
      const replaced = url.replace(OLD, NEW);
      // console.debug("[rewritten]", url, "→", replaced); // optional
      if (typeof input === "string" || input instanceof URL) {
        return origFetch(replaced, init);
      }
      // If `input` was a Request, clone it with the new URL
      const req = input as Request;
      const newReq = new Request(replaced, req);
      return origFetch(newReq, init);
    }

    return origFetch(input as any, init as any);
  };
})();
 // --- END TEMP URL REWRITE PATCH ---

import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);
