import { FormEvent, useState } from 'react';
import type { GigType } from '../types';
import { Avatar } from '../components/Avatar';
import { useApp } from '../context/AppContext';

type SettingsTab = 'family' | 'kuleana' | 'brain' | 'work';

export function SettingsPage() {
  const {
    state,
    syncStatus,
    cloudSyncEnabled,
    addFamilyMember,
    updateFamilyMember,
    updateFamilyMemberAvatar,
    updateWeeklyGoal,
    removeFamilyMember,
    addGig,
    updateGig,
    reorderGigs,
    toggleGigBonus,
    removeGig,
    kuleanaGigs,
    brainGigs,
    workGigs,
  } = useApp();

  const [tab, setTab] = useState<SettingsTab>('family');
  const [newName, setNewName] = useState('');
  const [newGigTitle, setNewGigTitle] = useState('');
  const [newGigDesc, setNewGigDesc] = useState('');
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [editingMemberName, setEditingMemberName] = useState('');
  const [editingGigId, setEditingGigId] = useState<string | null>(null);
  const [editingGigTitle, setEditingGigTitle] = useState('');
  const [editingGigDesc, setEditingGigDesc] = useState('');
  const [draggingGigId, setDraggingGigId] = useState<string | null>(null);

  const tabs: { id: SettingsTab; label: string }[] = [
    { id: 'family', label: 'Family' },
    { id: 'kuleana', label: 'Kuleana' },
    { id: 'brain', label: 'Brain Gigs' },
    { id: 'work', label: 'Work Gigs' },
  ];

  const gigTypeForTab = (t: SettingsTab): GigType | null => {
    if (t === 'kuleana') return 'kuleana';
    if (t === 'brain') return 'brain';
    if (t === 'work') return 'work';
    return null;
  };

  const gigsForTab = () => {
    if (tab === 'kuleana') return kuleanaGigs;
    if (tab === 'brain') return brainGigs;
    if (tab === 'work') return workGigs;
    return [];
  };

  const canReorder = tab === 'brain' || tab === 'work';

  const handleAddMember = (e: FormEvent) => {
    e.preventDefault();
    addFamilyMember(newName);
    setNewName('');
  };

  const handleAddGig = (e: FormEvent) => {
    e.preventDefault();
    const type = gigTypeForTab(tab);
    if (!type) return;
    addGig(newGigTitle, type, newGigDesc);
    setNewGigTitle('');
    setNewGigDesc('');
  };

  const startEditMember = (id: string, name: string) => {
    setEditingMemberId(id);
    setEditingMemberName(name);
  };

  const saveEditMember = () => {
    if (editingMemberId) {
      updateFamilyMember(editingMemberId, editingMemberName);
      setEditingMemberId(null);
    }
  };

  const startEditGig = (id: string, title: string, description?: string) => {
    setEditingGigId(id);
    setEditingGigTitle(title);
    setEditingGigDesc(description ?? '');
  };

  const saveEditGig = () => {
    if (editingGigId) {
      updateGig(editingGigId, editingGigTitle, editingGigDesc);
      setEditingGigId(null);
    }
  };

  const handleGigDrop = (targetGigId: string) => {
    if (!draggingGigId || !canReorder || draggingGigId === targetGigId) return;
    reorderGigs(tab as 'brain' | 'work', draggingGigId, targetGigId);
    setDraggingGigId(null);
  };

  return (
    <div className="page">
      <div className="page-header">
        <h2 className="page-header__title">Parent Settings</h2>
        <p className="page-header__subtitle">Manage family members and gig catalog</p>
      </div>

      <div className="tabs tabs--wrap" role="tablist">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            className={`tabs__btn${tab === t.id ? ' tabs__btn--active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'family' && (
        <section className="settings-section">
          <label className="form__field">
            <span className="form__label">Weekly goal (completed gigs)</span>
            <input
              className="form__input"
              type="number"
              min={1}
              step={1}
              value={state.weeklyGoal}
              onChange={(e) => updateWeeklyGoal(Number(e.target.value) || 1)}
            />
          </label>

          <form className="form form--inline" onSubmit={handleAddMember}>
            <input
              className="form__input"
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Child name"
              required
            />
            <button type="submit" className="btn btn--primary">
              Add
            </button>
          </form>

          <ul className="settings-list">
            {state.familyMembers.map((member) => (
              <li key={member.id} className="settings-item">
                {editingMemberId === member.id ? (
                  <>
                    <div className="settings-item__identity">
                      <Avatar
                        name={editingMemberName || member.name}
                        avatarUrl={member.avatarUrl}
                        editable
                        onUpload={(dataUrl) => updateFamilyMemberAvatar(member.id, dataUrl)}
                      />
                      <input
                        className="form__input"
                        value={editingMemberName}
                        onChange={(e) => setEditingMemberName(e.target.value)}
                      />
                    </div>
                    <button type="button" className="btn btn--sm btn--primary" onClick={saveEditMember}>
                      Save
                    </button>
                    <button
                      type="button"
                      className="btn btn--sm btn--ghost"
                      onClick={() => setEditingMemberId(null)}
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <div className="settings-item__identity">
                      <Avatar
                        name={member.name}
                        avatarUrl={member.avatarUrl}
                        editable
                        onUpload={(dataUrl) => updateFamilyMemberAvatar(member.id, dataUrl)}
                      />
                      <span>{member.name}</span>
                    </div>
                    <div className="settings-item__actions">
                      <button
                        type="button"
                        className="btn btn--sm btn--ghost"
                        onClick={() => startEditMember(member.id, member.name)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="btn btn--sm btn--ghost"
                        onClick={() => removeFamilyMember(member.id)}
                      >
                        Remove
                      </button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {tab !== 'family' && (
        <section className="settings-section">
          <form className="form" onSubmit={handleAddGig}>
            <label className="form__field">
              <span className="form__label">Title</span>
              <input
                className="form__input"
                type="text"
                value={newGigTitle}
                onChange={(e) => setNewGigTitle(e.target.value)}
                placeholder="New item title"
                required
              />
            </label>
            {tab !== 'kuleana' && (
              <label className="form__field">
                <span className="form__label">Description (optional)</span>
                <input
                  className="form__input"
                  type="text"
                  value={newGigDesc}
                  onChange={(e) => setNewGigDesc(e.target.value)}
                  placeholder="Short description"
                />
              </label>
            )}
            <button type="submit" className="btn btn--primary">
              Add {tab === 'kuleana' ? 'Kuleana' : tab === 'brain' ? 'Brain Gig' : 'Work Gig'}
            </button>
          </form>

          <ul className="settings-list settings-list--gigs">
            {gigsForTab().map((gig) => (
              <li
                key={gig.id}
                className={`settings-item settings-item--gig${draggingGigId === gig.id ? ' settings-item--dragging' : ''}`}
                draggable={canReorder && editingGigId !== gig.id}
                onDragStart={() => setDraggingGigId(gig.id)}
                onDragEnd={() => setDraggingGigId(null)}
                onDragOver={(e) => {
                  if (!canReorder) return;
                  e.preventDefault();
                }}
                onDrop={(e) => {
                  if (!canReorder) return;
                  e.preventDefault();
                  handleGigDrop(gig.id);
                }}
              >
                {editingGigId === gig.id ? (
                  <div className="settings-edit-gig">
                    <input
                      className="form__input"
                      value={editingGigTitle}
                      onChange={(e) => setEditingGigTitle(e.target.value)}
                    />
                    {tab !== 'kuleana' && (
                      <input
                        className="form__input"
                        value={editingGigDesc}
                        onChange={(e) => setEditingGigDesc(e.target.value)}
                        placeholder="Description"
                      />
                    )}
                    <div className="settings-item__actions">
                      <button type="button" className="btn btn--sm btn--primary" onClick={saveEditGig}>
                        Save
                      </button>
                      <button
                        type="button"
                        className="btn btn--sm btn--ghost"
                        onClick={() => setEditingGigId(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="settings-gig-main">
                      {canReorder && (
                        <span className="settings-gig-drag" aria-hidden="true" title="Drag to reorder">
                          ≡
                        </span>
                      )}
                      <div>
                        <p className="settings-gig-title">{gig.title}</p>
                        {gig.description && <p className="settings-gig-desc">{gig.description}</p>}
                      </div>
                    </div>
                    <div className="settings-item__actions">
                      {tab !== 'kuleana' && (
                        <button
                          type="button"
                          className={`bonus-badge bonus-badge--toggle${gig.isBonus ? ' bonus-badge--active' : ''}`}
                          onClick={() => toggleGigBonus(gig.id)}
                          aria-pressed={!!gig.isBonus}
                        >
                          Bonus
                        </button>
                      )}
                      <button
                        type="button"
                        className="btn btn--sm btn--ghost"
                        onClick={() => startEditGig(gig.id, gig.title, gig.description)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="btn btn--sm btn--ghost"
                        onClick={() => removeGig(gig.id)}
                      >
                        Remove
                      </button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="sync-status" aria-live="polite">
        <h3 className="sync-status__title">Data sync</h3>
        {cloudSyncEnabled ? (
          <p className="sync-status__text">
            {syncStatus === 'loading' && 'Loading…'}
            {syncStatus === 'syncing' && 'Saving to cloud…'}
            {syncStatus === 'synced' && 'Synced across devices. Changes appear on phones, tablets, and other browsers.'}
            {syncStatus === 'local' && 'Using saved data on this device.'}
            {syncStatus === 'error' && 'Could not reach cloud storage. Your data is saved on this device until sync recovers.'}
          </p>
        ) : (
          <p className="sync-status__text sync-status__text--warn">
            Cloud sync is not configured for this build, so data stays in this browser only. Add Supabase
            credentials (see README) and rebuild to sync across devices.
          </p>
        )}
      </section>
    </div>
  );
}
