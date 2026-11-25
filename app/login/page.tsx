"use client";

import { useState, type FormEvent } from "react";

export default function Login() {
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const secret = String(new FormData(event.currentTarget).get("secret") ?? "");
    setMessage("Checking.");
    const response = await fetch("/api/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ secret }),
    });
    if (response.ok) {
      window.location.href = "/dashboard";
    } else {
      setMessage("That is not the secret.");
    }
  }

  return (
    <main>
      <h1>Log in</h1>
      <form onSubmit={submit}>
        <label>
          Owner secret
          <input name="secret" type="password" autoComplete="current-password" required />
        </label>
        <button type="submit">Log in</button>
        <p role="status">{message}</p>
      </form>
    </main>
  );
}
