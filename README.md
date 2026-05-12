# GPT-Web-Client


cd backend
.\.venv\Scripts\Activate.ps1
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

cd frontend
npm run dev

http://localhost:5173

A full-stack ChatGPT-style web client built with:

- **Frontend:** React + Vite
- **Backend:** Python + FastAPI
- **Database:** SQLite via SQLAlchemy
- **Auth:** Email/password, Google OAuth, JWT bearer tokens
- **AI:** Local Ollama chat model

## Project structure

```text
GPT-Web-Client/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── auth.py          # Password hashing, JWT creation, current-user dependency
│   │   ├── config.py        # Environment-driven settings
│   │   ├── database.py      # SQLite/SQLAlchemy setup
│   │   ├── main.py          # FastAPI app and API routes
│   │   ├── models.py        # User, Conversation, Message tables
│   │   └── schemas.py       # Pydantic request/response models
│   ├── .env.example
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── AuthForm.jsx
│   │   │   ├── ChatInput.jsx
│   │   │   ├── MessageList.jsx
│   │   │   └── Sidebar.jsx
│   │   ├── pages/
│   │   │   ├── ChatPage.jsx
│   │   │   ├── LoginPage.jsx
│   │   │   └── SignupPage.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── styles.css
│   ├── .env.example
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
└── README.md
```

## Backend setup

From the repository root:

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

Edit `backend/.env`:

```bash
DATABASE_URL=sqlite:///./chatgpt_web.db
JWT_SECRET_KEY=replace-with-a-long-random-secret
ACCESS_TOKEN_EXPIRE_MINUTES=1440
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_CHAT_MODEL=llama3.2:latest
OLLAMA_TIMEOUT_SECONDS=120
GOOGLE_CLIENT_ID=your-google-oauth-client-id.apps.googleusercontent.com
CORS_ORIGINS=http://localhost:5173
```

Make sure Ollama is running before you send chat messages:

```bash
ollama serve
```

This project defaults to `llama3.2:latest`, which matches the chat model you have installed. Your embedding models (`qllama/bge-small-en-v1.5`, `nomic-embed-text`, and `mxbai-embed-large`) are not required for basic chat.

Start the API:

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The SQLite database is created automatically on startup.

### Backend endpoints

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `POST` | `/api/auth/signup` | Create an email/password account and return a JWT |
| `POST` | `/api/auth/login` | Log in with email/password and return a JWT |
| `POST` | `/api/auth/google` | Log in or create an account with a Google ID token |
| `GET` | `/api/auth/me` | Return the authenticated user |
| `GET` | `/api/conversations` | List the current user's conversations |
| `POST` | `/api/conversations` | Create a new chat |
| `GET` | `/api/conversations/{id}` | Load one chat and its messages |
| `DELETE` | `/api/conversations/{id}` | Delete one chat and its messages |
| `POST` | `/api/chat` | Send a message to Ollama and store the reply |

Protected endpoints require:

```http
Authorization: Bearer <jwt>
```

## Frontend setup

Open a second terminal from the repository root:

```bash
cd frontend
npm install
cp .env.example .env
```

Edit `frontend/.env`:

```bash
VITE_API_BASE_URL=http://localhost:8000/api
VITE_GOOGLE_CLIENT_ID=your-google-oauth-client-id.apps.googleusercontent.com
```

Start the React app:

```bash
npm run dev
```

Visit `http://localhost:5173`.

## Google OAuth notes

1. Create an OAuth 2.0 Client ID in Google Cloud Console.
2. Add `http://localhost:5173` as an authorized JavaScript origin.
3. Put the same client ID in both:
   - `backend/.env` as `GOOGLE_CLIENT_ID`
   - `frontend/.env` as `VITE_GOOGLE_CLIENT_ID`

The frontend receives a Google ID token and sends it to `/api/auth/google`; the backend verifies it with `google-auth`.

## Ollama notes

No OpenAI API key is required. The backend calls the local Ollama HTTP API:

```python
httpx.post(
    f"{settings.OLLAMA_BASE_URL}/api/chat",
    json={
        "model": settings.OLLAMA_CHAT_MODEL,
        "messages": [
            {"role": "system", "content": "You are a helpful assistant."},
            *history,
        ],
        "stream": False,
    },
)
```

Chat messages are saved per user in SQLite through the `conversations` and `messages` tables.

## Typical development flow

Run both servers at the same time:

```bash
# Terminal 1
ollama serve

# Terminal 2
cd backend
source .venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Terminal 3
cd frontend
npm run dev
```

Then create an account, start a chat, and use the sidebar to revisit previous conversations.
