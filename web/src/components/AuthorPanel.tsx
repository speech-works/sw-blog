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
};

// The persistent author rail shown alongside the article on wide screens. It is
// the always-visible trust signal: who is speaking (role badge), their bio, and
// an optional narration. Pure CSS sticky — no client JS. On narrow screens the
// stylesheet hides it and the article footer carries the same information.
export default function AuthorPanel({
  name,
  credentials,
  role,
  bio,
  photoUrl,
  audioUrl,
  withNames,
}: AuthorPanelProps) {
  const initial = name.trim().charAt(0).toUpperCase();

  return (
    <aside className="author-rail">
      {photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photoUrl} alt={name} className="author-photo" />
      ) : (
        <span aria-hidden className="author-photo author-initial">
          {initial}
        </span>
      )}

      {role ? <RoleBadge role={role} /> : null}

      <div>
        <p className="author-name">{name}</p>
        {credentials ? <p className="author-detail">{credentials}</p> : null}
        {withNames ? <p className="author-detail">with {withNames}</p> : null}
        {bio ? <p className="author-bio">{bio}</p> : null}
      </div>

      {audioUrl ? (
        <div className="author-audio">
          <AudioPlayer src={audioUrl} />
        </div>
      ) : null}
    </aside>
  );
}
