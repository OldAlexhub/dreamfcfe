const fs = require("fs");
const path = require("path");
const axios = require("axios");
const { chromium } = require("playwright");

const TOKEN_STORAGE_KEY = "dream_squad_fc_token";
const FRONTEND_URL =
  process.env.DOCS_FRONTEND_URL ||
  process.env.FRONTEND_URL ||
  "http://127.0.0.1:3000";
const API_URL = (
  process.env.DOCS_API_URL ||
  process.env.REACT_APP_API_BASE_URL ||
  "http://127.0.0.1:5000/api"
).replace(/\/$/, "");
const OUTPUT_DIR = path.join(__dirname, "..", "docs", "snippets");

function getPackId(pack) {
  return pack?.id || pack?._id;
}

function parsePacks(payload) {
  if (Array.isArray(payload?.packs)) {
    return payload.packs;
  }

  if (Array.isArray(payload?.data?.packs)) {
    return payload.data.packs;
  }

  return [];
}

function getErrorMessage(error) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    "Unknown request error."
  );
}

async function waitForHttp(url, label) {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    try {
      await axios.get(url, {
        timeout: 5000,
        validateStatus: () => true
      });
      return;
    } catch (error) {
      if (attempt === 19) {
        throw new Error(`${label} is not reachable at ${url}. ${getErrorMessage(error)}`);
      }

      await new Promise((resolve) => {
        setTimeout(resolve, 1500);
      });
    }
  }
}

async function bootstrapDemoClub(apiClient) {
  const username = `doc${Date.now().toString().slice(-8)}${Math.floor(Math.random() * 90 + 10)}`;
  const password = "password123";

  const registerResponse = await apiClient.post("/auth/register", {
    username,
    password
  });

  const token = registerResponse.data?.token;
  const user = registerResponse.data?.user || {};

  if (!token) {
    throw new Error("Register did not return a JWT token.");
  }

  const authConfig = {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };

  const packsResponse = await apiClient.get("/packs");
  const packs = parsePacks(packsResponse.data).sort(
    (leftPack, rightPack) => Number(leftPack?.cost || 0) - Number(rightPack?.cost || 0)
  );

  if (!packs.length) {
    throw new Error("No active packs were returned by the backend.");
  }

  const cheapestPack = packs[0];
  const cheapestPackCost = Number(cheapestPack.cost || 0);
  const reserveCoinsForUi = cheapestPackCost;
  const startingCoins = Number(user?.coins || 0);
  const affordablePreloads = cheapestPackCost
    ? Math.max(0, Math.floor((startingCoins - reserveCoinsForUi) / cheapestPackCost))
    : 0;
  const preloadCount = Math.min(4, affordablePreloads);

  for (let index = 0; index < preloadCount; index += 1) {
    await apiClient.post(`/packs/open/${getPackId(cheapestPack)}`, {}, authConfig);
  }

  await apiClient.post("/squad/auto-build", {}, authConfig);

  return {
    token,
    username,
    password,
    cheapestPack,
    authConfig
  };
}

async function captureScreens() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const apiClient = axios.create({
    baseURL: API_URL,
    timeout: 20000
  });

  await waitForHttp(`${FRONTEND_URL}/login`, "Frontend");
  await waitForHttp(`${API_URL}/packs`, "Backend API");

  const demoClub = await bootstrapDemoClub(apiClient);

  const browser = await chromium.launch({
    headless: true
  });

  try {
    const guestPage = await browser.newPage({
      viewport: {
        width: 1440,
        height: 1180
      }
    });

    await guestPage.goto(`${FRONTEND_URL}/login`, {
      waitUntil: "networkidle"
    });
    await guestPage.locator(".auth-screen").waitFor();
    await guestPage.screenshot({
      path: path.join(OUTPUT_DIR, "login.png")
    });
    await guestPage.close();

    const authContext = await browser.newContext({
      viewport: {
        width: 1440,
        height: 1280
      }
    });

    await authContext.addInitScript(
      ({ token, storageKey }) => {
        window.localStorage.setItem(storageKey, token);
      },
      {
        token: demoClub.token,
        storageKey: TOKEN_STORAGE_KEY
      }
    );

    const page = await authContext.newPage();

    await page.goto(`${FRONTEND_URL}/dashboard`, {
      waitUntil: "networkidle"
    });
    await page.locator(".dashboard-grid").waitFor();
    await page.screenshot({
      path: path.join(OUTPUT_DIR, "dashboard.png")
    });

    await page.goto(`${FRONTEND_URL}/packs`, {
      waitUntil: "networkidle"
    });
    await page.locator(".pack-grid").waitFor();
    await page.locator(".pack-card .btn--primary:enabled").first().click();
    await page.locator(".modal-backdrop").waitFor();
    await page.waitForTimeout(2400);
    await page.screenshot({
      path: path.join(OUTPUT_DIR, "packs-reveal.png")
    });

    await apiClient.post("/squad/auto-build", {}, demoClub.authConfig);

    await page.goto(`${FRONTEND_URL}/collection`, {
      waitUntil: "networkidle"
    });
    await page.locator(".collection-grid").waitFor();
    await page.screenshot({
      path: path.join(OUTPUT_DIR, "collection.png")
    });

    await page.goto(`${FRONTEND_URL}/squad`, {
      waitUntil: "networkidle"
    });
    await page.locator(".squad-pitch").waitFor();
    await page.screenshot({
      path: path.join(OUTPUT_DIR, "squad.png")
    });

    await authContext.close();
  } finally {
    await browser.close();
  }
}

captureScreens()
  .then(() => {
    process.stdout.write(`Screenshots written to ${OUTPUT_DIR}\n`);
  })
  .catch((error) => {
    process.stderr.write(`Failed to capture Dream Squad FC docs screenshots.\n${error.stack}\n`);
    process.exit(1);
  });
