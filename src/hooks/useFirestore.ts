import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  onSnapshot, 
  DocumentData, 
  Query,
  QuerySnapshot,
  FirestoreError
} from 'firebase/firestore';
import { db } from '../config/firebase';

interface UseFirestoreResult<T> {
  data: T[];
  loading: boolean;
  error: FirestoreError | null;
}

export function useFirestore<T = DocumentData>(
  collectionName: string,
  queryConstraints?: any[]
): UseFirestoreResult<T> {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<FirestoreError | null>(null);

  useEffect(() => {
    let q: Query<DocumentData>;
    
    if (queryConstraints && queryConstraints.length > 0) {
      q = query(collection(db, collectionName), ...queryConstraints);
    } else {
      q = query(collection(db, collectionName));
    }

    const unsubscribe = onSnapshot(
      q,
      (snapshot: QuerySnapshot<DocumentData>) => {
        const documents: T[] = [];
        snapshot.forEach((doc) => {
          const docData = doc.data();
          documents.push({
            id: doc.id,
            ...docData,
            // Convert Firestore timestamps to Date objects
            createdAt: docData.createdAt?.toDate?.() || docData.createdAt,
            updatedAt: docData.updatedAt?.toDate?.() || docData.updatedAt,
            timestamp: docData.timestamp?.toDate?.() || docData.timestamp,
            lastSeen: docData.lastSeen?.toDate?.() || docData.lastSeen,
          } as T);
        });
        setData(documents);
        setLoading(false);
        setError(null);
      },
      (err: FirestoreError) => {
        console.error('Firestore error:', err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [collectionName, JSON.stringify(queryConstraints)]);

  return { data, loading, error };
}

// Hook for single document
export function useFirestoreDoc<T = DocumentData>(
  collectionName: string,
  docId: string | null
): { data: T | null; loading: boolean; error: FirestoreError | null } {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<FirestoreError | null>(null);

  useEffect(() => {
    if (!docId) {
      setData(null);
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(
      collection(db, collectionName).doc(docId),
      (doc) => {
        if (doc.exists()) {
          const docData = doc.data();
          setData({
            id: doc.id,
            ...docData,
            createdAt: docData?.createdAt?.toDate?.() || docData?.createdAt,
            updatedAt: docData?.updatedAt?.toDate?.() || docData?.updatedAt,
          } as T);
        } else {
          setData(null);
        }
        setLoading(false);
        setError(null);
      },
      (err: FirestoreError) => {
        console.error('Firestore document error:', err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [collectionName, docId]);

  return { data, loading, error };
}