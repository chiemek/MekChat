import React, { useState } from 'react';
import { X, User, Phone, Mail, UserPlus, Contacts } from 'lucide-react';
import { contactService, ContactRequest } from '../services/contactService';

interface AddContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContactAdded: () => void;
}

export function AddContactModal({ isOpen, onClose, onContactAdded }: AddContactModalProps) {
  const [activeTab, setActiveTab] = useState<'manual' | 'import'>('manual');
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    displayName: '',
    phone: '',
    email: ''
  });
  const [importedContacts, setImportedContacts] = useState<any[]>([]);

  if (!isOpen) return null;

  const handleManualAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.displayName.trim()) return;

    setIsLoading(true);
    try {
      const contactData: ContactRequest = {
        displayName: formData.displayName.trim(),
        phone: formData.phone.trim() || undefined,
        email: formData.email.trim() || undefined
      };
      
      await contactService.addContact(contactData);
      setFormData({ displayName: '', phone: '', email: '' });
      onContactAdded();
      onClose();
    } catch (error) {
      console.error('Failed to add contact:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImportContacts = async () => {
    setIsLoading(true);
    try {
      const contacts = await contactService.importFromPhoneContacts();
      setImportedContacts(contacts);
      onContactAdded();
    } catch (error) {
      console.error('Failed to import contacts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Add Contact</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex mb-6 bg-white/5 rounded-xl p-1">
          <button
            onClick={() => setActiveTab('manual')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg transition-all ${
              activeTab === 'manual'
                ? 'bg-white/20 text-white'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            Manual
          </button>
          <button
            onClick={() => setActiveTab('import')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg transition-all ${
              activeTab === 'import'
                ? 'bg-white/20 text-white'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <Contacts className="w-4 h-4" />
            Import
          </button>
        </div>

        {activeTab === 'manual' ? (
          <form onSubmit={handleManualAdd} className="space-y-4">
            <div className="relative">
              <User className="absolute left-3 top-3 w-5 h-5 text-white/60" />
              <input
                type="text"
                name="displayName"
                placeholder="Display Name *"
                value={formData.displayName}
                onChange={handleInputChange}
                required
                className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="relative">
              <Phone className="absolute left-3 top-3 w-5 h-5 text-white/60" />
              <input
                type="tel"
                name="phone"
                placeholder="Phone Number"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="relative">
              <Mail className="absolute left-3 top-3 w-5 h-5 text-white/60" />
              <input
                type="email"
                name="email"
                placeholder="Email Address"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || !formData.displayName.trim()}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-white font-medium transition-all"
            >
              {isLoading ? 'Adding Contact...' : 'Add Contact'}
            </button>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="text-center">
              <Contacts className="w-16 h-16 text-white/60 mx-auto mb-4" />
              <p className="text-white/70 mb-4">
                Import contacts from your phone's contact list
              </p>
              
              {importedContacts.length > 0 ? (
                <div className="bg-green-500/20 border border-green-500/30 rounded-xl p-4 mb-4">
                  <p className="text-green-400">
                    Successfully imported {importedContacts.length} contacts!
                  </p>
                </div>
              ) : (
                <button
                  onClick={handleImportContacts}
                  disabled={isLoading}
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-white font-medium transition-all"
                >
                  {isLoading ? 'Importing Contacts...' : 'Import from Phone'}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}