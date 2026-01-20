const API_BASE = "http://localhost:8000/api";

export type AuthUser = {
  id: string;
  email: string;
  name: string;
};

export type AuthResponse = {
  access_token: string;
  token_type: "bearer";
  user: AuthUser;
};

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("cc_token");
}

export function setToken(token: string) {
  localStorage.setItem("cc_token", token);
}

export function clearToken() {
  localStorage.removeItem("cc_token");
}

export async function signup(name: string, email: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Signup failed" }));
    throw new Error(err.detail || "Signup failed");
  }
  return res.json();
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Login failed" }));
    throw new Error(err.detail || "Login failed");
  }
  return res.json();
}

export async function loginWithGoogleCredential(credential: string): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/auth/google`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ credential }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Google login failed" }));
    throw new Error(err.detail || "Google login failed");
  }
  return res.json();
}

export async function me(): Promise<AuthUser> {
  const token = getToken();
  if (!token) throw new Error("No token");
  const res = await fetch(`${API_BASE}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Not authenticated");
  return res.json();
}


