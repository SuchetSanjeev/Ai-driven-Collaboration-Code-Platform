# CollabCode AI 🚀

CollabCode AI is a full-stack, AI-driven collaborative coding platform designed for real-time development and intelligent code assistance. This web-based IDE allows multiple users to join coding sessions, write and execute code together in over 10 languages inside the Monaco Editor with the piston API, and leverage the power of Google's Gemini AI to explain code and fix bugs on the fly.

<img width="500" height="500" alt="CollabCodeAI_landingpage" src="https://github.com/user-attachments/assets/4f1166c7-8f26-43f4-b4a5-7733f6417793" />
<img width="500" height="500" alt="CollabCodeAI_Dashboard" src="https://github.com/user-attachments/assets/62d32074-6495-4d99-926b-8e77adda45bc" />
<img width="500" height="500" alt="Screenshot 2025-08-21 123643" src="https://github.com/user-attachments/assets/76d9c26f-5ad5-4de6-9027-5eccdae86aeb" />
<img width="500" height="500" alt="CollabCodeAI_analyzeAndFixFeature" src="https://github.com/user-attachments/assets/8ab02598-001b-4c9a-9062-ca48d2740167" />

## ✨ Features

- **Real-time Collaborative Editing**: Write code with others in the same session, with changes reflected live for all participants via a WebSocket-powered backend.
- **Multi-Language Support & Execution**: Run code in over 10 popular languages (including JavaScript, Python, C++, Java, and more) in a secure, sandboxed environment.
- **Persistent Sessions**: All code and language selections are automatically saved to Firestore, allowing you to pick up right where you left off.
- **Personalized User Dashboards**: A complete user authentication system where each user has a private dashboard displaying only the sessions they've created.
- **Share & Join by ID**: Easily collaborate with others by creating a session and sharing its unique ID.
- **AI-Powered Code Explanation**: Highlight any block of code and get a detailed, context-aware explanation from the integrated Google Gemini AI.
- **AI-Powered Bug Analysis & Fixes**: Select a snippet of code and let the AI analyze it for bugs, logical errors, or anti-patterns, providing both an explanation and a one-click suggested fix.

## 🛠️ Tech Stack

- **Frontend**: React, Vite, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Node.js, Express.js
- **Real-time Communication**: WebSockets (`ws` library)
- **Database**: Google Firestore
- **Authentication**: Firebase Authentication
- **AI Integration**: Google Gemini API
- **Code Execution**: Piston API and Monaco Editor

## ⚙️ Local Setup & Installation

Follow these steps to get the project running on your local machine.

### Prerequisites

- Node.js (v18 or later)
- npm (or your preferred package manager)
- A Firebase project with Firestore and Authentication enabled.
- A Google Gemini API Key.

### 1. Clone the Repository

```bash
git clone [https://github.com/your-username/ai-driven-collaboration-code-platform.git](https://github.com/your-username/ai-driven-collaboration-code-platform.git)
cd ai-driven-collaboration-code-platform
```

## 2. Frontend Setup

Navigate to the root directory and install the necessary dependencies.

```Bash
npm install
```
Create a .env.local file in the root directory and add your Firebase project's configuration keys:

```Firebase API
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

## 3. Backend Setup

Navigate to the server directory and install its dependencies.

```Bash
cd server
npm install
Add Firebase Service Account Key:
```

**Add Gemini API Key:**
```
Add your Google Gemini API key to the .env file inside the server directory:
GEMINI_API_KEY=your_gemini_api_key
```

## 4. Running the Application
You'll need two separate terminals to run both the frontend and backend servers.

In Terminal 1 (from the project root):

```Bash
npm run dev
```
Your React application will be running on [localhost:5173](http://localhost:5173.)

In Terminal 2 (from the server directory):

```Bash
node index.js
```

Your backend server will be running on [localhost:3001](http://localhost:3001.)
You can now open your browser and navigate to the URL to start using the application!
