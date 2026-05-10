import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import ChatInput from "../components/ChatInput.jsx";
import MessageList from "../components/MessageList.jsx";
import Sidebar from "../components/Sidebar.jsx";
import { api, clearToken } from "../services/api.js";

export default function ChatPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [messagesByConversation, setMessagesByConversation] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const messages = useMemo(
    () => messagesByConversation[activeConversationId] || [],
    [activeConversationId, messagesByConversation],
  );

  useEffect(() => {
    async function bootstrap() {
      try {
        const [profile, conversationList] = await Promise.all([
          api.me(),
          api.listConversations(),
        ]);
        setUser(profile);
        setConversations(conversationList);
        if (conversationList[0]) {
          await selectConversation(conversationList[0].id);
        }
      } catch (err) {
        clearToken();
        navigate("/login");
      }
    }
    bootstrap();
    // selectConversation intentionally reads fresh API state during bootstrap.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  async function refreshConversations() {
    const conversationList = await api.listConversations();
    setConversations(conversationList);
    return conversationList;
  }

  async function selectConversation(id) {
    setError("");
    const conversation = await api.getConversation(id);
    setActiveConversationId(id);
    setMessagesByConversation((current) => ({
      ...current,
      [id]: conversation.messages,
    }));
  }

  async function handleNewChat() {
    setError("");
    const conversation = await api.createConversation();
    setActiveConversationId(conversation.id);
    setMessagesByConversation((current) => ({
      ...current,
      [conversation.id]: [],
    }));
    await refreshConversations();
  }

  async function handleDeleteConversation(id) {
    setError("");
    try {
      await api.deleteConversation(id);
      const remainingConversations = conversations.filter((conversation) => conversation.id !== id);

      setConversations(remainingConversations);
      setMessagesByConversation((current) => {
        const next = { ...current };
        delete next[id];
        return next;
      });

      if (activeConversationId === id) {
        const nextConversation = remainingConversations[0];
        if (nextConversation) {
          await selectConversation(nextConversation.id);
        } else {
          setActiveConversationId(null);
        }
      }
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleSend(message) {
    setLoading(true);
    setError("");
    const temporaryId = `pending-${Date.now()}`;
    const conversationKey = activeConversationId || "new";
    const existingMessages = messagesByConversation[conversationKey] || [];

    setMessagesByConversation((current) => ({
      ...current,
      [conversationKey]: [
        ...(current[conversationKey] || []),
        { id: temporaryId, role: "user", content: message },
      ],
    }));

    try {
      const response = await api.sendMessage(message, activeConversationId);
      setActiveConversationId(response.conversation.id);
      setMessagesByConversation((current) => {
        const next = { ...current };
        delete next[conversationKey];
        next[response.conversation.id] = [...existingMessages, ...response.messages];
        return next;
      });
      await refreshConversations();
    } catch (err) {
      setError(err.message);
      setMessagesByConversation((current) => ({
        ...current,
        [conversationKey]: (current[conversationKey] || []).filter(
          (item) => item.id !== temporaryId,
        ),
      }));
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    clearToken();
    navigate("/login");
  }

  return (
    <div className="chat-shell">
      <Sidebar
        conversations={conversations}
        activeConversationId={activeConversationId}
        user={user}
        onNewChat={handleNewChat}
        onSelectConversation={selectConversation}
        onDeleteConversation={handleDeleteConversation}
        onLogout={handleLogout}
      />
      <main className="chat-main">
        <header className="chat-header">
          <h1>ChatGPT Web Client</h1>
          <span>{activeConversationId ? "Conversation synced" : "Start a new chat"}</span>
        </header>

        {error && <div className="chat-error">{error}</div>}

        <MessageList messages={messages} loading={loading} />
        <ChatInput disabled={loading} onSend={handleSend} />
      </main>
    </div>
  );
}
