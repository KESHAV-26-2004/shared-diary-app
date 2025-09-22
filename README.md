# 💌 Shared Diary Web App

A **private web-based diary** for sharing thoughts and memories with close friends. Built for simplicity, usability, and a warm, personal experience.

---

## 🌐 Features

### 🔑 Login & Approval Flow

* Users log in with **email and password**.
* Each login requires **admin approval** before access.
* Approved users can view and add diary entries.
* Managed using **Firebase Auth** and **Firestore**.

### ✍️ Diary Entries

* Users type raw text which is polished using the **OpenAI API**.
* Entries are stored in Firestore with the following structure:

```json
DiaryEntries: {
  "2025-09-21": {
    "Keshav": "Today felt quiet, I studied and rested peacefully.",
  }
}
```

* Each entry is tagged with **date + user**.

### 📅 Viewing Diary

* Timeline / Calendar interface displays all diary entries.
* Entries show the **user name** and polished text.
* Admins can view all users’ entries and approve new members.

### 🛠 Admin Dashboard

* Approve/reject new users.

### 🌟 Extra Features

* Search and filter diary entries by user or date.
* Mood-based emoji tagging.

---

## 🔧 Tech Stack

* **Frontend:** React.js + Tailwind CSS
* **Backend / DB:** Firebase Auth + Firestore
* **AI:** OpenAI API for diary entry polishing
* **Hosting:** Firebase Hosting

---

## 🚀 Getting Started

### 1️⃣ Clone & Install Dependencies

```bash
git clone <YOUR_GIT_URL>
cd shared-diary-app
npm install
```

### 2️⃣ Run Locally

```bash
npm run dev
```

* App will run at `http://localhost:5173` by default.

### 3️⃣ Firebase Setup

1. Create a Firebase project.
2. Enable **Authentication (Email/Password)**.
3. Set up Firestore collections: `users` and `DiaryEntries`.
4. Update `src/firebase.ts` with your Firebase config.

### 4️⃣ OpenAI Integration

* Obtain an **OpenAI API key**.
* Store it securely and call the API to polish diary entries.


