import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import PageContainer from "../components/layout/PageContainer";
import EmptyState from "../components/ui/EmptyState";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import StatCard from "../components/ui/StatCard";
import stadiumArt from "../assets/3.png";
import { useAuth } from "../context/AuthContext";
import api, { getErrorMessage } from "../services/api";
import formatDate, { formatCountdown } from "../utils/formatDate";

function Dashboard() {
  const navigate = useNavigate();
  const { user, loadCurrentUser } = useAuth();
  const [clubData, setClubData] = useState(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [error, setError] = useState("");
  const [infoMessage, setInfoMessage] = useState("");

  const loadClub = useCallback(async () => {
    setPageLoading(true);
    setError("");

    try {
      const response = await api.get("/club");
      setClubData(response.data);
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Could not load your club dashboard."));
    } finally {
      setPageLoading(false);
    }
  }, []);

  useEffect(() => {
    loadClub();
  }, [loadClub]);

  const dashboardUser = useMemo(() => {
    const remoteUser = clubData?.user || {};

    return {
      _id: remoteUser._id || remoteUser.id || user?._id || user?.id || null,
      username: remoteUser.username || user?.username || "Dream Squad Coach",
      coins: Number(remoteUser.coins ?? user?.coins ?? 0),
      packsOpened: Number(remoteUser.packsOpened ?? user?.packsOpened ?? 0),
      wins: Number(remoteUser.wins ?? user?.wins ?? 0),
      losses: Number(remoteUser.losses ?? user?.losses ?? 0),
      coinCooldownUntil: remoteUser.coinCooldownUntil || user?.coinCooldownUntil || null
    };
  }, [clubData, user]);

  const cooldownStatus = clubData?.cooldownStatus || {};
  const collectionSummary = clubData?.collectionSummary || {};

  const canClaimRefill =
    typeof clubData?.canClaimRefill === "boolean"
      ? clubData.canClaimRefill
      : Boolean(cooldownStatus.canClaimRefill);

  const cheapestPackCost =
    clubData?.cheapestPackCost ?? cooldownStatus.cheapestPackCost ?? collectionSummary.cheapestPackCost ?? null;

  const cooldownUntil = dashboardUser.coinCooldownUntil || cooldownStatus.coinCooldownUntil || null;
  const cooldownActive =
    typeof clubData?.cooldownActive === "boolean"
      ? clubData.cooldownActive
      : Boolean(cooldownUntil && !canClaimRefill);

  async function handleClaimRefill() {
    setClaiming(true);
    setError("");
    setInfoMessage("");

    try {
      const response = await api.post("/club/claim-refill");
      setInfoMessage(response.data?.message || "Refill claimed.");
      await Promise.all([loadClub(), loadCurrentUser({ showLoader: false })]);
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Could not claim a refill right now."));
    } finally {
      setClaiming(false);
    }
  }

  if (pageLoading) {
    return <LoadingSpinner fullScreen text="Warming up your dashboard..." />;
  }

  return (
    <PageContainer
      actions={
        <div className="hero-action-row">
          <Link className="btn btn--primary" to="/packs">
            Open Packs
          </Link>
          <Link className="btn btn--ghost" to="/collection">
            View Collection
          </Link>
        </div>
      }
      backgroundImage={stadiumArt}
      description="Track coins, refill timing, and how your club is growing every time you open a pack."
      eyebrow="Club HQ"
      title={`Welcome back, ${dashboardUser.username}`}
    >
      {error ? <div className="form-message form-message--error">{error}</div> : null}
      {infoMessage ? <div className="form-message form-message--success">{infoMessage}</div> : null}

      <section className="dashboard-grid">
        <StatCard accent="green" hint="Ready for the next pack run" icon="C" label="Coins" value={dashboardUser.coins.toLocaleString()} />
        <StatCard accent="cyan" hint="All-time openings" icon="PK" label="Packs Opened" value={dashboardUser.packsOpened} />
        <StatCard accent="gold" hint="Future match mode ready" icon="W" label="Wins" value={dashboardUser.wins} />
        <StatCard accent="purple" hint="Keep building chemistry" icon="L" label="Losses" value={dashboardUser.losses} />
      </section>

      <section className="dashboard-panels">
        <article className="surface-panel dashboard-panel">
          <div className="section-heading">
            <div>
              <span className="section-heading__eyebrow">Coin Refill</span>
              <h2>Stay in the game</h2>
            </div>
            {cheapestPackCost !== null ? <span className="pill">Cheapest pack: {cheapestPackCost} coins</span> : null}
          </div>

          <div className="dashboard-refill">
            <div>
              <strong>{canClaimRefill ? "Refill Ready" : cooldownActive ? "Cooldown Running" : "Club Rolling"}</strong>
              <p>
                {canClaimRefill
                  ? "Your refill is ready to claim."
                  : cooldownActive
                  ? `Next refill window opens in ${formatCountdown(cooldownUntil)}.`
                  : "You still have enough coins to keep opening packs."}
              </p>
              {cooldownUntil ? <span className="dashboard-refill__date">Cooldown ends {formatDate(cooldownUntil)}</span> : null}
            </div>

            <button
              className="btn btn--primary"
              disabled={!canClaimRefill || claiming}
              onClick={handleClaimRefill}
              type="button"
            >
              {claiming ? "Claiming..." : "Claim Refill"}
            </button>
          </div>
        </article>

        <article className="surface-panel dashboard-panel">
          <div className="section-heading">
            <div>
              <span className="section-heading__eyebrow">Club Snapshot</span>
              <h2>Collection pulse</h2>
            </div>
          </div>

          {collectionSummary.cardCount ? (
            <div className="dashboard-highlights">
              <div className="dashboard-highlight">
                <span>Average Overall</span>
                <strong>{collectionSummary.averageOverall || "--"}</strong>
              </div>
              <div className="dashboard-highlight">
                <span>Chemistry Score</span>
                <strong>{collectionSummary.chemistryScore || 0}</strong>
              </div>
              <div className="dashboard-highlight">
                <span>Top Nation</span>
                <strong>{collectionSummary.topNationalities?.[0]?.name || "Building"}</strong>
              </div>
              <div className="dashboard-highlight">
                <span>Top Club</span>
                <strong>{collectionSummary.topClubs?.[0]?.name || "Growing"}</strong>
              </div>
            </div>
          ) : (
            <EmptyState
              actionLabel="Open Your First Pack"
              description="Your collection is waiting for its first stars."
              onAction={() => navigate("/packs")}
              title="No club cards yet"
            />
          )}
        </article>
      </section>
    </PageContainer>
  );
}

export default Dashboard;
