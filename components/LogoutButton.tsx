"use client";

export default function LogoutButton() {
  async function logout() {
    await fetch("/api/logout", { method: "POST" });
    window.location.href = "/";
  }
  return (
    <button type="button" onClick={logout}>
      Log out
    </button>
  );
}
