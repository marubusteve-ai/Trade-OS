/**
 * Workspace Switcher & Creator Modal
 */

import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { Layers, Plus, CheckCircle2, Briefcase } from 'lucide-react';

export const WorkspaceModal: React.FC = () => {
  const {
    isWorkspaceModalOpen,
    closeWorkspaceModal,
    workspaces,
    activeWorkspaceId,
    setActiveWorkspaceId,
    createWorkspace,
  } = useAuth();
  const { notify } = useNotification();

  const [isCreating, setIsCreating] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [newWorkspaceDescription, setNewWorkspaceDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkspaceName.trim()) return;

    setIsLoading(true);
    try {
      const ws = await createWorkspace(newWorkspaceName.trim(), newWorkspaceDescription.trim() || undefined);
      notify.success('Workspace Created', `Switched to ${ws.name}`);
      setIsCreating(false);
      setNewWorkspaceName('');
      setNewWorkspaceDescription('');
      closeWorkspaceModal();
    } catch (err: any) {
      notify.error('Creation Failed', err?.message || 'Could not create workspace.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isWorkspaceModalOpen}
      onClose={closeWorkspaceModal}
      title="Trading Desks & Workspaces"
      description="Isolate prop firm evaluations, personal capital accounts, or backtest strategies."
      maxWidth="md"
    >
      <div className="space-y-4 py-1">
        {!isCreating ? (
          <>
            <div className="space-y-2">
              {workspaces.map((ws) => {
                const isActive = ws.id === activeWorkspaceId;
                return (
                  <button
                    key={ws.id}
                    onClick={() => {
                      setActiveWorkspaceId(ws.id);
                      notify.info('Active Workspace Switched', `Active Desk: ${ws.name}`);
                      closeWorkspaceModal();
                    }}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      isActive
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-white shadow-xs'
                        : 'bg-[#0C0D0F] border-[#22252A] text-[#9CA3AF] hover:border-[#2A2E35] hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-9 w-9 rounded-lg flex items-center justify-center ${
                          isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-[#15171A] text-[#848B98]'
                        }`}
                      >
                        <Briefcase className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">{ws.name}</span>
                          {ws.isDefault && (
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#1A1D21] text-[#848B98] border border-[#2A2E35]">
                              DEFAULT
                            </span>
                          )}
                        </div>
                        {ws.description && (
                          <p className="text-[11px] text-[#848B98] mt-0.5">{ws.description}</p>
                        )}
                      </div>
                    </div>

                    {isActive && <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />}
                  </button>
                );
              })}
            </div>

            <div className="pt-2 border-t border-[#22252A]">
              <Button
                variant="outline"
                onClick={() => setIsCreating(true)}
                className="w-full border-dashed border-[#2A2E35] text-emerald-400 hover:bg-emerald-500/10"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create New Trading Desk...
              </Button>
            </div>
          </>
        ) : (
          <form onSubmit={handleCreate} className="space-y-3.5">
            <Input
              label="Trading Desk Name"
              placeholder="e.g. Apex 300k Evaluation Desk"
              value={newWorkspaceName}
              onChange={(e) => setNewWorkspaceName(e.target.value)}
              prefixElement={<Layers className="h-3.5 w-3.5 text-[#848B98]" />}
              required
              autoFocus
            />

            <Input
              label="Description (Optional)"
              placeholder="e.g. Dedicated risk partition for prop firm challenges"
              value={newWorkspaceDescription}
              onChange={(e) => setNewWorkspaceDescription(e.target.value)}
            />

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreating(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" isLoading={isLoading}>
                Save Workspace
              </Button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
};
