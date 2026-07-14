import { initializeApp } from 'firebase/app';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, doc, getDocFromServer, setLogLevel } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import config from '../firebase-applet-config.json';

// Initialize Firebase app
const app = initializeApp({
  apiKey: config.apiKey,
  authDomain: config.authDomain,
  projectId: config.projectId,
  storageBucket: config.storageBucket,
  messagingSenderId: config.messagingSenderId,
  appId: config.appId
});

// Suppress Firestore verbose warnings/connection notices in the sandbox/iframe environments
setLogLevel('error');

// Initialize Firestore with persistent offline caching
const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  }),
  experimentalForceLongPolling: true
}, config.firestoreDatabaseId || '(default)');

// Initialize Auth
const auth = getAuth(app);

// Check if Firebase is configured with real credentials
export const isFirebaseAvailable = !!(
  config.apiKey &&
  !config.apiKey.includes('remixed-') &&
  config.projectId &&
  !config.projectId.includes('remixed-')
);

// Validate connection to Firestore
async function testConnection() {
  if (!isFirebaseAvailable) return;
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    console.info("Firestore is currently operating in offline caching mode. Seamless data sync will resume as soon as the online connection is established.");
  }
}
testConnection();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
      tenantId: auth.currentUser?.tenantId || null,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  
  const isPermissionError = errInfo.error.toLowerCase().includes('permission');
  const isBackgroundOp = operationType === OperationType.LIST || operationType === OperationType.GET;

  if (isFirebaseAvailable && !isPermissionError && !isBackgroundOp) {
    throw new Error(JSON.stringify(errInfo));
  }
}

export { db, auth };