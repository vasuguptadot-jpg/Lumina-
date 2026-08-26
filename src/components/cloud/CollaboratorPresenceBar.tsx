/**
 * Lumina Studio Pro - Real-Time Collaborator Presence Bar
 * Shows live avatars, active editing tools, and presence badges for connected peers.
 */

import React, { useEffect, useState } from 'react';
import { Users, Wifi, Circle } from 'lucide-react';
import { CollaboratorPresence } from '../../types/cloudSync';
import { collaborationEngine } from '../../services/collaborationEngine';
import { authService } from '../../services/authService';

interface CollaboratorPresenceBarProps {
  projectId: string;
  onOpenCollaborationModal?: () => void;
}

export const CollaboratorPresenceBar: React.FC<CollaboratorPresenceBarProps> = ({
  projectId,
  onOpenCollaborationModal,
}) => {
  const [collaborators, setCollaborators] = useState<CollaboratorPresence[]>([]);
  const currentUserId = authService.getUserId();

  useEffect(() => {
    if (!projectId || !authService.isAuthenticated()) return;

    collaborationEngine.joinProjectRoom(
      projectId,
      (presenceList) => {
        setCollaborators(presenceList);
      },
      (op) => {
        console.info('[Lumina Collab] Received remote op:', op.opType, op.path);
      }
    );

    return () => {
      collaborationEngine.leaveCurrentRoom();
    };
  }, [projectId]);

  if (!authService.isAuthenticated() || collaborators.length === 0) {
    return null;
  }

  return (
    <div
      onClick={onOpenCollaborationModal}
      className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 cursor-pointer transition-all group"
      title="Live Multi-User Collaboration Room"
    >
      <div className="flex -space-x-1.5 overflow-hidden">
        {collaborators.slice(0, 4).map((collab) => {
          const isSelf = collab.userId === currentUserId;
          const initials = (collab.displayName || 'User')
            .split(' ')
            .map((n) => n[0])
            .join('')
            .slice(0, 2)
            .toUpperCase();

          return (
            <div
              key={collab.userId}
              className="relative inline-block"
              title={`${collab.displayName}${isSelf ? ' (You)' : ''} • Role: ${collab.role}${collab.currentTool ? ` • Editing: ${collab.currentTool}` : ''}`}
            >
              {collab.photoURL ? (
                <img
                  src={collab.photoURL}
                  alt={collab.displayName}
                  className="w-5 h-5 rounded-full ring-1.5 ring-slate-950 object-cover"
                />
              ) : (
                <div className="w-5 h-5 rounded-full ring-1.5 ring-slate-950 bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-[8px] font-bold text-white">
                  {initials}
                </div>
              )}
              <span className="absolute bottom-0 right-0 w-1.5 h-1.5 rounded-full bg-emerald-400 ring-1 ring-slate-950"></span>
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-1 text-[10px] font-semibold text-slate-400 group-hover:text-slate-200">
        <Users className="w-3 h-3 text-indigo-400" />
        <span>{collaborators.length} online</span>
      </div>
    </div>
  );
};
