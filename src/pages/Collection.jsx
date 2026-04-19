import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import PageContainer from "../components/layout/PageContainer";
import EmptyState from "../components/ui/EmptyState";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import PlayerCard from "../components/ui/PlayerCard";
import StatCard from "../components/ui/StatCard";
import stadiumArt from "../assets/1.png";
import { useAuth } from "../context/AuthContext";
import api, { getErrorMessage } from "../services/api";

function Collection() {
  const navigate = useNavigate();
  const { loadCurrentUser } = useAuth();
  const [collectionData, setCollectionData] = useState(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [selling, setSelling] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [error, setError] = useState("");
  const [infoMessage, setInfoMessage] = useState("");

  const loadCollection = useCallback(async () => {
    setPageLoading(true);
    setError("");

    try {
      const response = await api.get("/club/collection");
      setCollectionData(response.data);
    } catch (requestError) {
      setError(
        getErrorMessage(requestError, "Could not load your collection."),
      );
    } finally {
      setPageLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCollection();
  }, [loadCollection]);

  const cards = useMemo(
    () => collectionData?.collection || collectionData?.cards || [],
    [collectionData],
  );
  const insights = collectionData?.insights || {};

  const selectedCount = selectedIds.length;
  const selectedCards = useMemo(
    () => cards.filter((card) => selectedIds.includes(card.id || card._id)),
    [cards, selectedIds],
  );
  const selectedSellValue = selectedCards.reduce(
    (totalValue, card) => totalValue + Number(card.sellValue || 0),
    0,
  );

  function toggleSelect(cardId) {
    setSelectedIds((currentValue) =>
      currentValue.includes(cardId)
        ? currentValue.filter((entry) => entry !== cardId)
        : [...currentValue, cardId],
    );
  }

  async function handleSellSelected() {
    if (!selectedIds.length) {
      return;
    }

    setSelling(true);
    setError("");
    setInfoMessage("");

    try {
      const response = await api.post("/club/sell", {
        ownedCardIds: selectedIds,
      });

      setInfoMessage(response.data?.message || "Cards sold successfully.");
      setSelectedIds([]);

      await Promise.all([
        loadCollection(),
        loadCurrentUser({ showLoader: false }),
      ]);
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Those cards could not be sold."));
    } finally {
      setSelling(false);
    }
  }

  if (pageLoading) {
    return <LoadingSpinner fullScreen text="Sorting your football cards..." />;
  }

  return (
    <PageContainer
      backgroundImage={stadiumArt}
      description="Flip through every player you own, pick the cards you want to sell, and watch your club take shape."
      eyebrow="Collection"
      title="Your Card Club"
    >
      {error ? (
        <div className="form-message form-message--error">{error}</div>
      ) : null}
      {infoMessage ? (
        <div className="form-message form-message--success">{infoMessage}</div>
      ) : null}

      <section className="collection-summary">
        <StatCard
          accent="cyan"
          hint="Total cards in your club"
          icon="CC"
          label="Cards"
          value={Number(collectionData?.totalCards || cards.length)}
        />
        <StatCard
          accent="green"
          hint="Average player quality"
          icon="OVR"
          label="Average Overall"
          value={insights.averageOverall || "--"}
        />
        <StatCard
          accent="gold"
          hint="Players already in your XI"
          icon="XI"
          label="In Squad"
          value={insights.squadCount || 0}
        />
        <StatCard
          accent="purple"
          hint="Shared club, nation, and league links"
          icon="CH"
          label="Chemistry"
          value={insights.chemistryScore || 0}
        />
      </section>

      {cards.length ? (
        <>
          <section className="surface-panel collection-toolbar">
            <div>
              <span className="section-heading__eyebrow">Card Actions</span>
              <h2>
                {selectedCount
                  ? `${selectedCount} cards selected`
                  : "Pick cards to sell"}
              </h2>
              <p>
                {selectedCount
                  ? `${selectedSellValue.toLocaleString()} coins ready if you sell now.`
                  : "Tap cards to select them. Cards in your squad are selectable and will be removed from your XI when sold."}
              </p>
            </div>

            <div className="collection-toolbar__actions">
              <button
                className="btn btn--ghost"
                disabled={!selectedCount}
                onClick={() => setSelectedIds([])}
                type="button"
              >
                Clear
              </button>
              <button
                className="btn btn--primary"
                disabled={!selectedCount || selling}
                onClick={handleSellSelected}
                type="button"
              >
                {selling ? "Selling..." : "Sell Selected"}
              </button>
            </div>
          </section>

          <section className="collection-grid">
            {cards.map((card) => {
              const cardId = card.id || card._id;

              return (
                <PlayerCard
                  card={card}
                  key={cardId}
                  onSelect={toggleSelect}
                  selectable={true}
                  selected={selectedIds.includes(cardId)}
                  showPortrait
                />
              );
            })}
          </section>
        </>
      ) : (
        <EmptyState
          actionLabel="Go To Packs"
          description="Your collection is empty. Open a pack to start building your club."
          onAction={() => navigate("/packs")}
          title="No players collected yet"
        />
      )}
    </PageContainer>
  );
}

export default Collection;
