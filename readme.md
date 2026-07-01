# ESG_KIOSK_PROJECT

> Comprehensive onboarding and developer guide for the ESG Feedback Kiosk & Digital Tree Final Year Project.

## Overview

The **ESG_KIOSK_PROJECT** is an ESG visitor engagement platform that combines visitor feedback collection, AI-powered sentiment analysis, digital badges, a Digital Tree visualization (2D & 3D), Pulse dashboard, and Pledgeboard into a kiosk experience.

The system consists of:

- HTTPS backend server
- Local kiosk server
- Admin portal
- AI sentiment analysis using Ollama and Transformers.js
- Digital Tree (2D & 3D)
- Pulse live sentiment display
- Pledgeboard
- Email & badge system
- Bluetooth integration
- Database-backed configuration and storage

---

# Prerequisites

Install:

- Node.js **v22.15.0**
- npm
- MySQL
- Git
- Ollama

Verify:

```bash
node --version
npm --version
mysql --version
git --version
ollama --version
```

---

# Project Structure

```text
ESG_KIOSK_PROJECT
├── .agents/
├── assets/
│   ├── overlays/
│   ├── static/
│   └── Tree/
│       ├── background/
│       └── leaf/
├── backend/
│   ├── cache/
│   ├── certs/
│   ├── config/
│   ├── Procedural_Orchestration_Module/
│   ├── server.js
│   ├── kioskServer.js
│   ├── adminServer.js
│   ├── gatewayServer.js
│   └── ...
├── database/
├── frontend/
│   ├── admin/
│   ├── feedback/
│   ├── tree/
│   ├── 3dTree/
│   ├── pulse/
│   ├── Pledgeboard/
│   └── connect/
├── uploads/
├── tests/
├── Team_Documentation/
├── startAll.js
└── package.json
```

## Important Folders

### assets/
Contains static resources including:
- Tree backgrounds
- Leaf images
- Overlay assets
- Static images

### backend/
Contains:
- REST APIs
- Database access
- Authentication
- AI analysis
- Badge system
- Email services
- Digital Tree APIs
- Pulse APIs
- Pledgeboard APIs

### frontend/
Contains all user interfaces:
- Feedback
- Admin
- Tree
- 3D Tree
- Pulse
- Pledgeboard
- Bluetooth test

---

# Installation

Clone repository

```bash
git clone <repository-url>
cd ESG_KIOSK_PROJECT
```

Install dependencies

```bash
npm install
```

---

# Database Setup

Navigate to:

```bash
cd backend/Procedural_Orchestration_Module
```

Run

```bash
node Datastore_Assembly.js
```

This creates:
- Database
- Required tables

---

# Authentication Initialization

Run

```bash
node AuthLayer_Reconstitution.js
```

This will:
- Hash passwords
- Encrypt existing data

---

# AI Setup

## Install Ollama

https://ollama.com

## Supported Models

| Type | Model |
|------|------|
| LLM | phi3 |
| LLM | gemma2:2b |
| LLM | qwen2.5:3b |
| Transformer | Xenova/bert-base-multilingual-uncased-sentiment |

Ollama endpoint:

```
http://localhost:11434/api/generate
```

## Pull Models

```bash
ollama pull phi3
ollama pull gemma2:2b
ollama pull qwen2.5:3b
```

## List Installed Models

```bash
ollama list
```

## Check Running Models

```bash
ollama ps
```

## Remove Model

```bash
ollama rm phi3
```

## Run Model

```bash
ollama run phi3
```

## Check Ollama Service

```bash
curl http://localhost:11434/api/generate
```

---

# Starting the Project

## Start Everything

```bash
node startAll.js
```

`startAll.js` launches:

- server.js
- kioskServer.js

simultaneously.

## Individual Startup

Backend

```bash
cd backend
node server.js
```

Kiosk

```bash
cd backend
node kioskServer.js
```

Ports:

| Service | Port |
|---------|------|
| HTTPS Server | 3000 |
| Localhost Server | 3003 |

---

# Major Features

## Feedback
- Visitor feedback collection
- AI sentiment analysis
- Positive / Neutral / Negative classification
- Inappropriate feedback flagging

## Digital Tree

Supports:

- 2D tree
- 3D tree
- Existing leaves
- Tree growth stages
- Animated leaves
- Visitor names on leaves
- Leaf positioning algorithm
- Background selection
- Tree title customization
- Tree parameter configuration

## Admin Portal

Supports:

- Feedback management
- AI analysis
- Visitor activity tracking
- Badge customization
- Email template management
- Email configuration
- System hibernation scheduling
- System restart scheduling
- Digital Tree customization
- Feedback page customization
- Data export

Tree configuration includes:
- Growth stage
- Background
- Leaf image
- Leaf size
- Falling rate
- Refresh rate
- Maximum displayed leaves
- Badge leaf type
- Tree title
- Title box adjustment

## Pulse

Displays:
- Daily sentiment
- Weekly sentiment
- Live visitor feedback

## Pledgeboard

Displays visitor pledges.

---

# Backend Cache

AI analysis cache:

```
backend/cache/feedback-analysis-cache.json
```

Used to reduce repeated AI inference.

---

# Development Workflow

1. Pull latest code.
2. Run `npm install`.
3. Ensure MySQL is running.
4. Run `Datastore_Assembly.js` if database setup is required.
5. Run `AuthLayer_Reconstitution.js` if initializing data.
6. Ensure Ollama is running.
7. Verify required AI models are installed.
8. Start the project with `node startAll.js`.

---

# Troubleshooting

## AI not responding

- Check `ollama ps`
- Verify models with `ollama list`
- Confirm endpoint is reachable.

## Database errors

- Verify MySQL service.
- Re-run `Datastore_Assembly.js`.

## Missing dependencies

```bash
npm install
```

## Port already in use

Terminate the process using the port before restarting.

---

# Notes for New Team Members

- Do not commit `node_modules`.
- Keep `.env` out of version control.
- Test AI models after pulling updates.
- Verify Digital Tree assets exist before testing.
- Use `startAll.js` during normal development.

---

# License

Final Year Project – Republic Polytechnic
