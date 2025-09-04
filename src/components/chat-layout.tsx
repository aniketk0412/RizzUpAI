'use client';

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
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
import { MoreHorizontal, PlusCircle, Search, Trash2, Edit, Coins, Bot } from 'lucide-react';
import { maintainSessionMemory } from '@/ai/flows/maintain-session-memory';
import { generateChatTitle } from '@/ai/flows/generate-chat-title';

const defaultRelations: Relation[] = ['GF', 'BF', 'Friend'];
const defaultTones: Tone[] = ['Friendly', 'Flirty', 'Rizz', 'Romantic'];

export default function ChatLayout() {
  const [sessions, setSessions] = useLocalStorage<ChatSession[]>('chat-sessions', []);
  const [activeSessionId, setActiveSessionId] = useLocalStorage<string | null>('active-session-id', null);
  const [credits, setCredits] = useLocalStorage<number>('user-credits', 15);
  const [resetTimestamp, setResetTimestamp] = useLocalStorage<number | null>('credit-reset-timestamp', null);

  const [searchQuery, setSearchQuery] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isCreditDialogOpen, setIsCreditDialogOpen] = useState(false);
  const [renameDialog, setRenameDialog] = useState<{ open: boolean; session: ChatSession | null }>({ open: false, session: null });
  const [newTitle, setNewTitle] = useState('');

  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
    if (credits === 0 && !resetTimestamp) {
      setResetTimestamp(new Date().getTime() + 24 * 60 * 60 * 1000);
    } else if (credits > 0 && resetTimestamp) {
      setResetTimestamp(null);
    }
  }, [credits, resetTimestamp]);
  
  const handleNewChat = () => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: 'New Chat',
      messages: [],
      relation: 'Friend',
      tone: 'Friendly',
      createdAt: Date.now(),
    };
    setSessions([newSession, ...sessions]);
    setActiveSessionId(newSession.id);
  };
  
  const updateSession = useCallback((sessionId: string, updates: Partial<ChatSession>) => {
    setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, ...updates } : s));
  }, [setSessions]);

  const handleSendMessage = useCallback(async (text: string, image?: string) => {
    if (!activeSession) return;
    if (credits <= 0) {
      toast({ title: 'Out of Credits', description: 'Please wait for the daily reset or buy more credits.', variant: 'destructive' });
      setIsCreditDialogOpen(true);
      return;
    }

    setIsSending(true);
    const userMessage: Message = { id: Date.now().toString(), text, sender: 'user', image };
    const loadingMessage: Message = { id: (Date.now() + 1).toString(), text: '', sender: 'ai', isProcessing: true };
    
    updateSession(activeSession.id, { messages: [...activeSession.messages, userMessage, loadingMessage] });
    setCredits(prev => prev - 1);

    try {
      if(activeSession.messages.length === 0) {
        generateChatTitle({ firstUserMessage: text }).then(({title}) => {
          updateSession(activeSession.id, { title });
        })
      }

      const response = await maintainSessionMemory({
        relation: activeSession.relation,
        tone: activeSession.tone,
        history: activeSession.messages,
        currentMessage: text,
        ...(image && { image: image }),
      });
      
      const aiMessage: Message = { id: Date.now().toString(), text: response.response, sender: 'ai' };
      
      setSessions(prev => prev.map(s => {
        if(s.id === activeSession.id) {
          const messages = s.messages.filter(m => !m.isProcessing);
          return {...s, messages: [...messages, aiMessage] };
        }
        return s;
      }));
    } catch (error) {
      console.error(error);
      toast({ title: 'Error', description: 'Failed to get response from AI.', variant: 'destructive' });
      setSessions(prev => prev.map(s => s.id === activeSession.id ? { ...s, messages: s.messages.filter(m => !m.isProcessing) } : s));
    } finally {
      setIsSending(false);
    }
  }, [activeSession, credits, setCredits, setSessions, toast, updateSession]);

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

  return (
    <SidebarProvider>
      <Sidebar variant="sidebar" collapsible="icon">
        <SidebarHeader>
          <h2 className="font-headline text-2xl group-data-[collapsible=icon]:hidden">RizzUp AI</h2>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <Button className="w-full" onClick={handleNewChat}><PlusCircle className="mr-2" /> <span className="group-data-[collapsible=icon]:hidden">New Chat</span></Button>
            </SidebarGroupContent>
          </SidebarGroup>
          <SidebarGroup>
            <SidebarGroupLabel className="flex items-center gap-2"><Search /> <span className="group-data-[collapsible=icon]:hidden">Search</span></SidebarGroupLabel>
            <SidebarGroupContent>
              <Input placeholder="Search chats..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="group-data-[collapsible=icon]:hidden"/>
            </SidebarGroupContent>
          </SidebarGroup>
          <SidebarMenu>
            {filteredSessions.map(session => (
              <SidebarMenuItem key={session.id}>
                <SidebarMenuButton
                  isActive={session.id === activeSessionId}
                  onClick={() => setActiveSessionId(session.id)}
                  tooltip={{ children: session.title, side: 'right' }}
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
          {/* Footer content if any */}
        </SidebarFooter>
      </Sidebar>

      <SidebarInset className="flex flex-col h-screen">
        <header className="flex items-center justify-between p-2 border-b">
          <SidebarTrigger />
          <div className="flex items-center gap-4">
            <Select value={activeSession?.relation || 'Friend'} onValueChange={(v: Relation) => activeSession && updateSession(activeSession.id, { relation: v })}>
              <SelectTrigger className="w-[120px] font-headline"><SelectValue placeholder="Relation" /></SelectTrigger>
              <SelectContent>
                {defaultRelations.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={activeSession?.tone || 'Friendly'} onValueChange={(v: Tone) => activeSession && updateSession(activeSession.id, { tone: v })}>
              <SelectTrigger className="w-[150px] font-headline"><SelectValue placeholder="Tone" /></SelectTrigger>
              <SelectContent>
                {defaultTones.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => setIsCreditDialogOpen(true)}>
              <Coins className="mr-2" /> {credits} Credits
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
                <h2 className="mt-4 text-2xl font-headline">Welcome to RizzUp AI</h2>
                <p className="mt-2 text-muted-foreground">Start a new chat from the sidebar to begin.</p>
              </div>
          )}
        </main>
        
        {activeSession && <ChatInput onSendMessage={handleSendMessage} isSending={isSending} />}
      </SidebarInset>

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
