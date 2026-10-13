import React, { useEffect, useState, useMemo } from 'react';
import { api } from '../../../services/api';
import { AdminUser } from '../../../types';
import { useAuth } from '../../auth/AuthContext';
import { Modal } from '../../shared/Modal';
import {
  Plus,
  Search,
  Filter,
  Shield,
  ShieldAlert,
  UserCheck,
  UserX,
  Edit,
  Trash2,
  KeyRound,
  RotateCcw,
  CheckCircle,
  AlertTriangle,
  Lock,
  Eye,
  EyeOff,
  UserPlus,
} from 'lucide-react';

export const UsersView: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Search & Filtering
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  // Create User Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createUsername, setCreateUsername] = useState('');
  const [createPassword, setCreatePassword] = useState('');
  const [createFullName, setCreateFullName] = useState('');
  const [createEmail, setCreateEmail] = useState('');
  const [createPhone, setCreatePhone] = useState('');
  const [createRole, setCreateRole] = useState('STAFF');
  const [createShowPassword, setCreateShowPassword] = useState(false);
  const [createSubmitting, setCreateSubmitting] = useState(false);

  // Edit User Modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [editFullName, setEditFullName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editRole, setEditRole] = useState('');
  const [editIsActive, setEditIsActive] = useState(1);
  const [editNewPassword, setEditNewPassword] = useState('');
  const [editShowPassword, setEditShowPassword] = useState(false);
  const [editSubmitting, setEditSubmitting] = useState(false);

  // Reset Password Modal
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetTargetUser, setResetTargetUser] = useState<AdminUser | null>(null);
  const [resetPassword, setResetPassword] = useState('');
  const [resetConfirm, setResetConfirm] = useState('');
  const [resetShowPassword, setResetShowPassword] = useState(false);
  const [resetSubmitting, setResetSubmitting] = useState(false);

  useEffect(() => {
    loadUsers();
  }, [searchQuery, selectedRole, selectedStatus]);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.append('search', searchQuery.trim());
      if (selectedRole !== 'ALL') params.append('role', selectedRole);
      if (selectedStatus !== 'ALL') params.append('status', selectedStatus);

      const qs = params.toString() ? `?${params.toString()}` : '';
      const res = await api.get<{ success: boolean; users: AdminUser[] }>(`/api/users${qs}`);
      if (res.success) {
        setUsers(res.users || []);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to fetch users.');
    } finally {
      setIsLoading(false);
    }
  };

  const showNotification = (msg: string, isError = false) => {
    if (isError) {
      setErrorMsg(msg);
      setTimeout(() => setErrorMsg(''), 5000);
    } else {
      setSuccessMsg(msg);
      setTimeout(() => setSuccessMsg(''), 4000);
    }
  };

  // Count active Super Admins to safeguard against accidental lockout
  const activeSuperAdminCount = useMemo(() => {
    return users.filter(u => u.role === 'SUPER_ADMIN' && u.is_active === 1).length;
  }, [users]);

  // Handler: Create User
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createUsername.trim() || !createPassword.trim() || !createFullName.trim() || !createEmail.trim()) {
      showNotification('Please fill in all required fields.', true);
      return;
    }

    setCreateSubmitting(true);
    try {
      await api.post('/api/users', {
        username: createUsername.trim(),
        password: createPassword.trim(),
        full_name: createFullName.trim(),
        email: createEmail.trim().toLowerCase(),
        phone: createPhone.trim(),
        role: createRole,
      });

      setCreateModalOpen(false);
      setCreateUsername('');
      setCreatePassword('');
      setCreateFullName('');
      setCreateEmail('');
      setCreatePhone('');
      setCreateRole('STAFF');
      showNotification(`Account for ${createFullName} created successfully!`);
      loadUsers();
    } catch (err: any) {
      showNotification(err.message || 'Failed to create user.', true);
    } finally {
      setCreateSubmitting(false);
    }
  };

  // Handler: Open Edit Modal
  const openEditModal = (u: AdminUser) => {
    setEditingUser(u);
    setEditFullName(u.full_name);
    setEditEmail(u.email);
    setEditPhone(u.phone || '');
    setEditRole(u.role);
    setEditIsActive(u.is_active);
    setEditNewPassword('');
    setEditModalOpen(true);
  };

  // Handler: Save Edit
  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    if (editingUser.id === currentUser?.id && editRole !== editingUser.role) {
      showNotification('You cannot modify your own administrative role.', true);
      return;
    }

    if (editingUser.id === currentUser?.id && editIsActive === 0) {
      showNotification('You cannot deactivate your own account.', true);
      return;
    }

    if (editingUser.role === 'SUPER_ADMIN' && (editIsActive === 0 || editRole !== 'SUPER_ADMIN') && activeSuperAdminCount <= 1) {
      showNotification('Cannot deactivate or demote the last active Super Admin.', true);
      return;
    }

    setEditSubmitting(true);
    try {
      const payload: any = {
        full_name: editFullName.trim(),
        email: editEmail.trim().toLowerCase(),
        phone: editPhone.trim(),
        role: editRole,
        is_active: editIsActive,
      };
      if (editNewPassword.trim()) {
        payload.password = editNewPassword.trim();
      }

      await api.put(`/api/users/${editingUser.id}`, payload);
      setEditModalOpen(false);
      showNotification(`User @${editingUser.username} updated successfully.`);
      loadUsers();
    } catch (err: any) {
      showNotification(err.message || 'Failed to update user.', true);
    } finally {
      setEditSubmitting(false);
    }
  };

  // Handler: Toggle Status
  const handleToggleStatus = async (target: AdminUser) => {
    if (target.id === currentUser?.id) {
      showNotification('You cannot deactivate your own account.', true);
      return;
    }

    if (target.role === 'SUPER_ADMIN' && target.is_active === 1 && activeSuperAdminCount <= 1) {
      showNotification('Cannot deactivate the last active Super Admin.', true);
      return;
    }

    const actionVerb = target.is_active === 1 ? 'deactivate' : 'activate';
    if (!window.confirm(`Are you sure you want to ${actionVerb} @${target.username}'s account?`)) {
      return;
    }

    try {
      await api.post(`/api/users/${target.id}/toggle-status`);
      showNotification(`Account @${target.username} has been ${actionVerb}d.`);
      loadUsers();
    } catch (err: any) {
      showNotification(err.message || `Failed to ${actionVerb} account.`, true);
    }
  };

  // Handler: Open Reset Password Modal
  const openResetPasswordModal = (target: AdminUser) => {
    setResetTargetUser(target);
    setResetPassword('');
    setResetConfirm('');
    setResetModalOpen(true);
  };

  // Handler: Submit Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetTargetUser) return;

    if (resetPassword !== resetConfirm) {
      showNotification('Passwords do not match.', true);
      return;
    }

    if (resetPassword.length < 8) {
      showNotification('Password must be at least 8 characters long.', true);
      return;
    }

    setResetSubmitting(true);
    try {
      await api.put(`/api/users/${resetTargetUser.id}`, {
        full_name: resetTargetUser.full_name,
        email: resetTargetUser.email,
        phone: resetTargetUser.phone || '',
        role: resetTargetUser.role,
        is_active: resetTargetUser.is_active,
        password: resetPassword.trim(),
      });
      setResetModalOpen(false);
      showNotification(`Password for @${resetTargetUser.username} updated and previous sessions revoked.`);
    } catch (err: any) {
      showNotification(err.message || 'Failed to reset password.', true);
    } finally {
      setResetSubmitting(false);
    }
  };

  // Handler: Delete User
  const handleDeleteUser = async (target: AdminUser) => {
    if (target.id === currentUser?.id) {
      showNotification('Cannot delete your own account.', true);
      return;
    }

    if (target.role === 'SUPER_ADMIN' && activeSuperAdminCount <= 1) {
      showNotification('Cannot delete the last active Super Admin.', true);
      return;
    }

    const confirmMsg = `⚠️ SECURITY WARNING: Are you sure you want to delete administrator @${target.username} (${target.full_name})?\n\nThis will permanently delete the user and revoke all active sessions.`;
    if (!window.confirm(confirmMsg)) {
      return;
    }

    try {
      await api.delete(`/api/users/${target.id}`);
      showNotification(`User @${target.username} deleted.`);
      loadUsers();
    } catch (err: any) {
      showNotification(err.message || 'Failed to delete user.', true);
    }
  };

  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return { bg: 'rgba(168, 85, 247, 0.15)', text: '#C084FC', border: 'rgba(168, 85, 247, 0.3)' };
      case 'ADMIN':
        return { bg: 'rgba(59, 130, 246, 0.15)', text: '#93C5FD', border: 'rgba(59, 130, 246, 0.3)' };
      case 'MANAGER':
        return { bg: 'rgba(16, 185, 129, 0.15)', text: '#6EE7B7', border: 'rgba(16, 185, 129, 0.3)' };
      case 'STAFF':
      case 'BOOKING_STAFF':
        return { bg: 'rgba(14, 165, 233, 0.15)', text: '#7DD3FC', border: 'rgba(14, 165, 233, 0.3)' };
      case 'CONTENT_MANAGER':
        return { bg: 'rgba(245, 158, 11, 0.15)', text: '#FCD34D', border: 'rgba(245, 158, 11, 0.3)' };
      case 'DRIVER':
        return { bg: 'rgba(234, 179, 8, 0.15)', text: '#FDE047', border: 'rgba(234, 179, 8, 0.3)' };
      default:
        return { bg: 'rgba(255, 255, 255, 0.08)', text: '#E2E8F0', border: 'rgba(255, 255, 255, 0.15)' };
    }
  };

  return (
    <div>
      {/* Notifications */}
      {errorMsg && (
        <div
          role="alert"
          style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            color: '#FCA5A5',
            padding: '12px 16px',
            borderRadius: '12px',
            fontSize: '0.875rem',
            marginBottom: '18px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <ShieldAlert size={18} />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div
          role="status"
          style={{
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.35)',
            color: '#6EE7B7',
            padding: '12px 16px',
            borderRadius: '12px',
            fontSize: '0.875rem',
            marginBottom: '18px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <CheckCircle size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Top Controls Header */}
      <div
        style={{
          background: '#131B2E',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '16px',
          padding: '22px 24px',
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: '#F8FAFC' }}>
              User & Role Management
            </h2>
            <span
              style={{
                fontSize: '0.75rem',
                padding: '3px 10px',
                borderRadius: '999px',
                background: 'rgba(59, 130, 246, 0.15)',
                color: '#93C5FD',
                fontWeight: 700,
              }}
            >
              RBAC Protected
            </span>
          </div>
          <div style={{ color: '#94A3B8', fontSize: '0.85rem', marginTop: '4px' }}>
            Create, audit, configure roles, and securely manage administrator credentials
          </div>
        </div>

        <button
          onClick={() => setCreateModalOpen(true)}
          style={{
            padding: '10px 20px',
            background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
            border: 'none',
            borderRadius: '10px',
            color: '#FFFFFF',
            fontWeight: 700,
            fontSize: '0.875rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)',
          }}
        >
          <UserPlus size={16} />
          <span>Add New Account</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div
        style={{
          background: '#131B2E',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '16px',
          padding: '16px 20px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: '1 1 280px' }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: '360px' }}>
            <Search
              size={16}
              style={{ position: 'absolute', left: '12px', top: '12px', color: '#64748B' }}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by name, email, or username..."
              style={{
                width: '100%',
                padding: '9px 12px 9px 38px',
                background: '#1E293B',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                color: '#FFFFFF',
                fontSize: '0.85rem',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedRole('ALL');
              setSelectedStatus('ALL');
            }}
            title="Reset Filters"
            style={{
              padding: '9px 12px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              color: '#94A3B8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.8rem',
            }}
          >
            <RotateCcw size={14} />
            <span>Reset</span>
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Filter size={14} color="#64748B" />
            <select
              value={selectedRole}
              onChange={e => setSelectedRole(e.target.value)}
              style={{
                padding: '8px 12px',
                background: '#1E293B',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                color: '#E2E8F0',
                fontSize: '0.85rem',
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              <option value="ALL">All Roles</option>
              <option value="SUPER_ADMIN">Super Admin</option>
              <option value="ADMIN">Admin</option>
              <option value="MANAGER">Manager</option>
              <option value="STAFF">Staff</option>
              <option value="BOOKING_STAFF">Booking Staff</option>
              <option value="CONTENT_MANAGER">Content Manager</option>
              <option value="DRIVER">Driver</option>
              <option value="CUSTOMER">Customer</option>
            </select>
          </div>

          <div>
            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              style={{
                padding: '8px 12px',
                background: '#1E293B',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                color: '#E2E8F0',
                fontSize: '0.85rem',
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              <option value="ALL">All Status</option>
              <option value="active">Active Accounts</option>
              <option value="deactivated">Deactivated</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div
        style={{
          background: '#131B2E',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.4)',
        }}
      >
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            textAlign: 'left',
            fontSize: '0.85rem',
          }}
        >
          <thead>
            <tr
              style={{
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                color: '#94A3B8',
                background: 'rgba(255, 255, 255, 0.02)',
              }}
            >
              <th style={{ padding: '14px 18px' }}>User Details</th>
              <th style={{ padding: '14px 18px' }}>Role</th>
              <th style={{ padding: '14px 18px' }}>Contact Info</th>
              <th style={{ padding: '14px 18px' }}>Account Status</th>
              <th style={{ padding: '14px 18px' }}>Last Activity</th>
              <th style={{ padding: '14px 18px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#60A5FA' }}>
                  Loading administrators...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#94A3B8' }}>
                  No accounts found matching the criteria.
                </td>
              </tr>
            ) : (
              users.map(u => {
                const roleBadge = getRoleBadgeStyle(u.role);
                const isSelf = u.id === currentUser?.id;
                const isOnlySuperAdmin = u.role === 'SUPER_ADMIN' && activeSuperAdminCount <= 1;

                return (
                  <tr
                    key={u.id}
                    style={{
                      borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                      transition: 'background 0.2s',
                    }}
                  >
                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '10px',
                            background: isSelf ? '#2563EB' : 'rgba(255, 255, 255, 0.08)',
                            color: '#FFFFFF',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '0.9rem',
                          }}
                        >
                          {u.full_name ? u.full_name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: '#F8FAFC' }}>
                            {u.full_name} {isSelf && <span style={{ color: '#60A5FA', fontSize: '0.75rem' }}>(You)</span>}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#93C5FD' }}>@{u.username}</div>
                        </div>
                      </div>
                    </td>

                    <td style={{ padding: '14px 18px' }}>
                      <span
                        style={{
                          background: roleBadge.bg,
                          color: roleBadge.text,
                          border: `1px solid ${roleBadge.border}`,
                          padding: '4px 10px',
                          borderRadius: '8px',
                          fontWeight: 700,
                          fontSize: '0.75rem',
                          letterSpacing: '0.02em',
                        }}
                      >
                        {u.role.replace('_', ' ')}
                      </span>
                    </td>

                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ color: '#E2E8F0', fontWeight: 500 }}>{u.email}</div>
                      <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{u.phone || '—'}</div>
                    </td>

                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: u.is_active ? '#34D399' : '#F87171',
                          }}
                        />
                        <span
                          style={{
                            color: u.is_active ? '#34D399' : '#F87171',
                            fontWeight: 700,
                            fontSize: '0.8rem',
                          }}
                        >
                          {u.is_active ? 'Active' : 'Deactivated'}
                        </span>
                      </div>
                      {u.failed_attempts && u.failed_attempts > 0 ? (
                        <div style={{ fontSize: '0.7rem', color: '#FCD34D', marginTop: '2px' }}>
                          ⚠️ {u.failed_attempts} failed attempt(s)
                        </div>
                      ) : null}
                    </td>

                    <td style={{ padding: '14px 18px', color: '#94A3B8', fontSize: '0.8rem' }}>
                      <div>{u.last_login ? u.last_login : 'Never'}</div>
                    </td>

                    <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        {/* Edit Button */}
                        <button
                          onClick={() => openEditModal(u)}
                          title="Edit Profile & Permissions"
                          style={{
                            background: 'rgba(255, 255, 255, 0.06)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            color: '#93C5FD',
                            cursor: 'pointer',
                            padding: '6px 8px',
                            borderRadius: '6px',
                            display: 'flex',
                            alignItems: 'center',
                          }}
                        >
                          <Edit size={14} />
                        </button>

                        {/* Reset Password Button */}
                        <button
                          onClick={() => openResetPasswordModal(u)}
                          title="Reset Password"
                          style={{
                            background: 'rgba(255, 255, 255, 0.06)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            color: '#FCD34D',
                            cursor: 'pointer',
                            padding: '6px 8px',
                            borderRadius: '6px',
                            display: 'flex',
                            alignItems: 'center',
                          }}
                        >
                          <KeyRound size={14} />
                        </button>

                        {/* Toggle Active Status */}
                        <button
                          onClick={() => handleToggleStatus(u)}
                          disabled={isSelf || (u.is_active === 1 && isOnlySuperAdmin)}
                          title={
                            isSelf
                              ? 'Cannot deactivate your own account'
                              : isOnlySuperAdmin
                              ? 'Cannot deactivate the last active Super Admin'
                              : u.is_active
                              ? 'Deactivate Account'
                              : 'Activate Account'
                          }
                          style={{
                            background: 'rgba(255, 255, 255, 0.06)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            color: isSelf || (u.is_active === 1 && isOnlySuperAdmin) ? '#475569' : u.is_active ? '#F87171' : '#34D399',
                            cursor: isSelf || (u.is_active === 1 && isOnlySuperAdmin) ? 'not-allowed' : 'pointer',
                            padding: '6px 8px',
                            borderRadius: '6px',
                            display: 'flex',
                            alignItems: 'center',
                          }}
                        >
                          {u.is_active ? <UserX size={14} /> : <UserCheck size={14} />}
                        </button>

                        {/* Delete User */}
                        <button
                          onClick={() => handleDeleteUser(u)}
                          disabled={isSelf || isOnlySuperAdmin}
                          title={
                            isSelf
                              ? 'Cannot delete your own account'
                              : isOnlySuperAdmin
                              ? 'Cannot delete the last active Super Admin'
                              : 'Delete User'
                          }
                          style={{
                            background: 'rgba(255, 255, 255, 0.06)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            color: isSelf || isOnlySuperAdmin ? '#475569' : '#EF4444',
                            cursor: isSelf || isOnlySuperAdmin ? 'not-allowed' : 'pointer',
                            padding: '6px 8px',
                            borderRadius: '6px',
                            display: 'flex',
                            alignItems: 'center',
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* CREATE USER MODAL */}
      <Modal isOpen={createModalOpen} onClose={() => setCreateModalOpen(false)} title="Create Administrator / Staff Account">
        <form onSubmit={handleCreateUser} style={{ padding: '6px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#94A3B8', marginBottom: '6px', fontWeight: 600 }}>
                Username *
              </label>
              <input
                type="text"
                value={createUsername}
                onChange={e => setCreateUsername(e.target.value)}
                placeholder="e.g. rahul_ops"
                required
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  background: '#1E293B',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '8px',
                  color: '#FFFFFF',
                  fontSize: '0.875rem',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#94A3B8', marginBottom: '6px', fontWeight: 600 }}>
                Full Name *
              </label>
              <input
                type="text"
                value={createFullName}
                onChange={e => setCreateFullName(e.target.value)}
                placeholder="e.g. Rahul Deshmukh"
                required
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  background: '#1E293B',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '8px',
                  color: '#FFFFFF',
                  fontSize: '0.875rem',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#94A3B8', marginBottom: '6px', fontWeight: 600 }}>
                Email Address *
              </label>
              <input
                type="email"
                value={createEmail}
                onChange={e => setCreateEmail(e.target.value)}
                placeholder="rahul@sangitatravels.com"
                required
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  background: '#1E293B',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '8px',
                  color: '#FFFFFF',
                  fontSize: '0.875rem',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#94A3B8', marginBottom: '6px', fontWeight: 600 }}>
                Phone Number
              </label>
              <input
                type="tel"
                value={createPhone}
                onChange={e => setCreatePhone(e.target.value)}
                placeholder="9822000000"
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  background: '#1E293B',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '8px',
                  color: '#FFFFFF',
                  fontSize: '0.875rem',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '18px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#94A3B8', marginBottom: '6px', fontWeight: 600 }}>
                Role *
              </label>
              <select
                value={createRole}
                onChange={e => setCreateRole(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  background: '#1E293B',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '8px',
                  color: '#FFFFFF',
                  fontSize: '0.875rem',
                  boxSizing: 'border-box',
                }}
              >
                <option value="SUPER_ADMIN">👑 Super Admin</option>
                <option value="ADMIN">🛡️ Admin</option>
                <option value="MANAGER">👔 Manager</option>
                <option value="STAFF">📋 Staff (Bookings & Fleet)</option>
                <option value="BOOKING_STAFF">📋 Booking Staff</option>
                <option value="CONTENT_MANAGER">✍️ Content Manager</option>
                <option value="DRIVER">🚗 Driver</option>
                <option value="CUSTOMER">👤 Customer</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#94A3B8', marginBottom: '6px', fontWeight: 600 }}>
                Initial Password * (min 8 chars, 1 letter, 1 number)
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={createShowPassword ? 'text' : 'password'}
                  value={createPassword}
                  onChange={e => setCreatePassword(e.target.value)}
                  placeholder="Min 8 characters"
                  required
                  style={{
                    width: '100%',
                    padding: '9px 38px 9px 12px',
                    background: '#1E293B',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '8px',
                    color: '#FFFFFF',
                    fontSize: '0.875rem',
                    boxSizing: 'border-box',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setCreateShowPassword(!createShowPassword)}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '9px',
                    background: 'none',
                    border: 'none',
                    color: '#94A3B8',
                    cursor: 'pointer',
                  }}
                >
                  {createShowPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button
              type="button"
              onClick={() => setCreateModalOpen(false)}
              style={{
                padding: '10px 18px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                color: '#CBD5E1',
                fontSize: '0.875rem',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createSubmitting}
              style={{
                padding: '10px 22px',
                background: '#2563EB',
                border: 'none',
                borderRadius: '8px',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: '0.875rem',
                cursor: createSubmitting ? 'not-allowed' : 'pointer',
              }}
            >
              {createSubmitting ? 'Creating...' : 'Create Account'}
            </button>
          </div>
        </form>
      </Modal>

      {/* EDIT USER MODAL */}
      <Modal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)} title={`Edit Account: @${editingUser?.username}`}>
        {editingUser && (
          <form onSubmit={handleUpdateUser} style={{ padding: '6px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94A3B8', marginBottom: '6px', fontWeight: 600 }}>
                  Full Name
                </label>
                <input
                  type="text"
                  value={editFullName}
                  onChange={e => setEditFullName(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    background: '#1E293B',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '8px',
                    color: '#FFFFFF',
                    fontSize: '0.875rem',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94A3B8', marginBottom: '6px', fontWeight: 600 }}>
                  Email Address
                </label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={e => setEditEmail(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    background: '#1E293B',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '8px',
                    color: '#FFFFFF',
                    fontSize: '0.875rem',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94A3B8', marginBottom: '6px', fontWeight: 600 }}>
                  Phone
                </label>
                <input
                  type="tel"
                  value={editPhone}
                  onChange={e => setEditPhone(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    background: '#1E293B',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '8px',
                    color: '#FFFFFF',
                    fontSize: '0.875rem',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94A3B8', marginBottom: '6px', fontWeight: 600 }}>
                  Role {editingUser.id === currentUser?.id && '(Locked for self)'}
                </label>
                <select
                  value={editRole}
                  onChange={e => setEditRole(e.target.value)}
                  disabled={editingUser.id === currentUser?.id}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    background: editingUser.id === currentUser?.id ? '#0F172A' : '#1E293B',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '8px',
                    color: editingUser.id === currentUser?.id ? '#64748B' : '#FFFFFF',
                    fontSize: '0.875rem',
                    boxSizing: 'border-box',
                    cursor: editingUser.id === currentUser?.id ? 'not-allowed' : 'pointer',
                  }}
                >
                  <option value="SUPER_ADMIN">👑 Super Admin</option>
                  <option value="ADMIN">🛡️ Admin</option>
                  <option value="MANAGER">👔 Manager</option>
                  <option value="STAFF">📋 Staff</option>
                  <option value="BOOKING_STAFF">📋 Booking Staff</option>
                  <option value="CONTENT_MANAGER">✍️ Content Manager</option>
                  <option value="DRIVER">🚗 Driver</option>
                  <option value="CUSTOMER">👤 Customer</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '18px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94A3B8', marginBottom: '6px', fontWeight: 600 }}>
                  Account Status
                </label>
                <select
                  value={editIsActive}
                  onChange={e => setEditIsActive(parseInt(e.target.value, 10))}
                  disabled={editingUser.id === currentUser?.id || (editingUser.role === 'SUPER_ADMIN' && activeSuperAdminCount <= 1)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    background: '#1E293B',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '8px',
                    color: '#FFFFFF',
                    fontSize: '0.875rem',
                    boxSizing: 'border-box',
                  }}
                >
                  <option value={1}>Active</option>
                  <option value={0}>Deactivated (Revokes Sessions)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94A3B8', marginBottom: '6px', fontWeight: 600 }}>
                  Optional New Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={editShowPassword ? 'text' : 'password'}
                    value={editNewPassword}
                    onChange={e => setEditNewPassword(e.target.value)}
                    placeholder="Leave blank to keep current"
                    style={{
                      width: '100%',
                      padding: '9px 38px 9px 12px',
                      background: '#1E293B',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '8px',
                      color: '#FFFFFF',
                      fontSize: '0.875rem',
                      boxSizing: 'border-box',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setEditShowPassword(!editShowPassword)}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '9px',
                      background: 'none',
                      border: 'none',
                      color: '#94A3B8',
                      cursor: 'pointer',
                    }}
                  >
                    {editShowPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
                style={{
                  padding: '10px 18px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  color: '#CBD5E1',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={editSubmitting}
                style={{
                  padding: '10px 22px',
                  background: '#2563EB',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '0.875rem',
                  cursor: editSubmitting ? 'not-allowed' : 'pointer',
                }}
              >
                {editSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* RESET PASSWORD MODAL */}
      <Modal
        isOpen={resetModalOpen}
        onClose={() => setResetModalOpen(false)}
        title={`Rotate Password for @${resetTargetUser?.username}`}
      >
        {resetTargetUser && (
          <form onSubmit={handleResetPassword} style={{ padding: '6px' }}>
            <p style={{ color: '#94A3B8', fontSize: '0.85rem', marginBottom: '16px' }}>
              Setting a new password will immediately revoke all active session tokens for{' '}
              <strong style={{ color: '#FFFFFF' }}>{resetTargetUser.full_name} (@{resetTargetUser.username})</strong> across all devices.
            </p>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#94A3B8', marginBottom: '6px', fontWeight: 600 }}>
                New Password * (min 8 characters, 1 letter, 1 number)
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={resetShowPassword ? 'text' : 'password'}
                  value={resetPassword}
                  onChange={e => setResetPassword(e.target.value)}
                  placeholder="Enter new strong password"
                  required
                  style={{
                    width: '100%',
                    padding: '9px 38px 9px 12px',
                    background: '#1E293B',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '8px',
                    color: '#FFFFFF',
                    fontSize: '0.875rem',
                    boxSizing: 'border-box',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setResetShowPassword(!resetShowPassword)}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '9px',
                    background: 'none',
                    border: 'none',
                    color: '#94A3B8',
                    cursor: 'pointer',
                  }}
                >
                  {resetShowPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#94A3B8', marginBottom: '6px', fontWeight: 600 }}>
                Confirm New Password *
              </label>
              <input
                type={resetShowPassword ? 'text' : 'password'}
                value={resetConfirm}
                onChange={e => setResetConfirm(e.target.value)}
                placeholder="Re-enter password to confirm"
                required
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  background: '#1E293B',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '8px',
                  color: '#FFFFFF',
                  fontSize: '0.875rem',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setResetModalOpen(false)}
                style={{
                  padding: '10px 18px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  color: '#CBD5E1',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={resetSubmitting}
                style={{
                  padding: '10px 22px',
                  background: '#2563EB',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '0.875rem',
                  cursor: resetSubmitting ? 'not-allowed' : 'pointer',
                }}
              >
                {resetSubmitting ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
