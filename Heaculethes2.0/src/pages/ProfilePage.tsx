// src/pages/ProfilePage.tsx
import { useAuth } from "../auth/AuthContext";

export default function ProfilePage() {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold mb-1">Profile</h1>
      <p className="text-slate-400 text-sm">
        Signed in as <span className="font-semibold">{user?.email}</span>
      </p>

      <button
        onClick={handleLogout}
        className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold hover:bg-red-500"
      >
        Log out
      </button>
    </div>
  );
}
