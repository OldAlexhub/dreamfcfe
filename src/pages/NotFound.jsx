import React from "react";
import { useNavigate } from "react-router-dom";

import PageContainer from "../components/layout/PageContainer";
import EmptyState from "../components/ui/EmptyState";

function NotFound() {
  const navigate = useNavigate();

  return (
    <PageContainer
      description="That route is not part of your club right now."
      eyebrow="404"
      title="Page Not Found"
    >
      <EmptyState
        actionLabel="Go To Dashboard"
        description="Head back to the main club hub and keep the squad moving."
        onAction={() => navigate("/dashboard")}
        title="This tunnel leads nowhere"
      />
    </PageContainer>
  );
}

export default NotFound;
