export default function Sidebar({
  conversations,
  activeConversationId,
  user,
  onNewChat,
  onSelectConversation,
  onLogout,
}) {
  return (
    <aside className="sidebar">
      <button className="new-chat-button" onClick={onNewChat}>
        + New chat
      </button>

      <nav className="conversation-list" aria-label="Previous conversations">
        {conversations.length === 0 && (
          <p className="empty-state">Your conversations will appear here.</p>
        )}
        {conversations.map((conversation) => (
          <button
            key={conversation.id}
            className={conversation.id === activeConversationId ? "active" : ""}
            onClick={() => onSelectConversation(conversation.id)}
            title={conversation.title}
          >
            {conversation.title}
          </button>
        ))}
      </nav>

      <footer className="sidebar-footer">
        <div>
          <strong>{user?.name || "Signed in"}</strong>
          <span>{user?.email}</span>
        </div>
        <button onClick={onLogout}>Log out</button>
      </footer>
    </aside>
  );
}
