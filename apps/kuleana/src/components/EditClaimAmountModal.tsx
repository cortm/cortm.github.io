import { FormEvent, useEffect, useState } from 'react';
import type { Claim } from '../types';
import { useApp } from '../context/AppContext';
import { formatCurrency } from '../lib/utils';
import { Modal } from './Modal';

interface EditClaimAmountModalProps {
  claim: Claim | null;
  gigTitle: string;
  open: boolean;
  onClose: () => void;
}

export function EditClaimAmountModal({
  claim,
  gigTitle,
  open,
  onClose,
}: EditClaimAmountModalProps) {
  const { updateClaimAmount } = useApp();
  const [dollarAmount, setDollarAmount] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open || !claim) return;
    setDollarAmount(String(claim.dollarAmount));
    setError('');
  }, [open, claim]);

  const handleClose = () => {
    setError('');
    onClose();
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!claim) return;

    const result = updateClaimAmount(claim.id, parseFloat(dollarAmount) || 0);
    if (!result.ok) {
      setError(result.error);
      return;
    }

    handleClose();
  };

  if (!claim) return null;

  return (
    <Modal open={open} title="Edit amount" onClose={handleClose}>
      <p className="modal__subtitle">
        {gigTitle} · was {formatCurrency(claim.dollarAmount)}
      </p>
      <form className="form" onSubmit={handleSubmit}>
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
              autoFocus
            />
          </div>
        </label>

        {error && <p className="form__error">{error}</p>}

        <div className="form__actions">
          <button type="button" className="btn btn--ghost" onClick={handleClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn--primary">
            Save
          </button>
        </div>
      </form>
    </Modal>
  );
}
