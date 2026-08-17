import {
  cert,
  getApps,
  initializeApp,
  type App,
  type ServiceAccount,
} from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getAuth, type Auth } from "firebase-admin/auth";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const APP_NAME = "longr-hub";
const DATABASE_ID = "default";
const SERVICE_ACCOUNT_PATH = resolve(
  process.cwd(),
  "firebase-service-account.json",
);

function loadServiceAccount(): ServiceAccount | null {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      return toServiceAccount(
        JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT) as Record<string, unknown>,
      );
    } catch {
      return null;
    }
  }

  try {
    const raw = JSON.parse(
      readFileSync(SERVICE_ACCOUNT_PATH, "utf8"),
    ) as Record<string, unknown>;
    return toServiceAccount(raw);
  } catch {
    return null;
  }
}

function toServiceAccount(raw: Record<string, unknown>): ServiceAccount {
  const privateKey = String(raw.private_key ?? "").replace(/\\n/g, "\n");
  return {
    projectId: String(raw.project_id ?? ""),
    clientEmail: String(raw.client_email ?? ""),
    privateKey,
  };
}

let app: App | null | undefined;

function getAdminApp(): App | null {
  if (app !== undefined) return app;

  const account = loadServiceAccount();
  if (!account) {
    app = null;
    return app;
  }

  const existing = getApps().find((candidate) => candidate.name === APP_NAME);
  if (existing) {
    app = existing;
    return app;
  }

  app = initializeApp(
    {
      credential: cert(account),
      projectId: account.projectId,
    },
    APP_NAME,
  );
  return app;
}

let firestore: Firestore | null | undefined;

export function getAdminFirestore(): Firestore | null {
  if (firestore !== undefined) return firestore;
  const appRef = getAdminApp();
  firestore = appRef ? getFirestore(appRef, DATABASE_ID) : null;
  return firestore;
}

let auth: Auth | null | undefined;

export function getAdminAuth(): Auth | null {
  if (auth !== undefined) return auth;
  const appRef = getAdminApp();
  auth = appRef ? getAuth(appRef) : null;
  return auth;
}
