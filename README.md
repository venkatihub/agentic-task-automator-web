
# Agentic Web UI Automator

This project is an AI-powered agentic system for generating, updating, and managing web UI blocks (forms, components, etc.) using LLMs and a RAG (Retrieval-Augmented Generation) workflow.  
It features a **Node.js/Express/Mongoose** backend and a **Next.js React** frontend.

---

### 🌐 [Demo URL](https://drive.google.com/file/d/1K7f4QTKxvQaqrPNVxsISo2pHt-43n0bG/view?usp=drive_link)

---

## Features

- **Natural Language to UI**: Describe a web component in plain English, and the system generates a responsive, validated HTML/CSS block.
- **RAG Workflow**: If a matching template exists, it is retrieved and updated as needed; otherwise, a new template is generated and stored.
- **Template Management**: All templates are stored in MongoDB and can be reused or updated.
- **Live Preview**: Generated UI blocks are rendered in the frontend for instant feedback.
- **Agentic Pipeline**: Modular agents handle intent extraction, template selection, dependency resolution, UI generation, and injection.

---

## Folder Structure

```
/backend    # Node.js/Express API with Mongoose models and agents
/frontend   # Next.js React frontend UI
/db         # Seed data and models
/agents     # Core agent logic
```

---

## Getting Started

### 1️⃣ Clone the Repository

```bash
git clone <your-repo-url>
cd hackthon
```

### 2️⃣ Backend Setup

#### a. Install dependencies

```bash
cd backend
npm install
```

#### b. Configure Environment

Create a `.env` file in `backend/` with the following:

```env
MONGODB_URI=mongodb://localhost:27017/yourdbname
GEMINI_API_KEY=your_google_gemini_api_key
PORT=4000
```

#### c. Seed Templates (optional)

```bash
node db/seed.js
```

#### d. Start the Backend

```bash
npm start
```

---

### 3️⃣ Frontend Setup

#### a. Install dependencies

```bash
cd ../frontend
npm install
```

#### b. Start the Frontend

```bash
npm run dev
```

Frontend will be available at: [http://localhost:3000](http://localhost:3000)

---

## Usage

1. Open the frontend in your browser.
2. Enter a natural language command (e.g., `"Add a contact form with name and email validation"`).
3. Run the task.

The backend will:

- Extract intent from your command.
- Retrieve or generate the best template.
- Update or create the template in MongoDB.
- Return the generated HTML/CSS block.

➡️ Preview the generated UI in the **"Generated Output"** section.

---

## Key Files

- `agents.js`: Core agent functions for intent extraction, template RAG, dependency resolution, UI generation, and DOM injection.
- `agentFlow.js`: Orchestrates the agentic pipeline.
- `TemplateModel.js`: Mongoose schema for templates.
- `AutomatorUI.js`: Main UI for interacting with the system and displaying results.

---

## Customization

- **Add new templates**: Update `db/seed.js` or use the UI to generate new ones.
- **Modify agent logic**: Edit `agents.js` for custom intent extraction, RAG, or UI generation logic.
- **Change LLM provider**: Update the LLM integration in `agents.js` as needed.

---

## Troubleshooting

- **MongoDB errors**: Ensure MongoDB is running and `MONGODB_URI` is correct.
- **LLM errors**: Check your Gemini API key and usage limits.
- **Frontend errors**: Make sure the backend is running and accessible from the frontend.

---

## License

MIT

---

Enjoy building agentic web UIs with AI! 🚀
