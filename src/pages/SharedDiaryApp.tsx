import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import LoginPage from "@/components/LoginPage";
import SignupPage from "@/components/SignupPage";
import GroupSelectionPage from "@/components/GroupSelectionPage";
import TimelinePage from "@/components/TimelinePage";
import AddEntryPage from "@/components/AddEntryPage";
import MembersPage from "@/components/MembersPage";
import PendingRequestsPage from "@/components/PendingRequestsPage";
import ViewDiaryPage from "@/components/ViewDiary";

// Firebase imports
import { auth, db } from "@/firebase";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged, signInWithEmailAndPassword } from "firebase/auth";

interface DiaryEntry {
  id: string;
  user: string;
  text: string;
  mood: string;
  date: string;
  userColor: "pink" | "blue";
}

interface Member {
  id: string;
  name: string;
  email: string;
  role: "admin" | "member";
  status: "approved" | "pending";
  joinedDate: string;
  color: "pink" | "blue";
}

interface JoinRequest {
  id: string;
  name: string;
  email: string;
  requestDate: string;
  role: "admin" | "member";
}

interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "member";
  groupIds?: string[];
}

const SharedDiaryApp = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState("timeline");
  const [appState, setAppState] = useState<"login" | "signup" | "groupSelection" | "inGroup">("login");
  const [loadingAuth, setLoadingAuth] = useState(true); // loading while checking auth
  const [groupId, setGroupId] = useState<string | null>(null);
  const [groupRole, setGroupRole] = useState<"admin" | "member">("member");
  const [memberStatus, setMemberStatus] = useState<"approved" | "pending">("pending");

  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);

  // --------------------------
  // Auth State Listener
  // --------------------------
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDoc = await getDoc(doc(db, "user", user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setCurrentUser({
            id: user.uid,
            name: userData.name,
            email: userData.email,
            role: userData.role || "member",
            groupIds: userData.groupIds || []
          });
          setAppState("groupSelection");
        }
      } else {
        setCurrentUser(null);
        setAppState("login");
      }
      setLoadingAuth(false);
    });

    return () => unsubscribe();
  }, []);


  // --------------------------
  // Login / Signup
  // --------------------------
  const handleLogin = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const userId = userCredential.user.uid;

      // Fetch Firestore data
      const userDoc = await getDoc(doc(db, "user", userId));
      if (!userDoc.exists()) throw new Error("User data not found");

      const userData = userDoc.data();
      const loggedInUser: User = {
        id: userId,
        name: userData.name,
        email: userData.email,
        role: userData.role || "member",
        groupIds: userData.groupIds || []
      };
      setCurrentUser(loggedInUser);
      setAppState("groupSelection");
    } catch (err: any) {
      console.error("Login failed:", err.message);
      alert(err.message); // or use toast
    }
  };

  const handleSignup = (name: string, email: string, password: string) => {
    const newUser: User = {
      id: Date.now().toString(),
      name,
      email,
      role: "member",
      groupIds: []
    };
    setCurrentUser(newUser);
    setAppState("groupSelection");
  };

  // --------------------------
  // Group Handlers
  // --------------------------
  const handleCreateGroup = (newGroupId?: string) => {
    const groupIdToUse = newGroupId || `DG-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    setGroupId(groupIdToUse);
    localStorage.setItem("lastGroupId", groupIdToUse);
    setGroupRole("admin");
    setMemberStatus("approved");
    setAppState("inGroup");
    setCurrentPage("timeline");
  };

  const handleOpenGroup = async (selectedGroupId: string) => {
    setGroupId(selectedGroupId);
    localStorage.setItem("lastGroupId", selectedGroupId);

    if (!currentUser) return;

    try {
      const groupSnap = await getDoc(doc(db, "groups", selectedGroupId));
      if (!groupSnap.exists()) {
        setGroupRole("member");
        setMemberStatus("pending");
        setCurrentPage("waiting");
        setAppState("inGroup");
        return;
      }

      const membersData = groupSnap.data()?.members || [];
      const currentMember = membersData.find((m: any) => m.uid === auth.currentUser?.uid);

      if (currentMember?.role === "admin") {
        setGroupRole("admin");
        setMemberStatus("approved");
        setCurrentPage("timeline");
      } else if (currentMember?.approved) {
        setGroupRole("member");
        setMemberStatus("approved");
        setCurrentPage("timeline");
      } else {
        setGroupRole("member");
        setMemberStatus("pending");
        setCurrentPage("waiting");
      }

      setAppState("inGroup");
    } catch (err) {
      console.error("Error opening group:", err);
      setGroupRole("member");
      setMemberStatus("pending");
      setCurrentPage("waiting");
      setAppState("inGroup");
    }
  };

  const handleAddEntry = (text: string) => {
    const moods = ["😊","😌","😄","🤔","😍","🥰","✨"];
    const randomMood = moods[Math.floor(Math.random() * moods.length)];

    const newEntry: DiaryEntry = {
      id: Date.now().toString(),
      user: "You",
      text,
      mood: randomMood,
      date: new Date().toISOString().split("T")[0],
      userColor: Math.random() > 0.5 ? "pink" : "blue"
    };

    setEntries(prev => [newEntry, ...prev]);
    setCurrentPage("timeline");
  };

  const handleNavigate = (page: string) => {
    if (page === "login") {
      setCurrentUser(null);
      auth.signOut();
      localStorage.removeItem("lastGroupId");
      setAppState("login");
      setCurrentPage("timeline");
      setGroupId(null);
      setGroupRole("member");
      setMemberStatus("pending");
    } else {
      setCurrentPage(page);
    }
  };

  // --------------------------
  // Show loading while auth is checked
  // --------------------------
  if (loadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg text-muted-foreground">Loading...</p>
      </div>
    );
  }

  // --------------------------
  // Render Pages
  // --------------------------
  if (appState === "login") return <LoginPage onLogin={handleLogin} onSignup={() => setAppState("signup")} />;
  if (appState === "signup") return <SignupPage onSignup={handleSignup} onBackToLogin={() => setAppState("login")} />;
  if (appState === "groupSelection") return (
    <GroupSelectionPage
      onCreateGroup={handleCreateGroup}
      onOpenGroup={handleOpenGroup}
      userRole={currentUser?.role || "member"}
    />
  );
  if (appState === "inGroup" && memberStatus === "pending") return (
    <div className="min-h-screen bg-gradient-warm flex items-center justify-center p-4">
      <div className="text-center">
        <div className="text-6xl mb-4">⏳</div>
        <h1 className="text-3xl font-bold text-foreground font-diary mb-4">Waiting for Approval</h1>
        <p className="text-muted-foreground mb-6">Your request to join group <strong>{groupId}</strong> is pending admin approval.</p>
        <p className="text-sm text-muted-foreground">You'll be notified once the admin approves your request.</p>
      </div>
    </div>
  );

  const renderCurrentPage = () => {
    switch (currentPage) {
      case "add-entry": return <AddEntryPage groupId={groupId!} onAddEntry={handleAddEntry} />;
      case "view-diary": return <ViewDiaryPage groupId={groupId!} />; 
      case "timeline": return <TimelinePage groupId={groupId!} />;
      case "members": return <MembersPage groupId={groupId!} />;
      case "pending-requests":
        return groupRole === "admin" ? (
          <PendingRequestsPage
            groupId={groupId!}
            currentUserUid={auth.currentUser?.uid!}
            currentUserRole={groupRole}
          />
        ) : null;
      default: return <TimelinePage groupId={groupId!} />;
    }
  };

  return (
    <>
      <Navigation currentPage={currentPage} onNavigate={handleNavigate} groupId={groupId || undefined} userRole={groupRole} />
      {renderCurrentPage()}
    </>
  );
};

export default SharedDiaryApp;
