import React, { useState, useEffect } from 'react';
import { Student, Mentor } from '../types';
import { saveStudentsBatchToCloud, saveMentorsBatchToCloud } from '../lib/firebase';
import { 
  WifiOff, 
  CloudUpload, 
  Download, 
  AlertTriangle, 
  X, 
  CheckCircle2, 
  RefreshCw, 
  Clock, 
  HardDrive 
} from 'lucide-react';

interface OfflineBackupSyncToastProps {
  students: Student[];
  mentors: Mentor[];
}

export const OfflineBackupSyncToast: React.FC<OfflineBackupSyncToastProps> = ({
  students,
  mentors,
}) => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [offlineSeconds, setOfflineSeconds] = useState<number>(0);
  const [showToast, setShowToast] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [isSimulatedOffline, setIsSimulatedOffline] = useState<boolean>(false);

  // Monitor online / offline status & duration
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // When coming back online after a period offline, keep toast open with sync prompt
      const duration = parseInt(localStorage.getItem('edupulse_offline_duration_sec') || '0', 10);
      if (duration > 30) {
        setShowToast(true);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowToast(true);
      if (!localStorage.getItem('edupulse_offline_start_timestamp')) {
        localStorage.setItem('edupulse_offline_start_timestamp', Date.now().toString());
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check: if app loaded offline or if saved offline start exists
    if (!navigator.onLine) {
      setShowToast(true);
      if (!localStorage.getItem('edupulse_offline_start_timestamp')) {
        localStorage.setItem('edupulse_offline_start_timestamp', Date.now().toString());
      }
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Timer to accumulate offline duration
  useEffect(() => {
    let interval: any;
    if (!isOnline || isSimulatedOffline) {
      interval = setInterval(() => {
        setOfflineSeconds((prev) => {
          const updated = prev + 1;
          localStorage.setItem('edupulse_offline_duration_sec', updated.toString());
          if (updated >= 15 && !showToast) {
            setShowToast(true);
          }
          return updated;
        });
      }, 1000);
    } else {
      setOfflineSeconds(0);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isOnline, isSimulatedOffline, showToast]);

  const handleManualBackupJSON = () => {
    try {
      const backupData = {
        exportDate: new Date().toISOString(),
        institution: 'Digboi College (Autonomous)',
        offlineDurationSeconds: offlineSeconds,
        studentsCount: students.length,
        mentorsCount: mentors.length,
        students,
        mentors,
      };

      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Digboi_College_Offline_Backup_${new Date().toISOString().split('T')[0]}_${Date.now().toString().slice(-4)}.json`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Failed to export offline JSON backup:', e);
    }
  };

  const handleManualCloudSync = async () => {
    setIsSyncing(true);
    setSyncStatus('idle');
    try {
      await Promise.all([
        saveStudentsBatchToCloud(students),
        saveMentorsBatchToCloud(mentors),
      ]);
      setSyncStatus('success');
      setTimeout(() => {
        setSyncStatus('idle');
        setShowToast(false);
      }, 3000);
    } catch (error) {
      console.error('Cloud sync error:', error);
      setSyncStatus('error');
    } finally {
      setIsSyncing(false);
    }
  };

  const toggleSimulatedOffline = () => {
    if (isSimulatedOffline) {
      setIsSimulatedOffline(false);
      setOfflineSeconds(0);
    } else {
      setIsSimulatedOffline(true);
      setShowToast(true);
      setOfflineSeconds(120); // Jump directly to 2 mins offline for testing
    }
  };

  const formatOfflineTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    if (mins > 0) {
      return `${mins}m ${secs}s`;
    }
    return `${secs}s`;
  };

  return (
    <>
      {/* Test / Simulation Trigger Button for Faculty (no-print) */}
      <div className="fixed bottom-4 left-4 z-40 no-print">
        <button
          onClick={toggleSimulatedOffline}
          className={`text-[11px] font-bold px-3 py-1.5 rounded-full border shadow-md flex items-center space-x-1.5 transition-all cursor-pointer ${
            isSimulatedOffline || !isOnline
              ? 'bg-amber-500 text-white border-amber-600 animate-pulse'
              : 'bg-slate-900/90 hover:bg-slate-900 text-slate-200 border-slate-700'
          }`}
          title="Simulate offline state to test manual backup and cloud sync notification toast"
        >
          <WifiOff className="w-3.5 h-3.5" />
          <span>{isSimulatedOffline ? 'Simulating Offline Mode' : 'Test Offline Sync Toast'}</span>
        </button>
      </div>

      {/* Floating Toast Notification */}
      {showToast && (
        <div className="fixed bottom-4 right-4 z-50 max-w-md w-full px-4 no-print animate-in slide-in-from-bottom duration-300">
          <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-2xl border border-slate-800 space-y-3">
            {/* Header / Banner */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                      {!isOnline || isSimulatedOffline ? 'Offline Mode Active' : 'Offline Period Detected'}
                    </span>
                    {(offlineSeconds > 0 || isSimulatedOffline) && (
                      <span className="bg-slate-800 text-slate-300 text-[10px] font-mono px-2 py-0.5 rounded-md flex items-center space-x-1 border border-slate-700">
                        <Clock className="w-3 h-3 text-amber-400" />
                        <span>{formatOfflineTime(offlineSeconds)}</span>
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm font-bold text-white mt-0.5">
                    Data Backup & Sync Recommended
                  </h4>
                </div>
              </div>

              <button
                onClick={() => setShowToast(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
                title="Dismiss Notification"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Description */}
            <p className="text-xs text-slate-300 leading-relaxed">
              You have been working offline or disconnected from cloud Firestore. To prevent loss of attendance marks, sessional scores, or mentorship logs, please trigger a manual backup or sync.
            </p>

            {/* Status Message */}
            {syncStatus === 'success' && (
              <div className="bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 p-2.5 rounded-xl text-xs flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Cloud database sync completed successfully! All records secured.</span>
              </div>
            )}

            {syncStatus === 'error' && (
              <div className="bg-red-950/80 border border-red-500/40 text-red-300 p-2.5 rounded-xl text-xs flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <span>Cloud sync failed. Check connection or download JSON Backup below.</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                onClick={handleManualCloudSync}
                disabled={isSyncing}
                className="flex-1 bg-[#1976d2] hover:bg-blue-600 text-white font-bold text-xs py-2 px-3 rounded-xl flex items-center justify-center space-x-1.5 transition-colors cursor-pointer disabled:opacity-50 shadow-xs"
              >
                {isSyncing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Syncing Cloud...</span>
                  </>
                ) : (
                  <>
                    <CloudUpload className="w-3.5 h-3.5" />
                    <span>Trigger Cloud Sync</span>
                  </>
                )}
              </button>

              <button
                onClick={handleManualBackupJSON}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs py-2 px-3 rounded-xl flex items-center justify-center space-x-1.5 transition-colors cursor-pointer shadow-xs"
                title="Download full JSON dataset copy to local storage"
              >
                <Download className="w-3.5 h-3.5 text-amber-400" />
                <span>Backup Data (JSON)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
