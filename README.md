# 🧜‍♂️ frienf-math-notes-fe

**React-based frontend for freehand math expression input, evaluation, and LaTeX rendering.**

## 🔧 Key Features

* ✏️ **Canvas Drawing**: Freehand draw mathematical expressions.
* 🧽 **Eraser Tool** *(planned)*: Remove drawn content via eraser mode.
* 🔲 **Canvas Manipulation**: Resize and move canvas (Shift + Drag).
* 📄 **Calculation API Integration**: Send image to backend for expression evaluation.
* 📄 **MathJax Rendering**: Show LaTeX-rendered results on canvas.
* 🕘 **Calculation History**: View and restore past results.
* ↩️ **Undo/Redo**: Navigate through drawing history.
* 🖥️ **Responsive UI**: Tailwind + Mantine UI with collapsible controls.
* ⌨️ **Keyboard Shortcuts**: Toggle history with `Ctrl+H`.

---

## 🚀 Getting Started

### 🔗 Prerequisites

* **Node.js** `>= 18`
* **npm** `>= 8`
* **Backend**: A running instance of [`frienf-math-notes-be`](https://github.com/your-org/frienf-math-notes-be) or similar.

### 📦 Setup Instructions

```bash
# Clone repo
git clone <repository-url>
cd frienf-math-notes-fe

# Install dependencies
npm install

# Add environment variables
echo "VITE_API_URL=http://localhost:8900" > .env

# Start development server
npm run dev
```

App runs at: [http://localhost:5173](http://localhost:5173)

---

## 🧰 Available Scripts

| Script            | Description                              |
| ----------------- | ---------------------------------------- |
| `npm run dev`     | Start dev server with live reload + lint |
| `npm run build`   | Create production build                  |
| `npm run preview` | Preview built app locally                |
| `npm run lint`    | Run ESLint                               |

---

## 🧑‍💼 Usage Guide

### ✏️ Drawing

* Draw with your mouse.
* Select colors from the swatch palette.

### 🧽 Erasing *(To be implemented)*

* Click eraser icon (currently placeholder).

### 🧱 Canvas Navigation

* Hold `Shift` + Drag to pan the canvas.
* Canvas auto-expands as needed.

### ▶️ Running Calculations

* Click "Run" (floating or sidebar button).
* LaTeX result appears on canvas, draggable.

### 🕘 Viewing History

* Press `Ctrl+H` to open/close history.
* Click a past entry to re-add its result.
* "Clear History" deletes all past entries.

### ↩️ Undo / Redo

* Use sidebar buttons to navigate drawing states.

### 🔄 Reset

* Clear current canvas and drawing state.
* Keeps calculation history intact.

---

## 🔗 Backend API Requirements

**Endpoint:** `POST /calculate`

### Request Payload:

```json
{
  "image": "<base64-encoded PNG>",
  "dict_of_vars": { "x": 2, "y": 5 }
}
```

### Response Format:

```json
[
  {
    "expr": "x + y",
    "result": "7",
    "assign": false
  }
]
```

---

## 📁 Project Structure

```
frienf-math-notes-fe/
├── public/                # Static assets
├── src/
│   ├── assets/            # Images
│   ├── components/        # Reusable components
│   ├── lib/               # Utility logic
│   ├── screens/           # Top-level pages
│   ├── App.tsx            # App entry and routes
│   ├── main.tsx           # Vite entry point
│   ├── index.css          # Tailwind base styles
│   └── constants.ts       # Shared constants
├── tailwind.config.js     # Tailwind config
├── vite.config.ts         # Vite config
└── tsconfig.json          # TypeScript config
```

---

## 🛠️ Tech Stack

* **React + TypeScript**
* **Vite** (fast dev/build tool)
* **Tailwind CSS** (utility-first CSS)
* **Mantine** (UI components)
* **MathJax** (LaTeX rendering)
* **Axios** (HTTP client)
* **Lucide React** (icons)
* **ESLint** (code linting)
* **React Router** (routing)

---

## 🤝 Contributing

1. Fork the repository.
2. Create a feature branch:

   ```bash
   git checkout -b feature/your-feature
   ```
3. Commit your changes:

   ```bash
   git commit -m "Add your feature"
   ```
4. Push and open a PR:

   ```bash
   git push origin feature/your-feature
   ```

---

## 🗆 License

Licensed under the [Apache License 2.0](LICENSE).

---

## 📨 Contact

* Open an [issue](https://github.com/your-org/frienf-math-notes-fe/issues) for bugs or feature requests.
* Reach out to the maintainers for collaboration or feedback.
