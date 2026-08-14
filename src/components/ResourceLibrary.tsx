import React, { useState, useEffect, useRef } from 'react';
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
  ExternalLink,
  Eye,
  Copy,
  Check,
  FileSpreadsheet,
  FileCode,
  Image as ImageIcon,
  Presentation,
  Loader2,
  AlertCircle,
  FolderOpen
} from 'lucide-react';
import { Mentor, ALL_DEPARTMENTS, ResourceItem, Department } from '../types';

interface ResourceLibraryProps {
  currentMentor: Mentor;
}

export const ResourceLibrary: React.FC<ResourceLibraryProps> = ({ currentMentor }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Safe initialization of resources from localStorage
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
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Remedial Guide');
  const [department, setDepartment] = useState<Department>(currentMentor?.department || 'Physics');
  const [fileType, setFileType] = useState('PDF');
  const [description, setDescription] = useState('');
  const [externalUrl, setExternalUrl] = useState('');
  
  // Selected file details
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFileName, setSelectedFileName] = useState('');
  const [selectedFileSize, setSelectedFileSize] = useState('');
  const [selectedFileDataUrl, setSelectedFileDataUrl] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Fetch resources from server API on mount
  useEffect(() => {
    fetch('/api/resources')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load resources');
        return res.json();
      })
      .then((data) => {
        if (data && Array.isArray(data.resources)) {
          setResources((prev) => {
            const map = new Map<string, ResourceItem>();
            prev.forEach((r) => map.set(r.id, r));
            data.resources.forEach((r: ResourceItem) => map.set(r.id, r));
            const merged = Array.from(map.values());
            try {
              localStorage.setItem('edupulse_resources', JSON.stringify(merged));
            } catch (e) {
              console.warn('LocalStorage quota warning:', e);
            }
            return merged;
          });
        }
      })
      .catch((err) => console.warn('Could not fetch server resources:', err));
  }, []);

  // Safe sync to localStorage whenever resources state changes
  useEffect(() => {
    try {
      // Strip out any legacy raw base64 dataUrls that might blow up localStorage
      const safeResources = resources.map((r) => {
        if (r.fileUrl && r.fileUrl.startsWith('data:') && r.fileUrl.length > 50000) {
          return { ...r, fileUrl: undefined };
        }
        return r;
      });
      localStorage.setItem('edupulse_resources', JSON.stringify(safeResources));
    } catch (e) {
      console.warn('LocalStorage quota warning while syncing resources:', e);
    }
  }, [resources]);

  // Update default department if currentMentor department changes
  useEffect(() => {
    if (currentMentor?.department) {
      setDepartment(currentMentor.department);
    }
  }, [currentMentor?.department]);

  // Filter resources
  const filtered = resources.filter((r) => {
    const matchesSearch =
      r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.fileName && r.fileName.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesDept = selectedDept === 'All' || r.department === selectedDept;
    const matchesCat = selectedCategory === 'All' || r.category === selectedCategory;

    return matchesSearch && matchesDept && matchesCat;
  });

  const processFile = (file: File) => {
    // Check file size (cap at 25MB)
    const maxBytes = 25 * 1024 * 1024;
    if (file.size > maxBytes) {
      setUploadError('File size exceeds 25 MB limit. Please select a smaller file.');
      return;
    }
    setUploadError(null);
    setSelectedFile(file);
    setSelectedFileName(file.name);

    const sizeStr = file.size < 1024 * 1024 
      ? `${(file.size / 1024).toFixed(1)} KB` 
      : `${(file.size / (1024 * 1024)).toFixed(1)} MB`;
    setSelectedFileSize(sizeStr);

    // Auto-detect format
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    if (['pdf'].includes(ext)) setFileType('PDF');
    else if (['docx', 'doc'].includes(ext)) setFileType('DOCX');
    else if (['pptx', 'ppt'].includes(ext)) setFileType('PPTX');
    else if (['xlsx', 'xls', 'csv'].includes(ext)) setFileType('XLSX');
    else if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) setFileType('Image');
    else setFileType('Document');

    // Auto populate title if currently empty
    if (!title.trim()) {
      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
      setTitle(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
    }

    // Read as Data URL for uploading
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setSelectedFileDataUrl(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleAddResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setUploadError('Please enter a title for the resource.');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    let finalFileUrl = externalUrl.trim() || undefined;
    let finalFileName = selectedFileName || `${title.trim()}.${fileType.toLowerCase()}`;
    let finalFileSize = selectedFileSize || 'Online Link';

    // If a file was selected, upload it to the server
    if (selectedFileDataUrl && selectedFile) {
      try {
        const uploadRes = await fetch('/api/upload-resource-file', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: selectedFile.name,
            fileData: selectedFileDataUrl,
            fileType,
          }),
        });

        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          if (uploadData.fileUrl) {
            finalFileUrl = uploadData.fileUrl;
            finalFileName = uploadData.fileName || selectedFile.name;
            finalFileSize = uploadData.fileSize || selectedFileSize;
          }
        } else {
          console.warn('Server file upload returned non-200 status, using fallback URL');
          // If server upload failed, fallback gracefully
          finalFileUrl = selectedFileDataUrl;
        }
      } catch (err) {
        console.warn('Network error while uploading file to server:', err);
        finalFileUrl = selectedFileDataUrl;
      }
    }

    const newRes: ResourceItem = {
      id: `res_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      title: title.trim(),
      category,
      department,
      fileType,
      description: description.trim() || 'Remedial study material prepared for Digboi College students.',
      author: currentMentor?.name || 'Faculty Member',
      uploadedByMentorId: currentMentor?.id || 'f_1',
      dateAdded: new Date().toISOString().split('T')[0],
      fileUrl: finalFileUrl,
      fileName: finalFileName,
      fileSize: finalFileSize,
    };

    // Update local state immediately
    setResources((prev) => [newRes, ...prev]);
    setIsUploading(false);
    setIsModalOpen(false);
    showToast(`Resource "${newRes.title}" successfully saved to your library!`);

    // Sync resource record to server
    try {
      await fetch('/api/resources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRes),
      });
    } catch (err) {
      console.warn('Failed to sync resource metadata to server:', err);
    }

    // Reset Form
    setTitle('');
    setDescription('');
    setExternalUrl('');
    setSelectedFile(null);
    setSelectedFileName('');
    setSelectedFileSize('');
    setSelectedFileDataUrl('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDeleteResource = async (id: string, resTitle: string) => {
    if (window.confirm(`Are you sure you want to delete "${resTitle}" from the library?`)) {
      setResources((prev) => prev.filter((r) => r.id !== id));
      showToast(`Resource removed.`);
      try {
        await fetch(`/api/resources/${id}`, { method: 'DELETE' });
      } catch (err) {
        console.warn('Failed to delete resource on server:', err);
      }
    }
  };

  const handleDownload = (res: ResourceItem) => {
    if (res.fileUrl) {
      if (res.fileUrl.startsWith('http://') || res.fileUrl.startsWith('https://')) {
        window.open(res.fileUrl, '_blank');
      } else if (res.fileUrl.startsWith('/api/resource-files/')) {
        // Direct server download
        const link = document.createElement('a');
        link.href = res.fileUrl;
        link.download = res.fileName || `${res.title}.${res.fileType.toLowerCase()}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else if (res.fileUrl.startsWith('data:')) {
        const link = document.createElement('a');
        link.href = res.fileUrl;
        link.download = res.fileName || `${res.title}.${res.fileType.toLowerCase()}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        window.open(res.fileUrl, '_blank');
      }
    } else {
      alert(`Resource: ${res.title}\nDescription: ${res.description}`);
    }
  };

  const handlePreviewOrOpen = (res: ResourceItem) => {
    if (res.fileUrl) {
      window.open(res.fileUrl, '_blank');
    } else {
      alert(`Resource: ${res.title}\nCategory: ${res.category}\nDepartment: ${res.department}\n\n${res.description}`);
    }
  };

  const handleCopyLink = (res: ResourceItem) => {
    const shareUrl = res.fileUrl && res.fileUrl.startsWith('/') 
      ? `${window.location.origin}${res.fileUrl}` 
      : res.fileUrl || window.location.href;
    
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopiedId(res.id);
      setTimeout(() => setCopiedId(null), 2500);
      showToast('Resource link copied to clipboard!');
    });
  };

  const getFileIcon = (fileType: string) => {
    const t = (fileType || '').toUpperCase();
    if (t.includes('PDF')) return <FileText className="w-5 h-5 text-red-500" />;
    if (t.includes('DOC') || t.includes('WORD')) return <FileText className="w-5 h-5 text-blue-600" />;
    if (t.includes('PPT')) return <Presentation className="w-5 h-5 text-orange-500" />;
    if (t.includes('XLS') || t.includes('EXCEL') || t.includes('CSV')) return <FileSpreadsheet className="w-5 h-5 text-emerald-600" />;
    if (t.includes('IMAGE') || t.includes('IMG') || t.includes('PNG') || t.includes('JPG')) return <ImageIcon className="w-5 h-5 text-purple-600" />;
    if (t.includes('LINK')) return <ExternalLink className="w-5 h-5 text-indigo-600" />;
    return <FileCode className="w-5 h-5 text-slate-600" />;
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center space-x-2 text-xs font-semibold animate-in fade-in slide-in-from-bottom-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Banner & Action Bar */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 bg-blue-50 text-[#1976d2] rounded-xl flex items-center justify-center border border-blue-100 shadow-xs">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-xl font-extrabold text-slate-900">Faculty Remedial Resource Library</h2>
                  <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-200 inline-flex items-center space-x-1">
                    <Lock className="w-3 h-3" />
                    <span>Cloud Storage Active</span>
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Institutional repository for Digboi College faculty to store, manage, and distribute remedial guides, question banks, and notes.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={() => {
                setUploadError(null);
                setIsModalOpen(true);
              }}
              className="px-4 py-2.5 bg-[#1976d2] hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all inline-flex items-center space-x-1.5 shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Upload New Resource</span>
            </button>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="pt-3 border-t border-slate-100 flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by title, topic, filename, or author..."
              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50/50"
            />
          </div>

          <div className="flex items-center space-x-2 w-full md:w-auto">
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="All">All Departments</option>
              {ALL_DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="All">All Categories</option>
              <option value="Remedial Guide">Remedial Guide</option>
              <option value="Practice Sheet">Practice Sheet</option>
              <option value="Course Material">Course Material</option>
              <option value="Formula Sheet">Formula Sheet</option>
              <option value="Question Bank">Question Bank</option>
              <option value="Visual Aid">Visual Aid</option>
              <option value="Syllabus & Blueprints">Syllabus & Blueprints</option>
            </select>

            {(searchTerm || selectedDept !== 'All' || selectedCategory !== 'All') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedDept('All');
                  setSelectedCategory('All');
                }}
                className="px-2.5 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                title="Reset Filters"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Grid of Resources */}
      {filtered.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-4">
          <div className="w-14 h-14 bg-blue-50 text-[#1976d2] rounded-2xl flex items-center justify-center mx-auto border border-blue-100 shadow-xs">
            <UploadCloud className="w-7 h-7" />
          </div>
          <div className="space-y-1.5">
            <h3 className="font-extrabold text-slate-900 text-base">
              {resources.length === 0 ? 'No Resources Saved Yet' : 'No Matching Resources Found'}
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              {resources.length === 0 
                ? 'Upload your first remedial study guide, PPT, PDF, or question bank to store it securely in the Digboi College cloud repository.'
                : 'Try adjusting your search query or department/category filters to find your files.'}
            </p>
          </div>
          <button
            onClick={() => {
              setUploadError(null);
              setIsModalOpen(true);
            }}
            className="px-5 py-2.5 bg-[#1976d2] hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all inline-flex items-center space-x-1.5 cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Upload Resource Now</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((res) => (
            <div
              key={res.id}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4 hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="bg-blue-50 text-[#1976d2] font-bold text-[10px] px-2.5 py-0.5 rounded-full border border-blue-100">
                    {res.department} • {res.category}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">{res.dateAdded}</span>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 shrink-0 group-hover:bg-blue-50 transition-colors">
                    {getFileIcon(res.fileType)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-slate-900 text-sm leading-snug line-clamp-2" title={res.title}>
                      {res.title}
                    </h3>
                    {res.fileName && (
                      <p className="text-[11px] text-slate-500 truncate mt-0.5 font-mono">
                        {res.fileName} {res.fileSize ? `(${res.fileSize})` : ''}
                      </p>
                    )}
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                  {res.description}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 space-y-2.5">
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <div className="flex items-center space-x-1 truncate max-w-[170px]" title={res.author}>
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="truncate">By <strong>{res.author}</strong></span>
                  </div>
                  <button
                    onClick={() => handleCopyLink(res)}
                    className="text-slate-400 hover:text-slate-700 inline-flex items-center space-x-1 text-[10px] font-semibold transition-colors cursor-pointer"
                    title="Copy resource link"
                  >
                    {copiedId === res.id ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span className="text-emerald-600 font-bold">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Share</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="flex items-center space-x-1.5 pt-1">
                  {res.fileUrl && (
                    <button
                      onClick={() => handlePreviewOrOpen(res)}
                      className="flex-1 inline-flex items-center justify-center space-x-1.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                      title="Open file in browser"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View</span>
                    </button>
                  )}

                  <button
                    onClick={() => handleDownload(res)}
                    className="flex-1 inline-flex items-center justify-center space-x-1.5 py-1.5 bg-[#1976d2] hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer shadow-xs"
                    title="Download resource file"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </button>

                  <button
                    onClick={() => handleDeleteResource(res.id, res.title)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                    title="Delete Resource"
                  >
                    <Trash2 className="w-4 h-4" />
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
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full p-6 space-y-5 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 bg-blue-50 text-[#1976d2] rounded-lg flex items-center justify-center">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">Upload Institutional Resource</h3>
                  <p className="text-[11px] text-slate-500">Save PDFs, Docs, PPTs, or question banks directly</p>
                </div>
              </div>
              <button
                onClick={() => {
                  if (!isUploading) setIsModalOpen(false);
                }}
                disabled={isUploading}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {uploadError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start space-x-2 text-xs text-red-700">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{uploadError}</span>
              </div>
            )}

            <form onSubmit={handleAddResource} className="space-y-4">
              {/* Drag and drop file zone */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Select or Drag File (PDF, DOCX, PPTX, XLSX, Images, etc.)
                </label>
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
                    isDragging 
                      ? 'border-blue-500 bg-blue-50' 
                      : selectedFileName 
                        ? 'border-emerald-400 bg-emerald-50/40' 
                        : 'border-slate-300 hover:border-[#1976d2] hover:bg-slate-50'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileChange}
                    className="hidden"
                    accept=".pdf,.docx,.doc,.pptx,.ppt,.xlsx,.xls,.csv,.jpg,.jpeg,.png,.webp,.txt"
                  />
                  {selectedFileName ? (
                    <div className="space-y-1">
                      <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                      <p className="text-xs font-bold text-slate-800">{selectedFileName}</p>
                      <p className="text-[11px] text-slate-500">
                        {selectedFileSize} • Click or drop to replace
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <UploadCloud className="w-8 h-8 text-slate-400 mx-auto" />
                      <p className="text-xs font-bold text-slate-700">
                        Click to browse or drag and drop your file here
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Supports PDF, Word, PowerPoint, Excel, Images up to 25 MB
                      </p>
                    </div>
                  )}
                </div>
              </div>

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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
                  >
                    <option value="Remedial Guide">Remedial Guide</option>
                    <option value="Practice Sheet">Practice Sheet</option>
                    <option value="Course Material">Course Material</option>
                    <option value="Formula Sheet">Formula Sheet</option>
                    <option value="Question Bank">Question Bank</option>
                    <option value="Visual Aid">Visual Aid</option>
                    <option value="Syllabus & Blueprints">Syllabus & Blueprints</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Department</label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value as Department)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
                  >
                    {ALL_DEPARTMENTS.map((dept) => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Format Type</label>
                  <select
                    value={fileType}
                    onChange={(e) => setFileType(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
                  >
                    <option value="PDF">PDF Document</option>
                    <option value="DOCX">Word Document (.docx)</option>
                    <option value="PPTX">PowerPoint (.pptx)</option>
                    <option value="XLSX">Excel Spreadsheet</option>
                    <option value="Image">Diagram / Image</option>
                    <option value="Link">Web Link / Cloud Drive</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">External Web Link (Optional)</label>
                  <input
                    type="url"
                    value={externalUrl}
                    onChange={(e) => setExternalUrl(e.target.value)}
                    placeholder="https://drive.google.com/..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description / Mentee Guidance Notes</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide context on how slow learners or mentees should utilize this material..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  disabled={isUploading}
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="px-5 py-2 bg-[#1976d2] hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all shadow-xs inline-flex items-center space-x-1.5 cursor-pointer"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving File...</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-4 h-4" />
                      <span>Save to Library</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
