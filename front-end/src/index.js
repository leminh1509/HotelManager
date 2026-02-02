import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { BookingProvider } from "./context/BookingContext";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <BrowserRouter>
    <BookingProvider>
      <App />
    </BookingProvider>
  </BrowserRouter>
);
