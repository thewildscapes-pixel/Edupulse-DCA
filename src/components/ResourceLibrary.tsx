import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Download, 
  Search, 
  Plus, 
  Trash2, 
  FileText, 
  X, 
  UploadCloud, 
  Lock, 
  ShieldCheck,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import { Mentor, ALL_DEPARTMENTS } from '../types';

export interface ResourceItem {
  id: string;
  title: string;
  category: string;
  department: string;
  fileType: string;
  description: string;
  author: string;
  uploadedByMentorId: string;
  dateAdded: string;
  fileUrl?: string;
  fileName?: string;
}

interface ResourceLibraryProps {
  currentMentor: Mentor;
}

export const ResourceLibrary: React.FC<ResourceLibraryProps> = ({ currentMentor }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [resources, setResources] = useState<ResourceItem[]>(() => {
    try {
      const saved = localStorage.getItem('edupulse_resources');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // Upload Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Remedial Guide');
  const [department, setDepartment] = useState(currentMentor?.department || 'Physics');
  const [fileType, setFileType] = useState('PDF');
  const [description, setDescription] = useState('');
  const [externalUrl, setExternalUrl] = useState('');
  const [selectedFileName, setSelectedFileName] = useState('');
  const [selectedFileDataUrl, setSelectedFileDataUrl] = useState('');

  useEffect(() => {
    localStorage.setItem('edupulse_resources', JSON.stringify(resources));
  }, [resources]);

  // Ensure all resources uploaded by mentor, department or author remain fully visible
  const myResources = resources.filter((r) => 
    !r.uploadedByMentorId ||
    r.uploadedByMentorId === currentMentor.id || 
    (currentMentor.name && r.author?.toLowerCase() === currentMentor.name?.toLowerCase()) ||
    (currentMentor.department && r.department === currentMentor.department)
  );

  const filtered = myResources.filter((r) => {
    const matchesSearch =
      r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = selectedDept === 'All' || r.department === selectedDept;
    return matchesSearch && matchesDept;
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFileName(file.name);
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setSelectedFileDataUrl(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddResource = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Please enter a resource title.');
      return;
    }

    const newRes: ResourceItem = {
      id: `res_${Date.now()}`,
      title: title.trim(),
      category,
      department,
      fileType,
      description: description.trim() || 'No description provided.',
      author: currentMentor.name || 'Faculty Member',
      uploadedByMentorId: currentMentor.id,
      dateAdded: new Date().toISOString().split('T')[0],
      fileUrl: externalUrl.trim() || selectedFileDataUrl || undefined,
      fileName: selectedFileName || `${title.trim()}.${fileType.toLowerCase()}`
    };

    setResources((prev) => [newRes, ...prev]);
    setIsModalOpen(false);

    // Reset Form
    setTitle('');
    setDescription('');
    setExternalUrl('');
    setSelectedFileName('');
    setSelectedFileDataUrl('');
  };

  const handleDeleteResource = (id: string, resTitle: string) => {
    if (window.confirm(`Are you sure you want to delete "${resTitle}" from your personal library?`)) {
      setResources((prev) => prev.filter((r) => r.id !== id));
    }
  };

  const handleDownload = (res: ResourceItem) => {
    if (res.fileUrl) {
      if (res.fileUrl.startsWith('http') || res.fileUrl.startsWith('https')) {
        window.open(res.fileUrl, '_blank');
      } else {
        const link = document.createElement('a');
        link.href = res.fileUrl;
        link.download = res.fileName || `${res.title}.${res.fileType.toLowerCase()}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } else {
      alert(`Downloading resource: ${res.title}\n\nFile: ${res.fileName || 'Document'}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <BookOpen className="w-6 h-6 text-[#1976d2]" />
            <h2 className="text-xl font-extrabold text-slate-900">Faculty Private Resource Library</h2>
            <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-200 inline-flex items-center space-x-1">
              <Lock className="w-3 h-3" />
              <span>Isolated Vault</span>
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Logged in as <strong className="text-slate-800">{currentMentor.name}</strong> ({currentMentor.department} Dept). 
            Only materials uploaded by you are accessible in your personal library vault.
          </p>
        </div>

        <div className="flex items-center space-x-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-60">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search your files..."
              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white text-slate-700 outline-none"
          >
            <option value="All">All Depts</option>
            {ALL_DEPARTMENTS.map((dept) => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-[#1976d2] hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all inline-flex items-center space-x-1.5 shadow-xs shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Upload Resource</span>
          </button>
        </div>
      </div>

      {/* Grid of Resources */}
      {filtered.length === 0 ? (
        <div className="bg-white p-10 rounded-2xl border border-slate-200 text-center space-y-4">
          <div className="w-12 h-12 bg-blue-50 text-[#1976d2] rounded-2xl flex items-center justify-center mx-auto border border-blue-100">
            <UploadCloud className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-extrabold text-slate-900 text-base">Your Resource Library is Currently Empty</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              No learning materials have been uploaded by <strong>{currentMentor.name}</strong> yet. Under Digboi College mentorship privacy policies, you have exclusive access to materials uploaded from your account.
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-[#1976d2] hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all inline-flex items-center space-x-1.5 cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>+ Upload First Resource</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((res) => (
            <div
              key={res.id}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="bg-blue-50 text-[#1976d2] font-semibold text-[10px] px-2.5 py-0.5 rounded-full border border-blue-100">
                    {res.department} • {res.category}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">{res.dateAdded}</span>
                </div>
                <h3 className="font-bold text-slate-900 text-sm">{res.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{res.description}</p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-1 text-slate-500 text-[11px]">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Uploaded by: <strong>{res.author}</strong></span>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleDeleteResource(res.id, res.title)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                    title="Delete Resource"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDownload(res)}
                    className="inline-flex items-center space-x-1 px-3 py-1.5 bg-slate-100 hover:bg-[#1976d2] hover:text-white text-slate-700 font-semibold rounded-lg transition-all cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download {res.fileType}</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <UploadCloud className="w-5 h-5 text-[#1976d2]" />
                <h3 className="font-extrabold text-slate-900 text-base">Upload Institutional Resource</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddResource} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Resource Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Unit 3 Quantum Mechanics Remedial Guide"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="Remedial Guide">Remedial Guide</option>
                    <option value="Practice Sheet">Practice Sheet</option>
                    <option value="Course Material">Course Material</option>
                    <option value="Formula Sheet">Formula Sheet</option>
                    <option value="Question Bank">Question Bank</option>
                    <option value="Visual Aid">Visual Aid</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Department</label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    {ALL_DEPARTMENTS.map((dept) => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">File Format</label>
                  <select
                    value={fileType}
                    onChange={(e) => setFileType(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="PDF">PDF Document</option>
                    <option value="DOCX">Word Document (.docx)</option>
                    <option value="PPTX">PowerPoint (.pptx)</option>
                    <option value="XLSX">Excel Spreadsheet</option>
                    <option value="Image">Diagram / Image</option>
                    <option value="Link">External Web Link</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Select File</label>
                  <input
                    type="file"
                    onChange={handleFileChange}
                    className="w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-[#1976d2] hover:file:bg-blue-100"
                  />
                </div>
              </div>

              {selectedFileName && (
                <p className="text-[11px] text-emerald-600 font-medium flex items-center space-x-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Selected file: {selectedFileName}</span>
                </p>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">External Resource URL (Optional)</label>
                <input
                  type="url"
                  value={externalUrl}
                  onChange={(e) => setExternalUrl(e.target.value)}
                  placeholder="https://drive.google.com/..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description / Notes</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide context on how slow learners or mentees should utilize this material..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                />
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#1976d2] hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
                >
                  Save to My Vault
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
