import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  serverTimestamp,
  getDocs,
  getDoc,
  limit
} from 'firebase/firestore';
import { auth, db } from '../config/firebase';

export interface Contact {
  id: string;
  userId: string;
  contactUserId: string;
  displayName: string;
  avatar?: string;
  phone?: string;
  email?: string;
  status: 'online' | 'offline' | 'away';
  lastSeen?: Date;
  isTyping?: boolean;
  addedAt: Date;
  updatedAt: Date;
  isFavorite?: boolean;
  isBlocked?: boolean;
  customName?: string; // Custom name set by user
  notes?: string;
}

export interface ContactRequest {
  displayName: string;
  phone?: string;
  email?: string;
  customName?: string;
  notes?: string;
}

class ContactService {
  private contactListeners: ((contacts: Contact[]) => void)[] = [];
  private unsubscribes: (() => void)[] = [];

  // CREATE - Add a new contact
  async addContact(contactData: ContactRequest): Promise<Contact> {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('User not authenticated');

    try {
      // First, try to find user by email or phone
      let contactUserId: string | null = null;
      
      if (contactData.email) {
        const userQuery = query(
          collection(db, 'users'),
          where('email', '==', contactData.email),
          limit(1)
        );
        const userSnapshot = await getDocs(userQuery);
        if (!userSnapshot.empty) {
          contactUserId = userSnapshot.docs[0].id;
        }
      }

      if (!contactUserId && contactData.phone) {
        const userQuery = query(
          collection(db, 'users'),
          where('phone', '==', contactData.phone),
          limit(1)
        );
        const userSnapshot = await getDocs(userQuery);
        if (!userSnapshot.empty) {
          contactUserId = userSnapshot.docs[0].id;
        }
      }

      // Check if contact already exists
      if (contactUserId) {
        const existingContactQuery = query(
          collection(db, 'contacts'),
          where('userId', '==', currentUser.uid),
          where('contactUserId', '==', contactUserId)
        );
        const existingSnapshot = await getDocs(existingContactQuery);
        if (!existingSnapshot.empty) {
          throw new Error('Contact already exists');
        }
      }

      const newContact = {
        userId: currentUser.uid,
        contactUserId: contactUserId || 'pending',
        displayName: contactData.displayName,
        phone: contactData.phone,
        email: contactData.email,
        customName: contactData.customName,
        notes: contactData.notes,
        status: 'offline' as const,
        isFavorite: false,
        isBlocked: false,
        addedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'contacts'), newContact);

      return {
        id: docRef.id,
        ...newContact,
        addedAt: new Date(),
        updatedAt: new Date()
      } as Contact;
    } catch (error) {
      console.error('Error adding contact:', error);
      throw error;
    }
  }

  // READ - Get all contacts for current user
  async getContacts(): Promise<Contact[]> {
    const currentUser = auth.currentUser;
    if (!currentUser) return [];

    try {
      const q = query(
        collection(db, 'contacts'),
        where('userId', '==', currentUser.uid),
        where('isBlocked', '!=', true),
        orderBy('displayName')
      );

      const querySnapshot = await getDocs(q);
      const contacts: Contact[] = [];

      for (const doc of querySnapshot.docs) {
        const data = doc.data();
        
        // Get real-time user status if contact is registered
        let userStatus = 'offline';
        let avatar = '';
        let lastSeen: Date | undefined;

        if (data.contactUserId && data.contactUserId !== 'pending') {
          const userDoc = await getDoc(doc(db, 'users', data.contactUserId));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            userStatus = userData.status || 'offline';
            avatar = userData.avatar || '';
            lastSeen = userData.lastSeen?.toDate();
          }
        }

        contacts.push({
          id: doc.id,
          ...data,
          status: userStatus,
          avatar,
          lastSeen,
          addedAt: data.addedAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        } as Contact);
      }

      return contacts;
    } catch (error) {
      console.error('Error fetching contacts:', error);
      return [];
    }
  }

  // READ - Search contacts
  async searchContacts(searchTerm: string): Promise<Contact[]> {
    const currentUser = auth.currentUser;
    if (!currentUser) return [];

    try {
      const searchTermLower = searchTerm.toLowerCase();
      
      const q = query(
        collection(db, 'contacts'),
        where('userId', '==', currentUser.uid),
        where('isBlocked', '!=', true)
      );

      const querySnapshot = await getDocs(q);
      const contacts: Contact[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const displayName = (data.customName || data.displayName || '').toLowerCase();
        const email = (data.email || '').toLowerCase();
        const phone = (data.phone || '').toLowerCase();

        if (displayName.includes(searchTermLower) || 
            email.includes(searchTermLower) || 
            phone.includes(searchTermLower)) {
          contacts.push({
            id: doc.id,
            ...data,
            addedAt: data.addedAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date()
          } as Contact);
        }
      });

      return contacts;
    } catch (error) {
      console.error('Error searching contacts:', error);
      return [];
    }
  }

  // READ - Get favorite contacts
  async getFavoriteContacts(): Promise<Contact[]> {
    const currentUser = auth.currentUser;
    if (!currentUser) return [];

    try {
      const q = query(
        collection(db, 'contacts'),
        where('userId', '==', currentUser.uid),
        where('isFavorite', '==', true),
        where('isBlocked', '!=', true),
        orderBy('displayName')
      );

      const querySnapshot = await getDocs(q);
      const contacts: Contact[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        contacts.push({
          id: doc.id,
          ...data,
          addedAt: data.addedAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        } as Contact);
      });

      return contacts;
    } catch (error) {
      console.error('Error fetching favorite contacts:', error);
      return [];
    }
  }

  // UPDATE - Update contact
  async updateContact(contactId: string, updates: Partial<Contact>): Promise<Contact> {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('User not authenticated');

    try {
      // Verify ownership
      const contactDoc = await getDoc(doc(db, 'contacts', contactId));
      if (!contactDoc.exists()) {
        throw new Error('Contact not found');
      }

      const contactData = contactDoc.data();
      if (contactData.userId !== currentUser.uid) {
        throw new Error('You can only update your own contacts');
      }

      const updateData = {
        ...updates,
        updatedAt: serverTimestamp()
      };
      delete updateData.id;
      delete updateData.addedAt;

      await updateDoc(doc(db, 'contacts', contactId), updateData);

      // Return updated contact
      const updatedDoc = await getDoc(doc(db, 'contacts', contactId));
      const updatedData = updatedDoc.data()!;
      
      return {
        id: contactId,
        ...updatedData,
        addedAt: updatedData.addedAt?.toDate() || new Date(),
        updatedAt: updatedData.updatedAt?.toDate() || new Date()
      } as Contact;
    } catch (error) {
      console.error('Error updating contact:', error);
      throw error;
    }
  }

  // UPDATE - Toggle favorite status
  async toggleFavorite(contactId: string): Promise<void> {
    try {
      const contactDoc = await getDoc(doc(db, 'contacts', contactId));
      if (!contactDoc.exists()) {
        throw new Error('Contact not found');
      }

      const currentStatus = contactDoc.data().isFavorite || false;
      await updateDoc(doc(db, 'contacts', contactId), {
        isFavorite: !currentStatus,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error toggling favorite:', error);
      throw error;
    }
  }

  // UPDATE - Block/unblock contact
  async toggleBlock(contactId: string): Promise<void> {
    try {
      const contactDoc = await getDoc(doc(db, 'contacts', contactId));
      if (!contactDoc.exists()) {
        throw new Error('Contact not found');
      }

      const currentStatus = contactDoc.data().isBlocked || false;
      await updateDoc(doc(db, 'contacts', contactId), {
        isBlocked: !currentStatus,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error toggling block status:', error);
      throw error;
    }
  }

  // DELETE - Delete contact
  async deleteContact(contactId: string): Promise<void> {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('User not authenticated');

    try {
      // Verify ownership
      const contactDoc = await getDoc(doc(db, 'contacts', contactId));
      if (!contactDoc.exists()) {
        throw new Error('Contact not found');
      }

      const contactData = contactDoc.data();
      if (contactData.userId !== currentUser.uid) {
        throw new Error('You can only delete your own contacts');
      }

      await deleteDoc(doc(db, 'contacts', contactId));
    } catch (error) {
      console.error('Error deleting contact:', error);
      throw error;
    }
  }

  // CREATE - Import contacts from phone (mock implementation)
  async importFromPhoneContacts(): Promise<Contact[]> {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('User not authenticated');

    // Simulate phone contact import
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const phoneContacts = [
      { displayName: 'Emma Watson', phone: '+1987654321', email: 'emma@example.com' },
      { displayName: 'John Doe', phone: '+1122334455', email: 'john@example.com' },
      { displayName: 'Lisa Park', phone: '+1555666777', email: 'lisa@example.com' }
    ];

    const importedContacts: Contact[] = [];
    
    for (const contact of phoneContacts) {
      try {
        const newContact = await this.addContact(contact);
        importedContacts.push(newContact);
      } catch (error) {
        console.warn(`Failed to import contact ${contact.displayName}:`, error);
      }
    }

    return importedContacts;
  }

  // Real-time subscription to contacts
  subscribeToContacts(callback: (contacts: Contact[]) => void) {
    const currentUser = auth.currentUser;
    if (!currentUser) return () => {};

    const q = query(
      collection(db, 'contacts'),
      where('userId', '==', currentUser.uid),
      orderBy('displayName')
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const contacts: Contact[] = [];
      
      for (const doc of snapshot.docs) {
        const data = doc.data();
        
        // Get real-time user status if contact is registered
        let userStatus = 'offline';
        let avatar = '';
        let lastSeen: Date | undefined;

        if (data.contactUserId && data.contactUserId !== 'pending') {
          const userDoc = await getDoc(doc(db, 'users', data.contactUserId));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            userStatus = userData.status || 'offline';
            avatar = userData.avatar || '';
            lastSeen = userData.lastSeen?.toDate();
          }
        }

        contacts.push({
          id: doc.id,
          ...data,
          status: userStatus,
          avatar,
          lastSeen,
          addedAt: data.addedAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        } as Contact);
      }
      
      callback(contacts);
    });

    this.unsubscribes.push(unsubscribe);
    return unsubscribe;
  }

  // Legacy method for compatibility
  onContactsUpdate(callback: (contacts: Contact[]) => void) {
    return this.subscribeToContacts(callback);
  }

  // Cleanup subscriptions
  cleanup() {
    this.unsubscribes.forEach(unsubscribe => unsubscribe());
    this.unsubscribes = [];
  }
}

export const contactService = new ContactService();