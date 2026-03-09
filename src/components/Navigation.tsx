//src/components/Navigation.tsx
import {
  Heart,
  Home,
  Plus,
  Book,
  LogOut,
  Users,
  Copy,
  Clock,
  MoreVertical,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import { db } from "@/firebase";
import {
  doc,
  deleteDoc,
  getDoc,
  updateDoc,
  arrayRemove,
  collection,
  getDocs,
  writeBatch
} from "firebase/firestore";
import { auth } from "@/firebase";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";

interface NavigationProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  onBackToGroups: () => void;
  groupId?: string;
  userRole?: "admin" | "member";
}

const Navigation = ({ currentPage, onNavigate, onBackToGroups, groupId, userRole }: NavigationProps) => {
  const { toast } = useToast();
  const [groupName, setGroupName] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const currentUid = auth.currentUser?.uid;
  const [deleting, setDeleting] = useState(false);

  const navItems = [
    { id: "timeline", label: "Home", icon: Home },
    { id: "add-entry", label: "Add Entry", icon: Plus },
    { id: "view-diary", label: "View Diary", icon: Book },
    { id: "members", label: "Members", icon: Users },

    ...(userRole === "admin"
      ? [{ id: "pending-requests", label: "Requests", icon: Clock, mobileHidden: true }]
      : []),
  ];

  const handleCopyGroupId = () => {
    if (groupId) {
      navigator.clipboard.writeText(groupId);
      toast({
        title: "Copied! 📋",
        description: "Share this ID with friends to invite them to your group.",
      });
    }
  };

  // 🔹 Delete group logic
  const handleDeleteGroup = async () => {
    setDeleting(true);
    try {
      if (!groupId || !currentUid) return;

      const groupRef = doc(db, "groups", groupId);
      const groupSnap = await getDoc(groupRef);

      if (!groupSnap.exists()) throw new Error("Group not found.");

      const data = groupSnap.data();

      if (data.adminId !== currentUid) {
        toast({
          title: "Permission denied",
          description: "Only the group admin can delete this group.",
          variant: "destructive",
        });
        return;
      }

      const members = data.members || [];

      if (!members.length) {
        console.warn("No members found while deleting group");
      }

      // 1️⃣ delete entries using pagination (scalable)
      const pageSize = 100;

      while (true) {

        const snapshot = await getDocs(
          collection(db, "groups", groupId, "entries")
        );

        if (snapshot.empty) break;

        const batch = writeBatch(db);

        snapshot.docs.slice(0, pageSize).forEach((docSnap) => {
          batch.delete(docSnap.ref);
        });

        await batch.commit();

        if (snapshot.size <= pageSize) break;
      }

      // 2️⃣ delete group first
      await deleteDoc(groupRef);

      // 3️⃣ remove group from users
      for (const member of members) {
        const userRef = doc(db, "user", member.uid);

        await updateDoc(userRef, {
          groupIds: arrayRemove(groupId),
        }).catch(() => {});
      }

      toast({
        title: "Group deleted 🗑️",
        description: "The group and all its data have been permanently removed.",
      });

      await new Promise(r => setTimeout(r, 700));

      onBackToGroups();

    } catch (err: any) {
      console.error("Error deleting group:", err);

      toast({
        title: "Error deleting group",
        description: err.message,
        variant: "destructive",
      });

    } finally {
      setOpenDialog(false);
    }
    setDeleting(false);
  };

  return (
    <nav className="bg-gradient-card border-b border-diary-pink/30 px-6 py-4 shadow-card">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        {/* Left Section */}
        <div className="flex items-center justify-between flex-1">
          {groupId && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onBackToGroups}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <div className="flex items-center space-x-2">
            <div className="hidden sm:flex items-center space-x-2">
              <Heart className="h-6 w-6 text-primary fill-current" />
              <h1 className="text-xl font-semibold text-foreground font-diary">
                Shared Diary 💌
              </h1>
            </div>
          </div>

          {groupId && (
            <div className="flex items-center gap-2 px-2 md:px-3 transition-smooth whitespace-nowrap">
              <Badge
                variant="secondary"
                className="bg-accent/20 text-accent-foreground border-accent/30 cursor-pointer hover:bg-accent/30 transition-smooth text-xs sm:text-sm"
                onClick={handleCopyGroupId}
              >
                <Copy className="h-3 w-3 mr-1" />
                <span className="sm:hidden">{groupId}</span>
                <span className="hidden sm:inline">Group: {groupId}</span>
              </Badge>
            </div>
          )}
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-1 flex-wrap md:flex-nowrap">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Button
                key={item.id}
                disabled={deleting}
                variant={currentPage === item.id ? "default" : "ghost"}
                size="sm"
                onClick={() => onNavigate(item.id)}
                className={`flex items-center space-x-2 transition-smooth 
                  ${item.mobileHidden ? "hidden sm:flex" : ""}`}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden lg:inline">{item.label}</span>
              </Button>
            );
          })}

          {/* Logout */}
          <Button
            disabled={deleting}
            variant="ghost"
            size="sm"
            onClick={() => onNavigate("login")}
            className="hidden sm:flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-smooth ml-4"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden lg:inline">Logout</span>
          </Button>

          {/* ⋮ Menu for Admin */}
          {userRole === "admin" && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="ml-2">
                  <MoreVertical className="h-5 w-5 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {/* Requests (mobile only) */}
                {userRole === "admin" && (
                  <DropdownMenuItem
                    className="sm:hidden"
                    onClick={() => onNavigate("pending-requests")}
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    Requests
                  </DropdownMenuItem>
                )}

                {/* Logout (mobile only) */}
                <DropdownMenuItem
                  className="sm:hidden"
                  onClick={() => onNavigate("login")}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </DropdownMenuItem>

                {/* Delete group */}
                <DropdownMenuItem
                  className="text-red-600 focus:text-red-700 cursor-pointer"
                  onClick={async () => {
                    if (!groupId) return;

                    const snap = await getDoc(doc(db, "groups", groupId));
                    if (snap.exists()) {
                      setGroupName(snap.data().name);
                    }

                    setOpenDialog(true);
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Group
                </DropdownMenuItem>

              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* 🗑️ Delete Confirmation Popup */}
      <AlertDialog open={openDialog} onOpenChange={setOpenDialog}>
        <AlertDialogContent className="text-center">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this group?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{groupName || groupId}</strong> and all its
              diary entries and members. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex justify-center space-x-3 mt-4">
            <AlertDialogCancel className="bg-gray-200">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteGroup}
              disabled={deleting}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {deleting ? "Deleting..." : "Yes, Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {deleting && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 text-center max-w-sm">
            <div className="text-lg font-semibold mb-2">Deleting group...</div>
            <div className="text-sm text-muted-foreground">
              Please don't close the app
            </div>
            <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
              <div className="bg-red-500 h-2 rounded-full animate-pulse w-full"></div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navigation;
