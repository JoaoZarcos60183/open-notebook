# Quick Start Guide

## 1. Activate the Environment

```bash
conda activate marinha
```

## 2. Install Dependencies

```bash
# Open-Notebook backend
cd open-notebook
pip install -e .

# Open-Notebook frontend
cd frontend && npm install && cd ..

# NOVA-Researcher
cd ../NOVA-Researcher
pip install -r requirements.txt
```

## 3. Start All Services

You need **4 terminals**:

**Terminal 1 — SAM3 Vision Server (GPU):**

```bash
cd NOVA-Researcher
python sam3_serve.py
# Runs at http://localhost:4800
```

**Terminal 2 — NOVA-Researcher API:**

```bash
cd NOVA-Researcher
python server.py
# Runs at http://localhost:8002
```

**Terminal 3 — Open-Notebook API:**

```bash
cd open-notebook
python run_api.py
# Runs at http://localhost:5055
```

**Terminal 4 — Open-Notebook Frontend:**

```bash
cd open-notebook/frontend
npm run dev
```

## 4. Open the App

Go to `http://localhost:3000` and log in with the admin password set in `.env`.

## Architecture

```
Browser (:3000)
  └─► Open-Notebook Frontend (Next.js)
        └─► Open-Notebook API (:5055)
              ├─► SurrealDB (:8555)         — data storage
              ├─► OpenSearch (novasearch)    — search backend
              ├─► Ollama (:11434)           — embeddings & chat (Qwen3)
              ├─► AMALIA API (novasearch)   — Portuguese Navy LLM
              └─► NOVA-Researcher API (:8002)
                    ├─► SAM3 Server (:4800) — image/video analysis (GPU)
                    ├─► Ollama (:11434)     — Qwen3 for research & vision
                    ├─► AMALIA API          — research with AMALIA
                    └─► OpenSearch          — document retrieval
```

## Useful Links

| Resource           | URL                                |
| ------------------ | ---------------------------------- |
| App                | http://localhost:3000              |
| API Docs (Swagger) | http://localhost:5055/docs         |
| NOVA-Researcher    | http://localhost:8002/docs         |
| SAM3 Server        | http://localhost:4800/docs         |
