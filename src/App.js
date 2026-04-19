import React from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import ProtectedRoute from "./components/auth/ProtectedRoute";
import Navbar from "./components/layout/Navbar";
import LoadingSpinner from "./components/ui/LoadingSpinner";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Collection from "./pages/Collection";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Matches from "./pages/Matches";
import NotFound from "./pages/NotFound";
import Packs from "./pages/Packs";
import Register from "./pages/Register";
import Squad from "./pages/Squad";

import "./styles/globals.css";
import "./styles/components.css";
import "./styles/auth.css";
import "./styles/dashboard.css";
import "./styles/packs.css";
import "./styles/collection.css";
import "./styles/squad.css";
import "./styles/matches.css";

function HomeRedirect() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading Dream Squad FC..." />;
  }

  return <Navigate replace to={user ? "/dashboard" : "/login"} />;
}

function PublicOnlyRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner fullScreen text="Checking account..." />;
  }

  if (user) {
    return <Navigate replace to="/dashboard" />;
  }

  return children;
}

function AppRoutes() {
  return (
    <div className="app-shell">
      <Navbar />

      <main className="app-main">
        <Routes>
          <Route path="/" element={<HomeRedirect />} />
          <Route
            path="/login"
            element={
              <PublicOnlyRoute>
                <Login />
              </PublicOnlyRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicOnlyRoute>
                <Register />
              </PublicOnlyRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/packs"
            element={
              <ProtectedRoute>
                <Packs />
              </ProtectedRoute>
            }
          />
          <Route
            path="/collection"
            element={
              <ProtectedRoute>
                <Collection />
              </ProtectedRoute>
            }
          />
          <Route
            path="/squad"
            element={
              <ProtectedRoute>
                <Squad />
              </ProtectedRoute>
            }
          />
          <Route
            path="/matches"
            element={
              <ProtectedRoute>
                <Matches />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
