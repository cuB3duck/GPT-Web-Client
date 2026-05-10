import { useState } from "react";

export default function ChatInput({ disabled, onSend }) {
  const [message, setMessage] = useState("");

  function handleSubmit(event) {
    event.preventDefault();
    const trimmed = message.trim();
    if (!trimmed || disabled) {
      return;
    }
    setMessage("");
    onSend(trimmed);
  }

  return (
    <form className="chat-input" onSubmit={handleSubmit}>
      <textarea
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        placeholder="Message ChatGPT Web Client"
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
