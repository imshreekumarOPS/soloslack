# Soloslack

A premium, glassmorphic, and highly animated productivity workspace that combines flexible **Markdown Notes** with an intuitive **Kanban Board** system.

## ✨ Features

-   **Dynamic Dashboard**: A beautiful overview of your recent notes, boards, and productivity stats.
-   **Kanban Boards**: Organize tasks with drag-and-drop columns and cards (powered by `@dnd-kit`).
-   **Markdown Notes**: Rich text editing with GitHub Flavored Markdown support.
-   **Glassmorphic Design**: A modern, sophisticated UI with sleek gradients, glass effects, and micro-interactions.
-   **Animations**: Smooth transitions and UI feedback powered by GSAP and CSS animations.
-   **Theme Support**: Integrated settings for theme preferences and API management.
-   **Keyboard Shortcuts**: Productivity-focused shortcuts (e.g., `Alt + N` for new notes, `Alt + B` for new boards).

## 🚀 Tech Stack

### Frontend
-   **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
-   **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
-   **State Management**: React Context API
-   **Drag & Drop**: `@dnd-kit`
-   **Markdown**: `react-markdown`, `remark-gfm`
-   **Icons**: `lucide-react`

### Backend
-   **Runtime**: Node.js
-   **Framework**: [Express.js](https://expressjs.com/)
-   **Database**: [MongoDB](https://www.mongodb.com/) (via Mongoose)
-   **Middleware**: CORS, Morgan, Dotenv

## 🛠️ Getting Started

### Prerequisites
-   Node.js (v18+)
-   MongoDB (Local or Atlas)

### Installation

1.  **Clone the repository**:
    ```bash
    git clone <repository-url>
    cd soloslack
    ```

2.  **Setup the Server**:
    ```bash
    cd website/server
    npm install
    ```
    Create a `.env` file in `website/server`:
    ```env
    PORT=5000
    MONGODB_URI=your_mongodb_connection_string
    ```
    Start the server:
    ```bash
    npm run dev
    ```

3.  **Setup the Client**:
    ```bash
    cd ../client
    npm install
    ```
    Create a `.env.local` file in `website/client`:
    ```env
    NEXT_PUBLIC_API_URL=http://localhost:5000/api
    ```
    Start the client:
    ```bash
    npm run dev
    ```

4.  **Access the application**:
    Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```text
website/
├── client/              # Next.js Frontend
│   ├── app/             # App Router pages (Dashboard, Boards, Notes, Settings)
│   ├── components/      # React components (Kanban, Notes, UI, Layout)
│   ├── context/         # React Contexts (Boards, Notes, Settings)
│   └── lib/             # Utilities and Formatters
└── server/              # Express.js Backend
    ├── src/
    │   ├── config/      # Database configuration
    │   ├── controllers/ # API logic
    │   ├── models/      # Mongoose schemas (Board, Card, Column, Note)
    │   └── routes/      # Express routes
    └── .env             # Environment variables
```

## 📡 API Endpoints Summary

-   **Notes**: `GET /api/notes`, `POST /api/notes`, `PATCH /api/notes/:id`, `DELETE /api/notes/:id`
-   **Boards**: `GET /api/boards`, `POST /api/boards`, `DELETE /api/boards/:id`
-   **Columns**: `POST /api/columns`, `PATCH /api/columns/:id`, `DELETE /api/columns/:id`
-   **Cards**: `POST /api/cards`, `PATCH /api/cards/:id`, `DELETE /api/cards/:id`
-   **Settings**: `GET /api/settings`, `POST /api/settings`

---

Built with ❤️ for productivity.
