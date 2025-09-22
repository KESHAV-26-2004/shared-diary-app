import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Users, Hash, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Firebase imports
import { db, auth } from "@/firebase";
import { doc, setDoc, getDoc, updateDoc, arrayUnion } from "firebase/firestore";

interface GroupSelectionPageProps {
  onCreateGroup: (groupId?: string) => void; // callback for creating new group
  onOpenGroup: (groupId: string) => void;    // callback for opening existing group
  userRole: "admin" | "member";
}

interface Group {
  groupId: string;
  name: string; // friendly name
  adminId: string;
}

const GroupSelectionPage = ({ onCreateGroup, onOpenGroup, userRole }: GroupSelectionPageProps) => {
  const [joinGroupId, setJoinGroupId] = useState("");
  const [groupName, setGroupName] = useState(""); // new input for friendly name
  const [userGroups, setUserGroups] = useState<Group[]>([]);
  const { toast } = useToast();

  const uid = auth.currentUser?.uid;

  // --------------------------
  // Logout Handler
  // --------------------------
  const handleLogout = async () => {
    try {
      await auth.signOut();
      localStorage.removeItem("lastGroupId");
      window.location.reload(); // reload to show login page
    } catch (err: any) {
      toast({ title: "Logout failed", description: err.message, variant: "destructive" });
    }
  };

  // --------------------------
  // Fetch user's groups on page load
  // --------------------------
  useEffect(() => {
    if (!uid) return;

    const fetchGroups = async () => {
      try {
        const userDoc = await getDoc(doc(db, "user", uid));
        if (!userDoc.exists()) return;

        const data = userDoc.data();
        const groupIds: string[] = Array.isArray(data?.groupIds)
          ? data.groupIds
          : data?.groupId
          ? [data.groupId]
          : [];

        if (groupIds.length) {
          const groupsData: Group[] = [];
          for (let gid of groupIds) {
            const groupSnap = await getDoc(doc(db, "groups", gid));
            if (groupSnap.exists()) {
              groupsData.push({ 
                groupId: gid, 
                adminId: groupSnap.data()?.adminId,
                name: groupSnap.data()?.name || gid, // fallback to id
              });
            }
          }
          setUserGroups(groupsData.slice(0, 5)); // max 5 groups
        }
      } catch (err: any) {
        toast({ title: "Error fetching groups", description: err.message, variant: "destructive" });
      }
    };

    fetchGroups();
  }, [uid]);

  // --------------------------
  // Create Group
  // --------------------------
  const handleCreateGroupClick = async () => {
    try {
      if (!uid) throw new Error("Not logged in");
      if (!groupName.trim()) {
        toast({ title: "Enter a group name", variant: "destructive" });
        return;
      }

      const userDoc = await getDoc(doc(db, "user", uid));
      const displayName = userDoc.exists() ? userDoc.data()?.name || "Anonymous" : "Anonymous";

      const groupId = `DG-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      // Create group in Firestore
      await setDoc(doc(db, "groups", groupId), {
        adminId: uid,
        name: groupName, // friendly name
        createdAt: new Date(),
        members: [
          { uid, name: displayName, email: userDoc.data()?.email || "unknown@example.com", role: "admin", approved: true, joinedAt: new Date() },
        ],
      });

      // Update user's groupIds
      const userRef = doc(db, "user", uid);
      await updateDoc(userRef, { groupIds: arrayUnion(groupId) });

      setUserGroups(prev => [{ groupId, name: groupName, adminId: uid }, ...prev].slice(0, 5));

      onCreateGroup(groupId);
      toast({ title: "Group created! ✨", description: `You are now admin of ${groupName}` });
      setGroupName(""); // reset input
    } catch (err: any) {
      toast({ title: "Error creating group ❌", description: err.message, variant: "destructive" });
    }
  };

  // --------------------------
  // Join Existing Group
  // --------------------------
  const handleJoinGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!joinGroupId.trim()) return;
      if (!uid) throw new Error("Not logged in");

      const userDoc = await getDoc(doc(db, "user", uid));
      const displayName = userDoc.exists() ? userDoc.data()?.name || "Anonymous" : "Anonymous";

      const groupRef = doc(db, "groups", joinGroupId);
      const groupSnap = await getDoc(groupRef);

      if (!groupSnap.exists()) {
        toast({ title: "Group not found", description: "Please check the Group ID.", variant: "destructive" });
        return;
      }

      const members = groupSnap.data()?.members || [];
      const existingMember = members.find((m: any) => m.uid === uid);

      if (!existingMember) {
        await updateDoc(groupRef, {
          members: arrayUnion({ uid, name: displayName, email: userDoc.data()?.email || "unknown@example.com", role: "member", approved: false, joinedAt: new Date() }),
        });
      }

      const userRef = doc(db, "user", uid);
      await updateDoc(userRef, { groupIds: arrayUnion(joinGroupId) });

      setUserGroups(prev => [{ 
        groupId: joinGroupId, 
        adminId: groupSnap.data()?.adminId,
        name: groupSnap.data()?.name || joinGroupId, // friendly name
      }, ...prev].slice(0, 5));

      checkMemberApproval(joinGroupId, uid);
      toast({ title: "Join request sent! 📨", description: "Waiting for admin approval." });
    } catch (err: any) {
      toast({ title: "Error joining group ❌", description: err.message, variant: "destructive" });
    }
  };

  // --------------------------
  // Check approval and open group
  // --------------------------
  const checkMemberApproval = async (selectedGroupId: string, uid: string) => {
    try {
      const groupSnap = await getDoc(doc(db, "groups", selectedGroupId));
      if (!groupSnap.exists()) return;

      const members = groupSnap.data()?.members || [];
      const member = members.find((m: any) => m.uid === uid);

      onOpenGroup(selectedGroupId); // handles approved/pending UI in parent
    } catch (err) {
      console.error("Error checking member approval:", err);
      onOpenGroup(selectedGroupId);
    }
  };

  const handleSelectGroup = (groupId: string) => {
    checkMemberApproval(groupId, uid!);
  };

  return (
    <div className="min-h-screen bg-gradient-warm flex flex-col items-center justify-center p-4 pb-24 relative">
      <div className="w-full max-w-2xl">

        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground font-diary mb-2">Welcome to Shared Diary! 💌</h1>
          <p className="text-muted-foreground">Choose how you'd like to get started</p>
        </div>

        {/* Existing groups buttons moved here */}
        {userGroups.length > 0 && (
          <div className="flex justify-center flex-wrap gap-2 mb-6">
            {userGroups.map((grp) => (
              <Button key={grp.groupId} onClick={() => handleSelectGroup(grp.groupId)} size="sm">
                {grp.name}
              </Button>
            ))}
          </div>
        )}

        {/* Create/Join Group Cards */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Create Group */}
          <Card className="bg-gradient-card border-diary-pink/20 shadow-soft">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-2">
                <div className="p-3 rounded-full bg-primary/10"><Plus className="h-6 w-6 text-primary" /></div>
              </div>
              <CardTitle className="font-diary">Create New Group</CardTitle>
              <CardDescription>Start your own diary circle and invite friends</CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-2">
              <Input
                type="text"
                placeholder="Enter a friendly group name"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="bg-white/80 border-diary-pink/30 focus:border-primary transition-smooth"
              />
              <Button onClick={handleCreateGroupClick} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-soft transition-smooth">
                <Plus className="h-4 w-4 mr-2" />Create Group
              </Button>
              <p className="text-xs text-muted-foreground mt-2">You'll become the admin and get a shareable Group ID</p>
            </CardContent>
          </Card>

          {/* Join Group */}
          <Card className="bg-gradient-card border-diary-blue/20 shadow-soft">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-2">
                <div className="p-3 rounded-full bg-accent/10"><Users className="h-6 w-6 text-accent" /></div>
              </div>
              <CardTitle className="font-diary">Join Existing Group</CardTitle>
              <CardDescription>Enter a Group ID to request access</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleJoinGroup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="groupId" className="flex items-center space-x-2">
                    <Hash className="h-4 w-4" /><span>Group ID</span>
                  </Label>
                  <Input
                    id="groupId"
                    type="text"
                    placeholder="Enter Group ID (e.g., DG-ABC123)"
                    value={joinGroupId}
                    onChange={(e) => setJoinGroupId(e.target.value)}
                    className="bg-white/80 border-diary-blue/30 focus:border-accent transition-smooth"
                    required
                  />
                </div>
                <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground shadow-soft transition-smooth">
                  <Users className="h-4 w-4 mr-2" />Request to Join
                </Button>
              </form>
              <p className="text-xs text-muted-foreground mt-2 text-center">Admin approval required to access the group</p>
            </CardContent>
          </Card>
        </div>

        {/* Role info card */}
        <div className="mt-8">
          <Card className="bg-white/10 border-white/20 shadow-soft">
            <CardContent className="pt-6 text-center">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium">Your Role:</span>{" "}
                <span className="capitalize ml-1 text-foreground"></span> – You can create or join groups and share diary entries
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Logout button remains at bottom */}
        <div className="absolute bottom-4 right-4">
          <Button
            variant="destructive"
            onClick={handleLogout}
            className="flex items-center space-x-2"
          >
            <LogOut className="h-4 w-4" /> <span>Logout</span>
          </Button>
        </div>

      </div>
    </div>
  );
};

export default GroupSelectionPage;
