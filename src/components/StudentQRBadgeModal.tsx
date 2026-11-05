import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Student } from '../types';
import QRCode from 'qrcode';
import {
  X,
  Printer,
  Download,
  QrCode,
  ShieldCheck,
  Search,
  CheckCircle2,
  Sparkles,
  Zap,
} from 'lucide-react';

interface StudentQRBadgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanBadgeDirectly?: (payload: string) => void;
}

export const StudentQRBadgeModal: React.FC<StudentQRBadgeModalProps> = ({
  isOpen,
  onClose,
  onScanBadgeDirectly,
}) => {
  const { students } = useApp();
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [qrCodeUrls, setQrCodeUrls] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Generate QR code data URLs for all students
  useEffect(() => {
    if (!isOpen) return;

    students.forEach((student) => {
      const payload = JSON.stringify({
        school: 'Farqaleet GGSS',
        studentId: student.id,
        rollNumber: student.rollNumber,
        name: student.name,
      });

      QRCode.toDataURL(payload, {
        width: 240,
        margin: 1,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      })
        .then((url) => {
          setQrCodeUrls((prev) => ({ ...prev, [student.id]: url }));
        })
        .catch((err) => {
          console.error('Failed generating QR code for student:', student.id, err);
        });
    });

    if (!selectedStudent && students.length > 0) {
      setSelectedStudent(students[0]);
    }
  }, [isOpen, students]);

  if (!isOpen) return null;

  const filteredStudents = students.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.rollNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.parentName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeStudent = selectedStudent || students[0];
  const activeQrUrl = activeStudent ? qrCodeUrls[activeStudent.id] : '';

  const handlePrint = () => {
    window.print();
  };

  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadActiveCard = async () => {
    if (!activeStudent) return;
    setIsDownloading(true);

    try {
      const payload = JSON.stringify({
        school: 'Farqaleet GGSS',
        studentId: activeStudent.id,
        rollNumber: activeStudent.rollNumber,
        name: activeStudent.name,
      });

      const highResQrUrl = await QRCode.toDataURL(payload, {
        width: 340,
        margin: 1,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      });

      const canvas = document.createElement('canvas');
      const W = 720;
      const H = 1140;
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const drawRoundedRect = (
        x: number,
        y: number,
        w: number,
        h: number,
        r: number
      ) => {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
      };

      // Outer white background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, W, H);

      // Clip to rounded card
      ctx.save();
      drawRoundedRect(8, 8, W - 16, H - 16, 32);
      ctx.clip();

      // Card white fill
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(8, 8, W - 16, H - 16);

      // Header gradient
      const headerH = 172;
      const grad = ctx.createLinearGradient(0, 0, W, headerH);
      grad.addColorStop(0, '#065f46');
      grad.addColorStop(1, '#134e4a');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, headerH);

      // Header text
      ctx.textAlign = 'center';
      ctx.fillStyle = '#6ee7b7';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText('GOVT GIRLS SECONDARY SCHOOL', W / 2, 54);

      ctx.fillStyle = '#ffffff';
      ctx.font = '800 32px sans-serif';
      ctx.fillText('FARQALEET GGSS', W / 2, 98);

      ctx.fillStyle = 'rgba(167, 243, 208, 0.9)';
      ctx.font = '500 17px sans-serif';
      ctx.fillText('Gulberg III, Lahore · Official Student Identity Card', W / 2, 134);

      // Student Avatar (with fallback to initials if offline/CORS)
      const avatarY = 276;
      const avatarR = 76;

      // Outer emerald ring
      ctx.beginPath();
      ctx.arc(W / 2, avatarY, avatarR + 8, 0, Math.PI * 2);
      ctx.fillStyle = '#d1fae5';
      ctx.fill();

      const loadImg = (src: string, useCors: boolean) =>
        new Promise<HTMLImageElement>((resolve, reject) => {
          const img = new Image();
          if (useCors) img.crossOrigin = 'anonymous';
          img.onload = () => resolve(img);
          img.onerror = reject;
          img.src = src;
        });

      try {
        const avatarImg = await loadImg(activeStudent.avatarUrl, true);
        ctx.save();
        ctx.beginPath();
        ctx.arc(W / 2, avatarY, avatarR, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(
          avatarImg,
          W / 2 - avatarR,
          avatarY - avatarR,
          avatarR * 2,
          avatarR * 2
        );
        ctx.restore();
      } catch {
        // Fallback initials circle
        ctx.beginPath();
        ctx.arc(W / 2, avatarY, avatarR, 0, Math.PI * 2);
        ctx.fillStyle = '#059669';
        ctx.fill();
        const initials = activeStudent.name
          .split(' ')
          .map((n) => n[0])
          .join('')
          .slice(0, 2)
          .toUpperCase();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 44px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(initials, W / 2, avatarY);
        ctx.textBaseline = 'alphabetic';
      }

      // Student Name
      ctx.textAlign = 'center';
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 34px sans-serif';
      ctx.fillText(activeStudent.name, W / 2, 404);

      // Roll Number Pill
      ctx.font = 'bold 22px monospace';
      const rollText = activeStudent.rollNumber;
      const rollWidth = Math.max(150, ctx.measureText(rollText).width + 40);
      drawRoundedRect(W / 2 - rollWidth / 2, 422, rollWidth, 42, 10);
      ctx.fillStyle = '#d1fae5';
      ctx.fill();
      ctx.fillStyle = '#064e3b';
      ctx.fillText(rollText, W / 2, 450);

      // Divider
      ctx.strokeStyle = '#f1f5f9';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(48, 492);
      ctx.lineTo(W - 48, 492);
      ctx.stroke();

      // 2x2 Info Grid
      const leftX = 56;
      const rightX = W / 2 + 24;
      ctx.textAlign = 'left';

      const drawField = (x: number, y: number, label: string, value: string, valueColor = '#1e293b') => {
        ctx.fillStyle = '#94a3b8';
        ctx.font = 'bold 16px sans-serif';
        ctx.fillText(label.toUpperCase(), x, y);
        ctx.fillStyle = valueColor;
        ctx.font = '600 22px sans-serif';
        ctx.fillText(value, x, y + 30);
      };

      drawField(leftX, 530, 'Class', `${activeStudent.grade} (${activeStudent.section})`);
      drawField(rightX, 530, 'Father / Guardian', activeStudent.parentName);
      drawField(leftX, 606, 'Emergency Phone', activeStudent.parentPhone, '#334155');
      drawField(rightX, 606, 'Card Status', '● Active', '#047857');

      // QR Code Box
      const qrBoxSize = 356;
      const qrBoxX = (W - qrBoxSize) / 2;
      const qrBoxY = 672;
      drawRoundedRect(qrBoxX, qrBoxY, qrBoxSize, qrBoxSize + 34, 24);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 3;
      ctx.stroke();

      const qrImg = await loadImg(highResQrUrl, false);
      ctx.drawImage(qrImg, qrBoxX + 28, qrBoxY + 20, 300, 300);

      ctx.textAlign = 'center';
      ctx.fillStyle = '#475569';
      ctx.font = 'bold 17px monospace';
      ctx.fillText('SCAN TO MARK ATTENDANCE', W / 2, qrBoxY + qrBoxSize + 14);

      // Footer
      const footerY = H - 64;
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, footerY, W, 64);
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, footerY);
      ctx.lineTo(W, footerY);
      ctx.stroke();

      ctx.fillStyle = '#64748b';
      ctx.font = '600 18px monospace';
      ctx.textAlign = 'left';
      ctx.fillText('Valid: 2026-2027', 40, footerY + 38);
      ctx.textAlign = 'right';
      ctx.fillText('GGSS SECURE ID', W - 40, footerY + 38);

      ctx.restore();

      // Outer Card Border
      drawRoundedRect(8, 8, W - 16, H - 16, 32);
      ctx.strokeStyle = 'rgba(5, 150, 105, 0.7)';
      ctx.lineWidth = 5;
      ctx.stroke();

      const cardDataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `Farqaleet-GGSS-ID-Card-${activeStudent.rollNumber}-${activeStudent.name.replace(/\s+/g, '_')}.png`;
      link.href = cardDataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to render full ID card:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDirectScan = (student: Student) => {
    const payload = JSON.stringify({
      school: 'Farqaleet GGSS',
      studentId: student.id,
      rollNumber: student.rollNumber,
      name: student.name,
    });
    if (onScanBadgeDirectly) {
      onScanBadgeDirectly(payload);
    }
    setCopiedId(student.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-900 via-teal-900 to-indigo-950 text-white flex items-center justify-between border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20 text-emerald-300">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 rounded-full">
                  Official Badges
                </span>
                <span className="text-xs text-emerald-200">Farqaleet GGSS</span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold tracking-tight font-display text-white">
                Student QR Code ID Badges
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-colors"
              title="Print ID Cards"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Badges</span>
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 bg-slate-50/60">
          {/* Left Column: Student Selection List */}
          <div className="lg:col-span-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Select Student ({filteredStudents.length})
              </span>
              <span className="text-[11px] text-emerald-700 font-medium">Class 8-A</span>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search name or roll number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 bg-white shadow-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            {/* List */}
            <div className="flex-1 max-h-[380px] lg:max-h-[460px] overflow-y-auto space-y-2 pr-1">
              {filteredStudents.map((st) => {
                const isSelected = activeStudent.id === st.id;
                const isJustScanned = copiedId === st.id;
                return (
                  <div
                    key={st.id}
                    onClick={() => setSelectedStudent(st)}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-emerald-50/90 border-emerald-500 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-emerald-300'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={st.avatarUrl}
                        alt={st.name}
                        className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-slate-900 truncate">
                          {st.name}
                        </div>
                        <div className="text-[11px] font-mono text-slate-500">
                          {st.rollNumber}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDirectScan(st);
                        }}
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold transition-colors ${
                          isJustScanned
                            ? 'bg-emerald-600 text-white'
                            : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                        }`}
                        title="Simulate scanning this badge now"
                      >
                        {isJustScanned ? (
                          <>
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Scanned!</span>
                          </>
                        ) : (
                          <>
                            <Zap className="w-3 h-3" />
                            <span>Sim Scan</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Physical Student ID Card Preview */}
          <div className="lg:col-span-7 flex flex-col items-center justify-center">
            {activeStudent && (
              <div className="w-full max-w-sm flex flex-col items-center">
                <div className="text-xs font-medium text-slate-500 mb-2 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Physical PVC / Paper Card Preview</span>
                </div>

                {/* Printable ID Card */}
                <div
                  id="student-id-card-printable"
                  className="w-full bg-white rounded-2xl border-2 border-emerald-600/60 shadow-lg overflow-hidden flex flex-col relative"
                >
                  {/* Card Header */}
                  <div className="bg-gradient-to-r from-emerald-800 to-teal-900 text-white p-3 text-center relative border-b border-emerald-700">
                    <div className="text-[10px] uppercase font-bold tracking-widest text-emerald-300">
                      Govt Girls Secondary School
                    </div>
                    <div className="text-sm font-extrabold tracking-tight font-display">
                      FARQALEET GGSS
                    </div>
                    <div className="text-[9px] text-emerald-200/90">
                      Gulberg III, Lahore · Official Student Identity Card
                    </div>
                    <div className="absolute right-3 top-3 w-5 h-5 rounded-full bg-white/10 flex items-center justify-center">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-4 flex flex-col items-center text-center">
                    {/* Student Photo */}
                    <div className="relative mb-2">
                      <img
                        src={activeStudent.avatarUrl}
                        alt={activeStudent.name}
                        className="w-20 h-20 rounded-full object-cover border-4 border-emerald-100 shadow-sm"
                      />
                      <span className="absolute bottom-0 right-0 px-1.5 py-0.5 rounded-full bg-emerald-600 text-white font-mono text-[9px] font-bold shadow-xs">
                        {activeStudent.section}
                      </span>
                    </div>

                    {/* Student Identity */}
                    <h3 className="text-base font-bold text-slate-900 font-display">
                      {activeStudent.name}
                    </h3>
                    <div className="inline-block px-2.5 py-0.5 mt-0.5 text-xs font-mono font-bold text-emerald-900 bg-emerald-100 rounded-md">
                      {activeStudent.rollNumber}
                    </div>

                    <div className="grid grid-cols-2 gap-2 w-full mt-3 pt-3 border-t border-slate-100 text-left text-[11px]">
                      <div>
                        <span className="text-slate-400 block text-[9px] uppercase">Class</span>
                        <span className="font-semibold text-slate-800">
                          {activeStudent.grade} ({activeStudent.section})
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[9px] uppercase">Father / Guardian</span>
                        <span className="font-semibold text-slate-800 truncate block">
                          {activeStudent.parentName}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[9px] uppercase">Emergency Phone</span>
                        <span className="font-mono text-slate-700">{activeStudent.parentPhone}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[9px] uppercase">Card Status</span>
                        <span className="text-emerald-700 font-semibold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
                          Active
                        </span>
                      </div>
                    </div>

                    {/* QR Code Container */}
                    <div className="mt-4 p-2 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col items-center">
                      {activeQrUrl ? (
                        <img
                          src={activeQrUrl}
                          alt="Student QR Code"
                          className="w-36 h-36 object-contain"
                        />
                      ) : (
                        <div className="w-36 h-36 bg-slate-100 rounded flex items-center justify-center text-xs text-slate-400">
                          Generating QR...
                        </div>
                      )}
                      <span className="text-[10px] font-mono tracking-wider font-bold text-slate-600 mt-1 uppercase">
                        SCAN TO MARK ATTENDANCE
                      </span>
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="bg-slate-50 px-3 py-2 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                    <span>Valid: 2026-2027</span>
                    <span>GGSS SECURE ID</span>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="w-full flex items-center gap-2 mt-4">
                  <button
                    onClick={() => handleDirectScan(activeStudent)}
                    className="flex-1 py-2 px-3 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl transition-colors shadow-xs flex items-center justify-center gap-1.5"
                  >
                    <Zap className="w-4 h-4 text-emerald-300" />
                    <span>Scan This Student Now</span>
                  </button>

                  <button
                    onClick={handleDownloadActiveCard}
                    disabled={isDownloading}
                    className="px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 rounded-xl border border-slate-300 transition-colors shadow-xs flex items-center gap-1.5 disabled:opacity-50"
                    title="Download Full Printable Student ID Card (PNG)"
                  >
                    <Download className="w-4 h-4" />
                    <span>{isDownloading ? 'Saving...' : 'Download Card'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3 sm:p-4 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>
              All QR codes are standard ISO/IEC 18004 formatted and can be scanned by any smartphone camera or USB barcode scanner.
            </span>
          </div>

          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl border border-slate-300 transition-colors"
          >
            Close Badges
          </button>
        </div>
      </div>
    </div>
  );
};
