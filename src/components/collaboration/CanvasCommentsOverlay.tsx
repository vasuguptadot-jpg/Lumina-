import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  Pin,
  Square,
  ArrowUpRight,
  Edit3,
  CheckCircle2,
  X,
  Send,
  Trash2,
  User,
  Filter,
  Eye,
  EyeOff,
  CornerDownRight,
  Sparkles,
} from 'lucide-react';
import {
  CanvasComment,
  CommentReply,
  AnnotationType,
  AnnotationPoint,
} from '../../types/collaboration';
import {
  addCanvasComment,
  addCommentReply,
  toggleResolveComment,
  deleteCanvasComment,
  subscribeToProjectComments,
} from '../../services/collaborationService';
import { User as FirebaseUser } from 'firebase/auth';

interface CanvasCommentsOverlayProps {
  projectId: string;
  currentUser: FirebaseUser | null;
  isCommentModeActive: boolean;
  onToggleCommentMode: () => void;
  showToast: (type: 'success' | 'error' | 'info', title: string, msg?: string) => void;
}

export const CanvasCommentsOverlay: React.FC<CanvasCommentsOverlayProps> = ({
  projectId,
  currentUser,
  isCommentModeActive,
  onToggleCommentMode,
  showToast,
}) => {
  const [comments, setComments] = useState<CanvasComment[]>([]);
  const [selectedCommentId, setSelectedCommentId] = useState<string | null>(null);
  const [activeAnnotationType, setActiveAnnotationType] = useState<AnnotationType>('pin');
  const [annotationColor, setAnnotationColor] = useState<string>('#f59e0b');
  const [filterResolved, setFilterResolved] = useState<'all' | 'unresolved' | 'resolved'>('all');
  const [showAnnotations, setShowAnnotations] = useState(true);

  // New comment drafting state
  const [draftComment, setDraftComment] = useState<{
    x: number;
    y: number;
    width?: number;
    height?: number;
    annotationType: AnnotationType;
    points?: AnnotationPoint[];
  } | null>(null);
  const [draftText, setDraftText] = useState('');
  const [replyText, setReplyText] = useState('');

  // Interactive box / drawing dragging state
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
  const [drawnPoints, setDrawnPoints] = useState<AnnotationPoint[]>([]);

  const containerRef = useRef<HTMLDivElement | null>(null);

  // Subscribe to real-time comments from Firestore
  useEffect(() => {
    if (!projectId) return;
    const unsub = subscribeToProjectComments(projectId, (fetchedComments) => {
      setComments(fetchedComments);
    });
    return () => unsub();
  }, [projectId]);

  // Filtered comments
  const filteredComments = comments.filter((c) => {
    if (filterResolved === 'unresolved') return !c.resolved;
    if (filterResolved === 'resolved') return c.resolved;
    return true;
  });

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isCommentModeActive || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const xPct = ((e.clientX - rect.left) / rect.width) * 100;
    const yPct = ((e.clientY - rect.top) / rect.height) * 100;

    if (activeAnnotationType === 'pin') {
      setDraftComment({
        x: xPct,
        y: yPct,
        annotationType: 'pin',
      });
      setSelectedCommentId(null);
      return;
    }

    setIsDrawing(true);
    setDrawStart({ x: xPct, y: yPct });
    if (activeAnnotationType === 'draw') {
      setDrawnPoints([{ x: xPct, y: yPct }]);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDrawing || !drawStart || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const currentX = ((e.clientX - rect.left) / rect.width) * 100;
    const currentY = ((e.clientY - rect.top) / rect.height) * 100;

    if (activeAnnotationType === 'draw') {
      setDrawnPoints((prev) => [...prev, { x: currentX, y: currentY }]);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDrawing || !drawStart || !containerRef.current) return;
    setIsDrawing(false);
    const rect = containerRef.current.getBoundingClientRect();
    const endX = ((e.clientX - rect.left) / rect.width) * 100;
    const endY = ((e.clientY - rect.top) / rect.height) * 100;

    if (activeAnnotationType === 'box') {
      const left = Math.min(drawStart.x, endX);
      const top = Math.min(drawStart.y, endY);
      const width = Math.abs(endX - drawStart.x);
      const height = Math.abs(endY - drawStart.y);

      setDraftComment({
        x: left,
        y: top,
        width: Math.max(5, width),
        height: Math.max(5, height),
        annotationType: 'box',
      });
    } else if (activeAnnotationType === 'arrow') {
      setDraftComment({
        x: drawStart.x,
        y: drawStart.y,
        annotationType: 'arrow',
        points: [drawStart, { x: endX, y: endY }],
      });
    } else if (activeAnnotationType === 'draw') {
      setDraftComment({
        x: drawStart.x,
        y: drawStart.y,
        annotationType: 'draw',
        points: drawnPoints,
      });
    }

    setDrawStart(null);
    setDrawnPoints([]);
  };

  const handleSubmitDraft = async () => {
    if (!draftComment || !draftText.trim()) return;
    if (!currentUser) {
      showToast('error', 'Authentication Required', 'Please sign in to post comments.');
      return;
    }

    try {
      const newCmt = await addCanvasComment(
        projectId,
        currentUser,
        draftText.trim(),
        draftComment.x,
        draftComment.y,
        draftComment.annotationType,
        annotationColor,
        draftComment.width,
        draftComment.height,
        draftComment.points
      );

      setDraftComment(null);
      setDraftText('');
      setSelectedCommentId(newCmt.id);
      showToast('success', 'Comment Pinned', 'Annotation saved to cloud project.');
    } catch (err: any) {
      showToast('error', 'Comment Failed', err.message);
    }
  };

  const handleSendReply = async (commentId: string) => {
    if (!replyText.trim() || !currentUser) return;
    try {
      await addCommentReply(projectId, commentId, currentUser, replyText.trim());
      setReplyText('');
      showToast('info', 'Reply Posted', 'Added reply to conversation thread.');
    } catch (err: any) {
      showToast('error', 'Reply Error', err.message);
    }
  };

  const handleToggleResolve = async (comment: CanvasComment) => {
    if (!currentUser) return;
    try {
      await toggleResolveComment(projectId, comment.id, currentUser, comment.resolved);
      showToast(
        'info',
        comment.resolved ? 'Comment Reopened' : 'Comment Resolved',
        comment.resolved ? 'Marked active for follow-up' : 'Issue marked resolved'
      );
    } catch (err: any) {
      showToast('error', 'Status Error', err.message);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await deleteCanvasComment(projectId, commentId);
      if (selectedCommentId === commentId) {
        setSelectedCommentId(null);
      }
      showToast('info', 'Comment Deleted', 'Annotation removed from canvas.');
    } catch (err: any) {
      showToast('error', 'Delete Error', err.message);
    }
  };

  const selectedComment = comments.find((c) => c.id === selectedCommentId);

  return (
    <>
      {/* Floating Collaboration Mode Bar */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 p-1.5 rounded-2xl bg-slate-950/90 border border-slate-700/80 shadow-2xl backdrop-blur-md text-xs select-none">
        <button
          onClick={onToggleCommentMode}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all ${
            isCommentModeActive
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'text-slate-300 hover:text-white bg-slate-900'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>{isCommentModeActive ? 'Comment Tool Active' : 'Comments'}</span>
          <span className="px-1.5 py-0.2 rounded-full bg-black/30 text-[10px] font-mono">
            {comments.length}
          </span>
        </button>

        {isCommentModeActive && (
          <>
            <div className="h-4 w-[1px] bg-slate-700 mx-1" />

            {/* Annotation Type Selector */}
            {[
              { id: 'pin', icon: Pin, label: 'Pin Marker' },
              { id: 'box', icon: Square, label: 'Box Area' },
              { id: 'arrow', icon: ArrowUpRight, label: 'Arrow' },
              { id: 'draw', icon: Edit3, label: 'Freehand' },
            ].map((tool) => {
              const Icon = tool.icon;
              const isSelected = activeAnnotationType === tool.id;
              return (
                <button
                  key={tool.id}
                  onClick={() => setActiveAnnotationType(tool.id as AnnotationType)}
                  className={`p-1.5 rounded-lg transition-colors ${
                    isSelected ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title={tool.label}
                >
                  <Icon className="w-3.5 h-3.5" />
                </button>
              );
            })}

            {/* Color Swatches */}
            <div className="flex items-center gap-1 pl-1">
              {['#f59e0b', '#ef4444', '#10b981', '#3b82f6', '#ec4899'].map((c) => (
                <button
                  key={c}
                  onClick={() => setAnnotationColor(c)}
                  className={`w-3.5 h-3.5 rounded-full border transition-transform ${
                    annotationColor === c ? 'scale-125 border-white shadow' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>

            <div className="h-4 w-[1px] bg-slate-700 mx-1" />

            {/* Filter */}
            <button
              onClick={() =>
                setFilterResolved((p) =>
                  p === 'all' ? 'unresolved' : p === 'unresolved' ? 'resolved' : 'all'
                )
              }
              className="px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white text-[11px] font-medium"
            >
              {filterResolved === 'all' ? 'All' : filterResolved === 'unresolved' ? 'Open' : 'Resolved'}
            </button>

            {/* Toggle Visibility */}
            <button
              onClick={() => setShowAnnotations(!showAnnotations)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white"
              title={showAnnotations ? 'Hide annotations' : 'Show annotations'}
            >
              {showAnnotations ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            </button>
          </>
        )}
      </div>

      {/* Full Overlay Canvas Layer for Interactive Pins & Markup */}
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className={`absolute inset-0 pointer-events-auto select-none ${
          isCommentModeActive ? 'cursor-crosshair z-20' : 'pointer-events-none z-10'
        } ${showAnnotations ? 'block' : 'hidden'}`}
      >
        {/* Render Existing Comments & Callouts */}
        {filteredComments.map((comment, index) => {
          const isSelected = selectedCommentId === comment.id;

          return (
            <React.Fragment key={comment.id}>
              {/* Box Annotation */}
              {comment.annotationType === 'box' && comment.width && comment.height && (
                <div
                  style={{
                    left: `${comment.x}%`,
                    top: `${comment.y}%`,
                    width: `${comment.width}%`,
                    height: `${comment.height}%`,
                    borderColor: comment.annotationColor,
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedCommentId(comment.id);
                  }}
                  className={`absolute border-2 rounded-lg pointer-events-auto cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-amber-500/10 shadow-lg ring-2 ring-amber-400'
                      : 'bg-black/10 hover:bg-black/20'
                  }`}
                />
              )}

              {/* Pin Marker */}
              <div
                style={{ left: `${comment.x}%`, top: `${comment.y}%` }}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedCommentId(isSelected ? null : comment.id);
                }}
                className={`absolute -translate-x-1/2 -translate-y-1/2 pointer-events-auto cursor-pointer flex items-center justify-center transition-transform ${
                  isSelected ? 'scale-125 z-30' : 'hover:scale-110 z-20'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shadow-xl border-2 transition-all ${
                    comment.resolved
                      ? 'bg-emerald-600 border-emerald-300 text-white opacity-70'
                      : isSelected
                      ? 'bg-amber-500 border-white text-slate-950 shadow-amber-500/50 ring-4 ring-amber-500/30'
                      : 'border-white text-slate-950'
                  }`}
                  style={{
                    backgroundColor: comment.resolved ? '#059669' : comment.annotationColor || '#f59e0b',
                  }}
                >
                  {comment.resolved ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>
              </div>
            </React.Fragment>
          );
        })}

        {/* Render Active Draft Box or Pin before submitting */}
        {draftComment && (
          <>
            {draftComment.annotationType === 'box' && draftComment.width && draftComment.height && (
              <div
                style={{
                  left: `${draftComment.x}%`,
                  top: `${draftComment.y}%`,
                  width: `${draftComment.width}%`,
                  height: `${draftComment.height}%`,
                  borderColor: annotationColor,
                }}
                className="absolute border-2 border-dashed rounded-lg bg-amber-500/20 animate-pulse pointer-events-none"
              />
            )}

            {/* Draft Creation Floating Dialog Card */}
            <div
              style={{
                left: `calc(${draftComment.x}% + 16px)`,
                top: `${draftComment.y}%`,
              }}
              onClick={(e) => e.stopPropagation()}
              className="absolute z-40 w-72 bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-3 flex flex-col gap-2.5 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150"
            >
              <div className="flex items-center justify-between text-xs font-bold text-white">
                <span className="flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
                  New Annotation
                </span>
                <button
                  onClick={() => setDraftComment(null)}
                  className="p-1 rounded-md text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <textarea
                autoFocus
                placeholder="Leave feedback, color note, or revision request..."
                value={draftText}
                onChange={(e) => setDraftText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                    handleSubmitDraft();
                  }
                }}
                className="w-full h-20 bg-slate-950 border border-slate-700/80 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 outline-none resize-none focus:border-amber-500"
              />

              <div className="flex items-center justify-between pt-1">
                <span className="text-[10px] text-slate-500">⌘+Enter to post</span>
                <button
                  onClick={handleSubmitDraft}
                  disabled={!draftText.trim()}
                  className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 disabled:opacity-50 transition-all"
                >
                  <Send className="w-3 h-3" />
                  <span>Post Pin</span>
                </button>
              </div>
            </div>
          </>
        )}

        {/* Selected Comment Thread Popup Card */}
        {selectedComment && (
          <div
            style={{
              left: `min(calc(${selectedComment.x}% + 18px), calc(100% - 320px))`,
              top: `min(${selectedComment.y}%, calc(100% - 320px))`,
            }}
            onClick={(e) => e.stopPropagation()}
            className="absolute z-40 w-80 bg-slate-900/95 border border-slate-700/80 rounded-2xl shadow-2xl p-4 flex flex-col gap-3 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 overflow-hidden flex items-center justify-center text-xs font-bold text-amber-400">
                  {selectedComment.authorAvatar ? (
                    <img src={selectedComment.authorAvatar} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span>{selectedComment.authorName?.[0] || 'U'}</span>
                  )}
                </div>
                <div>
                  <span className="text-xs font-bold text-white block">{selectedComment.authorName}</span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {new Date(selectedComment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleToggleResolve(selectedComment)}
                  className={`p-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 ${
                    selectedComment.resolved
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'bg-slate-800 text-slate-300 hover:text-white'
                  }`}
                  title={selectedComment.resolved ? 'Reopen comment' : 'Resolve comment'}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDeleteComment(selectedComment.id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 transition-colors"
                  title="Delete annotation"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setSelectedCommentId(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Comment Body */}
            <p className="text-xs text-slate-200 leading-relaxed bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
              {selectedComment.content}
            </p>

            {/* Thread Replies List */}
            {selectedComment.replies && selectedComment.replies.length > 0 && (
              <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                {selectedComment.replies.map((rep) => (
                  <div key={rep.id} className="bg-slate-950/40 p-2 rounded-xl border border-slate-850 flex gap-2">
                    <CornerDownRight className="w-3.5 h-3.5 text-slate-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="font-bold text-slate-300">{rep.authorName}</span>
                        <span className="text-slate-500 font-mono">
                          {new Date(rep.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 mt-0.5">{rep.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Reply Input Form */}
            <div className="flex items-center gap-1.5 pt-1">
              <input
                type="text"
                placeholder="Reply to thread..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSendReply(selectedComment.id);
                }}
                className="flex-1 bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:border-amber-500"
              />
              <button
                onClick={() => handleSendReply(selectedComment.id)}
                disabled={!replyText.trim()}
                className="p-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition-all disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};
