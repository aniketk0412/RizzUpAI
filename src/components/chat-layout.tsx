'use client';

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarTrigger,
  SidebarInset,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenuAction,
  SidebarOverlay,
  SidebarRail,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
} from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useLocalStorage } from '@/hooks/use-local-storage';
import type { ChatSession, Message, Relation, Tone } from '@/types';
import ChatMessage from './chat-message';
import ChatInput from './chat-input';
import CreditDialog from './credit-dialog';
import {
  MoreHorizontal,
  Plus,
  Search,
  Trash2,
  Edit,
  Flame,
  Moon,
  Sun,
  LogOut,
  ChevronLeft,
  Sparkles,
  ArrowUpRight,
} from 'lucide-react';
import { maintainSessionMemory } from '@/ai/flows/maintain-session-memory';
import { generateChatTitle } from '@/ai/flows/generate-chat-title';
import { Avatar, AvatarFallback } from './ui/avatar';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/hooks/use-auth';
import {
  fetchUserSessions,
  createDbChatSession,
  updateDbChatSession,
  deleteDbChatSession,
  saveDbChatMessage,
} from '@/actions/chat-actions';
import { cn } from '@/lib/utils';

const defaultRelations: { value: Relation; label: string }[] = [
  { value: 'Crush', label: 'Crush / Match' },
  { value: 'GF', label: 'GF' },
  { value: 'BF', label: 'BF' },
  { value: 'Friend', label: 'Friend' },
];

const defaultTones: { value: Tone; label: string }[] = [
  { value: 'Flirty', label: 'Flirty' },
  { value: 'Rizz', label: 'High Rizz' },
  { value: 'Romantic', label: 'Romantic' },
  { value: 'Friendly', label: 'Playful' },
];

const quickStarters = [
  {
    tag: 'Hinge · Match',
    prompt: 'be honest did you just say you like matcha to impress me',
    relation: 'Crush' as Relation,
    tone: 'Flirty' as Tone,
  },
  {
    tag: 'IG DM · Late Night',
    prompt: 'i can’t sleep, entertain me',
    relation: 'Crush' as Relation,
    tone: 'Rizz' as Tone,
  },
  {
    tag: 'iMessage · Reschedule',
    prompt: 'my week is kinda crazy tbh, maybe next week?',
    relation: 'Crush' as Relation,
    tone: 'Flirty' as Tone,
  },
  {
    tag: 'Partner · Check-in',
    prompt: 'long day at work today i’m so drained',
    relation: 'GF' as Relation,
    tone: 'Romantic' as Tone,
  },
];

export default function ChatLayout() {
  const { user, userProfile, loading, logout, refreshProfile, updateLocalCredits } = useAuth();
  const router = useRouter();

  const [sessions, setSessions] = useLocalStorage<ChatSession[]>('chat-sessions', []);
  const [activeSessionId, setActiveSessionId] = useLocalStorage<string | null>('active-session-id', null);
  const [dbSynced, setDbSynced] = useState(false);

  const credits = userProfile?.credits ?? 0;
  const resetTimestamp = userProfile?.creditResetTimestamp ?? null;

  const [searchQuery, setSearchQuery] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isCreditDialogOpen, setIsCreditDialogOpen] = useState(false);
  const [renameDialog, setRenameDialog] = useState<{ open: boolean; session: ChatSession | null }>({
    open: false,
    session: null,
  });
  const [newTitle, setNewTitle] = useState('');

  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!user || dbSynced) return;
    fetchUserSessions()
      .then((dbSessions) => {
        if (dbSessions && dbSessions.length > 0) {
          setSessions(dbSessions);
          setActiveSessionId(dbSessions[0].id);
        }
      })
      .catch((err) => console.error('DB session fetch error:', err))
      .finally(() => setDbSynced(true));
  }, [user, dbSynced, setSessions, setActiveSessionId]);

  const activeSession = useMemo(
    () => sessions.find((s) => s.id === activeSessionId),
    [sessions, activeSessionId]
  );

  const filteredSessions = useMemo(
    () =>
      sessions
        .filter((s) => s.title.toLowerCase().includes(searchQuery.toLowerCase()))
        .sort((a, b) => b.createdAt - a.createdAt),
    [sessions, searchQuery]
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeSession?.messages]);

  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      refreshProfile();
    }, 60 * 1000);
    return () => clearInterval(interval);
  }, [user, refreshProfile]);

  const handleNewChat = useCallback(() => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: 'New Session',
      messages: [],
      relation: 'Crush',
      tone: 'Flirty',
      createdAt: Date.now(),
    };
    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
    createDbChatSession(newSession).catch(() => {});
  }, [setSessions, setActiveSessionId]);

  useEffect(() => {
    if (!loading && user && sessions.length === 0) {
      handleNewChat();
    } else if (!activeSessionId && sessions.length > 0) {
      setActiveSessionId(sessions.sort((a, b) => b.createdAt - a.createdAt)[0].id);
    }
  }, [sessions, activeSessionId, handleNewChat, setActiveSessionId, loading, user]);

  const updateSession = useCallback(
    (sessionId: string, updates: Partial<ChatSession>) => {
      setSessions((prev) => prev.map((s) => (s.id === sessionId ? { ...s, ...updates } : s)));
      if (updates.title || updates.relation || updates.tone) {
        updateDbChatSession(sessionId, {
          ...(updates.title && { title: updates.title }),
          ...(updates.relation && { relation: updates.relation }),
          ...(updates.tone && { tone: updates.tone }),
        }).catch(() => {});
      }
    },
    [setSessions]
  );

  const handleSendMessage = useCallback(
    async (text: string, image?: string) => {
      if (!activeSession || !user) return;
      if (credits <= 0) {
        toast({
          title: 'Out of Credits',
          description: 'Please wait for the daily reset or top up your credits.',
          variant: 'destructive',
        });
        setIsCreditDialogOpen(true);
        return;
      }

      setIsSending(true);
      const userMessage: Message = { id: Date.now().toString(), text, sender: 'user', image };
      const isFirstMessage = activeSession.messages.length === 0;

      const loadingMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: '',
        sender: 'ai',
        isProcessing: true,
      };
      const updatedMessages = [...activeSession.messages, userMessage];
      updateSession(activeSession.id, { messages: [...updatedMessages, loadingMessage] });
      saveDbChatMessage(activeSession.id, userMessage).catch(() => {});

      try {
        if (isFirstMessage && text) {
          generateChatTitle({ firstUserMessage: text }).then(({ title }) => {
            updateSession(activeSession.id, { title });
          });
        }

        const response = await maintainSessionMemory({
          relation: activeSession.relation,
          tone: activeSession.tone,
          currentMessage: text,
          userId: user.uid,
          ...(image && { image }),
        });

        if (typeof response.remainingCredits === 'number') {
          updateLocalCredits(response.remainingCredits);
        } else {
          updateLocalCredits(Math.max(0, credits - 1));
        }

        const defaultOptionIndex = response.options && response.options.length > 1 ? 1 : 0;
        const aiMessage: Message = {
          id: Date.now().toString(),
          text: response.options?.[defaultOptionIndex]?.text || response.response,
          sender: 'ai',
          explanation: response.explanation,
          options: response.options,
        };

        saveDbChatMessage(activeSession.id, aiMessage).catch(() => {});

        setSessions((prev) =>
          prev.map((s) => {
            if (s.id === activeSession.id) {
              const currentSession = prev.find((p) => p.id === activeSessionId) || s;
              return { ...currentSession, messages: [...updatedMessages, aiMessage] };
            }
            return s;
          })
        );
      } catch (error: any) {
        toast({
          title: 'Error Generating Replies',
          description: error.message || 'An unknown error occurred.',
          variant: 'destructive',
        });
        setSessions((prev) =>
          prev.map((s) => (s.id === activeSession.id ? { ...s, messages: updatedMessages } : s))
        );
      } finally {
        setIsSending(false);
      }
    },
    [activeSession, credits, toast, updateSession, activeSessionId, user, updateLocalCredits, setSessions]
  );

  const handleRename = () => {
    if (renameDialog.session && newTitle.trim()) {
      updateSession(renameDialog.session.id, { title: newTitle.trim() });
      setRenameDialog({ open: false, session: null });
      setNewTitle('');
    }
  };

  const handleDelete = (sessionId: string) => {
    setSessions(sessions.filter((s) => s.id !== sessionId));
    deleteDbChatSession(sessionId).catch(() => {});
    if (activeSessionId === sessionId) {
      setActiveSessionId(
        sessions.length > 1 ? sessions.filter((s) => s.id !== sessionId)[0].id : null
      );
    }
  };

  if (loading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex items-center gap-3 font-code text-xs uppercase tracking-widest text-muted-foreground">
          <div className="h-2.5 w-2.5 rounded-full bg-primary animate-ping" />
          Loading Studio...
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider defaultOpen={false}>
      <div className="flex h-dvh w-full overflow-hidden bg-background">
        <Sidebar collapsible="offcanvas" className="border-r border-border/70">
          <SidebarRail className="group-data-[state=expanded]:bg-background group-data-[state=expanded]:hover:bg-accent group-data-[state=expanded]:text-foreground">
            <ChevronLeft className="size-4 transition-transform duration-200 group-data-[state=collapsed]:rotate-180" />
          </SidebarRail>

          <SidebarHeader className="p-3">
            <Button
              variant="outline"
              className="w-full justify-start gap-2 rounded-xl border-border/80 bg-card hover:bg-accent font-medium text-xs h-10"
              onClick={handleNewChat}
            >
              <Plus className="h-4 w-4 text-primary" />
              <span className="group-data-[collapsible=icon]:hidden">New Session</span>
            </Button>
          </SidebarHeader>

          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupContent>
                <div className="relative px-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Filter history..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 h-9 text-xs group-data-[collapsible=icon]:hidden bg-card/60 rounded-xl border-border/70"
                  />
                </div>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarMenu className="space-y-0.5 px-2">
              {filteredSessions.map((session) => (
                <SidebarMenuItem key={session.id}>
                  <SidebarMenuButton
                    isActive={session.id === activeSessionId}
                    onClick={() => setActiveSessionId(session.id)}
                    tooltip={{ children: session.title, side: 'right' }}
                    className="data-[active=true]:bg-sidebar-accent rounded-xl text-xs h-9"
                  >
                    <span className="truncate">{session.title}</span>
                  </SidebarMenuButton>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <SidebarMenuAction showOnHover>
                        <MoreHorizontal className="h-4 w-4" />
                      </SidebarMenuAction>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent side="right" className="rounded-xl">
                      <DropdownMenuItem
                        onClick={() => {
                          setNewTitle(session.title);
                          setRenameDialog({ open: true, session });
                        }}
                      >
                        <Edit className="mr-2 h-3.5 w-3.5" /> Rename
                      </DropdownMenuItem>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                            <Trash2 className="mr-2 h-3.5 w-3.5 text-destructive" />
                            <span className="text-destructive">Delete</span>
                          </DropdownMenuItem>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="rounded-2xl">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="font-headline text-2xl">
                              Delete Session?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently remove &ldquo;{session.title}&rdquo;.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(session.id)}
                              className="rounded-xl bg-destructive hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>

          <SidebarFooter className="border-t border-border/60 p-3">
            <div className="flex items-center gap-2.5 group-data-[collapsible=icon]:hidden">
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarFallback className="rounded-lg bg-primary text-primary-foreground font-code text-xs">
                  {user.email?.[0]?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{user.email}</p>
                <p className="font-code text-[10px] text-muted-foreground">{credits} credits left</p>
              </div>
              <Button variant="ghost" size="icon" onClick={logout} className="h-8 w-8 rounded-lg">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </SidebarFooter>
        </Sidebar>

        <SidebarOverlay />

        <SidebarInset className="flex flex-1 flex-col h-dvh overflow-hidden">
          {/* Top Bar + Calibrator Pills */}
          <header className="shrink-0 z-20 border-b border-border/70 bg-background/85 backdrop-blur-md">
            <div className="max-w-4xl mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <SidebarTrigger className="h-8 w-8 rounded-lg" />
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center text-primary-foreground shadow-sm">
                    <Flame className="h-4 w-4 fill-current" />
                  </div>
                  <span className="font-headline text-2xl tracking-tight">RizzUp</span>
                </div>
              </div>

              {/* Tactile Pill Selectors */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center rounded-xl border border-border/80 bg-card p-1 gap-0.5">
                  <span className="font-code text-[10px] uppercase tracking-wider text-muted-foreground px-2 hidden sm:inline">
                    Who:
                  </span>
                  {defaultRelations.map((rel) => {
                    const active = (activeSession?.relation || 'Crush') === rel.value;
                    return (
                      <button
                        key={rel.value}
                        type="button"
                        onClick={() =>
                          activeSession && updateSession(activeSession.id, { relation: rel.value })
                        }
                        className={cn(
                          'px-2.5 py-1 rounded-lg text-xs font-medium transition-all',
                          active
                            ? 'bg-primary text-primary-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                        )}
                      >
                        {rel.label}
                      </button>
                    );
                  })}
                </div>

                <div className="inline-flex items-center rounded-xl border border-border/80 bg-card p-1 gap-0.5">
                  <span className="font-code text-[10px] uppercase tracking-wider text-muted-foreground px-2 hidden sm:inline">
                    Vibe:
                  </span>
                  {defaultTones.map((t) => {
                    const active = (activeSession?.tone || 'Flirty') === t.value;
                    return (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() =>
                          activeSession && updateSession(activeSession.id, { tone: t.value })
                        }
                        className={cn(
                          'px-2.5 py-1 rounded-lg text-xs font-medium transition-all',
                          active
                            ? 'bg-foreground text-background shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                        )}
                      >
                        {t.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Right Actions */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCreditDialogOpen(true)}
                  className="h-8 rounded-xl border-border/80 bg-card font-code text-xs gap-1.5"
                >
                  <span className="h-2 w-2 rounded-full bg-primary" />
                  {credits} <span className="hidden sm:inline">LEFT</span>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleTheme}
                  className="h-8 w-8 rounded-xl"
                >
                  {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </header>

          {/* Main Flex Workspace — Scrolls internally only when needed */}
          <main className="flex-1 overflow-y-auto px-4 py-4 flex flex-col">
            <div className="max-w-3xl w-full mx-auto flex-1 flex flex-col">
              {activeSession && activeSession.messages.length > 0 ? (
                <div className="flex flex-col gap-6 py-2">
                  {activeSession.messages.map((message) => (
                    <ChatMessage key={message.id} message={message} />
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              ) : (
                /* Empty State — Flex Centered, No Page Overflow */
                <div className="my-auto flex flex-col gap-6 py-4">
                  <div className="space-y-2 max-w-lg">
                    <h1 className="font-headline text-3xl sm:text-4xl tracking-tight leading-[1.06]">
                      What did they <span className="italic text-primary">send you</span>?
                    </h1>
                    <p className="text-sm text-muted-foreground">
                      Paste their text below, drop a screenshot, or tap a message to test it out.
                    </p>
                  </div>

                  <div className="flex flex-col gap-2">
                    <span className="text-xs text-muted-foreground px-0.5">
                      Try a sample incoming text
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {quickStarters.map((item, i) => (
                        <button
                          key={i}
                          type="button"
                          disabled={isSending}
                          onClick={() => {
                            if (activeSession) {
                              updateSession(activeSession.id, {
                                relation: item.relation,
                                tone: item.tone,
                              });
                            }
                            handleSendMessage(item.prompt);
                          }}
                          className="group flex items-center justify-between gap-3 text-left rounded-xl border border-border/75 bg-card/85 hover:border-primary/60 hover:bg-card px-3.5 py-3 transition-all"
                        >
                          <div className="flex flex-col gap-1 min-w-0">
                            <span className="text-[11px] font-medium text-muted-foreground">
                              {item.tag}
                            </span>
                            <p className="text-[13px] font-medium text-foreground truncate">
                              “{item.prompt}”
                            </p>
                          </div>
                          <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-primary transition-colors" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </main>

          {activeSession && <ChatInput onSendMessage={handleSendMessage} isSending={isSending} />}
        </SidebarInset>
      </div>

      <CreditDialog
        open={isCreditDialogOpen}
        onOpenChange={setIsCreditDialogOpen}
        credits={credits}
        resetTimestamp={resetTimestamp}
      />

      <Dialog
        open={renameDialog.open}
        onOpenChange={(open) => setRenameDialog({ open, session: renameDialog.session })}
      >
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-headline text-2xl">Rename Session</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-3">
            <Label htmlFor="chat-title" className="text-xs">
              Session Title
            </Label>
            <Input
              id="chat-title"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="rounded-xl"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRenameDialog({ open: false, session: null })}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button onClick={handleRename} className="rounded-xl">
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}
