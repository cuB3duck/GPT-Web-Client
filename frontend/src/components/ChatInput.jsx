import { useState } from "react";

export default function ChatInput({ disabled, onSend }) {
  const [message, setMessage] = useState("");

  // Prevents messages that are only whitespace.
  function handleSubmit(event) {
    event.preventDefault();
    const trimmed = message.trim();
    if (!trimmed || disabled) {
      return;
    }
    setMessage("");
    onSend(trimmed);
  }

  // Text box button.
  return (
    <form className="chat-input" onSubmit={handleSubmit}>
      <textarea
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        placeholder="Ask anything. Shift + Enter for newline."
        rows={1}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            handleSubmit(event);
          }
        }}
      />
      <button type="submit" disabled={disabled || !message.trim()}>
        Send
      </button>
    </form>
  );
}
