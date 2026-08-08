import React, { useState } from 'react';
import { Student, Mentor } from '../types';
import { CollegeLogo } from './CollegeLogo';
import { 
  FileText, 
  Send, 
  Download, 
  Printer, 
  User, 
  Calendar, 
  Building, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  MessageSquare,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface OfficialNoticeGeneratorProps {
  students: Student[];
  currentMentor?: Mentor;
}

export const OfficialNoticeGenerator: React.FC<OfficialNoticeGeneratorProps> = ({
  students,
  currentMentor,
}) => {
  const [selectedStudentId, setSelectedStudentId] = useState<string>(students[0]?.id || '');
  const selectedStudent = students.find((s) => s.id === selectedStudentId) || students[0];

  const [noticeType, setNoticeType] = useState<
    'remedial_notice' | 'sessional_warning' | 'parent_meeting' | 'academic_certificate' | 'others'
  >('remedial_notice');

  const [mentorNameInput, setMentorNameInput] = useState<string>(
    currentMentor?.name || selectedStudent?.mentorName || 'Faculty Mentor'
  );
  const [principalNameInput, setPrincipalNameInput] = useState<string>('Dr. Pabitra Bharali');
  const [iqacCoordinatorInput, setIqacCoordinatorInput] = useState<string>('Dr. Pabon Gogoi');

  const [meetingDate, setMeetingDate] = useState<string>(
    new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0]
  );
  const [meetingTime, setMeetingTime] = useState<string>('11:00 AM');
  const [venue, setVenue] = useState<string>('Department Seminar Hall, Digboi College');
  const [customRemark, setCustomRemark] = useState<string>(
    'Student is strictly advised to attend morning remedial sessions and meet the undersigned mentor with completed laboratory practical record books.'
  );

  const [customLetterTitle, setCustomLetterTitle] = useState<string>('');
  const [customLetterBody, setCustomLetterBody] = useState<string>('');
  const [isLetterModified, setIsLetterModified] = useState<boolean>(false);

  const [isCopied, setIsCopied] = useState<boolean>(false);

  // Update mentor name when selected student or current mentor changes
  React.useEffect(() => {
    if (currentMentor?.name) {
      setMentorNameInput(currentMentor.name);
    } else if (selectedStudent?.mentorName) {
      setMentorNameInput(selectedStudent.mentorName);
    }
  }, [currentMentor, selectedStudent]);

  // Generate Official Reference Number
  const refNo = `DC/NOT/${new Date().getFullYear()}/${selectedStudent?.rollNo || '001'}`;
  const currentDateFormatted = new Date().toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // Compose Official Notice Text
  const getNoticeDetails = () => {
    switch (noticeType) {
      case 'remedial_notice':
        return {
          title: 'MANDATORY REMEDIAL CLASS ENROLLMENT NOTICE',
          subtitle: 'Issued under Digboi College Institutional Mentorship Scheme for Academic Support',
          badgeBg: 'bg-amber-100 text-amber-900 border-amber-300',
          body: `This is to officially inform that student ${selectedStudent?.name} (Roll No: ${selectedStudent?.rollNo}, Dept of ${selectedStudent?.department}, Sem ${selectedStudent?.semester || 3}) has been categorized under the Slow Learner Diagnostic Group based on attendance (${selectedStudent?.overallAttendance}%) and sessional performance.
          
As per Digboi College Academic Regulations, the student is hereby instructed to mandatorily attend the Saturday Special Remedial & Diagnostic Tutorials scheduled at ${venue} at ${meetingTime}. Failure to maintain attendance in remedial classes will result in withholding of end-semester admit cards.`
        };
      case 'sessional_warning':
        return {
          title: 'ACADEMIC WARNING NOTICE: SESSIONAL EVALUATION SHORTAGE',
          subtitle: 'Formal Alert Issued by Departmental Mentorship Committee',
          badgeBg: 'bg-red-100 text-red-900 border-red-300',
          body: `Notice is hereby served to ${selectedStudent?.name} (Roll No: ${selectedStudent?.rollNo}, Program: ${selectedStudent?.program}) regarding deficit marks in recent Sessional Examinations. 

The student is strictly directed to present themselves before the Faculty Mentor (${mentorNameInput || 'Faculty Mentor'}) on ${meetingDate} at ${meetingTime} along with their Guardian for an academic review and study plan formulation.`
        };
      case 'parent_meeting':
        return {
          title: 'INVITATION FOR PARENT-TEACHER CONSULTATION MEETING',
          subtitle: 'Digboi College Faculty Mentorship Ecosystem',
          badgeBg: 'bg-blue-100 text-blue-900 border-blue-300',
          body: `Respected Parent/Guardian (${selectedStudent?.parentName || 'Guardian'}),

You are cordially requested to attend an urgent Parent-Teacher Mentorship Meeting regarding the academic progress, attendance record (${selectedStudent?.overallAttendance}%), and overall conduct of your ward ${selectedStudent?.name}.

Date: ${meetingDate}
Time: ${meetingTime}
Venue: ${venue}

Your presence is vital for formulating corrective action plans for the upcoming Semester examinations.`
        };
      case 'academic_certificate':
        return {
          title: 'CERTIFICATE OF MENTORSHIP & ACADEMIC PROGRESS',
          subtitle: 'Official Institutional Record of Digboi College (Autonomous)',
          badgeBg: 'bg-emerald-100 text-emerald-900 border-emerald-300',
          body: `This is to certify that ${selectedStudent?.name} (Roll No: ${selectedStudent?.rollNo}, Department of ${selectedStudent?.department}) has successfully participated in the Digboi College Remedial Mentorship & Tutorial Guidance Program.

The student has demonstrated marked improvement in sessional evaluations and academic discipline under the supervision of Faculty Mentor ${mentorNameInput || 'Digboi College Faculty'}.`
        };
      case 'others':
        return {
          title: 'OFFICIAL ACADEMIC NOTICE & COMMUNICATION',
          subtitle: 'Issued under Digboi College Institutional Mentorship Ecosystem',
          badgeBg: 'bg-purple-100 text-purple-900 border-purple-300',
          body: `This is to officially inform that student ${selectedStudent?.name || '[Student Name]'} (Roll No: ${selectedStudent?.rollNo || '[Roll No]'}, Department of ${selectedStudent?.department || '[Department]'}) is hereby notified regarding special departmental instructions and academic guidance directives.

Please comply with the instructions specified above or contact the undersigned mentor for further academic consultations.`
        };
    }
  };

  const details = getNoticeDetails();

  // Keep custom title & body synced with defaults unless manually modified
  React.useEffect(() => {
    if (!isLetterModified) {
      setCustomLetterTitle(details.title);
      setCustomLetterBody(details.body);
    }
  }, [noticeType, selectedStudentId, meetingDate, meetingTime, venue, isLetterModified]);

  const activeTitle = customLetterTitle || details.title;
  const activeBody = customLetterBody || details.body;

  // WhatsApp formatted string
  const whatsappMsg = `*OFFICIAL NOTICE — DIGBOI COLLEGE (AUTONOMOUS)*\nRef: ${refNo}\nDate: ${currentDateFormatted}\n\n*${activeTitle}*\nTo: Parent/Guardian of *${selectedStudent?.name}* (Roll: ${selectedStudent?.rollNo})\nDept: ${selectedStudent?.department}\n\n${activeBody}\n\n*Note:* ${customRemark}\n\nBy Order,\nFaculty Mentor: *${mentorNameInput || 'Digboi College Faculty'}*\nDigboi College (Autonomous), Assam`;

  const handleDownloadPDF = async () => {
    const element = document.getElementById('official-notice-print-area');
    if (!element) return;
    try {
      const canvas = await html2canvas(element, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Digboi_College_Notice_${selectedStudent?.rollNo || 'Official'}.pdf`);
    } catch (e) {
      window.print();
    }
  };

  const handleWhatsAppSend = () => {
    const phone = selectedStudent?.parentPhone || selectedStudent?.guardianPhone || '';
    const cleanPhone = phone.replace(/\D/g, '');
    const targetPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const url = targetPhone
      ? `https://wa.me/${targetPhone}?text=${encodeURIComponent(whatsappMsg)}`
      : `https://wa.me/?text=${encodeURIComponent(whatsappMsg)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-[#1976d2] to-blue-900 text-white p-6 rounded-2xl shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 bg-amber-400 text-blue-950 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider mb-2">
              <ShieldCheck className="w-4 h-4" />
              <span>Official Institutional Notice Hub</span>
            </div>
            <h2 className="text-2xl font-black tracking-tight">Digboi College Academic Notice & Letterhead Generator</h2>
            <p className="text-xs text-blue-100 font-medium max-w-2xl mt-1">
              Generate, print, and dispatch official notices for slow learners, sessional warnings, parent meetings, and mentorship completion certificates on Digboi College (Autonomous) letterhead.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleDownloadPDF}
              className="inline-flex items-center space-x-1.5 bg-amber-400 hover:bg-amber-300 text-blue-950 text-xs font-extrabold px-4 py-2.5 rounded-xl transition-all shadow-xs"
            >
              <Download className="w-4 h-4" />
              <span>Download Official Notice PDF</span>
            </button>
            <button
              onClick={handleWhatsAppSend}
              className="inline-flex items-center space-x-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-xs"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Send via WhatsApp</span>
            </button>
          </div>
        </div>
      </div>

      {/* Control Panel Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Options Form */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center space-x-2">
            <FileText className="w-4 h-4 text-[#1976d2]" />
            <span>Notice Parameters</span>
          </h3>

          <div>
            <label className="text-xs font-bold text-slate-600 block mb-1">Select Mentee</label>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-[#1976d2]"
            >
              {students.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.name} ({st.rollNo}) — {st.department}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-600 block mb-1">Notice Template Category</label>
            <select
              value={noticeType}
              onChange={(e: any) => setNoticeType(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-[#1976d2]"
            >
              <option value="remedial_notice">Mandatory Remedial Class Notice</option>
              <option value="sessional_warning">Sessional Deficit Warning Alert</option>
              <option value="parent_meeting">Parent-Teacher Meeting Invitation</option>
              <option value="academic_certificate">Mentorship Completion Certificate</option>
              <option value="others">Others / Custom Official Letter & Notice</option>
            </select>
          </div>

          {/* Signatories Customization */}
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <span className="text-[11px] font-black text-slate-700 uppercase tracking-wider block">Official Signatories</span>
            
            <div>
              <label className="text-[10px] font-bold text-slate-600 block mb-0.5">Faculty Mentor Name</label>
              <input
                type="text"
                value={mentorNameInput}
                onChange={(e) => setMentorNameInput(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800"
                placeholder="e.g. Dr. Mentor Name"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold text-slate-600 block mb-0.5">IQAC Coordinator</label>
                <input
                  type="text"
                  value={iqacCoordinatorInput}
                  onChange={(e) => setIqacCoordinatorInput(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-600 block mb-0.5">Principal Name</label>
                <input
                  type="text"
                  value={principalNameInput}
                  onChange={(e) => setPrincipalNameInput(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">Meeting / Action Date</label>
              <input
                type="date"
                value={meetingDate}
                onChange={(e) => setMeetingDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">Time Slot</label>
              <input
                type="text"
                value={meetingTime}
                onChange={(e) => setMeetingTime(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-600 block mb-1">Venue Location</label>
            <input
              type="text"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold text-slate-800"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-600 block">Edit Notice Heading Title</label>
              {isLetterModified && (
                <button
                  type="button"
                  onClick={() => {
                    setIsLetterModified(false);
                    setCustomLetterTitle(details.title);
                    setCustomLetterBody(details.body);
                  }}
                  className="text-[10px] text-blue-600 font-bold hover:underline"
                >
                  Reset Template Default
                </button>
              )}
            </div>
            <input
              type="text"
              value={activeTitle}
              onChange={(e) => {
                setIsLetterModified(true);
                setCustomLetterTitle(e.target.value);
              }}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-[#1976d2]"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-600 block mb-1">Edit Notice & Letter Body Content</label>
            <textarea
              rows={6}
              value={activeBody}
              onChange={(e) => {
                setIsLetterModified(true);
                setCustomLetterBody(e.target.value);
              }}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 leading-relaxed focus:ring-2 focus:ring-[#1976d2]"
              placeholder="Type or customize the official letter content here..."
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-600 block mb-1">Custom Mentor Remark / Note</label>
            <textarea
              rows={2}
              value={customRemark}
              onChange={(e) => setCustomRemark(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-[#1976d2]"
            />
          </div>
        </div>

        {/* Right Live Document Preview */}
        <div className="md:col-span-2 bg-slate-100 p-4 rounded-2xl border border-slate-200">
          <div className="bg-white p-8 rounded-xl shadow-lg border border-slate-300 space-y-6 max-w-3xl mx-auto" id="official-notice-print-area">
            {/* Header */}
            <div className="border-b-2 border-[#1976d2] pb-4 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <CollegeLogo className="w-16 h-16 object-contain" />
                <div>
                  <h1 className="text-xl font-black text-[#1976d2] uppercase">DIGBOI COLLEGE (AUTONOMOUS)</h1>
                  <p className="text-xs font-bold text-slate-700">P.O. Digboi, Dist: Tinsukia, Assam - 786171</p>
                  <p className="text-[10px] text-slate-500 font-semibold">NAAC Grade "A+ (CGPA 3.49)" • Internal Quality Assurance Cell (IQAC)</p>
                </div>
              </div>

              <div className="text-right">
                <div className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-black uppercase border ${details.badgeBg}`}>
                  Official Notice
                </div>
                <p className="text-[10px] font-mono font-bold text-slate-500 mt-1">Ref: {refNo}</p>
                <p className="text-[10px] font-semibold text-slate-600">Date: {currentDateFormatted}</p>
              </div>
            </div>

            {/* Title Banner */}
            <div className="text-center py-2 bg-slate-50 border border-slate-200 rounded-lg">
              <h2 className="text-sm font-black text-[#1976d2] uppercase tracking-wider">{activeTitle}</h2>
              <p className="text-[11px] text-slate-500 font-semibold">{details.subtitle}</p>
            </div>

            {/* Student Info Box */}
            <div className="grid grid-cols-3 gap-3 bg-blue-50/50 p-3.5 rounded-lg border border-blue-100 text-xs">
              <div><span className="text-[10px] text-slate-500 font-bold block uppercase">Student Name</span><strong className="text-slate-900">{selectedStudent?.name}</strong></div>
              <div><span className="text-[10px] text-slate-500 font-bold block uppercase">Roll No</span><strong className="text-slate-900 font-mono">{selectedStudent?.rollNo}</strong></div>
              <div><span className="text-[10px] text-slate-500 font-bold block uppercase">Department</span><strong className="text-slate-900">{selectedStudent?.department}</strong></div>
            </div>

            {/* Main Body */}
            <div className="text-xs text-slate-800 leading-relaxed space-y-3 whitespace-pre-line font-medium">
              <p>{activeBody}</p>

              <div className="bg-amber-50 border-l-4 border-amber-500 p-3 rounded text-amber-900 text-xs font-bold">
                 Mentor Remarks: {customRemark}
              </div>
            </div>

            {/* Signatures */}
            <div className="pt-12 flex justify-between items-end text-xs font-bold text-slate-800 border-t border-slate-100">
              <div className="text-center">
                <p className="text-slate-900 font-extrabold">{mentorNameInput || 'Faculty Mentor'}</p>
                <p className="text-[10px] text-slate-500">Faculty Mentor ({selectedStudent?.department || 'Department'})</p>
                <p className="text-[10px] text-slate-400 mt-2">_______________________<br/>Faculty Mentor Signature</p>
              </div>

              <div className="text-center">
                <p className="text-slate-900 font-extrabold">{iqacCoordinatorInput || 'Dr. Pabon Gogoi'}</p>
                <p className="text-[10px] text-slate-500">IQAC Coordinator, Digboi College</p>
                <p className="text-[10px] text-slate-400 mt-2">_______________________<br/>Official Seal / IQAC</p>
              </div>

              <div className="text-center">
                <p className="text-slate-900 font-extrabold">{principalNameInput || 'Dr. Pabitra Bharali'}</p>
                <p className="text-[10px] text-slate-500">Principal, Digboi College</p>
                <p className="text-[10px] text-slate-400 mt-2">_______________________<br/>Principal Signature</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
