import { GoogleOAuthProvider } from "@react-oauth/google";
import { Navigate, Route, Routes } from "react-router-dom";

import ChatPage from "./pages/ChatPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import SignupPage from "./pages/SignupPage.jsx";
import { getToken } from "./services/api.js";

function ProtectedRoute({ children }) {
  return getToken() ? children : <Navigate to="/login" replace />;
}

export default function App() {
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <ChatPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </GoogleOAuthProvider>
  );
}
