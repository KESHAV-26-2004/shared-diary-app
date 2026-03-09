//src/components/TimelinePage.tsx
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Sparkles } from "lucide-react";
import { auth, db } from "@/firebase";
import {
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  startAfter,
  DocumentData,
  QueryDocumentSnapshot
} from "firebase/firestore";
import { decryptEntry } from "@/lib/crypto";

interface DiaryEntry {
  id: string;
  user: string;
  text: string;
  mood: string;
  date: string;
  userColor: "pink" | "blue";
}

interface TimelinePageProps {
  groupId: string;
  groupKey: string;
}

const TimelinePage = ({ groupId, groupKey }: TimelinePageProps) => {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    if (!groupId || !groupKey) return;

    setEntries([]);
    setLastDoc(null);
    setHasMore(true);

    const loadEntries = async () => {

      setLoading(true);

      const q = query(
        collection(db, "groups", groupId, "entries"),
        orderBy("createdAt", "desc"),
        limit(20)
      );

      const snapshot = await getDocs(q);

      const fetchedEntries: DiaryEntry[] = await Promise.all(snapshot.docs.map(async (doc) => {

        const data = doc.data();

        return {
          id: doc.id,
          user: data.user,
          text: await decryptEntry(data.text, groupKey),
          mood: data.mood,
          date:
            data.createdAt?.toDate().toLocaleDateString("en-CA") ||
            new Date().toLocaleDateString("en-CA"),
          userColor: data.uid === auth.currentUser?.uid ? "blue" : "pink"
        };
      }));

      setEntries(fetchedEntries);
      if (snapshot.docs.length > 0) {
        setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
      }

      if (snapshot.docs.length < 20) {
        setHasMore(false);
      }

      setLoading(false);
    };

    loadEntries();

  }, [groupId, groupKey]);

  const loadMore = async () => {

    if (!lastDoc || loadingMore || !hasMore) return;

    setLoadingMore(true);

    const q = query(
      collection(db, "groups", groupId, "entries"),
      orderBy("createdAt", "desc"),
      startAfter(lastDoc),
      limit(20)
    );

    const snapshot = await getDocs(q);

    const newEntries: DiaryEntry[] = await Promise.all(snapshot.docs.map(async (doc) => {

      const data = doc.data();

      return {
        id: doc.id,
        user: data.user,
        text: await decryptEntry(data.text, groupKey),
        mood: data.mood,
        date:
          data.createdAt?.toDate().toLocaleDateString("en-CA") ||
          new Date().toLocaleDateString("en-CA"),
        userColor: data.uid === auth.currentUser?.uid ? "blue" : "pink"
      };
    }));

    setEntries((prev) => [...prev, ...newEntries]);
    if (snapshot.docs.length > 0) {
      setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
    }

    if (snapshot.docs.length < 20) {
      setHasMore(false);
    }

    setLoadingMore(false);
  };

  // Group entries by date
  const groupedEntries = entries.reduce((groups, entry) => {
    const date = entry.date;
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-warm flex items-center justify-center">
        <p className="text-muted-foreground">Loading diary...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-warm">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground font-diary mb-2">
            Your Shared Memories
          </h1>
          <p className="text-muted-foreground">
            A collection of thoughts and moments from your circle
          </p>
        </div>

        <div className="space-y-8 max-h-[80vh] overflow-y-auto px-2">
          {Object.entries(groupedEntries)
            .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
            .map(([date, dayEntries]) => (
              <div key={date} className="space-y-4">
                <div className="flex items-center space-x-2 sticky top-0 z-10 bg-gradient-warm">
                  <Badge variant="secondary" className="bg-accent/20 text-accent-foreground border-accent/30 px-3 py-1">
                    <CalendarDays className="h-3 w-3 mr-1" />
                    {formatDate(date)}
                  </Badge>
                </div>

                <div className="space-y-3">
                  {dayEntries.map((entry) => (
                    <Card key={entry.id} className={`${entry.userColor === "pink" ? "bg-diary-pink/60" : "bg-diary-blue/60"} border-white/40 shadow-card hover:shadow-soft transition-smooth backdrop-blur-sm`}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            <Sparkles className="h-4 w-4 text-primary" />
                            <span className="font-medium text-foreground font-diary">{entry.user}</span>
                            <span className="text-lg">{entry.mood}</span>
                          </div>
                        </div>
                        <p className="text-foreground leading-relaxed">{entry.text}</p>
                        <div className="mt-3 text-right">
                          <div className="text-xs text-muted-foreground opacity-40">Shared Diary 💌</div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
        </div>
        
        {Object.keys(groupedEntries).length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-xl font-semibold text-foreground mb-2">
              No entries yet
            </h3>
            <p className="text-muted-foreground">
              Start sharing your thoughts to see them appear here
            </p>
          </div>
        )}
        {hasMore && (
              <div className="text-center mt-6">
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="px-4 py-2 bg-primary text-white rounded shadow"
                >
                  {loadingMore ? "Loading..." : "Load More"}
                </button>
              </div>
            )}
      </div>
    </div>
  );
};

export default TimelinePage;
