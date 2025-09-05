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
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenuAction,
  SidebarOverlay,
  SidebarRail,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
import { MoreHorizontal, PlusCircle, Search, Trash2, Edit, Coins, Bot, Moon, Sun, LogOut, LogIn, ChevronLeft } from 'lucide-react';
import { maintainSessionMemory } from '@/ai/flows/maintain-session-memory';
import { generateChatTitle } from '@/ai/flows/generate-chat-title';
import { Avatar, AvatarFallback } from './ui/avatar';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/hooks/use-auth';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const defaultRelations: Relation[] = ['GF', 'BF', 'Friend'];
const defaultTones: Tone[] = ['Friendly', 'Flirty', 'Rizz', 'Romantic'];

export default function ChatLayout() {
  const { user, userProfile, loading, logout } = useAuth();
  const router = useRouter();

  const [sessions, setSessions] = useLocalStorage<ChatSession[]>('chat-sessions', []);
  const [activeSessionId, setActiveSessionId] = useLocalStorage<string | null>('active-session-id', null);
  
  const credits = userProfile?.credits ?? 0;
  const resetTimestamp = userProfile?.creditResetTimestamp ?? null;

  const [searchQuery, setSearchQuery] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isCreditDialogOpen, setIsCreditDialogOpen] = useState(false);
  const [renameDialog, setRenameDialog] = useState<{ open: boolean; session: ChatSession | null }>({ open: false, session: null });
  const [newTitle, setNewTitle] = useState('');
  
  const { theme, toggleTheme } = useTheme();

  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);


  const activeSession = useMemo(() => sessions.find(s => s.id === activeSessionId), [sessions, activeSessionId]);
  
  const filteredSessions = useMemo(() =>
    sessions
      .filter(s => s.title.toLowerCase().includes(searchQuery.toLowerCase()))
      .sort((a, b) => b.createdAt - a.createdAt),
    [sessions, searchQuery]
  );
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeSession?.messages]);

  useEffect(() => {
    const checkCreditReset = async () => {
      if (!user) return;
      
      const now = new Date().getTime();
      
      if (credits === 0 && !resetTimestamp) {
        const newTimestamp = now + 24 * 60 * 60 * 1000;
        await setDoc(doc(db, 'users', user.uid), { creditResetTimestamp: newTimestamp }, { merge: true });
      } else if (credits > 0 && resetTimestamp) {
        await setDoc(doc(db, 'users', user.uid), { creditResetTimestamp: null }, { merge: true });
      } else if (resetTimestamp && now > resetTimestamp) {
        await setDoc(doc(db, 'users', user.uid), { credits: 15, creditResetTimestamp: null }, { merge: true });
      }
    };
    
    checkCreditReset();
    const interval = setInterval(checkCreditReset, 1000 * 60);
    return () => clearInterval(interval);
  }, [credits, resetTimestamp, user]);

  const handleNewChat = useCallback(() => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: 'New Chat',
      messages: [],
      relation: 'Friend',
      tone: 'Friendly',
      createdAt: Date.now(),
    };
    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
  }, [setSessions, setActiveSessionId]);
  
  useEffect(() => {
    if (!loading && user && sessions.length === 0) {
      handleNewChat();
    } else if (!activeSessionId && sessions.length > 0) {
      setActiveSessionId(sessions.sort((a,b) => b.createdAt - a.createdAt)[0].id);
    }
  }, [sessions, activeSessionId, handleNewChat, setActiveSessionId, loading, user]);
  
  const updateSession = useCallback((sessionId: string, updates: Partial<ChatSession>) => {
    setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, ...updates } : s));
  }, [setSessions]);

  const handleSendMessage = useCallback(async (text: string, image?: string) => {
    if (!activeSession || !user) return;
    if (credits <= 0) {
      toast({ title: 'Out of Credits', description: 'Please wait for the daily reset or buy more credits.', variant: 'destructive' });
      setIsCreditDialogOpen(true);
      return;
    }
  
    setIsSending(true);
    const userMessage: Message = { id: Date.now().toString(), text, sender: 'user', image };
    
    // Check if it's the first message and generate title
    const isFirstMessage = activeSession.messages.length === 0;

    const loadingMessage: Message = { id: (Date.now() + 1).toString(), text: '', sender: 'ai', isProcessing: true };
    const updatedMessages = [...activeSession.messages, userMessage];
    updateSession(activeSession.id, { messages: [...updatedMessages, loadingMessage] });
  
    try {
      if (isFirstMessage) {
        generateChatTitle({ firstUserMessage: text }).then(({ title }) => {
          updateSession(activeSession.id, { title });
        });
      }
  
      const response = await maintainSessionMemory({
        relation: activeSession.relation,
        tone: activeSession.tone,
        history: updatedMessages,
        currentMessage: text,
        userId: user.uid,
        ...(image && { image: image }),
      });
      
      const aiMessage: Message = { 
        id: Date.now().toString(), 
        text: response.response, 
        sender: 'ai',
        explanation: response.explanation
      };
      
      setSessions(prev => prev.map(s => {
        if (s.id === activeSession.id) {
          // Make sure to not lose the potentially updated title
          const currentSession = prev.find(p => p.id === activeSessionId) || s;
          return { ...currentSession, messages: [...updatedMessages, aiMessage] };
        }
        return s;
      }));
    } catch (error: any) {
      toast({ 
        title: 'Error Generating Response', 
        description: error.message || 'An unknown error occurred.', 
        variant: 'destructive' 
      });
      setSessions(prev => prev.map(s => s.id === activeSession.id ? { ...s, messages: updatedMessages } : s));
    } finally {
      setIsSending(false);
    }
  }, [activeSession, credits, toast, updateSession, activeSessionId, user]);

  const handleRename = () => {
    if (renameDialog.session && newTitle.trim()) {
      updateSession(renameDialog.session.id, { title: newTitle.trim() });
      setRenameDialog({ open: false, session: null });
      setNewTitle('');
    }
  };

  const handleDelete = (sessionId: string) => {
    setSessions(sessions.filter(s => s.id !== sessionId));
    if (activeSessionId === sessionId) {
      setActiveSessionId(sessions.length > 1 ? sessions.filter(s => s.id !== sessionId)[0].id : null);
    }
  };

  if (loading || !user) {
    return <div className="flex h-screen w-full items-center justify-center">Loading...</div>;
  }

  return (
    <SidebarProvider defaultOpen={false}>
      <div className="flex min-h-screen">
        <Sidebar collapsible="offcanvas">
          <SidebarRail className="group-data-[state=expanded]:bg-background group-data-[state=expanded]:hover:bg-accent group-data-[state=expanded]:text-foreground">
            <ChevronLeft className="size-4 transition-transform duration-200 group-data-[state=collapsed]:rotate-180" />
          </SidebarRail>
           <SidebarHeader>
             <Button variant="outline" className="w-full border-dashed rounded-lg" onClick={handleNewChat}><PlusCircle className="mr-2" /> <span className="group-data-[collapsible=icon]:hidden">New Chat</span></Button>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupContent>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search chats..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9 group-data-[collapsible=icon]:hidden bg-transparent rounded-lg"/>
                </div>
              </SidebarGroupContent>
            </SidebarGroup>
            <SidebarMenu>
              {filteredSessions.map(session => (
                <SidebarMenuItem key={session.id} className="mx-2">
                  <SidebarMenuButton
                    isActive={session.id === activeSessionId}
                    onClick={() => setActiveSessionId(session.id)}
                    tooltip={{ children: session.title, side: 'right' }}
                    className="data-[active=true]:bg-sidebar-accent rounded-lg"
                  >
                    <span className="truncate">{session.title}</span>
                  </SidebarMenuButton>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <SidebarMenuAction showOnHover>
                        <MoreHorizontal />
                      </SidebarMenuAction>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent side="right">
                      <DropdownMenuItem onClick={() => { setNewTitle(session.title); setRenameDialog({ open: true, session }); }}>
                        <Edit className="mr-2 h-4 w-4" /> Rename
                      </DropdownMenuItem>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                            <Trash2 className="mr-2 h-4 w-4 text-destructive" /> <span className="text-destructive">Delete</span>
                          </DropdownMenuItem>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete the chat "{session.title}".
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(session.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter>
             <div className="flex flex-col gap-2 p-2 group-data-[collapsible=icon]:hidden">
              {user ? (
                <div className="flex items-center gap-2 p-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {user.email?.[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <p className="font-semibold truncate">{user.email}</p>
                  <Button variant="ghost" size="icon" onClick={logout} className="ml-auto">
                    <LogOut />
                  </Button>
                </div>
              ) : (
                 <Button onClick={() => router.push('/login')}>
                  <LogIn className="mr-2" /> Login
                </Button>
              )}
            </div>
          </SidebarFooter>
        </Sidebar>
        <SidebarOverlay />
        <SidebarInset>
          <header className="flex items-center justify-between p-2 border-b">
            <div className="flex items-center gap-2">
              <SidebarTrigger />
              <h2 className="font-headline text-xl">ChatAI</h2>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Relation:</span>
                <Select value={activeSession?.relation || 'Friend'} onValueChange={(v: Relation) => activeSession && updateSession(activeSession.id, { relation: v })}>
                  <SelectTrigger className="w-[120px] font-headline"><SelectValue placeholder="Relation" /></SelectTrigger>
                  <SelectContent>
                    {defaultRelations.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Tone:</span>
                <Select value={activeSession?.tone || 'Friendly'} onValueChange={(v: Tone) => activeSession && updateSession(activeSession.id, { tone: v })}>
                  <SelectTrigger className="w-[150px] font-headline"><SelectValue placeholder="Tone" /></SelectTrigger>
                  <SelectContent>
                    {defaultTones.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Button variant="outline" onClick={() => setIsCreditDialogOpen(true)}>
                <Coins className="mr-2" /> {credits} Credits
              </Button>
              <Button variant="ghost" size="icon" onClick={toggleTheme}>
                {theme === 'dark' ? <Sun /> : <Moon />}
              </Button>
            </div>
          </header>
          
          <main className="flex-1 overflow-y-auto p-4 space-y-4">
            {activeSession ? (
              <>
                {activeSession.messages.map(message => <ChatMessage key={message.id} message={message} />)}
                 <div ref={messagesEndRef} />
              </>
            ) : (
               <div className="flex flex-col items-center justify-center h-full text-center">
                  <Bot size={64} className="text-muted-foreground" />
                  <h2 className="mt-4 text-2xl font-headline">Welcome to ChatAI</h2>
                  <p className="mt-2 text-muted-foreground">Unlock your inner charmer.</p>
                </div>
            )}
          </main>
          
          {activeSession && <ChatInput onSendMessage={handleSendMessage} isSending={isSending} />}
        </SidebarInset>
      </div>

      <CreditDialog open={isCreditDialogOpen} onOpenChange={setIsCreditDialogOpen} credits={credits} resetTimestamp={resetTimestamp} />

      <Dialog open={renameDialog.open} onOpenChange={(open) => setRenameDialog({ open, session: renameDialog.session })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Chat</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Label htmlFor="chat-title">New Title</Label>
            <Input id="chat-title" value={newTitle} onChange={e => setNewTitle(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameDialog({ open: false, session: null })}>Cancel</Button>
            <Button onClick={handleRename}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}
