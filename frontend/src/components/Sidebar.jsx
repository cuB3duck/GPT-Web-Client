export default function Sidebar({
  conversations,
  activeConversationId,
  deletingConversationId,
  user,
  onNewChat,
  onSelectConversation,
  onDeleteConversation,
  onLogout,
}) {
  // Display sidebar for conversations and logging out.
  const isDeletingAnyConversation = Boolean(deletingConversationId);

  return (
    <aside className="sidebar">
      <button className="new-chat-button" type="button" onClick={onNewChat}>
        + New chat
      </button>

      <nav className="conversation-list" aria-label="Previous conversations">
        {conversations.length === 0 && (
          <p className="empty-state">Your conversations will appear here.</p>
        )}
        {conversations.map((conversation) => {
          const isDeleting = deletingConversationId === conversation.id;

          return (
            <div
              key={conversation.id}
              className={`conversation-row ${
                conversation.id === activeConversationId ? "active" : ""
              }`}
            >
              <button
                className="conversation-title"
                type="button"
                onClick={() => onSelectConversation(conversation.id)}
                title={conversation.title}
                disabled={isDeletingAnyConversation}
              >
                {conversation.title}
              </button>
              <button
                className="delete-chat-button"
                type="button"
                onClick={() => onDeleteConversation(conversation.id)}
                aria-label={`Delete ${conversation.title}`}
                title="Delete chat"
                disabled={isDeletingAnyConversation}
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          );
        })}
      </nav>

      <footer className="sidebar-footer">
        <div>
          <strong>{user?.name || "Signed in"}</strong>
          <span>{user?.email}</span>
        </div>
        <button type="button" onClick={onLogout}>Log out</button>
      </footer>
    </aside>
  );
}
