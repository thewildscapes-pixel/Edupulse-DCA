import React, { useState, useEffect } from 'react';
import { Mentor, Department, ALL_DEPARTMENTS } from '../types';
import { 
  UserCheck, 
  Mail, 
  Phone, 
  Building2, 
  Award, 
  X, 
  CheckCircle2, 
  ShieldCheck,
  Sparkles
} from 'lucide-react';

const DEPARTMENTS: Department[] = ALL_DEPARTMENTS;

interface EditMentorProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentMentor?: Mentor;
  onSaveProfile: (profile: {
    id?: string;
    name: string;
    designation: string;
    department: Department;
    email: string;
    phone: string;
    assignedMenteeIds?: string[];
  }) => void;
}

export const EditMentorProfileModal: React.FC<EditMentorProfileModalProps> = ({
  isOpen,
  onClose,
  currentMentor,
  onSaveProfile,
}) => {
  const [name, setName] = useState(currentMentor?.name || '');
  const [designation, setDesignation] = useState(currentMentor?.designation || 'Assistant Professor');
  const [department, setDepartment] = useState<Department>(currentMentor?.department || 'Physics');
  const [email, setEmail] = useState(currentMentor?.email || '');
  const [phone, setPhone] = useState(currentMentor?.phone || '+91 94350 00000');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (currentMentor) {
      setName(currentMentor.name || '');
      setDesignation(currentMentor.designation || 'Assistant Professor');
      setDepartment(currentMentor.department || 'Physics');
      setEmail(currentMentor.email || '');
      setPhone(currentMentor.phone || '+91 94350 00000');
    }
  }, [currentMentor, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter your full name with title (e.g., Dr. Ananya Sharma)');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid faculty email address');
      return;
    }
    if (!phone.trim() || phone.trim().length < 8) {
      setError('Please enter a valid WhatsApp phone number for student & parent communication');
      return;
    }

    setError(null);
    onSaveProfile({
      id: currentMentor?.id,
      name: name.trim(),
      designation: designation.trim() || 'Assistant Professor',
      department,
      email: email.trim(),
      phone: phone.trim(),
      assignedMenteeIds: currentMentor?.assignedMenteeIds,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 relative animate-fade-in my-auto">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center space-x-3 mb-5">
          <div className="p-3 rounded-2xl bg-blue-100 text-[#1976d2] border border-blue-200">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider bg-blue-100 text-[#1976d2] px-2 py-0.5 rounded">
              Shared Faculty Profile
            </span>
            <h2 className="text-xl font-bold text-slate-900 mt-0.5">
              Faculty Profile & WhatsApp Contact
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Digboi College (Autonomous) • Shared across Educator & Mentor Portals
            </p>
          </div>
        </div>

        {/* Informational Callout */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3.5 mb-5 text-xs text-blue-900 flex items-start space-x-2.5">
          <ShieldCheck className="w-5 h-5 text-[#1976d2] shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Unified Faculty Profile Details</p>
            <p className="text-blue-800/90 text-[11px] leading-relaxed mt-0.5">
              These details are linked to your email ({email || 'faculty'}) and shared across both Educator and Mentor modes. Your WhatsApp contact enables direct report sharing with parents and assigned mentors.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Full Name */}
          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
              Faculty Name & Title *
            </label>
            <div className="relative">
              <UserCheck className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Dr. Diganta Borah"
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1976d2]"
                required
              />
            </div>
          </div>

          {/* Designation & Department */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Designation *
              </label>
              <div className="relative">
                <Award className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <select
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1976d2]"
                >
                  <option value="Assistant Professor">Assistant Professor</option>
                  <option value="Associate Professor">Associate Professor</option>
                  <option value="Professor">Professor</option>
                  <option value="HoD & Associate Professor">HoD & Associate Professor</option>
                  <option value="HoD & Assistant Professor">HoD & Assistant Professor</option>
                  <option value="Vice Principal">Vice Principal</option>
                  <option value="Guest Faculty">Guest Faculty</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Department *
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value as Department)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1976d2]"
                >
                  {DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Email & WhatsApp Number */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Faculty Email ID *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@digboicollege.edu.in"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1976d2]"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                WhatsApp Number *
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-emerald-600 absolute left-3 top-3" />
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +91 94350 12345"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  required
                />
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2.5 border border-slate-300 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer text-center"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md transition-colors cursor-pointer flex items-center justify-center space-x-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Save Profile & WhatsApp</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
