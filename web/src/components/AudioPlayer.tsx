// Shared "Listen" audio player, used by the desktop author rail and the mobile
// author card so the markup and behaviour stay in one place.
export default function AudioPlayer({
  src,
  label = "Listen",
}: {
  src: string;
  label?: string;
}) {
  return (
    <div>
      <p className="audio-label">{label}</p>
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <audio controls preload="none" src={src} className="audio-player">
        Your browser does not support the audio element.
      </audio>
    </div>
  );
}
