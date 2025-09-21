import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PenTool, Sparkles, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Firebase
import { db, auth } from "@/firebase";
import { collection, addDoc, serverTimestamp, getDoc, doc } from "firebase/firestore";

interface AddEntryPageProps {
  groupId: string; // Required to save in correct group
  onAddEntry?: (text: string) => void;
}

const emojiList = ["😊", "😢", "😡", "✨", "❤️", "😴"];

const AddEntryPage = ({ groupId, onAddEntry }: AddEntryPageProps) => {
  const [entryText, setEntryText] = useState("");
  const [selectedEmoji, setSelectedEmoji] = useState("✨");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!entryText.trim()) return;

  setIsSubmitting(true);

  try {
    const user = auth.currentUser;
    if (!user) throw new Error("User not logged in");

    // Fetch display name from Firestore
    const userDoc = await getDoc(doc(db, "user", user.uid));
    const userData = userDoc.data() as { name?: string } | undefined;
    const displayName = userDoc.exists() ? userData?.name || "Anonymous" : "Anonymous";

    // Save to Firestore with original text + selected emoji
    await addDoc(collection(db, "diaryEntries", groupId, "entries"), {
      text: entryText,
      mood: selectedEmoji,
      user: displayName, // ✅ Use Firestore name
      uid: user.uid,
      createdAt: serverTimestamp()
    });

    if (onAddEntry) onAddEntry(entryText);

    setEntryText("");
    setSelectedEmoji("✨");
    toast({
      title: "Entry added! ✨",
      description: "Your thoughts have been shared with the group."
    });
  } catch (err: any) {
    console.error(err);
    toast({ title: "Error", description: err.message, variant: "destructive" });
  } finally {
    setIsSubmitting(false);
  }
};


  return (
    <div className="min-h-screen bg-gradient-warm">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <PenTool className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground font-diary">
              Share Your Thoughts
            </h1>
          </div>
          <p className="text-muted-foreground">
            Write about your day, feelings, or anything on your mind
          </p>
        </div>

        <Card className="bg-gradient-card border-diary-pink/20 shadow-soft">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center space-x-2">
              <Sparkles className="h-5 w-5 text-accent" />
              <span className="font-diary">New Entry</span>
            </CardTitle>
            <CardDescription>
              Choose an emoji to reflect your mood
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Textarea
                  placeholder="Dear diary, today I..."
                  value={entryText}
                  onChange={(e) => setEntryText(e.target.value)}
                  className="min-h-48 bg-white/80 border-diary-pink/30 focus:border-primary transition-smooth resize-none text-base leading-relaxed"
                  disabled={isSubmitting}
                />
              </div>

              <div className="flex items-center justify-between">
                {/* Character count on the left */}
                <div className="text-sm text-muted-foreground">
                  {entryText.length} characters
                </div>

                <div className="flex items-center space-x-2">
                  {/* Emoji selector button */}
                  <select
                    value={selectedEmoji}
                    onChange={(e) => setSelectedEmoji(e.target.value)}
                    className="bg-white/80 border-diary-pink/30 rounded px-2 py-1 text-lg"
                    disabled={isSubmitting}
                  >
                    {emojiList.map((emoji) => (
                      <option key={emoji} value={emoji}>
                        {emoji}
                      </option>
                    ))}
                  </select>

                  {/* Share Button */}
                  <Button
                    type="submit"
                    disabled={!entryText.trim() || isSubmitting}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-soft transition-smooth flex items-center space-x-2"
                  >
                    {isSubmitting ? (
                      <>
                        <Sparkles className="h-4 w-4 animate-spin" />
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        <span>Share Entry</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </form>

            <div className="mt-4 text-center">
              <div className="text-xs text-muted-foreground opacity-40">
                Shared Diary 💌
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AddEntryPage;
