export default function Sidebar({
  conversations,
  activeConversationId,
  user,
  onNewChat,
  onSelectConversation,
  onDeleteConversation,
  onLogout,
}) {
  // Display sidebar for conversations and logging out.
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
          <div
            key={conversation.id}
            className={`conversation-row ${
              conversation.id === activeConversationId ? "active" : ""
            }`}
          >
            <button
              className="conversation-title"
              onClick={() => onSelectConversation(conversation.id)}
              title={conversation.title}
            >
              {conversation.title}
            </button>
            <button
              className="delete-chat-button"
              onClick={() => onDeleteConversation(conversation.id)}
              aria-label={`Delete ${conversation.title}`}
              title="Delete chat"
            >
              Delete
            </button>
          </div>
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
