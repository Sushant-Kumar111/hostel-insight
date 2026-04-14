// Mock Firebase Implementation for Development
// This allows the app to run without Firebase credentials

export const isFirebaseConfigured = true; // Always true since we're using mocks

// Mock Auth User
export class MockUser {
  uid: string;
  email: string;
  displayName: string;

  constructor(uid: string, email: string, displayName: string) {
    this.uid = uid;
    this.email = email;
    this.displayName = displayName;
  }
}

// Mock Auth
export const auth = {
  currentUser: null as MockUser | null,
  callbacks: [] as ((user: MockUser | null) => void)[],
  
  signUp: (email: string, password: string, displayName: string) => {
    const uid = Math.random().toString(36).substr(2, 9);
    const user = new MockUser(uid, email, displayName);
    auth.currentUser = user;
    auth.callbacks.forEach(cb => cb(user));
    localStorage.setItem('mockAuthUser', JSON.stringify(user));
    return Promise.resolve(user);
  },
  
  signIn: (email: string, password: string) => {
    const uid = Math.random().toString(36).substr(2, 9);
    const user = new MockUser(uid, email, 'User');
    auth.currentUser = user;
    auth.callbacks.forEach(cb => cb(user));
    localStorage.setItem('mockAuthUser', JSON.stringify(user));
    return Promise.resolve(user);
  },
  
  signOut: () => {
    auth.currentUser = null;
    auth.callbacks.forEach(cb => cb(null));
    localStorage.removeItem('mockAuthUser');
    return Promise.resolve();
  }
};

// Mock Database
const createMockDataStore = () => {
  // Import initial data
  const initialHostelData = Array.from({ length: 9 }, (_, i) => ({
    id: `floor-${i + 1}`,
    floorNumber: i + 1,
    rooms: Array.from({ length: 21 }, (_, j) => ({
      id: `room-${i * 21 + j + 1}`,
      name: `Room ${i * 21 + j + 1}`,
      capacity: 3,
      students: [],
      maintenance: false,
    })),
  }));

  return {
    floors: Object.fromEntries(
      initialHostelData.map(floor => [floor.id, {
        id: floor.id,
        floorNumber: floor.floorNumber,
        rooms: floor.rooms
      }])
    ),
    bookings: {},
    complaints: {},
    feedback: {},
    roomChangeRequests: {}
  };
};

const mockDataStore: { [key: string]: any } = createMockDataStore();

export const db = {
  store: mockDataStore
};

// Mock Firebase functions
export const onAuthStateChanged = (auth: any, callback: (user: any) => void) => {
  const stored = localStorage.getItem('mockAuthUser');
  if (stored) {
    try {
      const user = JSON.parse(stored);
      auth.currentUser = user;
      callback(user);
    } catch (e) {
      callback(null);
    }
  } else {
    callback(null);
  }
  auth.callbacks.push(callback);
  return () => {
    const index = auth.callbacks.indexOf(callback);
    if (index > -1) auth.callbacks.splice(index, 1);
  };
};

export const signOut = () => auth.signOut();

export const app = null;

// Mock Firestore functions
export const collection = (db: any, collectionName: string) => ({
  _collectionName: collectionName
});

export const doc = (db: any, collectionName: string, docId: string) => ({
  _collectionName: collectionName,
  _docId: docId
});

export const getDocs = async (collectionRef: any) => {
  try {
    const collectionName = collectionRef._collectionName;
    console.log(`[getDocs] Fetching collection: ${collectionName}`);
    
    if (!collectionName) {
      console.warn('No collection name provided to getDocs');
      return { empty: true, docs: [], forEach: () => {} };
    }
    
    const data = mockDataStore[collectionName] || {};
    console.log(`[getDocs] Found ${Object.keys(data).length} items in ${collectionName}`, data);
    
    const docs = Object.entries(data).map(([id, value]: [string, any]) => ({
      id,
      data: () => value,
      exists: () => true
    }));
    
    const result = {
      empty: docs.length === 0,
      docs,
      forEach: (callback: any) => docs.forEach((doc: any) => callback(doc))
    };
    
    console.log(`[getDocs] Returning result:`, result);
    return result;
  } catch (error) {
    console.error('Error in getDocs:', error);
    throw error; // Re-throw to let the caller handle it
  }
};

export const getDoc = async (docRef: any) => {
  const { _collectionName, _docId } = docRef;
  const collections = mockDataStore[_collectionName] || {};
  const data = collections[_docId];
  return {
    exists: () => !!data,
    data: () => data || {},
    id: _docId
  };
};

export const setDoc = async (docRef: any, data: any) => {
  const { _collectionName, _docId } = docRef;
  if (!mockDataStore[_collectionName]) {
    mockDataStore[_collectionName] = {};
  }
  mockDataStore[_collectionName][_docId] = data;
};

export const writeBatch = (db: any) => {
  const operations: Array<{ type: string; ref: any; data?: any }> = [];
  const batch = {
    set: (ref: any, data: any) => {
      operations.push({ type: 'set', ref, data });
      return batch;
    },
    update: (ref: any, data: any) => {
      operations.push({ type: 'update', ref, data });
      return batch;
    },
    delete: (ref: any) => {
      operations.push({ type: 'delete', ref });
      return batch;
    },
    commit: async () => {
      for (const op of operations) {
        if (op.type === 'set') {
          const { _collectionName, _docId } = op.ref;
          if (!mockDataStore[_collectionName]) {
            mockDataStore[_collectionName] = {};
          }
          mockDataStore[_collectionName][_docId] = op.data;
        } else if (op.type === 'update') {
          const { _collectionName, _docId } = op.ref;
          if (mockDataStore[_collectionName] && mockDataStore[_collectionName][_docId]) {
            mockDataStore[_collectionName][_docId] = {
              ...mockDataStore[_collectionName][_docId],
              ...op.data
            };
          }
        } else if (op.type === 'delete') {
          const { _collectionName, _docId } = op.ref;
          if (mockDataStore[_collectionName]) {
            delete mockDataStore[_collectionName][_docId];
          }
        }
      }
    }
  };
  return batch;
};

export const updateDoc = async (docRef: any, data: any) => {
  const { _collectionName, _docId } = docRef;
  if (mockDataStore[_collectionName] && mockDataStore[_collectionName][_docId]) {
    mockDataStore[_collectionName][_docId] = {
      ...mockDataStore[_collectionName][_docId],
      ...data
    };
  }
};

export const runTransaction = async (db: any, callback: any) => {
  return await callback({});
};

export const addDoc = async (collectionRef: any, data: any) => {
  const collectionName = collectionRef._collectionName;
  if (!mockDataStore[collectionName]) {
    mockDataStore[collectionName] = {};
  }
  const newId = Math.random().toString(36).substr(2, 9);
  mockDataStore[collectionName][newId] = {
    ...data,
    id: newId, // Sometimes useful in mocks
  };
  return {
    _collectionName: collectionName,
    _docId: newId,
    id: newId,
  };
};

export const serverTimestamp = () => {
    return new Date().toISOString();
};

export const query = (collectionRef: any, ...queryConstraints: any[]) => {
    return {
        _collectionName: collectionRef._collectionName,
        _constraints: queryConstraints
    };
};

export const where = (fieldPath: string, opStr: string, value: any) => {
    return { type: 'where', fieldPath, opStr, value };
};

export const orderBy = (fieldPath: string, directionStr: string = 'asc') => {
    return { type: 'orderBy', fieldPath, directionStr };
};

export const onSnapshot = (queryOrDocRef: any, callback: (snapshot: any) => void) => {
    // In a real mock, we would store this callback and trigger it on writes.
    // For now, we just perform an immediate fetch to give it initial data.
    if (queryOrDocRef._docId) { // It's a doc ref
        getDoc(queryOrDocRef).then(docSnap => {
            callback(docSnap);
        });
    } else { // It's a query or collection
        getDocs(queryOrDocRef).then(querySnapshot => {
            callback(querySnapshot);
        });
    }
    return () => {}; // return unsubscribe function
};