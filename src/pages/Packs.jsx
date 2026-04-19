import React, { useCallback, useEffect, useMemo, useState } from "react";

import PageContainer from "../components/layout/PageContainer";
import PackRevealModal from "../components/pack/PackRevealModal";
import EmptyState from "../components/ui/EmptyState";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import PackCard from "../components/ui/PackCard";
import StatCard from "../components/ui/StatCard";
import stadiumArt from "../assets/4.png";
import { useAuth } from "../context/AuthContext";
import api, { getErrorMessage } from "../services/api";

function Packs() {
  const { user, loadCurrentUser } = useAuth();
  const [packs, setPacks] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState("");
  const [openingPackId, setOpeningPackId] = useState(null);
  const [revealData, setRevealData] = useState({
    open: false,
    packName: "",
    coins: 0,
    cards: []
  });

  const loadPacks = useCallback(async () => {
    setPageLoading(true);
    setError("");

    try {
      const response = await api.get("/packs");
      setPacks(response.data?.packs || response.data?.data?.packs || []);
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Could not load the pack store."));
    } finally {
      setPageLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPacks();
  }, [loadPacks]);

  const cheapestPackCost = useMemo(() => {
    if (!packs.length) {
      return null;
    }

    return packs.reduce((lowestValue, pack) => {
      const packCost = Number(pack.cost || 0);

      if (lowestValue === null || packCost < lowestValue) {
        return packCost;
      }

      return lowestValue;
    }, null);
  }, [packs]);

  async function handleOpenPack(pack) {
    const packId = pack.id || pack._id;

    if (!packId) {
      setError("This pack is missing an id and cannot be opened.");
      return;
    }

    setOpeningPackId(packId);
    setError("");

    try {
      const response = await api.post(`/packs/open/${packId}`);
      const payload = response.data || {};
      const pulledCards = payload.pulledCards || payload.players || payload.cards || [];

      setRevealData({
        open: true,
        packName: payload.pack?.name || pack.name || "Dream Pack",
        coins: Number(payload.coins ?? user?.coins ?? 0),
        cards: pulledCards
      });

      await loadCurrentUser({ showLoader: false });
    } catch (requestError) {
      setError(getErrorMessage(requestError, "That pack could not be opened."));
    } finally {
      setOpeningPackId(null);
    }
  }

  if (pageLoading) {
    return <LoadingSpinner fullScreen text="Lighting up the pack store..." />;
  }

  return (
    <>
      <PageContainer
        backgroundImage={stadiumArt}
        description="Choose a pack, light the tunnel, and reveal the next stars for your club."
        eyebrow="Pack Store"
        title="Open New Talent"
      >
        {error ? <div className="form-message form-message--error">{error}</div> : null}

        <section className="packs-topline">
          <StatCard accent="green" hint="Available right now" icon="C" label="Your Coins" value={Number(user?.coins || 0).toLocaleString()} />
          <StatCard accent="cyan" hint="Most budget-friendly entry" icon="PK" label="Cheapest Pack" value={cheapestPackCost !== null ? `${cheapestPackCost} coins` : "--"} />
        </section>

        {packs.length ? (
          <section className="pack-grid">
            {packs.map((pack) => {
              const packId = pack.id || pack._id;
              const cost = Number(pack.cost || 0);

              return (
                <PackCard
                  disabled={Number(user?.coins || 0) < cost}
                  key={packId}
                  onOpen={handleOpenPack}
                  opening={openingPackId === packId}
                  pack={pack}
                />
              );
            })}
          </section>
        ) : (
          <EmptyState
            description="The pack store is empty. Add packs in the backend and they will appear here."
            title="No packs are active"
          />
        )}
      </PageContainer>

      <PackRevealModal
        cards={revealData.cards}
        coins={revealData.coins}
        onClose={() =>
          setRevealData({
            open: false,
            packName: "",
            coins: 0,
            cards: []
          })
        }
        open={revealData.open}
        packName={revealData.packName}
      />
    </>
  );
}

export default Packs;
