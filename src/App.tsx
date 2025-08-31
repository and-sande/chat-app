import React, { useState, useEffect, useRef } from "react";
import { 
  Send, 
  MessageCircle, 
  Smile, 
  Home, 
  Hash, 
  Plus, 
  Settings, 
  LogOut,
  Search,
  Bell,
  Users,
  Sparkles,
  Crown,
  Zap,

  Globe,
  Music,
  Code,
  Gamepad2,
  Palette,
  Camera,
  Coffee,
  BookOpen,
  TrendingUp,

  Lock,
  Unlock,
  Menu,
  X
} from "lucide-react";
import { cn } from "./lib/utils";

interface Message {
  id: string;
  text: string;
  sender_id: string;
  sender_username: string;
  channel_id: string;
  timestamp: string;
  message_type: string;
}

interface Channel {
  id: string;
  name: string;
  description: string;
  created_by: string;
  created_at: string;
  is_private: boolean;
  member_count: number;
}

interface User {
  id: string;
  username: string;
  is_online: boolean;
  last_seen: string;
}

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [username, setUsername] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [currentChannel, setCurrentChannel] = useState<string>("general");
  const [channels, setChannels] = useState<Channel[]>([]);

  const [showChannelModal, setShowChannelModal] = useState(false);
  const [newChannelName, setNewChannelName] = useState("");
  const [newChannelDescription, setNewChannelDescription] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('disconnected');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const currentChannelRef = useRef<string>(currentChannel);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Keep current channel in a ref for event handlers
  useEffect(() => {
    currentChannelRef.current = currentChannel;
  }, [currentChannel]);

  // Fetch initial data
  useEffect(() => {
    if (isConnected) {
      fetchChannels();
    }
  }, [isConnected]);

  // Load messages for the default/current channel once connected
  useEffect(() => {
    if (isConnected && currentChannel && currentChannel !== 'home') {
      loadChannelMessages(currentChannel);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected]);

  const setupWebSocketHandlers = (websocket: WebSocket) => {
    websocket.onopen = () => {
      console.log('WebSocket connected');
      setWs(websocket);
      setConnectionStatus('connected');
    };

    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('WebSocket message received:', data);
      
      if (data.type === 'new_message') {
        // Only add message if it's not from the current user (to avoid duplicates)
        if (data.message.sender_id !== currentUser?.id) {
          setMessages(prev => [...prev, data.message]);
        }
      } else if (data.type === 'user_typing') {
        // Only show typing indicators for the active channel
        if (data.channel_id === currentChannelRef.current) {
          setTypingUsers(prev => {
            if (!prev.includes(data.username)) {
              return [...prev, data.username];
            }
            return prev;
          });
          setTimeout(() => {
            setTypingUsers(prev => prev.filter(u => u !== data.username));
          }, 3000);
        }
      }
    };

    websocket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    websocket.onclose = () => {
      console.log('WebSocket disconnected');
      setWs(null);
      setConnectionStatus('disconnected');
      // Attempt to reconnect after a delay
      setTimeout(() => {
        if (isConnected && currentUser) {
          console.log('Attempting to reconnect WebSocket...');
          setConnectionStatus('connecting');
          const wsProtocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
          const newWebsocket = new WebSocket(`${wsProtocol}://${window.location.host}/ws/${currentUser.id}`);
          setupWebSocketHandlers(newWebsocket);
        }
      }, 2000);
    };
  };

  const fetchChannels = async () => {
    try {
      const response = await fetch('/api/channels');
      const data = await response.json();
      setChannels(data);
    } catch (error) {
      console.error('Error fetching channels:', error);
    }
  };



  const connectUser = async () => {
    if (!username.trim()) return;

    try {
      const response = await fetch('/api/users/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: username.trim() }),
      });

      if (response.ok) {
        const userData = await response.json();
        setCurrentUser(userData);
        setIsConnected(true);
        
        // Connect WebSocket via same-origin (proxied by Vite)
        const wsProtocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
        const websocket = new WebSocket(`${wsProtocol}://${window.location.host}/ws/${userData.id}`);
        setupWebSocketHandlers(websocket);
      } else {
        const errorData = await response.json();
        alert(errorData.detail || 'Failed to connect');
      }
    } catch (error) {
      console.error('Error connecting user:', error);
      alert('Failed to connect to server');
    }
  };

  const handleSendMessage = () => {
    if (!inputText.trim() || !ws || currentChannel === "home") return;

    const messageData = {
      type: "message",
      text: inputText.trim(),
      channel_id: currentChannel,
      sender_username: currentUser?.username || "Unknown"
    };

    // Create the message object for immediate display
    const newMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      sender_id: currentUser?.id || "",
      sender_username: currentUser?.username || "Unknown",
      channel_id: currentChannel,
      timestamp: new Date().toISOString(),
      message_type: "text"
    };

    // Add message to local state immediately (optimistic update)
    setMessages(prev => [...prev, newMessage]);
    
    // Send via WebSocket
    console.log('Sending message via WebSocket:', messageData);
    ws.send(JSON.stringify(messageData));
    setInputText("");
    setIsTyping(false);
  };

  const handleTyping = () => {
    if (!ws || currentChannel === "home") return;
    
    if (!isTyping) {
      setIsTyping(true);
      ws.send(JSON.stringify({
        type: "typing",
        channel_id: currentChannel,
        username: currentUser?.username || "Unknown"
      }));
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const loadChannelMessages = async (channelId: string) => {
    if (channelId === "home") {
      setMessages([]);
      return;
    }
    
    try {
      const response = await fetch(`/api/channels/${channelId}/messages`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      } else {
        setMessages([]);
      }
    } catch (error) {
      console.error('Error loading channel messages:', error);
      setMessages([]);
    }
  };

  const handleChannelChange = (channelId: string) => {
    // Prevent rapid channel switching
    if (currentChannel === channelId || isProcessing) return;
    
    setIsProcessing(true);
    setCurrentChannel(channelId);
    loadChannelMessages(channelId);
    
    // Allow channel changes again after a short delay
    setTimeout(() => {
      setIsProcessing(false);
    }, 500);
  };

  const handleCreateChannel = async () => {
    if (!newChannelName.trim()) return;

    try {
      const response = await fetch('/api/channels', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newChannelName.trim(),
          description: newChannelDescription.trim(),
          is_private: isPrivate
        }),
      });

      if (response.ok) {
        const newChannel = await response.json();
        setChannels(prev => [...prev, newChannel]);
        setNewChannelName("");
        setNewChannelDescription("");
        setIsPrivate(false);
        setShowChannelModal(false);
      }
    } catch (error) {
      console.error('Error creating channel:', error);
    }
  };

  const handleDisconnect = async () => {
    if (currentUser) {
      try {
        await fetch(`/api/users/${currentUser.id}/disconnect`, {
          method: 'POST'
        });
      } catch (error) {
        console.error('Error disconnecting:', error);
      }
    }
    
    if (ws) {
      ws.close();
    }
    
    setIsConnected(false);
    setCurrentUser(null);
    setUsername("");
    setMessages([]);
    setCurrentChannel("general");
    setWs(null);
  };

  const getChannelIcon = (channelName: string) => {
    const icons: { [key: string]: React.ReactNode } = {
      general: <Globe className="w-4 h-4" />,
      random: <Sparkles className="w-4 h-4" />,
      tech: <Code className="w-4 h-4" />,
      music: <Music className="w-4 h-4" />,
      gaming: <Gamepad2 className="w-4 h-4" />,
      art: <Palette className="w-4 h-4" />,
      photography: <Camera className="w-4 h-4" />,
      coffee: <Coffee className="w-4 h-4" />,
      books: <BookOpen className="w-4 h-4" />,
      crypto: <TrendingUp className="w-4 h-4" />,
    };
    return icons[channelName] || <Hash className="w-4 h-4" />;
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute top-40 left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>

        <div className="relative z-10 bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl p-12 w-full max-w-lg border border-white/20">
          <div className="text-center mb-10">
            <div className="bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 p-6 rounded-full w-24 h-24 mx-auto mb-8 flex items-center justify-center shadow-2xl">
              <MessageCircle className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 bg-clip-text text-transparent mb-4">
              Chat App
            </h1>
            <p className="text-gray-300 text-xl">Enter your username to start chatting</p>
          </div>
          
          <div className="space-y-6">
            <div className="relative">
              <input
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && connectUser()}
                className="w-full px-8 py-5 bg-white/10 border border-white/20 rounded-2xl focus:outline-none focus:ring-4 focus:ring-purple-400/50 focus:border-transparent text-white placeholder-gray-300 text-lg backdrop-blur-sm transition-all duration-300"
              />
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                <Sparkles className="w-6 h-6 text-purple-400" />
              </div>
            </div>
            
            <button
              onClick={connectUser}
              disabled={!username.trim()}
              className="w-full bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 text-white py-5 px-8 rounded-2xl font-bold text-xl hover:from-purple-600 hover:via-pink-600 hover:to-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 hover:shadow-2xl shadow-lg"
            >
              <Zap className="w-6 h-6 inline mr-3" />
              Join Chat
            </button>
          </div>

          <div className="mt-8 text-center">
            <p className="text-gray-400 text-sm">Powered by React + FastAPI + WebSockets</p>
          </div>
        </div>
      </div>
    );
  }

  const currentChannelData = channels.find(ch => ch.id === currentChannel);
  const channelMessages = messages.filter(m => m.channel_id === currentChannel);

  return (
    <div className="min-h-[100dvh] bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex overflow-hidden">
      {/* Modern Sidebar - Desktop */}
      <div className="hidden lg:flex w-80 bg-white/10 backdrop-blur-xl shadow-2xl border-r border-white/20 flex-col">
        {/* Header */}
        <div className="p-6 border-b border-white/20">
          <div className="flex items-center space-x-3 mb-4">
            <div className="bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 p-3 rounded-xl shadow-lg">
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold text-white">Chat App</h1>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-300">
            <div className={cn(
              "w-2 h-2 rounded-full",
              connectionStatus === 'connected' ? "bg-green-400 animate-pulse" :
              connectionStatus === 'connecting' ? "bg-yellow-400 animate-pulse" :
              "bg-red-400"
            )}></div>
            <span>
              {connectionStatus === 'connected' ? 'Connected' :
               connectionStatus === 'connecting' ? 'Connecting...' :
               'Disconnected'} as {currentUser?.username}
            </span>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 p-4 space-y-3">
          <button
            onClick={() => handleChannelChange("home")}
            className={cn(
              "w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left transition-all duration-300 group",
              currentChannel === "home" 
                ? "bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300 border border-purple-400/30 shadow-lg" 
                : "text-gray-300 hover:bg-white/10 hover:text-white"
            )}
          >
            <Home className="w-5 h-5" />
            <span className="font-medium">Home</span>
          </button>

          <div className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Channels</h3>
              <button
                onClick={() => setShowChannelModal(true)}
                className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-all duration-300 hover:scale-110"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2">
              {channels.map((channel) => (
                <button
                  key={channel.id}
                  onClick={() => handleChannelChange(channel.id)}
                  className={cn(
                    "w-full flex items-center justify-between px-4 py-3 rounded-xl text-left transition-all duration-300 group",
                    channel.id === currentChannel
                      ? "bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300 border border-purple-400/30 shadow-lg" 
                      : "text-gray-300 hover:bg-white/10 hover:text-white"
                  )}
                >
                  <div className="flex items-center space-x-3">
                    <div className="text-purple-400">
                      {getChannelIcon(channel.name)}
                    </div>
                    <span className="font-medium">{channel.name}</span>
                    {channel.is_private && <Lock className="w-3 h-3 text-gray-500" />}
                  </div>
                  <div className="flex items-center space-x-2">
                    {channel.member_count > 0 && (
                      <span className="text-xs text-gray-400">{channel.member_count}</span>
                    )}
                    {channel.created_by === "system" && (
                      <Crown className="w-3 h-3 text-yellow-400" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* User Actions */}
        <div className="p-4 border-t border-white/20 space-y-2">
          <button className="w-full flex items-center space-x-3 px-4 py-3 text-gray-300 hover:bg-white/10 hover:text-white rounded-xl transition-all duration-300">
            <Settings className="w-4 h-4" />
            <span>Settings</span>
          </button>
          <button
            onClick={handleDisconnect}
            className="w-full flex items-center space-x-3 px-4 py-3 text-red-400 hover:bg-red-500/20 hover:text-red-300 rounded-xl transition-all duration-300"
          >
            <LogOut className="w-4 h-4" />
            <span>Disconnect</span>
          </button>
        </div>
      </div>

      {/* Mobile Sidebar Drawer */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <div className="relative z-10 w-72 max-w-[85%] h-full bg-white/10 backdrop-blur-xl border-r border-white/20 shadow-2xl p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 p-2 rounded-lg shadow-lg">
                  <MessageCircle className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-lg font-bold text-white">Chat App</h1>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            {/* Navigation (reuse) */}
            <div className="flex-1 space-y-3 overflow-y-auto">
              <button
                onClick={() => { setSidebarOpen(false); handleChannelChange("home"); }}
                className={cn(
                  "w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-left transition-all duration-300",
                  currentChannel === "home" 
                    ? "bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300 border border-purple-400/30 shadow-lg" 
                    : "text-gray-300 hover:bg-white/10 hover:text-white"
                )}
              >
                <Home className="w-4 h-4" />
                <span className="font-medium">Home</span>
              </button>

              <div className="pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Channels</h3>
                  <button
                    onClick={() => { setShowChannelModal(true); setSidebarOpen(false); }}
                    className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-all duration-300"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-2">
                  {channels.map((channel) => (
                    <button
                      key={channel.id}
                      onClick={() => { setSidebarOpen(false); handleChannelChange(channel.id); }}
                      className={cn(
                        "w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-all duration-300",
                        channel.id === currentChannel
                          ? "bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300 border border-purple-400/30 shadow-lg" 
                          : "text-gray-300 hover:bg-white/10 hover:text-white"
                      )}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="text-purple-400">
                          {getChannelIcon(channel.name)}
                        </div>
                        <span className="font-medium">{channel.name}</span>
                        {channel.is_private && <Lock className="w-3 h-3 text-gray-500" />}
                      </div>
                      <div className="flex items-center space-x-2">
                        {channel.member_count > 0 && (
                          <span className="text-xs text-gray-400">{channel.member_count}</span>
                        )}
                        {channel.created_by === "system" && (
                          <Crown className="w-3 h-3 text-yellow-400" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Chat Header */}
        <div className="bg-white/10 backdrop-blur-xl shadow-lg border-b border-white/20 px-4 sm:px-6 lg:px-8 py-4 lg:py-6 safe-top">
          {/* Connection Status Banner */}
          {connectionStatus !== 'connected' && (
            <div className="mb-4 p-3 rounded-lg bg-yellow-500/20 border border-yellow-400/30 text-yellow-300 text-sm text-center">
              {connectionStatus === 'connecting' ? '🔄 Reconnecting...' : '❌ Connection lost. Attempting to reconnect...'}
            </div>
          )}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Mobile: open sidebar */}
              <button className="lg:hidden p-2 hover:bg-white/10 rounded-xl" onClick={() => setSidebarOpen(true)}>
                <Menu className="w-6 h-6 text-gray-300" />
              </button>
              <div className="text-purple-400">
                {currentChannel === "home" ? <Home className="w-6 h-6" /> : getChannelIcon(currentChannelData?.name || "")}
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white">
                  {currentChannel === "home" ? "Home" : currentChannelData?.name || "Channel"}
                </h2>
                {currentChannel !== "home" && (
                  <p className="text-gray-400">{channelMessages.length} messages</p>
                )}
              </div>
            </div>
            <div className="hidden sm:flex items-center space-x-4">
              <button className="p-3 hover:bg-white/10 rounded-xl transition-all duration-300 hover:scale-110">
                <Search className="w-5 h-5 text-gray-400" />
              </button>
              <button className="p-3 hover:bg-white/10 rounded-xl transition-all duration-300 hover:scale-110">
                <Bell className="w-5 h-5 text-gray-400" />
              </button>
              <button className="p-3 hover:bg-white/10 rounded-xl transition-all duration-300 hover:scale-110">
                <Users className="w-5 h-5 text-gray-400" />
              </button>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 flex flex-col w-full max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-6 min-h-0">
          <div className="flex-1 bg-white/10 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-2xl border border-white/20 flex flex-col overflow-hidden min-h-0">
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 min-h-0">
              {currentChannel === "home" ? (
                <div className="text-center text-gray-300 py-16">
                  <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 p-8 rounded-full w-32 h-32 mx-auto mb-8 flex items-center justify-center border border-purple-400/30">
                    <Home className="w-16 h-16 text-purple-400" />
                  </div>
                  <h3 className="text-3xl font-bold text-white mb-4">Welcome to Chat App</h3>
                  <p className="text-gray-400 text-lg mb-12">Select a channel from the sidebar to start chatting</p>
                  <div className="grid grid-cols-2 gap-6 max-w-2xl mx-auto">
                    {channels.slice(0, 6).map((channel) => (
                      <button
                        key={channel.id}
                        onClick={() => handleChannelChange(channel.id)}
                        className="p-6 bg-white/10 hover:bg-white/20 rounded-2xl border border-white/20 transition-all duration-300 hover:scale-105 hover:shadow-xl group"
                      >
                        <div className="text-purple-400 mb-3 group-hover:scale-110 transition-transform duration-300">
                          {getChannelIcon(channel.name)}
                        </div>
                        <p className="font-semibold text-white text-lg mb-2">{channel.name}</p>
                        <p className="text-sm text-gray-400">{channel.description}</p>
                      </button>
                    ))}
                  </div>
                </div>
              ) : channelMessages.length === 0 ? (
                <div className="text-center text-gray-300 py-16">
                  <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 p-8 rounded-full w-32 h-32 mx-auto mb-8 flex items-center justify-center border border-purple-400/30">
                    <Smile className="w-16 h-16 text-purple-400" />
                  </div>
                  <h3 className="text-3xl font-bold text-white mb-4">No messages yet</h3>
                  <p className="text-gray-400 text-lg">Start the conversation in #{currentChannelData?.name}!</p>
                </div>
              ) : (
                <>
                  {channelMessages.map((message) => (
                    <div
                      key={message.id}
                      className={cn(
                        "flex",
                        message.sender_id === currentUser?.id ? "justify-end" : "justify-start"
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-lg px-6 py-4 rounded-2xl shadow-lg backdrop-blur-sm",
                          message.sender_id === currentUser?.id
                            ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                            : "bg-white/20 text-white border border-white/20"
                        )}
                      >
                        <div className="flex items-center space-x-3 mb-3">
                          <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                            message.sender_id === currentUser?.id 
                              ? "bg-white/20 text-white" 
                              : "bg-purple-500/20 text-purple-300"
                          )}>
                            {message.sender_username.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-semibold">{message.sender_username}</span>
                          {message.sender_id === currentUser?.id && (
                            <span className="text-xs opacity-70">You</span>
                          )}
                        </div>
                        <p className="text-base leading-relaxed mb-2">{message.text}</p>
                        <span className={cn(
                          "text-xs block",
                          message.sender_id === currentUser?.id ? "opacity-70" : "text-gray-400"
                        )}>
                          {new Date(message.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  ))}
                  
                  {/* Typing indicators */}
                  {typingUsers.length > 0 && (
                    <div className="flex justify-start">
                      <div className="bg-white/20 text-white px-4 py-2 rounded-2xl border border-white/20">
                        <span className="text-sm text-gray-300">
                          {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
                        </span>
                      </div>
                    </div>
                  )}
                </>
              )}
              <div ref={messagesEndRef} />
            </div>
            
            {/* Message Input */}
            <div className="border-t border-white/20 p-3 sm:p-6 lg:p-8 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
              <div className="flex space-x-3 sm:space-x-4">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={handleKeyPress}
                  onInput={handleTyping}
                  placeholder={`Message #${currentChannel === "home" ? "general" : currentChannelData?.name || "channel"}`}
                  className="flex-1 px-4 sm:px-6 py-3 sm:py-4 bg-white/10 border border-white/20 rounded-2xl focus:outline-none focus:ring-4 focus:ring-purple-400/50 focus:border-transparent text-white placeholder-gray-400 transition-all duration-300 backdrop-blur-sm text-sm sm:text-base"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputText.trim() || currentChannel === "home"}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-5 sm:px-8 py-3 sm:py-4 rounded-2xl hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 hover:shadow-xl flex items-center space-x-3 shadow-lg"
                >
                  <Send className="w-5 h-5" />
                  <span className="font-semibold">Send</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create Channel Modal */}
      {showChannelModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 w-full max-w-lg mx-4 border border-white/20 shadow-2xl">
            <h3 className="text-2xl font-bold text-white mb-6">Create New Channel</h3>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Channel name"
                value={newChannelName}
                onChange={(e) => setNewChannelName(e.target.value)}
                className="w-full px-6 py-4 bg-white/10 border border-white/20 rounded-2xl focus:outline-none focus:ring-4 focus:ring-purple-400/50 focus:border-transparent text-white placeholder-gray-400 backdrop-blur-sm"
              />
              <textarea
                placeholder="Channel description"
                value={newChannelDescription}
                onChange={(e) => setNewChannelDescription(e.target.value)}
                className="w-full px-6 py-4 bg-white/10 border border-white/20 rounded-2xl focus:outline-none focus:ring-4 focus:ring-purple-400/50 focus:border-transparent text-white placeholder-gray-400 backdrop-blur-sm resize-none"
                rows={3}
              />
              <label className="flex items-center space-x-3 text-white">
                <input
                  type="checkbox"
                  checked={isPrivate}
                  onChange={(e) => setIsPrivate(e.target.checked)}
                  className="w-5 h-5 text-purple-500 bg-white/10 border-white/20 rounded focus:ring-purple-400/50"
                />
                <span>Private channel</span>
                {isPrivate ? <Lock className="w-4 h-4 text-yellow-400" /> : <Unlock className="w-4 h-4 text-green-400" />}
              </label>
            </div>
            <div className="flex space-x-4 mt-8">
              <button
                onClick={() => setShowChannelModal(false)}
                className="flex-1 px-6 py-4 text-gray-300 border border-white/20 rounded-2xl hover:bg-white/10 hover:text-white transition-all duration-300"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateChannel}
                disabled={!newChannelName.trim()}
                className="flex-1 px-6 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-semibold"
              >
                Create Channel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
