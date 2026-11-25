"use client";

import { useState, type FormEvent } from "react";
import { CHANNELS, NOTE_MAX_CHARACTERS } from "../lib/constants";

type Recipient = { id: number; name: string; token: string };

// Login-only form. It logs one reach-out and shows the exact links to send to that person.
export default function ReachoutForm({
  recipients,
  linkSlugs,
  baseUrl,
}: {
  recipients: Recipient[];
  linkSlugs: string[];
  baseUrl: string;
}) {
  const [recipientId, setRecipientId] = useState<number | "">(recipients[0]?.id ?? "");
  const [channel, setChannel] = useState<string>(CHANNELS[0]);
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");
  const chosen = recipients.find((r) => r.id === recipientId);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setMessage("Saving.");
    const response = await fetch("/api/reachouts", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ recipientId, channel, note }),
    });
    const json = await response.json().catch(() => ({}));
    if (response.ok) {
      setMessage("Saved. Reload to see it in the list.");
      setNote("");
    } else {
      setMessage(json.error ?? "That did not save.");
    }
  }

  if (recipients.length === 0) {
    return <p>Make a recipient link first (chapter 5.4). Then you can log a reach-out here.</p>;
  }

  return (
    <form onSubmit={submit} className="reachout-form">
      <label>
        Recipient
        <select value={recipientId} onChange={(e) => setRecipientId(Number(e.target.value))}>
          {recipients.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        Channel
        <select value={channel} onChange={(e) => setChannel(e.target.value)}>
          {CHANNELS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </label>
      <label>
        Note (optional, at most {NOTE_MAX_CHARACTERS} characters)
        <input value={note} maxLength={NOTE_MAX_CHARACTERS} onChange={(e) => setNote(e.target.value)} />
      </label>
      <button type="submit">Log this reach-out</button>
      <p role="status">{message}</p>
      {chosen ? (
        <div>
          <p>Links to send to {chosen.name}:</p>
          <ul>
            <li>
              <code>{`${baseUrl}/p/${chosen.token}`}</code>
            </li>
            {linkSlugs.map((slug) => (
              <li key={slug}>
                <code>{`${baseUrl}/go/${slug}?r=${chosen.token}`}</code>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </form>
  );
}
