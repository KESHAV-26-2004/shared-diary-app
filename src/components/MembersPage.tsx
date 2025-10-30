import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Crown, Heart, Clock, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import { db, auth } from "@/firebase";
import { doc, getDoc, updateDoc, arrayRemove } from "firebase/firestore";

interface Member {
  uid: string;
  name: string;
  email?: string;
  role: "admin" | "member";
  approved: boolean;
  joinedAt: any;
  color: "pink" | "blue";
}

interface MembersPageProps {
  groupId: string;
}

const MembersPage = ({ groupId }: MembersPageProps) => {
  const [members, setMembers] = useState<Member[]>([]);
  const [adminId, setAdminId] = useState<string | null>(null);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const { toast } = useToast();
  const currentUid = auth.currentUser?.uid;

  // 🔹 Fetch members
  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const groupSnap = await getDoc(doc(db, "groups", groupId));
        if (groupSnap.exists()) {
          const data = groupSnap.data();
          setAdminId(data.adminId);

          const fetchedMembers =
            data?.members?.map((m: any) => ({
              uid: m.uid,
              name: m.name,
              email: m.email || "",
              role: m.role,
              approved: m.approved,
              joinedAt: m.joinedAt?.toDate ? m.joinedAt.toDate() : new Date(),
              color: Math.random() > 0.5 ? "pink" : "blue",
            })) || [];
          setMembers(fetchedMembers);
        }
      } catch (err) {
        console.error("Error fetching members:", err);
      }
    };

    fetchMembers();
  }, [groupId]);

  // 🔹 Handle member deletion
  const handleDeleteMember = async (uid: string, name: string) => {
    try {
      if (!currentUid || currentUid !== adminId) {
        toast({
          title: "Permission denied",
          description: "Only admin can remove members",
          variant: "destructive",
        });
        return;
      }

      const groupRef = doc(db, "groups", groupId);
      const groupSnap = await getDoc(groupRef);
      if (!groupSnap.exists()) return;

      const data = groupSnap.data();
      const updatedMembers = (data.members || []).filter((m: any) => m.uid !== uid);
      const updatedMemberUIDs = (data.memberUIDs || []).filter((id: string) => id !== uid);

      await updateDoc(groupRef, {
        members: updatedMembers,
        memberUIDs: updatedMemberUIDs,
      });

      // Remove from user side
      const userRef = doc(db, "user", uid);
      await updateDoc(userRef, {
        groupIds: arrayRemove(groupId),
      });

      setMembers((prev) => prev.filter((m) => m.uid !== uid));
      toast({
        title: "Member removed 🗑️",
        description: `${name} has been removed from the group.`,
      });
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Error removing member",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setSelectedMember(null); // close dialog
    }
  };

  const approvedMembers = members.filter((m) => m.approved);
  const pendingMembers = members.filter((m) => !m.approved);

  return (
    <div className="min-h-screen bg-gradient-warm">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Users className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground font-diary">Diary Circle</h1>
          </div>
          <p className="text-muted-foreground">The wonderful people sharing their stories</p>
        </div>

        <div className="space-y-8">
          {/* Approved Members */}
          <div>
            <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center space-x-2">
              <Heart className="h-5 w-5 text-primary" />
              <span>Active Members ({approvedMembers.length})</span>
            </h2>

            <div className="grid gap-4 md:grid-cols-2">
              {approvedMembers.map((member) => (
                <Card
                  key={member.uid}
                  className={`relative ${
                    member.color === "pink"
                      ? "bg-diary-pink/60"
                      : "bg-diary-blue/60"
                  } border-white/40 shadow-card hover:shadow-soft transition-smooth`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg font-diary flex items-center space-x-2">
                        <span>{member.name}</span>
                        {member.role === "admin" && (
                          <Crown className="h-4 w-4 text-accent" />
                        )}
                      </CardTitle>
                      <Badge variant="secondary" className="bg-white/40 text-foreground border-white/20">
                        {member.role}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm text-muted-foreground mb-2">{member.email}</p>
                    <p className="text-xs text-muted-foreground">
                      Joined {new Date(member.joinedAt).toLocaleDateString()}
                    </p>
                  </CardContent>

                  {/* 🗑️ Delete button */}
                  {currentUid === adminId && member.uid !== adminId && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute bottom-2 right-2 text-black hover:bg-red-100"
                          onClick={() => setSelectedMember(member)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>

                      <AlertDialogContent className="text-center">
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remove {selectedMember?.name}?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently remove this member from the group.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="flex justify-center space-x-3 mt-4">
                          <AlertDialogCancel className="bg-gray-200">No</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() =>
                              handleDeleteMember(member.uid, member.name)
                            }
                            className="bg-red-500 hover:bg-red-600 text-white"
                          >
                            Yes, Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </Card>
              ))}
            </div>
          </div>

          {/* Pending Members */}
          {pendingMembers.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center space-x-2">
                <Clock className="h-5 w-5 text-accent" />
                <span>Pending Approval ({pendingMembers.length})</span>
              </h2>

              <div className="grid gap-4 md:grid-cols-2">
                {pendingMembers.map((member) => (
                  <Card
                    key={member.uid}
                    className="relative bg-accent/10 border-accent/30 shadow-card"
                  >
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg font-diary">{member.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-sm text-muted-foreground mb-2">{member.email}</p>
                      <Badge variant="outline" className="border-accent/40 text-accent">
                        Awaiting approval
                      </Badge>
                    </CardContent>

                    {currentUid === adminId && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute bottom-2 right-2 text-black hover:bg-red-100"
                            onClick={() => setSelectedMember(member)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>

                        <AlertDialogContent className="text-center">
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remove {selectedMember?.name}?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently remove this pending member from the group.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter className="flex justify-center space-x-3 mt-4">
                            <AlertDialogCancel className="bg-gray-200">No</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() =>
                                handleDeleteMember(member.uid, member.name)
                              }
                              className="bg-red-500 hover:bg-red-600 text-white"
                            >
                              Yes, Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MembersPage;
