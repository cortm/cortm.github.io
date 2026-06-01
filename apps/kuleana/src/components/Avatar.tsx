import { useId, useRef, type ChangeEvent } from 'react';
import { getNameInitial, processAvatarFile } from '../lib/avatar';

interface AvatarProps {
  name: string;
  avatarUrl?: string;
  size?: 'pill' | 'sm' | 'md';
  editable?: boolean;
  onUpload?: (dataUrl: string) => void;
}

export function Avatar({ name, avatarUrl, size = 'md', editable = false, onUpload }: AvatarProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const initial = getNameInitial(name);
  const label = editable ? `Upload photo for ${name}` : name;

  const handleFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !onUpload) return;

    try {
      const dataUrl = await processAvatarFile(file);
      onUpload(dataUrl);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not upload image.';
      window.alert(message);
    }
  };

  const circle = (
    <span
      className={`avatar avatar--${size}${editable ? ' avatar--editable' : ''}`}
      title={name}
      aria-hidden={editable ? true : undefined}
    >
      {avatarUrl ? (
        <img className="avatar__img" src={avatarUrl} alt="" />
      ) : (
        <span className="avatar__initial" aria-hidden="true">
          {initial}
        </span>
      )}
    </span>
  );

  if (!editable) {
    return (
      <span className="avatar-wrap" title={name} role="img" aria-label={name}>
        {circle}
      </span>
    );
  }

  return (
    <span className="avatar-wrap">
      <input
        ref={inputRef}
        id={inputId}
        className="avatar__input"
        type="file"
        accept="image/*"
        onChange={handleFile}
        aria-label={label}
      />
      <label htmlFor={inputId} className="avatar__label" title={label}>
        {circle}
      </label>
    </span>
  );
}
