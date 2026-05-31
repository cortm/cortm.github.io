import { FormEvent, useState } from 'react';
import type { Gig } from '../types';
import { useApp } from '../context/AppContext';
import { Modal } from './Modal';

interface ClaimModalProps {
  gig: Gig | null;
  open: boolean;
  onClose: () => void;
}

export function ClaimModal({ gig, open, onClose }: ClaimModalProps) {
  const { state, claimGig } = useApp();
  const [assigneeName, setAssigneeName] = useState('');
  const [dollarAmount, setDollarAmount] = useState('');
  const [error, setError] = useState('');

  const reset = () => {
    setAssigneeName('');
    setDollarAmount('');
    setError('');
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!gig) return;

    const result = claimGig({
      gigId: gig.id,
      assigneeName,
      dollarAmount: parseFloat(dollarAmount) || 0,
    });

    if (!result.ok) {
      setError(result.error);
      return;
    }

    handleClose();
  };

  if (!gig) return null;

  return (
    <Modal open={open} title={`Claim: ${gig.title}`} onClose={handleClose}>
      <form className="form" onSubmit={handleSubmit}>
        <label className="form__field">
          <span className="form__label">Who are you?</span>
          {state.familyMembers.length > 0 ? (
            <select
              className="form__input"
              value={assigneeName}
              onChange={(e) => setAssigneeName(e.target.value)}
              required
            >
              <option value="">Choose a name…</option>
              {state.familyMembers.map((m) => (
                <option key={m.id} value={m.name}>
                  {m.name}
                </option>
              ))}
            </select>
          ) : (
            <input
              className="form__input"
              type="text"
              value={assigneeName}
              onChange={(e) => setAssigneeName(e.target.value)}
              placeholder="Your name"
              required
            />
          )}
        </label>

        <label className="form__field">
          <span className="form__label">How much will you earn?</span>
          <div className="form__money">
            <span className="form__money-prefix">$</span>
            <input
              className="form__input form__input--money"
              type="number"
              min="0"
              step="0.5"
              value={dollarAmount}
              onChange={(e) => setDollarAmount(e.target.value)}
              placeholder="0"
              required
            />
          </div>
        </label>

        {error && <p className="form__error">{error}</p>}

        <div className="form__actions">
          <button type="button" className="btn btn--ghost" onClick={handleClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn--primary">
            Confirm Claim
          </button>
        </div>
      </form>
    </Modal>
  );
}
