import React from "react";
import { Navigate, useLocation } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";
import LoadingSpinner from "../ui/LoadingSpinner";

function ProtectedRoute({ children }) {
  const location = useLocation();
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner fullScreen text="Entering the stadium..." />;
  }

  if (!user) {
    return <Navigate replace state={{ from: location.pathname }} to="/login" />;
  }

  return children;
}

export default ProtectedRoute;
