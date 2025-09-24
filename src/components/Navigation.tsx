import { Heart, Home, Plus, Book, LogOut, Users, Copy, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface NavigationProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  groupId?: string;
  userRole?: "admin" | "member";
}

const Navigation = ({ currentPage, onNavigate, groupId, userRole }: NavigationProps) => {
  const { toast } = useToast();
  
  const navItems = [
    { id: "timeline", label: "Home", icon: Home },
    { id: "add-entry", label: "Add Entry", icon: Plus },
    { id: "view-diary", label: "View Diary", icon: Book },
    { id: "members", label: "Members", icon: Users },
    ...(userRole === "admin" ? [{ id: "pending-requests", label: "Requests", icon: Clock }] : []),
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

  return (
    <nav className="bg-gradient-card border-b border-diary-pink/30 px-6 py-4 shadow-card">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center justify-between flex-1">
          <div className="flex items-center space-x-2">
            {/* Hide both icon and title on small screens */}
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
                {/* On phones → only show ID; on sm+ → show "Group: ID" */}
                <span className="sm:hidden">{groupId}</span>
                <span className="hidden sm:inline">Group: {groupId}</span>
              </Badge>
            </div>
          )}
        </div>
        
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
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigate("login")}
            className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-smooth ml-4"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;