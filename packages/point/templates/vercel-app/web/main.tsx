import { createRoot } from "react-dom/client";
import { mountApp } from "../generated/app.tsx";
import "./styles.css";

const root = document.getElementById("root");
if (!root) throw new Error("Missing #root element");
createRoot(root).render(mountApp());
