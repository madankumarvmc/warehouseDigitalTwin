import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

console.log("Starting Nestle-DC1 Warehouse Visibility...");

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element not found");
}

console.log("Creating React root...");
createRoot(rootElement).render(<App />);
