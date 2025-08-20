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
}

export interface ContactRequest {
  displayName: string;
  phone?: string;
  email?: string;
}

class ContactService {
  private contacts: Contact[] = [];
  private contactListeners: ((contacts: Contact[]) => void)[] = [];

  constructor() {
    // Initialize with some demo contacts
    this.contacts = [
      {
        id: 'contact-1',
        userId: 'current-user',
        contactUserId: 'user1',
        displayName: 'Alex Johnson',
        avatar: 'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=150',
        email: 'alex@example.com',
        phone: '+1234567890',
        status: 'online',
        addedAt: new Date(Date.now() - 86400000)
      },
      {
        id: 'contact-2',
        userId: 'current-user',
        contactUserId: 'user2',
        displayName: 'Sarah Chen',
        avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150',
        email: 'sarah@example.com',
        status: 'away',
        addedAt: new Date(Date.now() - 172800000)
      },
      {
        id: 'contact-3',
        userId: 'current-user',
        contactUserId: 'user3',
        displayName: 'Mike Rodriguez',
        avatar: 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=150',
        email: 'mike@example.com',
        status: 'offline',
        lastSeen: new Date(Date.now() - 1800000),
        addedAt: new Date(Date.now() - 259200000)
      }
    ];
  }

  async addContact(contactData: ContactRequest): Promise<Contact> {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const newContact: Contact = {
      id: 'contact-' + Date.now(),
      userId: 'current-user',
      contactUserId: 'user-' + Date.now(),
      displayName: contactData.displayName,
      phone: contactData.phone,
      email: contactData.email,
      avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150',
      status: 'offline',
      addedAt: new Date()
    };

    this.contacts.push(newContact);
    this.notifyContactListeners();
    return newContact;
  }

  async importFromPhoneContacts(): Promise<Contact[]> {
    // Simulate phone contact import
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const phoneContacts = [
      { displayName: 'Emma Watson', phone: '+1987654321', email: 'emma@example.com' },
      { displayName: 'John Doe', phone: '+1122334455', email: 'john@example.com' },
      { displayName: 'Lisa Park', phone: '+1555666777', email: 'lisa@example.com' }
    ];

    const importedContacts: Contact[] = [];
    
    for (const contact of phoneContacts) {
      const newContact: Contact = {
        id: 'imported-' + Date.now() + Math.random(),
        userId: 'current-user',
        contactUserId: 'imported-user-' + Date.now() + Math.random(),
        displayName: contact.displayName,
        phone: contact.phone,
        email: contact.email,
        avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150',
        status: Math.random() > 0.5 ? 'online' : 'offline',
        addedAt: new Date()
      };
      
      importedContacts.push(newContact);
      this.contacts.push(newContact);
    }

    this.notifyContactListeners();
    return importedContacts;
  }

  async updateContact(contactId: string, updates: Partial<Contact>): Promise<Contact> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const contactIndex = this.contacts.findIndex(c => c.id === contactId);
    if (contactIndex === -1) throw new Error('Contact not found');
    
    this.contacts[contactIndex] = { ...this.contacts[contactIndex], ...updates };
    this.notifyContactListeners();
    return this.contacts[contactIndex];
  }

  async deleteContact(contactId: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    this.contacts = this.contacts.filter(c => c.id !== contactId);
    this.notifyContactListeners();
  }

  getContacts(): Contact[] {
    return this.contacts;
  }

  onContactsUpdate(callback: (contacts: Contact[]) => void) {
    this.contactListeners.push(callback);
    callback(this.contacts);
    
    return () => {
      this.contactListeners = this.contactListeners.filter(listener => listener !== callback);
    };
  }

  private notifyContactListeners() {
    this.contactListeners.forEach(listener => listener([...this.contacts]));
  }
}

export const contactService = new ContactService();