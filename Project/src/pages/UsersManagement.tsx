import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { User, UserRole, UserStatus } from '../types';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import {
  Users, UserPlus, Edit, Trash2, ShieldCheck, UserCheck,
  Eye, CheckCircle2, XCircle, Search, RefreshCw, AlertCircle
} from 'lucide-react';

export const UsersManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Add User Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('analyst');
  const [department, setDepartment] = useState('Security Operations');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit User Modal
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('analyst');
  const [editDepartment, setEditDepartment] = useState('');
  const [editStatus, setEditStatus] = useState<UserStatus>('active');
  const [editPassword, setEditPassword] = useState('');

  // Delete User Dialog
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.getUsers();
      setUsers(res.users);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setFormError('Name, email, and password are required.');
      return;
    }

    try {
      setIsSubmitting(true);
      setFormError(null);
      await api.createUser({ name, email, password, role, department });
      setIsAddModalOpen(false);
      setName('');
      setEmail('');
      setPassword('');
      await fetchUsers();
    } catch (err: any) {
      setFormError(err.message || 'Failed to create user.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEdit = (user: User) => {
    setEditingUser(user);
    setEditName(user.name);
    setEditRole(user.role);
    setEditDepartment(user.department);
    setEditStatus(user.status);
    setEditPassword('');
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      setIsSubmitting(true);
      setFormError(null);
      await api.updateUser(editingUser.id, {
        name: editName,
        role: editRole,
        department: editDepartment,
        status: editStatus,
        ...(editPassword ? { password: editPassword } : {})
      });
      setEditingUser(null);
      await fetchUsers();
    } catch (err: any) {
      setFormError(err.message || 'Failed to update user.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    try {
      setIsDeleting(true);
      await api.deleteUser(userToDelete.id);
      setUserToDelete(null);
      await fetchUsers();
    } catch (err: any) {
      alert(err.message || 'Failed to delete user.');
    } finally {
      setIsDeleting(false);
    }
  };

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.department?.toLowerCase().includes(search.toLowerCase()) ||
    u.role.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-400" />
            <span>User & Access Provisioning (Admin)</span>
          </h2>
          <p className="text-xs text-slate-400">
            Manage SOC personnel accounts, assign RBAC permissions, and review account security status
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="admin-create-user-modal-btn"
            onClick={() => { setIsAddModalOpen(true); setFormError(null); }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-lg shadow-purple-600/25 transition-all"
          >
            <UserPlus className="w-4 h-4" />
            <span>Create New User</span>
          </button>
          <button
            onClick={fetchUsers}
            className="p-2 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-300 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <input
          id="search-users-input"
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter users by name, email, department, or role..."
          className="w-full pl-3 pr-3 py-2 rounded-xl bg-slate-900/80 border border-slate-700 text-xs text-slate-100 placeholder-slate-500 outline-none focus:border-cyan-400"
        />
      </div>

      {/* Users Table */}
      <div className="rounded-2xl glass-card border border-cyan-500/20 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/70 text-slate-400">
                <th className="py-3 px-4 font-medium">User Profile</th>
                <th className="py-3 px-4 font-medium">Email Address</th>
                <th className="py-3 px-4 font-medium">RBAC Role</th>
                <th className="py-3 px-4 font-medium">Department</th>
                <th className="py-3 px-4 font-medium">Status</th>
                <th className="py-3 px-4 font-medium">Last Login</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.map((u) => (
                <tr key={u.id} id={`user-row-${u.id}`} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-4 font-sans font-bold text-slate-100">
                    {u.name}
                  </td>
                  <td className="py-3 px-4 text-cyan-300">
                    {u.email}
                  </td>
                  <td className="py-3 px-4">
                    {u.role === 'admin' && (
                      <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30 uppercase text-[10px]">
                        Admin
                      </span>
                    )}
                    {u.role === 'analyst' && (
                      <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30 uppercase text-[10px]">
                        Analyst
                      </span>
                    )}
                    {u.role === 'viewer' && (
                      <span className="px-2 py-0.5 rounded-full bg-slate-700 text-slate-300 font-bold uppercase text-[10px]">
                        Viewer
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-slate-300">
                    {u.department}
                  </td>
                  <td className="py-3 px-4">
                    {u.status === 'active' ? (
                      <span className="inline-flex items-center gap-1 text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-red-400">
                        <XCircle className="w-3.5 h-3.5" />
                        Disabled
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-slate-400 text-[11px]">
                    {u.last_login ? new Date(u.last_login).toLocaleString() : 'Never'}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        id={`edit-user-btn-${u.id}`}
                        onClick={() => handleOpenEdit(u)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-cyan-500/20 text-cyan-300 transition-colors"
                        title="Edit User"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        id={`delete-user-btn-${u.id}`}
                        onClick={() => setUserToDelete(u)}
                        className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
                        title="Delete User"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      <Modal
        id="add-user-modal"
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Create New SOC User Account"
      >
        {formError && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 uppercase font-mono mb-1">Full Name *</label>
            <input
              id="create-user-name-input"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Sarah Connor"
              required
              className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 outline-none focus:border-cyan-400"
            />
          </div>

          <div>
            <label className="block text-slate-300 uppercase font-mono mb-1">Email Address *</label>
            <input
              id="create-user-email-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="sarah@soc.corp"
              required
              className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 outline-none focus:border-cyan-400"
            />
          </div>

          <div>
            <label className="block text-slate-300 uppercase font-mono mb-1">Temporary Password *</label>
            <input
              id="create-user-password-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min 6 characters"
              required
              className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 outline-none focus:border-cyan-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 uppercase font-mono mb-1">Assigned Role</label>
              <select
                id="create-user-role-select"
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 outline-none"
              >
                <option value="analyst">Security Analyst</option>
                <option value="admin">Administrator</option>
                <option value="viewer">Viewer (Read-Only)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 uppercase font-mono mb-1">Department</label>
              <input
                id="create-user-department-input"
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="Incident Response"
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300"
            >
              Cancel
            </button>
            <button
              id="submit-create-user-btn"
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold uppercase tracking-wider"
            >
              {isSubmitting ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        id="edit-user-modal"
        isOpen={!!editingUser}
        onClose={() => setEditingUser(null)}
        title={`Edit User: ${editingUser?.email}`}
      >
        {formError && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleUpdateUser} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 uppercase font-mono mb-1">Full Name</label>
            <input
              id="edit-user-name-input"
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 outline-none focus:border-cyan-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 uppercase font-mono mb-1">Role</label>
              <select
                id="edit-user-role-select"
                value={editRole}
                onChange={(e) => setEditRole(e.target.value as any)}
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 outline-none"
              >
                <option value="analyst">Security Analyst</option>
                <option value="admin">Administrator</option>
                <option value="viewer">Viewer (Read-Only)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 uppercase font-mono mb-1">Account Status</label>
              <select
                id="edit-user-status-select"
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value as any)}
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 outline-none"
              >
                <option value="active">Active (Access Enabled)</option>
                <option value="disabled">Disabled (Deactivated)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-300 uppercase font-mono mb-1">Department</label>
            <input
              id="edit-user-department-input"
              type="text"
              value={editDepartment}
              onChange={(e) => setEditDepartment(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-300 uppercase font-mono mb-1">Change Password (Leave blank to keep current)</label>
            <input
              id="edit-user-password-input"
              type="password"
              value={editPassword}
              onChange={(e) => setEditPassword(e.target.value)}
              placeholder="New password (optional)"
              className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 outline-none focus:border-cyan-400"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setEditingUser(null)}
              className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300"
            >
              Cancel
            </button>
            <button
              id="submit-edit-user-btn"
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold uppercase tracking-wider"
            >
              {isSubmitting ? 'Saving...' : 'Update Account'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete User Confirmation */}
      <ConfirmDialog
        id="delete-user-confirm-dialog"
        isOpen={!!userToDelete}
        onClose={() => setUserToDelete(null)}
        onConfirm={handleDeleteUser}
        title="Delete User Account"
        message={`Are you sure you want to permanently delete user "${userToDelete?.name}" (${userToDelete?.email})? This action cannot be undone.`}
        confirmText="Delete Account"
        isLoading={isDeleting}
      />
    </div>
  );
};
