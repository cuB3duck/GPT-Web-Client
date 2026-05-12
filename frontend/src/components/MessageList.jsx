export default function MessageList({ messages, loading }) {
  return (
    // Page if there are no messages.
    <div className="messages">
      {messages.length === 0 && (
        <div className="welcome-panel">
          <h1>How can I help you today?</h1>
          <p>Ask a question, brainstorm an idea, or continue a previous chat.</p>
        </div>
      )}

      {messages.map((message) => (
        <article key={message.id || `${message.role}-${message.content}`} className={`message ${message.role}`}>
          <div className="avatar">{message.role === "user" ? "You" : "AI"}</div>
          <div className="bubble">{message.content}</div>
        </article>
      ))}

      {loading && (
        <article className="message assistant">
          <div className="avatar">AI</div>
          <div className="bubble typing">Thinking...</div>
        </article>
      )}
    </div>
  );
}
