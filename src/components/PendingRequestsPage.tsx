import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Check, X, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Firebase
import { db } from "@/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";

interface Member {
  uid: string;
  name: string;
  email?: string;
  role: "admin" | "member";
  approved: boolean;
  joinedAt: any;
}

interface PendingRequestsPageProps {
  groupId: string;
  currentUserUid: string;
  currentUserRole: "admin" | "member";
}

const PendingRequestsPage = ({ groupId, currentUserUid, currentUserRole }: PendingRequestsPageProps) => {
  const { toast } = useToast();
  const [requests, setRequests] = useState<Member[]>([]);

  // Fetch unapproved members
  useEffect(() => {
    if (!groupId) return;

    const fetchPending = async () => {
      try {
        const groupRef = doc(db, "groups", groupId);
        const groupSnap = await getDoc(groupRef);
        if (!groupSnap.exists()) return;

        const members: Member[] = groupSnap.data()?.members || [];
        const pendingMembers = members.filter((m) => !m.approved);
        setRequests(pendingMembers);
      } catch (err) {
        console.error("Error fetching pending members:", err);
      }
    };

    fetchPending();
  }, [groupId]);

  const handleApprove = async (uid: string, name: string) => {
    try {
      const groupRef = doc(db, "groups", groupId);
      const groupSnap = await getDoc(groupRef);
      if (!groupSnap.exists()) return;

      const members: Member[] = groupSnap.data()?.members || [];
      const updatedMembers = members.map((m) =>
        m.uid === uid ? { ...m, approved: true } : m
      );

      await updateDoc(groupRef, { members: updatedMembers });

      toast({
        title: "Member approved! ✅",
        description: `${name} has been added to your diary group.`,
      });

      setRequests(updatedMembers.filter((m) => !m.approved));
    } catch (err) {
      console.error(err);
      toast({
        title: "Error",
        description: "Failed to approve member",
        variant: "destructive",
      });
    }
  };

  const handleReject = async (uid: string, name: string) => {
    try {
      const groupRef = doc(db, "groups", groupId);
      const groupSnap = await getDoc(groupRef);
      if (!groupSnap.exists()) return;

      const members: Member[] = groupSnap.data()?.members || [];
      const updatedMembers = members.filter((m) => m.uid !== uid);

      await updateDoc(groupRef, { members: updatedMembers });

      toast({
        title: "Request rejected",
        description: `${name}'s join request has been declined.`,
        variant: "destructive",
      });

      setRequests(updatedMembers.filter((m) => !m.approved));
    } catch (err) {
      console.error(err);
      toast({
        title: "Error",
        description: "Failed to reject member",
        variant: "destructive",
      });
    }
  };

  if (currentUserRole !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Only admins can approve or reject members.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-warm">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Clock className="h-8 w-8 text-accent" />
            <h1 className="text-3xl font-bold text-foreground font-diary">
              Pending Requests
            </h1>
          </div>
          <p className="text-muted-foreground">
            Review and approve members who want to join your diary group
          </p>
        </div>

        <div className="space-y-6">
          {requests.length > 0 ? (
            <div className="grid gap-4">
              {requests.map((request) => (
                <Card 
                  key={request.uid}
                  className="bg-gradient-card border-accent/20 shadow-soft"
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-full bg-accent/10">
                          <User className="h-5 w-5 text-accent" />
                        </div>
                        <div>
                          <CardTitle className="text-lg font-diary">
                            {request.name}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground">
                            {request.email || "No email provided"}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className="border-accent/40 text-accent">
                        {request.role}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        Requested on {request.joinedAt.toDate().toLocaleDateString()}
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleReject(request.uid, request.name)}
                          className="border-destructive/40 text-destructive hover:bg-destructive/10"
                        >
                          <X className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleApprove(request.uid, request.name)}
                          className="bg-primary hover:bg-primary/90 text-primary-foreground"
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📭</div>
              <h3 className="text-xl font-semibold text-foreground mb-2">No pending requests</h3>
              <p className="text-muted-foreground">
                All join requests have been processed. Share your Group ID to invite new members.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PendingRequestsPage;
