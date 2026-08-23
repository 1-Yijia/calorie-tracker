import { useNavigate } from "react-router-dom";

export function AppBar({
  title,
  back,
  right,
}: {
  title: string;
  back?: boolean;
  right?: React.ReactNode;
}) {
  const nav = useNavigate();
  return (
    <div className="appbar">
      {back ? (
        <button className="iconbtn" aria-label="Back" onClick={() => nav(-1)}>
          ‹
        </button>
      ) : (
        <span />
      )}
      <h1>{title}</h1>
      {right ?? <span />}
    </div>
  );
}
