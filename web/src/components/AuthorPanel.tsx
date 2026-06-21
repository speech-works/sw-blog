import RoleBadge from "./RoleBadge";
import AudioPlayer from "./AudioPlayer";

type AuthorPanelProps = {
  name: string;
  credentials?: string;
  role?: string;
  bio?: string;
  photoUrl?: string | null;
  audioUrl?: string;
  withNames?: string;
  className?: string;
};

// The persistent author rail shown alongside the article on wide screens. It is
// the always-visible trust signal: who is speaking (role badge), their bio, and
// an optional narration. Pure CSS sticky — no client JS. On narrow screens it is
// hidden by the caller and the article footer carries the same information.
export default function AuthorPanel({
  name,
  credentials,
  role,
  bio,
  photoUrl,
  audioUrl,
  withNames,
  className = "",
}: AuthorPanelProps) {
  const initial = name.trim().charAt(0).toUpperCase();

  return (
    <aside className={className}>
      <div
        className="sticky flex flex-col gap-3"
        style={{ top: "calc(var(--nav-height, 4rem) + 1.5rem)" }}
      >
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photoUrl}
            alt={name}
            className="h-14 w-14 rounded-full object-cover ring-1 ring-black/5"
          />
        ) : (
          <span
            aria-hidden
            className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-lg font-bold text-brand-600 ring-1 ring-black/5"
          >
            {initial}
          </span>
        )}

        {role ? <RoleBadge role={role} /> : null}

        <div>
          <p className="text-sm font-bold text-app-title">{name}</p>
          {credentials ? (
            <p className="text-[13px] text-app-muted">{credentials}</p>
          ) : null}
          {withNames ? (
            <p className="mt-1 text-[12px] text-app-muted">with {withNames}</p>
          ) : null}
          {bio ? (
            <p className="mt-2 text-[13px] leading-relaxed text-app-muted">
              {bio}
            </p>
          ) : null}
        </div>

        {audioUrl ? (
          <div className="border-t border-black/5 pt-3">
            <AudioPlayer src={audioUrl} />
          </div>
        ) : null}
      </div>
    </aside>
  );
}
