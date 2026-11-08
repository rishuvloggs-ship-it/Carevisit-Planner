import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  Heart,
  MapPin,
  FileText,
  Mail,
  Shield,
  Trash2,
  Edit2,
  Check,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { CaregiverAvatar } from '../components/CaregiverAvatar';
import api from '../api/apiClient';
import toast from 'react-hot-toast';

export const CirclePage = () => {
  const { activeCircle, currentRole, isFamilyAdmin, refreshUserData } = useAuth();
  const [showAddModal, setShowAddModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('Caregiver');
  const [inviting, setInviting] = useState(false);

  // Edit recipient info state
  const [isEditingRecipient, setIsEditingRecipient] = useState(false);
  const [recipientForm, setRecipientForm] = useState({
    name: activeCircle?.careRecipient?.name || '',
    notes: activeCircle?.careRecipient?.notes || '',
    address: activeCircle?.careRecipient?.address || '',
  });

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail) return;

    setInviting(true);
    try {
      const res = await api.post(`/circles/${activeCircle._id}/members`, {
        email: inviteEmail.trim(),
        role: inviteRole,
      });

      if (res.data?.success) {
        toast.success(res.data.message || 'Caregiver added to circle!');
        setShowAddModal(false);
        setInviteEmail('');
        await refreshUserData();
      }
    } catch (err) {
      // handled
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveMember = async (userId, memberName) => {
    if (!window.confirm(`Are you sure you want to remove ${memberName} from this circle?`)) {
      return;
    }

    try {
      await api.delete(`/circles/${activeCircle._id}/members/${userId}`);
      toast.success('Member removed');
      await refreshUserData();
    } catch (err) {
      // handled
    }
  };

  const handleSaveRecipient = async () => {
    try {
      await api.put(`/circles/${activeCircle._id}`, {
        careRecipient: recipientForm,
      });
      toast.success('Recipient details updated!');
      setIsEditingRecipient(false);
      await refreshUserData();
    } catch (err) {
      // handled
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            Care Circle & Caregivers
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage authorised family members, professional caregivers, and care recipient preferences
          </p>
        </div>

        {isFamilyAdmin && (
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition flex items-center gap-1.5 shadow-md shadow-blue-500/20"
          >
            <UserPlus className="w-4 h-4" />
            Add Caregiver
          </button>
        )}
      </div>

      {/* Care Recipient Profile Card */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-500 to-pink-500 flex items-center justify-center text-white shadow-md shadow-rose-500/20">
              <Heart className="w-6 h-6 fill-current" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
                Care Recipient
              </span>
              <h3 className="text-xl font-black text-slate-900 dark:text-slate-100">
                {activeCircle?.careRecipient?.name || 'Care Recipient'}
              </h3>
            </div>
          </div>

          {isFamilyAdmin && !isEditingRecipient && (
            <button
              type="button"
              onClick={() => {
                setRecipientForm({
                  name: activeCircle?.careRecipient?.name || '',
                  notes: activeCircle?.careRecipient?.notes || '',
                  address: activeCircle?.careRecipient?.address || '',
                });
                setIsEditingRecipient(true);
              }}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition flex items-center gap-1.5"
            >
              <Edit2 className="w-3.5 h-3.5" />
              Edit Profile
            </button>
          )}
        </div>

        {isEditingRecipient ? (
          <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Recipient Name
              </label>
              <input
                type="text"
                value={recipientForm.name}
                onChange={(e) => setRecipientForm({ ...recipientForm, name: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Home Address
              </label>
              <input
                type="text"
                value={recipientForm.address}
                onChange={(e) => setRecipientForm({ ...recipientForm, address: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Care Notes, Emergency Contacts & Preferences
              </label>
              <textarea
                rows={3}
                value={recipientForm.notes}
                onChange={(e) => setRecipientForm({ ...recipientForm, notes: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => setIsEditingRecipient(false)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveRecipient}
                className="px-4 py-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm"
              >
                Save Details
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
            {activeCircle?.careRecipient?.address && (
              <div className="flex items-start gap-2 text-slate-600 dark:text-slate-300">
                <MapPin className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                <span className="font-medium">{activeCircle.careRecipient.address}</span>
              </div>
            )}
            {activeCircle?.careRecipient?.notes ? (
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800">
                <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Care Instructions & Clinical Preferences:
                </span>
                <p className="text-slate-600 dark:text-slate-400 whitespace-pre-wrap leading-relaxed">
                  {activeCircle.careRecipient.notes}
                </p>
              </div>
            ) : (
              <p className="text-slate-400 italic">No care notes added yet.</p>
            )}
          </div>
        )}
      </div>

      {/* Authorized Circle Members List */}
      <div className="space-y-3">
        <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 flex items-center justify-between">
          <span>Authorised Circle Members ({activeCircle?.members?.length || 0})</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {activeCircle?.members?.map((m) => {
            const memberUser = m.userId;
            const role = m.role;

            return (
              <div
                key={memberUser?._id || m.joinedAt}
                className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <CaregiverAvatar user={memberUser} size="md" />
                  <div className="min-w-0">
                    <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">
                      {memberUser?.name || 'Invited User'}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {memberUser?.email}
                    </p>
                    <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
                      {role}
                    </span>
                  </div>
                </div>

                {isFamilyAdmin && role !== 'Family Admin' && (
                  <button
                    type="button"
                    onClick={() => handleRemoveMember(memberUser?._id, memberUser?.name)}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition"
                    title="Remove from circle"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Caregiver Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-3">
              <div className="p-2 rounded-xl bg-blue-600 text-white">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                  Add Caregiver to Circle
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Authorize a caregiver or family member by email
                </p>
              </div>
            </div>

            <form onSubmit={handleInvite} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Caregiver Email Address *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="caregiver@example.com"
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Circle Role
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Caregiver">Caregiver (Can schedule visits & complete tasks)</option>
                  <option value="Viewer">Viewer (Read-only observation)</option>
                  <option value="Family Admin">Family Admin (Full control)</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviting || !inviteEmail}
                  className="px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl shadow-sm"
                >
                  {inviting ? 'Adding...' : 'Add to Circle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
