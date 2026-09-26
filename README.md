<div align="center">

# 🌿 SkinWise Advisor

### Intelligent Skincare Recommendation Platform

[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vite.dev/)
[![shadcn/ui](https://img.shields.io/badge/shadcn/ui-Components-000000?style=for-the-badge&logo=shadcnui&logoColor=white)](https://ui.shadcn.com/)

An intelligent skin assessment tool that curates personalized product recommendations tailored to your unique skin needs. Built with a modern React frontend and a Supabase backend to deliver AI-driven insights directly to you.

[Features](#-features) · [Tech Stack](#-tech-stack) · [Getting Started](#-getting-started) · [Project Structure](#-project-structure)

</div>

---

## ✨ Features

### 🧪 Smart Skin Assessment Quiz
- **6-Step guided quiz** collecting comprehensive skin data:
  - **Basic Info** — Age range & gender
  - **Skin Type** — Oily, Dry, Combination, Sensitive, or Normal
  - **Skin Concerns** — Multi-select from acne, dark spots, wrinkles, pigmentation, dullness, and more
  - **Lifestyle** — Climate, allergies & sensitivities
  - **Preferences** — Skin goals & budget range
  - **Face Photo** *(optional)* — Capture or upload a photo for visual AI skin analysis
- **Progress indicator** with step validation ensuring data completeness
- **Allergy awareness** — AI avoids recommending products with flagged ingredients

### 🤖 Personalized Product Recommendations
- Detailed product suggestions based on your quiz profile
- **Visual skin analysis** — When a face photo is provided, visual conditions (acne, redness, dryness, texture issues) are analyzed
- Recommendations include:
  - Product name & brand
  - Key ingredients breakdown
  - Why it's suitable for your skin
  - Usage instructions
  - Safety warnings & allergen alerts
  - Price range & purchase links

### 📸 Face Capture & Detection
- **Real-time webcam face detection** using TensorFlow.js BlazeFace model
- **Face bounding box overlay** for guided photo capture
- **File upload fallback** — Upload an existing photo if camera isn't available
- **Auto face detection validation** — Ensures a face is detected before capture

### 📊 Assessment History & Favorites
- **Full history** of all past skin assessments with timestamps
- **Expandable details** — View assessment parameters and product recommendations for each entry
- **Favorite products** with a single click and view them in a dedicated Favorites page

### 👤 User Profiles & Authentication
- **Authentication** with email/password registration and login
- **User profiles** with full name and email management
- **Protected routes** — Quiz, Results, History, and Favorites require authentication

### 🎨 UI/UX
- **🌗 Dark/Light mode** with system preference detection and manual toggle
- **Responsive design** — Fully mobile-friendly with touch-optimized interactions
- **shadcn/ui component library** — Polished, accessible UI components built on Radix UI
- **Toast notifications** — Elegant feedback for all user actions

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| **React 18/19** | UI library with modern hooks |
| **TypeScript** | Type-safe development |
| **Vite** | Lightning-fast dev server & build tool |
| **React Router DOM** | Client-side routing & navigation |
| **Tailwind CSS** | Utility-first CSS framework |
| **shadcn/ui** | Accessible component library (Radix UI) |
| **TanStack React Query** | Server state management & data fetching |
| **Lucide React** | Beautiful icon library |
| **React Hook Form + Zod** | Form management with schema validation |

### Backend Integration
| Technology | Purpose |
|---|---|
| **Supabase** | Authentication, Database, and Backend services integration |

### AI & Computer Vision
| Technology | Purpose |
|---|---|
| **TensorFlow.js** | Client-side face detection (BlazeFace model) |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18+ (or **Bun**)

### 1. Clone the Repository

```bash
git clone https://github.com/Sjjcnr/SkinWise.git
cd SkinWise
```

### 2. Install Dependencies

```bash
npm install
# or
bun install
```

### 3. Set Up Environment Variables

Create a `.env` file in the root and add your Supabase connection strings:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. Run the Application

```bash
npm run dev
# or
bun run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### 5. Build for Production

```bash
npm run build
npm run preview
```

---

## 📁 Project Structure

```
SkinWise/
├── index.html                    # Vite entry HTML
├── package.json                  # Dependencies & scripts
├── vite.config.ts                # Vite configuration
├── tailwind.config.ts            # Tailwind CSS theme & plugins
├── tsconfig.json                 # TypeScript configuration
├── components.json               # shadcn/ui configuration
│
├── public/
│   └── ...
│
├── src/
│   ├── main.tsx                  # React entry point
│   ├── App.tsx                   # Root component with routing
│   ├── index.css                 # Global styles
│   │
│   ├── types/                    # TypeScript interfaces
│   ├── contexts/                 # React Contexts (e.g. AuthContext)
│   ├── hooks/                    # Custom hooks (e.g. useAssessment)
│   ├── integrations/             # Third-party integrations (Supabase)
│   ├── lib/                      # Utility functions
│   │
│   ├── pages/                    # Route components
│   │   ├── Index.tsx             # Landing page
│   │   ├── Auth.tsx              # Authentication
│   │   ├── Quiz.tsx              # Skin assessment wizard
│   │   ├── Results.tsx           # Recommendations display
│   │   ├── History.tsx           # Past assessments
│   │   ├── Favorites.tsx         # Saved products
│   │   └── Profile.tsx           # User settings
│   │
│   └── components/               # Reusable UI components
│       ├── quiz/                 # Quiz steps
│       └── ui/                   # shadcn/ui base components
│
└── ...
```

---

## 🤝 Contributing

Contributions are welcome! Feel free to open an issue or submit a pull request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the **ISC License**.

---

<div align="center">

**Built with ❤️ using React, TypeScript, Supabase, Tailwind CSS, and shadcn/ui**

</div>
