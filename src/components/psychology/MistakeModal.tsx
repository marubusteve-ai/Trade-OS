import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { MistakeCategory, MistakeSeverity, MistakeTaxonomyItem } from '../../types/psychology';
import { AlertOctagon, Check, Plus, AlertTriangle } from 'lucide-react';

interface MistakeModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: MistakeCategory[];
  onSubmit: (mistake: Omit<MistakeTaxonomyItem, 'id' | 'isCustom'>) => Promise<void>;
}

export const MistakeModal: React.FC<MistakeModalProps> = ({
  isOpen,
  onClose,
  categories,
  onSubmit,
}) => {
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || '');
  const [severity, setSeverity] = useState<MistakeSeverity>('MODERATE');
  const [description, setDescription] = useState('');
  const [typicalImpactSummary, setTypicalImpactSummary] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('Please provide a name for the mistake.');
      return;
    }

    const selectedCategory = categories.find((c) => c.id === categoryId);
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      await onSubmit({
        name: name.trim(),
        categoryId,
        categoryName: selectedCategory?.name || 'Custom Category',
        severity,
        description: description.trim(),
        typicalImpactSummary: typicalImpactSummary.trim() || undefined,
      });
      setName('');
      setDescription('');
      setTypicalImpactSummary('');
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to create taxonomy item');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Custom Mistake Item"
      description="Add a specific execution error or psychological bias to track across your trades."
      maxWidth="lg"
      footer={
        <div className="flex items-center justify-end gap-2 w-full">
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} isLoading={isSubmitting}>
            <Check className="h-4 w-4 mr-1.5" />
            Save Mistake
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-[#F3F4F6]">
        {errorMessage && (
          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-[#848B98] mb-1">
            Mistake Name *
          </label>
          <Input
            type="text"
            placeholder="e.g. Counter-trend scalp into major supply"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-[#848B98] mb-1">
              Category *
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full h-9 rounded-md bg-[#13151A] border border-[#2B2E36] px-3 text-xs text-[#F3F4F6] focus:outline-none focus:border-emerald-500"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#848B98] mb-1">
              Severity Level
            </label>
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value as MistakeSeverity)}
              className="w-full h-9 rounded-md bg-[#13151A] border border-[#2B2E36] px-3 text-xs text-[#F3F4F6] focus:outline-none focus:border-emerald-500"
            >
              <option value="MINOR">Minor (Small friction / suboptimal exit)</option>
              <option value="MODERATE">Moderate (Missed setup / compressed RR)</option>
              <option value="SEVERE">Severe (Oversized / moved stop / revenge)</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-[#848B98] mb-1">
            Description & Root Cause
          </label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Why does this mistake happen and what triggers it?"
            className="w-full rounded-md bg-[#13151A] border border-[#2B2E36] p-2.5 text-xs text-[#F3F4F6] placeholder-[#636A78] focus:outline-none focus:border-emerald-500 resize-none"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-[#848B98] mb-1">
            Typical Negative Impact
          </label>
          <Input
            type="text"
            placeholder="e.g. Gives back 50% of daily gains in chop"
            value={typicalImpactSummary}
            onChange={(e) => setTypicalImpactSummary(e.target.value)}
          />
        </div>
      </form>
    </Modal>
  );
};
