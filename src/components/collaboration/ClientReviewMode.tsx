import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  AlertCircle,
  Star,
  MessageSquare,
  Shield,
  Eye,
  Sparkles,
  Download,
  Share2,
  Sliders,
  Send,
  Camera,
} from 'lucide-react';
import { Project } from '../../types/editor';
import { User } from 'firebase/auth';
import { updateProjectApprovalStatus } from '../../services/collaborationService';
import confetti from 'canvas-confetti';

interface ClientReviewModeProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  currentUser: User | null;
  showToast: (type: 'success' | 'error' | 'info', title: string, msg?: string) => void;
}

export const ClientReviewMode: React.FC<ClientReviewModeProps> = ({
  isOpen,
  onClose,
  project,
  currentUser,
  showToast,
}) => {
  const [rating, setRating] = useState<number>(5);
  const [feedbackText, setFeedbackText] = useState('');
  const [clientSignature, setClientSignature] = useState(currentUser?.displayName || '');
  const [showWatermark, setShowWatermark] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeActionModal, setActiveActionModal] = useState<'approve' | 'request_changes' | null>(null);

  if (!isOpen) return null;

  const handleApprove = async () => {
    if (!currentUser) {
      showToast('error', 'Sign In Required', 'Please sign in to officially sign off on this project.');
      return;
    }
    setIsSubmitting(true);
    try {
      await updateProjectApprovalStatus(
        project.id,
        currentUser,
        'approved',
        feedbackText.trim() || 'Approved by Art Director/Client for final production.',
        clientSignature.trim() || currentUser.displayName || 'Art Director',
        project.history.length
      );
      try {
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.7 } });
      } catch (e) {}
      showToast('success', 'Project Approved & Signed Off', `Approval recorded under ${clientSignature || 'Client'}`);
      setActiveActionModal(null);
      onClose();
    } catch (err: any) {
      showToast('error', 'Approval Error', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestChanges = async () => {
    if (!currentUser) {
      showToast('error', 'Sign In Required', 'Please sign in to submit change requests.');
      return;
    }
    if (!feedbackText.trim()) {
      showToast('error', 'Feedback Required', 'Please provide details on the revisions requested.');
      return;
    }
    setIsSubmitting(true);
    try {
      await updateProjectApprovalStatus(
        project.id,
        currentUser,
        'changes_requested',
        feedbackText.trim(),
        clientSignature.trim() || currentUser.displayName || 'Client',
        project.history.length
      );
      showToast('info', 'Revisions Requested', 'Change notes sent to the creator.');
      setActiveActionModal(null);
      onClose();
    } catch (err: any) {
      showToast('error', 'Request Error', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col select-none text-slate-100 animate-in fade-in duration-200">
      {/* Top Client Presentation Bar */}
      <div className="h-16 px-8 border-b border-slate-800 flex items-center justify-between bg-slate-950/90 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-600 text-slate-950 font-bold shadow-lg shadow-amber-500/20">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-tight">{project.name}</h2>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[11px] font-bold font-mono">
                CLIENT REVIEW ROOM
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Color Grading & Retouch Master • {project.image.width} × {project.image.height}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Watermark toggle */}
          <button
            onClick={() => setShowWatermark(!showWatermark)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              showWatermark
                ? 'bg-slate-900 border-slate-700 text-amber-300'
                : 'bg-slate-900/40 border-slate-800 text-slate-500'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Watermark {showWatermark ? 'On' : 'Off'}</span>
          </button>

          <button
            onClick={onClose}
            className="p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Center Presentation Canvas Viewport */}
      <div className="flex-1 flex items-center justify-center p-8 relative overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
        <div className="relative max-w-5xl max-h-[70vh] rounded-3xl overflow-hidden shadow-2xl border border-slate-800">
          <img
            src={project.image.originalUrl}
            alt="Review Master"
            className="max-h-[70vh] w-auto block object-contain"
          />

          {/* Client Review Protected Overlay Watermark */}
          {showWatermark && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center rotate-[-25deg] select-none opacity-20">
              <span className="text-4xl md:text-6xl font-black tracking-widest text-white uppercase border-4 border-white px-8 py-4 rounded-3xl">
                CLIENT REVIEW COPY • NOT FOR RELEASE
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Client Action Bar */}
      <div className="h-20 px-8 border-t border-slate-800 bg-slate-950/95 flex items-center justify-between backdrop-blur-md">
        {/* Rating */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400 font-medium">Evaluation:</span>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                className="p-1 hover:scale-125 transition-transform"
              >
                <Star
                  className={`w-5 h-5 ${
                    star <= rating ? 'text-amber-400 fill-amber-400' : 'text-slate-700'
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveActionModal('request_changes')}
            className="px-5 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-850 border border-slate-700 text-rose-300 font-bold text-xs flex items-center gap-2 transition-colors shadow-lg"
          >
            <AlertCircle className="w-4 h-4 text-rose-400" />
            <span>Request Changes / Revisions</span>
          </button>

          <button
            onClick={() => setActiveActionModal('approve')}
            className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Sign Off & Approve Master</span>
          </button>
        </div>
      </div>

      {/* Sign-off / Request Revisions Modal Form */}
      {activeActionModal && (
        <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                {activeActionModal === 'approve' ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Official Approval Sign-Off
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 text-rose-400" />
                    Request Revisions from Creator
                  </>
                )}
              </h3>
              <button
                onClick={() => setActiveActionModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="text-slate-400 block text-xs mb-1">Digital Signature / Name</label>
              <input
                type="text"
                placeholder="Full Name (e.g. Alex Morgan - Lead Art Director)"
                value={clientSignature}
                onChange={(e) => setClientSignature(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="text-slate-400 block text-xs mb-1">
                {activeActionModal === 'approve' ? 'Optional Praise or Final Hand-Off Notes' : 'Revision Details (Specify adjustments)'}
              </label>
              <textarea
                rows={4}
                placeholder={
                  activeActionModal === 'approve'
                    ? 'Color palette matches brand guideline perfectly. Approved for catalog release.'
                    : 'Highlights on the cheekbone are slightly clipped. Please cool down temperature by -100K.'
                }
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 outline-none resize-none focus:border-amber-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setActiveActionModal(null)}
                className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={activeActionModal === 'approve' ? handleApprove : handleRequestChanges}
                disabled={isSubmitting}
                className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeActionModal === 'approve'
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20'
                    : 'bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-600/20'
                }`}
              >
                {isSubmitting ? 'Recording...' : activeActionModal === 'approve' ? 'Sign & Approve' : 'Submit Revisions'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
