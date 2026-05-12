const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

export function getToken() {
  return localStorage.getItem("token");
}

export function setToken(token) {
  localStorage.setItem("token", token);
}

export function clearToken() {
  localStorage.removeItem("token");
}

async function request(path, options = {}) {
  const token = getToken();
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const contentType = response.headers.get("content-type") || "";
  const hasBody = response.status !== 204 && response.status !== 205;
  const responseText = hasBody ? await response.text() : "";
  const data =
    responseText && contentType.includes("application/json") ? JSON.parse(responseText) : null;

  if (!response.ok) {
    throw new Error(data?.detail || "Request failed");
  }

  return data;
}

export const api = {
  signup: (payload) =>
    request("/auth/signup", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  login: (payload) =>
    request("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  googleLogin: (idToken) =>
    request("/auth/google", {
      method: "POST",
      body: JSON.stringify({ id_token: idToken }),
    }),
  me: () => request("/auth/me"),
  listConversations: () => request("/conversations"),
  createConversation: () =>
    request("/conversations", {
      method: "POST",
      body: JSON.stringify({ title: "New chat" }),
    }),
  getConversation: (id) => request(`/conversations/${id}`),
  deleteConversation: (id) =>
    request(`/conversations/${id}`, {
      method: "DELETE",
    }),
  sendMessage: (message, conversationId) =>
    request("/chat", {
      method: "POST",
      body: JSON.stringify({ message, conversation_id: conversationId }),
    }),
};
