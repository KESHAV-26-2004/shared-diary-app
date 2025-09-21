import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Crown, Heart, Clock } from "lucide-react";

// Member type
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
  groupId: string; // pass the current group id
}

import { db } from "@/firebase";
import { doc, getDoc } from "firebase/firestore";

const MembersPage = ({ groupId }: MembersPageProps) => {
  const [members, setMembers] = useState<Member[]>([]);

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const groupSnap = await getDoc(doc(db, "groups", groupId));
        if (groupSnap.exists()) {
          const data = groupSnap.data();
          const fetchedMembers = data?.members?.map((m: any) => ({
            uid: m.uid,
            name: m.name,
            email: m.email || "",
            role: m.role,
            approved: m.approved,
            joinedAt: m.joinedAt?.toDate ? m.joinedAt.toDate() : new Date(),
            color: Math.random() > 0.5 ? "pink" : "blue", // random color for now
          })) || [];
          setMembers(fetchedMembers);
        }
      } catch (err) {
        console.error("Error fetching members:", err);
      }
    };

    fetchMembers();
  }, [groupId]);

  const approvedMembers = members.filter(m => m.approved);
  const pendingMembers = members.filter(m => !m.approved);

  return (
    <div className="min-h-screen bg-gradient-warm">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Users className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground font-diary">
              Diary Circle
            </h1>
          </div>
          <p className="text-muted-foreground">
            The wonderful people sharing their stories
          </p>
        </div>

        <div className="space-y-8">
          {/* Approved Members */}
          <div>
            <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center space-x-2">
              <Heart className="h-5 w-5 text-primary" />
              <span>Active Members ({approvedMembers.length})</span>
            </h2>
            
            <div className="grid gap-4 md:grid-cols-2">
              {approvedMembers.map(member => (
                <Card 
                  key={member.uid}
                  className={`
                    ${member.color === "pink" ? "bg-diary-pink/60" : "bg-diary-blue/60"}
                    border-white/40 shadow-card hover:shadow-soft transition-smooth
                  `}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg font-diary flex items-center space-x-2">
                        <span>{member.name}</span>
                        {member.role === "admin" && <Crown className="h-4 w-4 text-accent" />}
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
                {pendingMembers.map(member => (
                  <Card key={member.uid} className="bg-accent/10 border-accent/30 shadow-card">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg font-diary">{member.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-sm text-muted-foreground mb-2">{member.email}</p>
                      <Badge variant="outline" className="border-accent/40 text-accent">
                        Awaiting approval
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {members.length === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">👥</div>
              <h3 className="text-xl font-semibold text-foreground mb-2">No members yet</h3>
              <p className="text-muted-foreground">Invite friends to start building your diary circle</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MembersPage;
