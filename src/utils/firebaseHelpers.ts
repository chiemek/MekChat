import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter, 
  serverTimestamp,
  DocumentSnapshot,
  QueryConstraint
} from 'firebase/firestore';
import { db } from '../config/firebase';

// Generic CRUD operations
export class FirebaseHelper {
  // CREATE - Add document
  static async create<T>(collectionName: string, data: Omit<T, 'id'>): Promise<string> {
    try {
      const docData = {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      const docRef = await addDoc(collection(db, collectionName), docData);
      return docRef.id;
    } catch (error) {
      console.error(`Error creating document in ${collectionName}:`, error);
      throw error;
    }
  }

  // READ - Get single document
  static async getById<T>(collectionName: string, id: string): Promise<T | null> {
    try {
      const docRef = doc(db, collectionName, id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt?.toDate?.() || data.createdAt,
          updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
          timestamp: data.timestamp?.toDate?.() || data.timestamp,
        } as T;
      }
      return null;
    } catch (error) {
      console.error(`Error getting document ${id} from ${collectionName}:`, error);
      throw error;
    }
  }

  // READ - Get multiple documents with query
  static async getMany<T>(
    collectionName: string, 
    constraints: QueryConstraint[] = [],
    limitCount?: number
  ): Promise<T[]> {
    try {
      let q = query(collection(db, collectionName), ...constraints);
      
      if (limitCount) {
        q = query(q, limit(limitCount));
      }

      const querySnapshot = await getDocs(q);
      const documents: T[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        documents.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.() || data.createdAt,
          updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
          timestamp: data.timestamp?.toDate?.() || data.timestamp,
        } as T);
      });
      
      return documents;
    } catch (error) {
      console.error(`Error getting documents from ${collectionName}:`, error);
      throw error;
    }
  }

  // READ - Get documents with pagination
  static async getManyPaginated<T>(
    collectionName: string,
    constraints: QueryConstraint[] = [],
    limitCount: number = 20,
    lastDoc?: DocumentSnapshot
  ): Promise<{
    documents: T[];
    lastDoc?: DocumentSnapshot;
    hasMore: boolean;
  }> {
    try {
      let q = query(collection(db, collectionName), ...constraints, limit(limitCount));
      
      if (lastDoc) {
        q = query(q, startAfter(lastDoc));
      }

      const querySnapshot = await getDocs(q);
      const documents: T[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        documents.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.() || data.createdAt,
          updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
          timestamp: data.timestamp?.toDate?.() || data.timestamp,
        } as T);
      });
      
      return {
        documents,
        lastDoc: querySnapshot.docs[querySnapshot.docs.length - 1],
        hasMore: querySnapshot.docs.length === limitCount
      };
    } catch (error) {
      console.error(`Error getting paginated documents from ${collectionName}:`, error);
      throw error;
    }
  }

  // UPDATE - Update document
  static async update<T>(
    collectionName: string, 
    id: string, 
    updates: Partial<T>
  ): Promise<void> {
    try {
      const docRef = doc(db, collectionName, id);
      const updateData = {
        ...updates,
        updatedAt: serverTimestamp()
      };
      await updateDoc(docRef, updateData);
    } catch (error) {
      console.error(`Error updating document ${id} in ${collectionName}:`, error);
      throw error;
    }
  }

  // DELETE - Delete document
  static async delete(collectionName: string, id: string): Promise<void> {
    try {
      const docRef = doc(db, collectionName, id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error(`Error deleting document ${id} from ${collectionName}:`, error);
      throw error;
    }
  }

  // SEARCH - Search documents by field
  static async search<T>(
    collectionName: string,
    field: string,
    searchTerm: string,
    limitCount: number = 20
  ): Promise<T[]> {
    try {
      const q = query(
        collection(db, collectionName),
        where(field, '>=', searchTerm),
        where(field, '<=', searchTerm + '\uf8ff'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      const documents: T[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        documents.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.() || data.createdAt,
          updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
        } as T);
      });
      
      return documents;
    } catch (error) {
      console.error(`Error searching documents in ${collectionName}:`, error);
      throw error;
    }
  }

  // COUNT - Count documents (approximate)
  static async count(collectionName: string, constraints: QueryConstraint[] = []): Promise<number> {
    try {
      const q = query(collection(db, collectionName), ...constraints);
      const querySnapshot = await getDocs(q);
      return querySnapshot.size;
    } catch (error) {
      console.error(`Error counting documents in ${collectionName}:`, error);
      throw error;
    }
  }
}

// Batch operations helper
export class FirebaseBatch {
  private operations: (() => Promise<void>)[] = [];

  add(operation: () => Promise<void>) {
    this.operations.push(operation);
    return this;
  }

  async execute(): Promise<void> {
    try {
      await Promise.all(this.operations.map(op => op()));
      this.operations = [];
    } catch (error) {
      console.error('Batch operation failed:', error);
      throw error;
    }
  }
}

// Utility functions
export const firestoreUtils = {
  // Convert Firestore timestamp to Date
  timestampToDate: (timestamp: any): Date | undefined => {
    return timestamp?.toDate?.() || timestamp;
  },

  // Create server timestamp
  serverTimestamp: () => serverTimestamp(),

  // Format document data
  formatDocumentData: <T>(doc: any): T => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate?.() || data.createdAt,
      updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
      timestamp: data.timestamp?.toDate?.() || data.timestamp,
    } as T;
  }
};