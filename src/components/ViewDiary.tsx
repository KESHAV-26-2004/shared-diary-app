import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Sparkles } from "lucide-react";
import { db } from "@/firebase";
import { collection, onSnapshot } from "firebase/firestore";

interface DiaryEntry {
  id: string;
  user: string;
  text: string;
  mood: string;
  createdAt: Date;
  userColor: "pink" | "blue";
}

interface ViewDiaryPageProps {
  groupId: string;
}

const moods = ["😊", "😢", "😡", "✨", "❤️", "😴"];

const ViewDiaryPage = ({ groupId }: ViewDiaryPageProps) => {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<DiaryEntry[]>([]);
  const [filterUser, setFilterUser] = useState<string>("All");
  const [filterMood, setFilterMood] = useState<string>("All");
  const [filterDate, setFilterDate] = useState<string>(""); // YYYY-MM-DD
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");

  // Fetch all entries once
  useEffect(() => {
    if (!groupId) return;

    const unsubscribe = onSnapshot(
      collection(db, "diaryEntries", groupId, "entries"),
      (snapshot) => {
        const fetchedEntries: DiaryEntry[] = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            user: data.user,
            text: data.text,
            mood: data.mood,
            createdAt: data.createdAt?.toDate() || new Date(),
            userColor: Math.random() > 0.5 ? "pink" : "blue",
          };
        });
        setEntries(fetchedEntries);
      },
      (error) => console.error(error)
    );

    return () => unsubscribe();
  }, [groupId]);

  // Apply filters and sorting
  useEffect(() => {
    let temp = [...entries];

    if (filterUser !== "All") temp = temp.filter((e) => e.user === filterUser);
    if (filterMood !== "All") temp = temp.filter((e) => e.mood === filterMood);
    if (filterDate) temp = temp.filter(
      (e) => e.createdAt.toLocaleDateString("en-CA") === filterDate
    );

    temp.sort((a, b) =>
      sortOrder === "asc"
        ? a.createdAt.getTime() - b.createdAt.getTime()
        : b.createdAt.getTime() - a.createdAt.getTime()
    );

    setFilteredEntries(temp);
  }, [entries, filterUser, filterMood, filterDate, sortOrder]);

  // Get list of users for filter dropdown
  const users = Array.from(new Set(entries.map((e) => e.user)));

  // Group by date
  const groupedEntries = filteredEntries.reduce((groups, entry) => {
    const date = entry.createdAt.toLocaleDateString("en-CA");
    if (!groups[date]) groups[date] = [];
    groups[date].push(entry);
    return groups;
  }, {} as Record<string, DiaryEntry[]>);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatDisplayDate = (isoDate: string) => {
    if (!isoDate) return "";
    const [year, month, day] = isoDate.split("-");
    return `${day}-${month}-${year}`;
  };


  return (
    <div className="min-h-screen bg-gradient-warm">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground font-diary mb-2">
            View Diary
          </h1>
          <p className="text-muted-foreground">
            Browse and filter diary entries from your circle
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center justify-between mb-6 gap-2">
          {/* User Filter */}
          <select
            className="bg-white/80 border-diary-pink/30 rounded px-2 py-1"
            value={filterUser}
            onChange={(e) => setFilterUser(e.target.value)}
          >
            <option value="All">All Users</option>
            {users.map((u) => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>

          {/* Mood Filter */}
          <select
            className="bg-white/80 border-diary-pink/30 rounded px-2 py-1"
            value={filterMood}
            onChange={(e) => setFilterMood(e.target.value)}
          >
            <option value="All">All Moods</option>
            {moods.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>

          {/* Date Filter */}
          <input
            type="date"
            className="bg-white/80 border-diary-pink/30 rounded px-2 py-1"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
          />

          {/* Sort */}
          <select
            className="bg-white/80 border-diary-pink/30 rounded px-2 py-1"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as "asc" | "desc")}
          >
            <option value="desc">Newest First</option>
            <option value="asc">Oldest First</option>
          </select>
        </div>

        <div className="space-y-8">
          {Object.entries(groupedEntries)
            .sort(
              ([a], [b]) => new Date(b).getTime() - new Date(a).getTime()
            )
            .map(([date, dayEntries]) => (
              <div key={date} className="space-y-4">
                <div className="flex items-center space-x-2 sticky top-4 z-10">
                  <Badge
                    variant="secondary"
                    className="bg-accent/20 text-accent-foreground border-accent/30 px-3 py-1"
                  >
                    <CalendarDays className="h-3 w-3 mr-1" />
                    {formatDisplayDate(date)} 
                  </Badge>
                </div>

                <div className="space-y-3">
                  {dayEntries.map((entry) => (
                    <Card
                      key={entry.id}
                      className={`
                        ${entry.userColor === "pink" ? "bg-diary-pink/60" : "bg-diary-blue/60"}
                        border-white/40 shadow-card hover:shadow-soft transition-smooth
                        backdrop-blur-sm
                      `}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            <Sparkles className="h-4 w-4 text-primary" />
                            <span className="font-medium text-foreground font-diary">
                              {entry.user}
                            </span>
                            <span className="text-lg">{entry.mood}</span>
                          </div>
                        </div>

                        <p className="text-foreground leading-relaxed">
                          {entry.text}
                        </p>

                        <div className="mt-3 text-right">
                          <div className="text-xs text-muted-foreground opacity-40">
                            Shared Diary 💌
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
        </div>

        {filteredEntries.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-xl font-semibold text-foreground mb-2">
              No entries found
            </h3>
            <p className="text-muted-foreground">
              Adjust your filters to see diary entries
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ViewDiaryPage;
