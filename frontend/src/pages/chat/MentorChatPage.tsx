import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import { LoadingState } from '../../components/common/LoadingState';
import { MessageCircle, Send, CheckCheck, Users, ChevronLeft, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';

export const MentorChatPage: React.FC = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const juniorIdParam = searchParams.get('juniorId');

  const [chatChannel, setChatChannel] = useState<'SENIOR' | 'DIRECTOR' | 'FACULTY'>(
    user?.role === 'DIRECTOR' ? 'DIRECTOR' : user?.role === 'FACULTY' ? 'FACULTY' : 'SENIOR'
  );
  const [contacts, setContacts] = useState<any[]>([]);
  const [activeJuniorId, setActiveJuniorId] = useState<string | null>(juniorIdParam);
  const [conversation, setConversation] = useState<any>(null);
  const [partnerInfo, setPartnerInfo] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  // Mobile Contacts Drawer State for Senior/Director/Faculty
  const [isMobileContactsOpen, setIsMobileContactsOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isSenior = user?.role === 'SENIOR';
  const isJunior = user?.role === 'JUNIOR';
  const isDirector = user?.role === 'DIRECTOR';
  const isFaculty = user?.role === 'FACULTY';
  const isStaff = isSenior || isDirector || isFaculty;

  // Auto-scroll to bottom of chat window
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch Contacts List
  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const res = await api.get(`/messages/conversations?chatType=${chatChannel}`);
        const list = res.data.data;
        setContacts(list);

        if (isStaff && list.length > 0 && !activeJuniorId) {
          setActiveJuniorId(list[0].junior_id || list[0].id);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchContacts();
  }, [isStaff, chatChannel]);

  // Fetch Chat Messages with Live Polling (Every 1.5 seconds)
  const fetchChat = async () => {
    try {
      let url = `/messages/conversation?chatType=${chatChannel}`;
      if (isStaff && activeJuniorId) {
        url += `&juniorId=${activeJuniorId}`;
      }
      const res = await api.get(url);
      setConversation(res.data.data.conversation);
      setPartnerInfo(res.data.data.partnerInfo || {});
      setMessages(res.data.data.messages || []);
      if (res.data.data.activeJuniorId && !activeJuniorId) {
        setActiveJuniorId(res.data.data.activeJuniorId);
      }
    } catch (err: any) {
      setConversation(null);
      setPartnerInfo(null);
      setMessages([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setConversation(null);
    setPartnerInfo(null);
    setMessages([]);
    fetchChat();
    const interval = setInterval(fetchChat, 1500); // 1.5s live polling
    return () => clearInterval(interval);
  }, [activeJuniorId, chatChannel]);

  const handleSelectJunior = (jId: string) => {
    setActiveJuniorId(jId);
    setSearchParams({ juniorId: jId });
    setIsMobileContactsOpen(false); // Close drawer on mobile select
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !conversation) return;

    const messageText = inputText.trim();
    setInputText('');

    // Optimistic UI update
    const tempMsg = {
      id: `temp-${Date.now()}`,
      conversation_id: conversation.id,
      sender_id: user?.id,
      sender_name: user?.name,
      sender_role: user?.role,
      content: messageText,
      created_at: new Date().toISOString()
    };
    setMessages((prev) => [...prev, tempMsg]);

    setIsSending(true);
    try {
      await api.post('/messages/send', {
        conversationId: conversation.id,
        content: messageText,
        chatType: chatChannel
      });
      fetchChat();
    } catch (err) {
      toast.error('Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-3 sm:space-y-4 h-[calc(100vh-100px)] sm:h-[calc(100vh-130px)] flex flex-col px-1 sm:px-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shrink-0">
        <div>
          <h1 className="text-base sm:text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600 shrink-0" /> Live Chat Center
          </h1>
          <p className="text-[11px] sm:text-xs text-slate-500 hidden sm:block">
            {isJunior ? 'Communicate directly with your Senior Mentor, Faculty Mentor, or Department Director' : 'Real-time mentorship & student query messages'}
          </p>
        </div>

        {/* Channel Switcher for Junior Students */}
        {isJunior && (
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-bold flex-wrap sm:flex-nowrap">
            <button
              onClick={() => setChatChannel('SENIOR')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                chatChannel === 'SENIOR' ? 'bg-orange-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Senior Mentor Chat
            </button>
            <button
              onClick={() => setChatChannel('FACULTY')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                chatChannel === 'FACULTY' ? 'bg-teal-700 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Faculty Mentor Chat 🎓
            </button>
            <button
              onClick={() => setChatChannel('DIRECTOR')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                chatChannel === 'DIRECTOR' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Director Chat 👑
            </button>
          </div>
        )}

        {/* Mobile Contacts Button for Staff */}
        {isStaff && (
          <button
            onClick={() => setIsMobileContactsOpen(!isMobileContactsOpen)}
            className="md:hidden inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer"
          >
            <Users className="w-3.5 h-3.5 text-orange-400" /> Students ({contacts.length})
          </button>
        )}
      </div>

      {/* Main Chat Interface Box */}
      <div className="flex-1 bg-white border border-slate-200/90 rounded-2xl shadow-sm flex overflow-hidden relative min-h-0">
        {/* Mobile Backdrop for Staff Contacts Drawer */}
        {isStaff && isMobileContactsOpen && (
          <div
            onClick={() => setIsMobileContactsOpen(false)}
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-30 md:hidden animate-in fade-in duration-150"
          />
        )}

        {/* Staff Contacts Sidebar (Desktop fixed left panel, Mobile sliding drawer) */}
        {isStaff && (
          <div
            className={`w-72 bg-slate-950 text-slate-300 border-r border-slate-800/90 flex flex-col shrink-0 absolute md:static inset-y-0 left-0 z-40 transform transition-transform duration-200 ${
              isMobileContactsOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
            }`}
          >
            <div className="p-3.5 border-b border-slate-800/90 bg-slate-900/90 flex items-center justify-between">
              <span className="text-xs font-black text-slate-100 uppercase tracking-wider flex items-center gap-2">
                <Users className="w-4 h-4 text-orange-500" /> Student Contacts ({contacts.length})
              </span>
              <button
                onClick={() => setIsMobileContactsOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-200 md:hidden cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60 p-2 space-y-1">
              {contacts.length === 0 ? (
                <p className="p-4 text-xs text-slate-500 italic text-center">No assigned student contacts found.</p>
              ) : (
                contacts.map((jun) => {
                  const targetId = jun.junior_id || jun.id;
                  const isSelected = activeJuniorId === targetId;
                  return (
                    <div
                      key={targetId}
                      onClick={() => handleSelectJunior(targetId)}
                      className={`p-3 rounded-xl cursor-pointer transition-all flex items-center gap-3 ${
                        isSelected
                          ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-md'
                          : 'hover:bg-slate-900/90 text-slate-300'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-xl bg-slate-900 text-slate-200 flex items-center justify-center font-black text-xs shrink-0 border border-slate-700">
                        {jun.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="overflow-hidden flex-1 text-xs">
                        <p className="font-bold truncate">{jun.name}</p>
                        <p className={`text-[10px] truncate ${isSelected ? 'text-orange-100' : 'text-slate-400'}`}>
                          {jun.register_number || 'Student'} • {jun.department || jun.year || ''}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Chat Conversation Panel */}
        <div className="flex-1 flex flex-col min-w-0 bg-white">
          {/* Active Partner Banner Header */}
          <div className="p-3 sm:p-3.5 bg-slate-50/90 border-b border-slate-200/90 flex items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              {/* Back to contacts list button on mobile */}
              {isStaff && (
                <button
                  onClick={() => setIsMobileContactsOpen(true)}
                  className="p-1 text-slate-600 hover:text-slate-900 md:hidden cursor-pointer shrink-0"
                  title="View Contacts"
                >
                  <ChevronLeft className="w-5 h-5 text-orange-600" />
                </button>
              )}

              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-orange-600 to-amber-600 text-white flex items-center justify-center font-black text-xs shadow-xs shrink-0">
                {partnerInfo?.name ? partnerInfo.name.charAt(0).toUpperCase() : 'M'}
              </div>

              <div className="overflow-hidden min-w-0">
                <h3 className="font-extrabold text-xs sm:text-sm text-slate-900 leading-tight truncate">
                  {partnerInfo?.name || (
                    isJunior
                      ? (chatChannel === 'FACULTY' ? 'Faculty Mentor' : chatChannel === 'DIRECTOR' ? 'Department Director' : 'Senior Mentor')
                      : 'Select Junior Student'
                  )}
                </h3>
                <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium truncate">
                  {isJunior
                    ? `${chatChannel === 'FACULTY' ? 'Faculty Mentor' : chatChannel === 'DIRECTOR' ? 'Department Director' : 'Senior Mentor'} • ${partnerInfo?.faculty_code || partnerInfo?.director_code || partnerInfo?.senior_code || ''}`
                    : `Junior Student • ${partnerInfo?.register_number || ''}`}
                </p>
              </div>
            </div>

            <span className="text-[10px] font-extrabold px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full flex items-center gap-1.5 shrink-0">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="hidden sm:inline uppercase">Live Active</span>
              <span className="sm:hidden">LIVE</span>
            </span>
          </div>

          {/* Chat Messages Log */}
          {isLoading && !conversation ? (
            <LoadingState message="Connecting to live conversation..." />
          ) : !conversation ? (
            <div className="flex-1 p-6 text-center flex flex-col items-center justify-center space-y-3">
              <MessageCircle className="w-10 h-10 text-slate-300" />
              <p className="text-xs font-extrabold text-slate-800">
                {isJunior
                  ? `No ${chatChannel === 'FACULTY' ? 'Faculty Mentor' : chatChannel === 'DIRECTOR' ? 'Department Director' : 'Senior Mentor'} assigned yet.`
                  : 'No conversation partner selected.'}
              </p>
              <p className="text-[11px] text-slate-500 max-w-xs">
                {isJunior
                  ? 'Contact SuperAdmin to assign your mentor.'
                  : 'Select an assigned junior student from the contacts menu to start chatting.'}
              </p>
              {isStaff && (
                <button
                  onClick={() => setIsMobileContactsOpen(true)}
                  className="px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl cursor-pointer md:hidden"
                >
                  Open Contacts Menu
                </button>
              )}
            </div>
          ) : (
            <div className="flex-1 p-3 sm:p-4 overflow-y-auto space-y-3 bg-slate-50/60 min-h-0">
              {messages.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs italic">
                  No messages yet. Type a message below to start the conversation!
                </div>
              ) : (
                messages.map((m) => {
                  const isMe = m.sender_id === user?.id;
                  return (
                    <div key={m.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      <div
                        className={`max-w-[85%] sm:max-w-md px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed break-words shadow-2xs ${
                          isMe
                            ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-br-xs'
                            : 'bg-white text-slate-800 border border-slate-200/90 rounded-bl-xs'
                        }`}
                      >
                        <p className="font-bold text-[10px] opacity-80 mb-0.5">{m.sender_name}</p>
                        <p className="whitespace-pre-line text-xs font-medium">{m.content}</p>
                      </div>
                      <span className="text-[9px] text-slate-400 mt-1 flex items-center gap-1 font-mono">
                        {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {isMe && <CheckCheck className="w-3 h-3 text-orange-500" />}
                      </span>
                    </div>
                  );
                })
              )}
              {/* Invisible element to trigger smooth scrolling to latest message */}
              <div ref={messagesEndRef} />
            </div>
          )}

          {/* Message Input Form (Mobile Sticky Input) */}
          {conversation && (
            <form onSubmit={handleSend} className="p-2.5 sm:p-3 bg-white border-t border-slate-200/90 flex gap-2 shrink-0">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={
                  isJunior
                    ? `Type a message to your ${chatChannel === 'FACULTY' ? 'Faculty Mentor' : chatChannel === 'DIRECTOR' ? 'Director' : 'Senior Mentor'}...`
                    : "Type a message to student..."
                }
                className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-semibold outline-hidden"
              />
              <button
                type="submit"
                disabled={isSending || !inputText.trim()}
                className="px-3.5 sm:px-4 py-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-extrabold text-xs rounded-xl shadow-md transition-all inline-flex items-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Send</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
