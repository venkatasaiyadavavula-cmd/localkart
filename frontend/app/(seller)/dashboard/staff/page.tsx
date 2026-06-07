'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import {
  Users, Plus, Trash2, RefreshCw, Shield,
  Package, Truck, Crown, Copy, CheckCircle2,
  ChevronRight, X, AlertTriangle, Clock, Wifi,
} from 'lucide-react';
import { toast } from 'sonner';

const API = process.env.NEXT_PUBLIC_API_URL;
const auth = () => ({ Authorization: `Bearer ${localStorage.getItem('accessToken')}` });

type StaffRole = 'store_manager' | 'products_manager' | 'delivery_staff';
type StaffStatus = 'active' | 'inactive';

interface StaffMember {
  id:          string;
  name:        string;
  phone:       string;
  staffId:     string;
  role:        StaffRole;
  status:      StaffStatus;
  permissions: string[];
  lastLoginAt: string | null;
  isOnline:    boolean;
  note:        string | null;
  createdAt:   string;
}

interface NewCredentials {
  staffId:     string;
  tempPassword:string;
  name:        string;
  role:        StaffRole;
  permissions: string[];
  message:     string;
}

const ROLE_CONFIG: Record<StaffRole, {
  label:       string;
  icon:        React.ElementType;
  color:       string;
  bg:          string;
  border:      string;
  permissions: string;
  gradient:    string;
}> = {
  store_manager: {
    label:       'Store Manager',
    icon:        Crown,
    color:       '#7C3AED',
    bg:          '#F5F3FF',
    border:      'rgba(124,58,237,0.20)',
    gradient:    'linear-gradient(135deg,#7C3AED,#6D28D9)',
    permissions: 'Products + Orders + Inventory',
  },
  products_manager: {
    label:       'Products Manager',
    icon:        Package,
    color:       '#2563EB',
    bg:          '#EFF6FF',
    border:      'rgba(37,99,235,0.20)',
    gradient:    'linear-gradient(135deg,#2563EB,#1D4ED8)',
    permissions: 'Products + Inventory',
  },
  delivery_staff: {
    label:       'Delivery Staff',
    icon:        Truck,
    color:       '#059669',
    bg:          '#ECFDF5',
    border:      'rgba(5,150,105,0.20)',
    gradient:    'linear-gradient(135deg,#059669,#047857)',
    permissions: 'View + Update Orders only',
  },
};

function CopyBtn({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success(`${label} copied!`);
  };
  return (
    <button onClick={copy} className="flex items-center justify-center w-7 h-7 rounded-lg transition-colors hover:bg-white/20">
      {copied ? <CheckCircle2 className="h-3.5 w-3.5 text-green-300" /> : <Copy className="h-3.5 w-3.5 text-white/70" />}
    </button>
  );
}

function CredentialsModal({ creds, onClose }: { creds: NewCredentials; onClose: () => void }) {
  const cfg = ROLE_CONFIG[creds.role];
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)' }}>
      <div className="w-full max-w-sm rounded-3xl overflow-hidden animate-scale-spring" style={{ background: 'white', boxShadow: '0 32px 64px rgba(0,0,0,0.25)' }}>

        {/* Top gradient header */}
        <div className="relative p-5 text-white overflow-hidden" style={{ background: cfg.gradient }}>
          <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-20" style={{ background: 'rgba(255,255,255,0.4)', filter: 'blur(20px)' }} />
          <div className="flex items-center justify-between relative">
            <div>
              <p className="text-[11px] font-bold text-white/70 uppercase tracking-widest mb-1">New Staff Added</p>
              <p className="text-xl font-black" style={{ fontFamily: 'var(--font-display)' }}>{creds.name}</p>
              <p className="text-sm text-white/70 font-semibold mt-0.5">{cfg.label}</p>
            </div>
            <div className="flex items-center justify-center w-12 h-12 rounded-2xl" style={{ background: 'rgba(255,255,255,0.18)' }}>
              <cfg.icon className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        {/* Credentials */}
        <div className="p-5 space-y-3">
          <p className="text-xs font-extrabold text-gray-400 uppercase tracking-widest">Login Credentials</p>

          {[
            { label: 'Staff ID',  value: creds.staffId,      icon: Shield },
            { label: 'Password',  value: creds.tempPassword, icon: RefreshCw },
          ].map(({ label, value, icon: Icon }) => (
            <div
              key={label}
              className="flex items-center justify-between px-3.5 py-3 rounded-2xl"
              style={{ background: '#F8F9FF', border: '1.5px solid #E5E9F2' }}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ background: '#EEF0FE' }}>
                  <Icon className="h-3.5 w-3.5" style={{ color: '#3D5AF1' }} />
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">{label}</p>
                  <p className="text-sm font-extrabold text-gray-800 font-mono">{value}</p>
                </div>
              </div>
              <button
                onClick={() => { navigator.clipboard.writeText(value); toast.success(`${label} copied!`); }}
                className="flex items-center justify-center w-8 h-8 rounded-xl bg-white border border-gray-100 hover:bg-gray-50 transition-colors"
              >
                <Copy className="h-3.5 w-3.5 text-gray-400" />
              </button>
            </div>
          ))}

          {/* Permissions */}
          <div className="rounded-2xl p-3" style={{ background: cfg.bg, border: `1.5px solid ${cfg.border}` }}>
            <p className="text-[10px] font-extrabold uppercase tracking-wide mb-2" style={{ color: cfg.color }}>
              Access Permissions
            </p>
            <div className="flex flex-wrap gap-1.5">
              {creds.permissions.map(p => (
                <span key={p} className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'white', color: cfg.color }}>
                  {p.replace(':', ': ')}
                </span>
              ))}
            </div>
          </div>

          <div className="flex items-start gap-2 bg-amber-50 rounded-2xl p-3">
            <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-[11px] text-amber-700 font-semibold leading-snug">
              Share credentials with the staff member. Password should be changed on first login.
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-full py-3.5 rounded-2xl text-sm font-extrabold text-white"
            style={{ background: 'linear-gradient(135deg,#3D5AF1,#6D28D9)', boxShadow: '0 4px 16px rgba(61,90,241,0.30)' }}
          >
            Done — I've noted the credentials
          </button>
        </div>
      </div>
    </div>
  );
}

function AddStaffSheet({ open, onClose, onAdded }: { open: boolean; onClose: () => void; onAdded: (c: NewCredentials) => void }) {
  const [form, setForm] = useState({ name: '', phone: '', role: 'delivery_staff' as StaffRole, note: '' });
  const qc = useQueryClient();

  const mutation = useMutation({
    mutationFn: async () => {
      const { data } = await axios.post(`${API}/seller/staff`, form, { headers: auth() });
      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['staff'] });
      onAdded(data);
      onClose();
      setForm({ name: '', phone: '', role: 'delivery_staff', note: '' });
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Failed to add staff'),
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center" style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-lg rounded-t-3xl bg-white p-5 pb-safe-bottom animate-slide-up" style={{ boxShadow: '0 -16px 48px rgba(0,0,0,0.15)' }}>

        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-black text-gray-900" style={{ fontFamily: 'var(--font-display)' }}>Add Staff Member</h2>
            <p className="text-xs text-gray-400 mt-0.5">They get a separate login — no access to your account</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
            <X className="h-4 w-4 text-gray-500" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Name */}
          <div>
            <label className="text-xs font-extrabold text-gray-500 uppercase tracking-wide mb-1.5 block">Full Name *</label>
            <input
              value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              placeholder="e.g. Ravi Kumar"
              className="input-base"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="text-xs font-extrabold text-gray-500 uppercase tracking-wide mb-1.5 block">Mobile Number *</label>
            <input
              value={form.phone}
              onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
              placeholder="+91 XXXXXXXXXX"
              type="tel"
              className="input-base"
            />
          </div>

          {/* Role selection */}
          <div>
            <label className="text-xs font-extrabold text-gray-500 uppercase tracking-wide mb-2 block">Role & Access *</label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.entries(ROLE_CONFIG) as [StaffRole, typeof ROLE_CONFIG[StaffRole]][]).map(([role, cfg]) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setForm(p => ({ ...p, role }))}
                  className="flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all duration-200 text-center"
                  style={{
                    borderColor: form.role === role ? cfg.color : '#E5E9F2',
                    background:  form.role === role ? cfg.bg    : 'white',
                  }}
                >
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: form.role === role ? cfg.bg : '#F3F4F6' }}>
                    <cfg.icon className="h-4.5 w-4.5" style={{ color: form.role === role ? cfg.color : '#9CA3AF' }} />
                  </div>
                  <span className="text-[11px] font-extrabold leading-tight" style={{ color: form.role === role ? cfg.color : '#6B7280' }}>
                    {cfg.label}
                  </span>
                  <span className="text-[9px] text-gray-400 leading-tight">{cfg.permissions}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="text-xs font-extrabold text-gray-500 uppercase tracking-wide mb-1.5 block">Note (optional)</label>
            <input
              value={form.note}
              onChange={e => setForm(p => ({ ...p, note: e.target.value }))}
              placeholder="e.g. Morning shift, handles electronics section"
              className="input-base"
            />
          </div>

          <button
            onClick={() => mutation.mutate()}
            disabled={!form.name || !form.phone || mutation.isPending}
            className="w-full py-4 rounded-2xl text-sm font-extrabold text-white transition-all active:scale-[0.97] disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg,#3D5AF1,#6D28D9)', boxShadow: '0 4px 20px rgba(61,90,241,0.30)' }}
          >
            {mutation.isPending ? 'Adding...' : 'Add Staff Member'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function StaffPage() {
  const [showAdd,    setShowAdd]    = useState(false);
  const [newCreds,   setNewCreds]   = useState<NewCredentials | null>(null);
  const [deleteId,   setDeleteId]   = useState<string | null>(null);
  const qc = useQueryClient();

  const { data: staff = [], isLoading } = useQuery<StaffMember[]>({
    queryKey: ['staff'],
    queryFn:  async () => {
      const { data } = await axios.get(`${API}/seller/staff`, { headers: auth() });
      return data;
    },
  });

  const removeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data } = await axios.delete(`${API}/seller/staff/${id}`, { headers: auth() });
      return data;
    },
    onSuccess: (data) => {
      toast.success(data.message);
      qc.invalidateQueries({ queryKey: ['staff'] });
      setDeleteId(null);
    },
    onError: () => toast.error('Failed to remove staff'),
  });

  const resetMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data } = await axios.post(`${API}/seller/staff/${id}/reset-password`, {}, { headers: auth() });
      return data;
    },
    onSuccess: (data) => {
      toast.success(`New password: ${data.newPassword}`, { duration: 8000 });
    },
    onError: () => toast.error('Failed to reset password'),
  });

  const activeStaff  = staff.filter(s => s.status === 'active');
  const MAX_STAFF    = 10;

  if (isLoading) {
    return (
      <div className="p-4 space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-24 rounded-2xl skeleton-shimmer" />
        ))}
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 max-w-2xl mx-auto" style={{ fontFamily: 'var(--font-sans)', background: '#F5F7FA' }}>

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-black text-gray-900" style={{ fontFamily: 'var(--font-display)' }}>
            Staff Management
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            {activeStaff.length}/{MAX_STAFF} active · Separate logins for each member
          </p>
        </div>
        {activeStaff.length < MAX_STAFF && (
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 text-xs font-extrabold text-white px-4 py-2.5 rounded-2xl transition-all active:scale-95"
            style={{ background: 'linear-gradient(135deg,#3D5AF1,#6D28D9)', boxShadow: '0 4px 16px rgba(61,90,241,0.30)' }}
          >
            <Plus className="h-3.5 w-3.5" />
            Add Staff
          </button>
        )}
      </div>

      {/* Role legend */}
      <div className="grid grid-cols-3 gap-2 mb-5">
        {(Object.entries(ROLE_CONFIG) as [StaffRole, typeof ROLE_CONFIG[StaffRole]][]).map(([role, cfg]) => (
          <div
            key={role}
            className="flex items-center gap-2 p-2.5 rounded-2xl border"
            style={{ background: cfg.bg, borderColor: cfg.border }}
          >
            <cfg.icon className="h-4 w-4 flex-shrink-0" style={{ color: cfg.color }} />
            <div className="min-w-0">
              <p className="text-[10px] font-extrabold truncate" style={{ color: cfg.color }}>{cfg.label}</p>
              <p className="text-[9px] text-gray-400 truncate">{cfg.permissions}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Staff list */}
      {activeStaff.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-3xl mx-auto mb-4 flex items-center justify-center" style={{ background: '#EEF0FE' }}>
            <Users className="h-8 w-8" style={{ color: '#3D5AF1' }} />
          </div>
          <p className="font-extrabold text-gray-700 text-base">No staff members yet</p>
          <p className="text-sm text-gray-400 mt-1 mb-5">Add workers — they get their own secure login</p>
          <button
            onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-2 text-sm font-extrabold text-white px-6 py-3 rounded-2xl"
            style={{ background: 'linear-gradient(135deg,#3D5AF1,#6D28D9)', boxShadow: '0 4px 16px rgba(61,90,241,0.30)' }}
          >
            <Plus className="h-4 w-4" />
            Add First Staff Member
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {activeStaff.map((member) => {
            const cfg = ROLE_CONFIG[member.role];
            const Icon = cfg.icon;
            return (
              <div
                key={member.id}
                className="bg-white rounded-3xl border overflow-hidden transition-all duration-200 hover:shadow-soft"
                style={{ borderColor: '#E5E9F2', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
              >
                {/* Top role stripe */}
                <div className="h-1 w-full" style={{ background: cfg.gradient }} />

                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    {/* Avatar + info */}
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="relative flex-shrink-0">
                        <div
                          className="w-11 h-11 rounded-2xl flex items-center justify-center text-white text-base font-extrabold"
                          style={{ background: cfg.gradient }}
                        >
                          {member.name[0].toUpperCase()}
                        </div>
                        {/* Online dot */}
                        <span
                          className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white"
                          style={{ background: member.isOnline ? '#10B981' : '#D1D5DB' }}
                        />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-extrabold text-gray-900">{member.name}</p>
                          <span
                            className="text-[10px] font-extrabold px-2 py-0.5 rounded-full"
                            style={{ background: cfg.bg, color: cfg.color }}
                          >
                            {cfg.label}
                          </span>
                          {member.isOnline && (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-green-500">
                              <Wifi className="h-2.5 w-2.5" /> Online
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 font-medium mt-0.5">{member.phone}</p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <code
                            className="text-[10px] font-extrabold px-2 py-0.5 rounded-lg font-mono"
                            style={{ background: '#F3F4F6', color: '#6B7280' }}
                          >
                            {member.staffId}
                          </code>
                          {member.lastLoginAt && (
                            <span className="flex items-center gap-0.5 text-[10px] text-gray-400">
                              <Clock className="h-2.5 w-2.5" />
                              {new Date(member.lastLoginAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                            </span>
                          )}
                        </div>
                        {member.note && (
                          <p className="text-[11px] text-gray-400 mt-1 italic">{member.note}</p>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-1.5 flex-shrink-0">
                      <button
                        onClick={() => resetMutation.mutate(member.id)}
                        className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1.5 rounded-xl border transition-colors"
                        style={{ color: '#6B7280', borderColor: '#E5E9F2' }}
                        title="Reset password"
                      >
                        <RefreshCw className="h-3 w-3" />
                        Reset
                      </button>
                      <button
                        onClick={() => setDeleteId(member.id)}
                        className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1.5 rounded-xl border transition-colors"
                        style={{ color: '#EF4444', borderColor: 'rgba(239,68,68,0.20)', background: '#FEF2F2' }}
                        title="Remove access"
                      >
                        <Trash2 className="h-3 w-3" />
                        Remove
                      </button>
                    </div>
                  </div>

                  {/* Permissions chips */}
                  <div className="flex flex-wrap gap-1.5 mt-3 pt-3" style={{ borderTop: '1px solid #F1F5F9' }}>
                    {member.permissions.map(p => (
                      <span
                        key={p}
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{ background: cfg.bg, color: cfg.color }}
                      >
                        ✓ {p.replace(':', ': ')}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add staff sheet */}
      <AddStaffSheet
        open={showAdd}
        onClose={() => setShowAdd(false)}
        onAdded={(creds) => setNewCreds(creds)}
      />

      {/* Credentials modal */}
      {newCreds && (
        <CredentialsModal
          creds={newCreds}
          onClose={() => setNewCreds(null)}
        />
      )}

      {/* Delete confirm */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)' }}>
          <div className="w-full max-w-sm bg-white rounded-3xl p-5 animate-scale-spring" style={{ boxShadow: '0 24px 64px rgba(0,0,0,0.20)' }}>
            <div className="flex items-center justify-center w-14 h-14 rounded-3xl mx-auto mb-4" style={{ background: '#FEF2F2' }}>
              <AlertTriangle className="h-7 w-7 text-red-500" />
            </div>
            <h3 className="text-lg font-black text-gray-900 text-center" style={{ fontFamily: 'var(--font-display)' }}>
              Remove Access?
            </h3>
            <p className="text-sm text-gray-500 text-center mt-2 leading-relaxed">
              This staff member will be <strong>immediately logged out</strong> and cannot access the seller panel anymore.
            </p>
            <div className="flex gap-2 mt-5">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 py-3 rounded-2xl text-sm font-bold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => removeMutation.mutate(deleteId)}
                disabled={removeMutation.isPending}
                className="flex-1 py-3 rounded-2xl text-sm font-extrabold text-white transition-all active:scale-[0.97]"
                style={{ background: 'linear-gradient(135deg,#EF4444,#DC2626)', boxShadow: '0 4px 16px rgba(239,68,68,0.30)' }}
              >
                {removeMutation.isPending ? 'Removing...' : 'Yes, Remove'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
