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
} from "firebase/firestore";
import { auth } from "@/firebase";
import { useState } from "react";

interface NavigationProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  groupId?: string;
  userRole?: "admin" | "member";
}

const Navigation = ({ currentPage, onNavigate, groupId, userRole }: NavigationProps) => {
  const { toast } = useToast();
  const [openDialog, setOpenDialog] = useState(false);
  const currentUid = auth.currentUser?.uid;

  const navItems = [
    { id: "timeline", label: "Home", icon: Home },
    { id: "add-entry", label: "Add Entry", icon: Plus },
    { id: "view-diary", label: "View Diary", icon: Book },
    { id: "members", label: "Members", icon: Users },
    ...(userRole === "admin"
      ? [{ id: "pending-requests", label: "Requests", icon: Clock }]
      : []),
  ];

  const handleCopyGroupId = () => {
    if (groupId) {
      navigator.clipboard.writeText(groupId);
      toast({
        title: "Group ID copied! 📋",
        description: "Share this ID with friends to invite them to your group.",
      });
    }
  };

  // 🔹 Delete group logic
  const handleDeleteGroup = async () => {
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
      // Remove group from all users' groupIds
      for (const member of members) {
        const userRef = doc(db, "user", member.uid);
        await updateDoc(userRef, {
          groupIds: arrayRemove(groupId),
        }).catch(() => {});
      }

      // Delete the group document
      await deleteDoc(groupRef);

      toast({
        title: "Group deleted 🗑️",
        description: "The group and all its data have been permanently removed.",
      });

      // Navigate back to group selection
      onNavigate("select-group");
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
  };

  return (
    <nav className="bg-gradient-card border-b border-diary-pink/30 px-6 py-4 shadow-card">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        {/* Left Section */}
        <div className="flex items-center justify-between flex-1">
          <div className="flex items-center space-x-2">
            <div className="hidden sm:flex items-center space-x-2">
              <Heart className="h-6 w-6 text-primary fill-current" />
              <h1 className="text-xl font-semibold text-foreground font-diary">
                Shared Diary 💌
              </h1>
            </div>
          </div>

          {groupId && (
            <div className="flex items-center space-x-2">
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
        <div className="flex items-center space-x-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Button
                key={item.id}
                variant={currentPage === item.id ? "default" : "ghost"}
                size="sm"
                onClick={() => onNavigate(item.id)}
                className="flex items-center space-x-2 transition-smooth"
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{item.label}</span>
              </Button>
            );
          })}

          {/* Logout */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigate("login")}
            className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-smooth ml-4"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Logout</span>
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
                <DropdownMenuItem
                  className="text-red-600 focus:text-red-700 cursor-pointer"
                  onClick={() => setOpenDialog(true)}
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
              This will permanently delete <strong>{groupId}</strong> and all its
              diary entries and members. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex justify-center space-x-3 mt-4">
            <AlertDialogCancel className="bg-gray-200">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteGroup}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Yes, Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </nav>
  );
};

export default Navigation;
