import { useNavigate } from "react-router-dom";
import { AppBar } from "../components/AppBar";
import { ProfileForm } from "../components/ProfileForm";
import { getLimits, getProfile, setLimits, setProfile } from "../lib/storage";
import type { Profile } from "../types";

const FALLBACK: Profile = {
  goal: "lose",
  sex: "female",
  age: 30,
  heightCm: 165,
  weightKg: 60,
  activity: "moderate",
};

export default function EditLimits() {
  const nav = useNavigate();
  const profile = getProfile() ?? FALLBACK;
  const limits = getLimits() ?? undefined;

  return (
    <div className="screen">
      <AppBar title="Daily Limits" back />
      <div className="content">
        <p className="muted-note" style={{ textAlign: "left" }}>
          Targets update automatically from your profile. Edit any number to set it
          manually.
        </p>
        <ProfileForm
          initialProfile={profile}
          initialLimits={limits}
          allowOverride
          submitLabel="Save"
          onSubmit={(p, l) => {
            setProfile(p);
            setLimits(l);
            nav(-1);
          }}
        />
      </div>
    </div>
  );
}
