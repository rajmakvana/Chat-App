import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.tsx";
import { SelectedUserProvider } from "./context/SelectedUser.tsx";
import { SelectedGroupProvider } from "./context/SelectedGroup.tsx";

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <AuthProvider>
      <SelectedUserProvider>
        <SelectedGroupProvider>
          <App />
        </SelectedGroupProvider>
      </SelectedUserProvider>
    </AuthProvider>
  </BrowserRouter>,
);
