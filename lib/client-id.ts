"use client";

const CLIENT_ID_KEY = "gpt-image-studio-client-id";

function randomId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

export function getClientId() {
  if (typeof window === "undefined") return "";

  const existing = window.localStorage.getItem(CLIENT_ID_KEY);
  if (existing) return existing;

  const id = randomId();
  window.localStorage.setItem(CLIENT_ID_KEY, id);
  return id;
}
