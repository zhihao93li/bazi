"use client";

interface SocialProofProps {
  rating?: number;
  userCount?: string;
  avatars?: string[];
  className?: string;
  showDivider?: boolean;
}

function StarIcon({ filled, half }: { filled: boolean; half?: boolean }) {
  if (half) {
    return (
      <svg className="w-3.5 h-3.5 text-[var(--dark-12)]" fill="currentColor" viewBox="0 0 20 20">
        <defs>
          <linearGradient id="halfStar">
            <stop offset="50%" stopColor="currentColor" />
            <stop offset="50%" stopColor="transparent" />
          </linearGradient>
        </defs>
        <path
          fill="url(#halfStar)"
          stroke="currentColor"
          strokeWidth="0.5"
          d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
        />
      </svg>
    );
  }
  return (
    <svg
      className={`w-3.5 h-3.5 ${filled ? "text-[var(--dark-12)]" : "text-[var(--light-85)]"}`}
      fill="currentColor"
      viewBox="0 0 20 20"
    >
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  );
}

function DefaultAvatar({ index }: { index: number }) {
  const colors = [
    "bg-[var(--accent-purple)]",
    "bg-[var(--accent-orange)]",
    "bg-[var(--accent-pink)]",
    "bg-[var(--accent-blue)]",
    "bg-[var(--accent-green)]",
  ];
  return (
    <div
      className={`w-8 h-8 rounded-full ${colors[index % colors.length]} border-2 border-white flex items-center justify-center text-white text-xs font-medium`}
    >
      {String.fromCharCode(65 + index)}
    </div>
  );
}

export function SocialProof({
  rating = 5,
  userCount = "1000+",
  avatars = [],
  className = "",
  showDivider = true,
}: SocialProofProps) {
  const displayAvatars = avatars.length > 0 ? avatars.slice(0, 5) : [null, null, null, null];

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* Star Rating */}
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <StarIcon key={star} filled={star <= rating} />
        ))}
      </div>

      {/* Divider */}
      {showDivider && (
        <div className="w-px h-5 bg-[var(--light-85)]" />
      )}

      {/* Stacked Avatars */}
      <div className="flex -space-x-2">
        {displayAvatars.map((avatar, index) => (
          <div key={index} className="relative" style={{ zIndex: displayAvatars.length - index }}>
            {avatar ? (
              <img
                src={avatar}
                alt={`User ${index + 1}`}
                className="w-8 h-8 rounded-full border-2 border-white object-cover"
              />
            ) : (
              <DefaultAvatar index={index} />
            )}
          </div>
        ))}
      </div>

      {/* User Count Text */}
      <span className="text-base font-medium text-[var(--dark-7)]">
        {userCount} 用户信赖
      </span>
    </div>
  );
}
