import { useState } from 'react';

const initials = (name = '') =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0].toUpperCase()).join('') || '?';

/** Round photo, or the member's initials when there is no photo. Decorative: the name is always shown next to it. */
const MemberAvatar = ({ name, image, size = 32 }) => {
  const [failedSrc, setFailedSrc] = useState(null);
  const style = { width: size, height: size };

  if (!image || failedSrc === image) {
    return (
      <span
        aria-hidden="true"
        style={style}
        className="inline-flex shrink-0 items-center justify-center rounded-full border border-[var(--glass-border)] bg-[var(--card-hover)] text-xs font-semibold text-[var(--text-primary)]"
      >
        {initials(name)}
      </span>
    );
  }

  return (
    <img
      src={image}
      alt=""
      style={style}
      className="shrink-0 rounded-full border border-[var(--glass-border)] object-cover"
      onError={() => setFailedSrc(image)}
    />
  );
};

export default MemberAvatar;
