import { useNavigate } from "react-router-dom";
import { ProfileForm } from "../components/ProfileForm";
import { setLimits, setProfile } from "../lib/storage";
import type { Profile } from "../types";

const DEFAULT: Profile = {
  goal: "lose",
  sex: "female",
  age: 30,
  heightCm: 165,
  weightKg: 60,
  activity: "moderate",
};

export default function Onboarding() {
  const nav = useNavigate();
  return (
    <div className="screen">
      <div className="content">
        <div className="hero">
          <h2>Welcome 👋</h2>
          <p>Set your goal and details so we can tailor your daily targets.</p>
        </div>
        <ProfileForm
          initialProfile={DEFAULT}
          allowOverride={false}
          submitLabel="Get started"
          onSubmit={(profile, limits) => {
            setProfile(profile);
            setLimits(limits);
            nav("/", { replace: true });
          }}
        />
      </div>
    </div>
  );
}
