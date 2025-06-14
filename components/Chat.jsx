'use client';
import { useState, useEffect, useRef } from 'react';
import { Search, Send, User, MessageCircle, Phone, Video, MoreVertical, Smile, Paperclip } from 'lucide-react';
import { database, auth } from '@/app/lib/firebase';
import { ref, push, onValue, get } from 'firebase/database';

function Chat() {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef(null);

  // Generate unique chat ID for two users
  const getChatId = (uid1, uid2) => {
    return [uid1, uid2].sort().join('_');
  };

  // Fetch messages for selected chat
  useEffect(() => {
    if (!selectedUser) return;

    const chatId = getChatId(auth.currentUser.uid, selectedUser.id);
    const messagesRef = ref(database, `chats/${chatId}/messages`);
    
    const unsubscribe = onValue(messagesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const messageList = Object.entries(data).map(([id, msg]) => ({
          id,
          ...msg
        }));
        setMessages(messageList.sort((a, b) => a.timestamp - b.timestamp));
      } else {
        setMessages([]);
      }
    });

    return () => unsubscribe();
  }, [selectedUser]);

  // Fetch all users on component mount
  useEffect(() => {
    const usersRef = ref(database, 'users');
    const unsubscribe = onValue(usersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const userList = Object.entries(data)
          .map(([id, user]) => ({ id, ...user }))
          .filter(user => user.id !== auth.currentUser?.uid);
        setUsers(userList);
      }
    });

    return () => unsubscribe();
  }, []);

  // Handle sending messages
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser) return;

    const chatId = getChatId(auth.currentUser.uid, selectedUser.id);
    const messagesRef = ref(database, `chats/${chatId}/messages`);
    
    await push(messagesRef, {
      text: newMessage,
      senderId: auth.currentUser.uid,
      receiverId: selectedUser.id,
      timestamp: Date.now()
    });
    
    setNewMessage('');
  };

  // Handle search
  const handleSearch = (e) => {
    const searchTerm = e.target.value.toLowerCase();
    setSearchQuery(searchTerm);
  };

  // Filter users based on search query
  const filteredUsers = users.filter(user => 
    user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getInitials = (name) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Add this new useEffect for auto-scrolling
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Sidebar */}
      <div className="w-1/4 bg-white/5 backdrop-blur-xl border-r border-white/10">
        {/* Header */}
        <div className="p-6 border-b border-white/10">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl">
              <MessageCircle size={24} className="text-white" />
            </div>
            Messages
          </h2>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="search"
              placeholder="Search users..."
              value={searchQuery}
              onChange={handleSearch}
              className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
            />
          </div>
        </div>

        {/* Users List */}
        <div className="overflow-y-auto h-full pb-20">
          {filteredUsers.map(user => (
            <button
              key={user.id}
              onClick={() => setSelectedUser(user)}
              className={`w-full p-4 text-left hover:bg-white/10 transition-all duration-200 border-l-4 ${
                selectedUser?.id === user.id 
                  ? 'bg-white/10 border-l-purple-500' 
                  : 'border-l-transparent hover:border-l-purple-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-semibold">
                    {getInitials(user.name)}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white"></div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-white truncate">{user.name || 'Anonymous'}</div>
                  <div className="text-sm text-gray-400 truncate">{user.email}</div>
                </div>
              </div>
            </button>
          ))}
          
          {filteredUsers.length === 0 && (
            <div className="p-8 text-center text-gray-400">
              <User size={48} className="mx-auto mb-4 opacity-50" />
              <p>No users found</p>
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex h-screen flex-col">
        {selectedUser ? (
          <>
            {/* Chat Header */}
            <div className="p-6 bg-white/5 backdrop-blur-xl border-b border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-semibold">
                      {getInitials(selectedUser.name)}
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white"></div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-xl text-white">{selectedUser.name || 'Anonymous'}</h3>
                    <p className="text-sm text-gray-400">{selectedUser.email}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button className="p-3 hover:bg-white/10 rounded-xl transition-colors duration-200">
                    <Phone size={20} className="text-gray-300" />
                  </button>
                  <button className="p-3 hover:bg-white/10 rounded-xl transition-colors duration-200">
                    <Video size={20} className="text-gray-300" />
                  </button>
                  <button className="p-3 hover:bg-white/10 rounded-xl transition-colors duration-200">
                    <MoreVertical size={20} className="text-gray-300" />
                  </button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 p-6 overflow-y-auto space-y-4">
              {messages.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-center">
                  <div>
                    <MessageCircle size={64} className="mx-auto mb-4 text-gray-400 opacity-50" />
                    <p className="text-gray-400 text-lg">No messages yet</p>
                    <p className="text-gray-500 text-sm">Start the conversation by sending a message!</p>
                  </div>
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${
                      msg.senderId === auth.currentUser.uid ? 'justify-end' : 'justify-start'
                    } animate-slideUp`}
                  >
                    <div
                      className={`max-w-[70%] p-4 rounded-2xl shadow-lg ${
                        msg.senderId === auth.currentUser.uid
                          ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white ml-12'
                          : 'bg-white/10 backdrop-blur-md text-white mr-12 border border-white/20'
                      }`}
                    >
                      <p className="leading-relaxed">{msg.text}</p>
                      <div className={`text-xs mt-2 ${
                        msg.senderId === auth.currentUser.uid 
                          ? 'text-purple-100' 
                          : 'text-gray-400'
                      }`}>
                        {formatTime(msg.timestamp)}
                      </div>
                    </div>
                  </div>
                ))
              )}
              {/* Add this div as the last element in messages container */}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-6 bg-white/5 backdrop-blur-xl border-t border-white/10">
              <form onSubmit={handleSubmit} className="flex items-end gap-4">
                <div className="flex gap-2">
                  <button 
                    type="button"
                    className="p-3 hover:bg-white/10 rounded-xl transition-colors duration-200"
                  >
                    <Paperclip size={20} className="text-gray-300" />
                  </button>
                  <button 
                    type="button"
                    className="p-3 hover:bg-white/10 rounded-xl transition-colors duration-200"
                  >
                    <Smile size={20} className="text-gray-300" />
                  </button>
                </div>
                
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="w-full p-4 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                  />
                </div>
                
                <button 
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="p-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-gray-600 disabled:to-gray-700 text-white rounded-2xl transition-all duration-200 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
                >
                  <Send size={20} />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-24 h-24 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mb-6 mx-auto">
                <MessageCircle size={48} className="text-white" />
              </div>
              <h3 className="text-2xl font-semibold text-white mb-2">Select a user to start chatting</h3>
              <p className="text-gray-400">Choose someone from your contacts to begin a conversation</p>
            </div>
          </div>
        )}
      </div>
      
      <style jsx>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}

export default Chat;