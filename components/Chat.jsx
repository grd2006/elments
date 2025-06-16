'use client';
import { useState, useEffect, useRef } from 'react';
import { Search, Send, User, MessageCircle, Trash2, Menu, X } from 'lucide-react'; // Import Menu and X icons
import { database, auth } from '@/app/lib/firebase';
import { ref, push, onValue, remove } from 'firebase/database';

function Chat() {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // State for mobile sidebar
  const messagesContainerRef = useRef(null);

  // Generate unique chat ID for two users
  const getChatId = (uid1, uid2) => {
    if (!uid1 || !uid2) return null;
    return [uid1, uid2].sort().join('_');
  };

  // Fetch messages for selected chat
  useEffect(() => {
    if (!selectedUser || !auth.currentUser) return;

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
      if (data && auth.currentUser) {
        const userList = Object.entries(data)
          .map(([id, user]) => ({ id, ...user }))
          .filter(user => user.id !== auth.currentUser.uid);
        setUsers(userList);
      }
    });

    return () => unsubscribe();
  }, []);

  // Handle sending messages
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser || !auth.currentUser) return;

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
  
  // Handle deleting a chat
  const handleDeleteChat = async () => {
    if (!selectedUser || !auth.currentUser) return;

    const isConfirmed = window.confirm(`Are you sure you want to delete the chat with ${selectedUser.name}? This action cannot be undone.`);
    
    if (isConfirmed) {
      const chatId = getChatId(auth.currentUser.uid, selectedUser.id);
      const chatRef = ref(database, `chats/${chatId}`);
      try {
        await remove(chatRef);
        setSelectedUser(null);
      } catch (error) {
        console.error("Error deleting chat:", error);
        alert("Failed to delete chat. Please try again.");
      }
    }
  };

  // Handle search
  const handleSearch = (e) => setSearchQuery(e.target.value);

  // Filter users based on search query
  const filteredUsers = users.filter(user => 
    user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatTime = (timestamp) => new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const getInitials = (name) => name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  const handleSelectUser = (user) => {
    setSelectedUser(user);
    setIsSidebarOpen(false); // Close sidebar on mobile after selecting a user
  };

  return (
    <div className="relative flex h-full bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 overflow-hidden">
      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div 
          onClick={() => setIsSidebarOpen(false)} 
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
        ></div>
      )}

      {/* Sidebar */}
      <div className={`
        absolute md:relative inset-y-0 left-0 z-30
        w-4/5 max-w-sm md:w-1/4 md:max-w-none
        bg-white/5 backdrop-blur-xl border-r border-white/10
        transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0
      `}>
        {/* Header */}
        <div className="p-6 border-b border-white/10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl">
                  <MessageCircle size={24} className="text-white" />
                </div>
                Messages
              </h2>
              {/* Close button for mobile */}
              <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-gray-400 hover:text-white">
                  <X size={24} />
              </button>
            </div>
          
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
        <div className="overflow-y-auto h-[calc(100%-124px)]"> {/* Adjusted height for new layout */}
          {filteredUsers.map(user => (
            <button
              key={user.id}
              onClick={() => handleSelectUser(user)}
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
      <div className="flex-1 flex flex-col">
        {selectedUser ? (
          <>
            {/* Chat Header */}
            <div className="p-6 bg-white/5 backdrop-blur-xl border-b border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {/* Hamburger menu for mobile */}
                  <button onClick={() => setIsSidebarOpen(true)} className="md:hidden text-white">
                      <Menu size={24} />
                  </button>
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
                <button 
                  onClick={handleDeleteChat}
                  className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/20 rounded-full transition-colors duration-200"
                  title="Delete Chat"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div ref={messagesContainerRef} className="flex-1 p-6 overflow-y-auto space-y-4 scroll-smooth">
              {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${ msg.senderId === auth.currentUser?.uid ? 'justify-end' : 'justify-start' } animate-slideUp`}
                  >
                    <div
                      className={`max-w-[70%] p-4 rounded-2xl shadow-lg ${
                        msg.senderId === auth.currentUser?.uid
                          ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white ml-12'
                          : 'bg-white/10 backdrop-blur-md text-white mr-12 border border-white/20'
                      }`}
                    >
                      <p className="leading-relaxed">{msg.text}</p>
                      <div className={`text-xs mt-2 ${ msg.senderId === auth.currentUser?.uid ? 'text-purple-100' : 'text-gray-400' }`}>
                        {formatTime(msg.timestamp)}
                      </div>
                    </div>
                  </div>
                ))}
              {messages.length === 0 && (
                <div className="flex-1 flex items-center justify-center text-center">
                  <div>
                    <MessageCircle size={64} className="mx-auto mb-4 text-gray-400 opacity-50" />
                    <p className="text-gray-400 text-lg">No messages yet</p>
                    <p className="text-gray-500 text-sm">Start the conversation!</p>
                  </div>
                </div>
              )}
            </div>

            {/* Message Input */}
            <div className="p-6 bg-white/5 backdrop-blur-xl border-t border-white/10">
              <form onSubmit={handleSubmit} className="flex items-end gap-4">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="w-full p-4 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
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
            <div className="text-center p-4">
               {/* Hamburger menu for mobile on welcome screen */}
              <button onClick={() => setIsSidebarOpen(true)} className="absolute top-6 left-6 md:hidden text-white">
                <Menu size={28} />
              </button>
              <div className="w-24 h-24 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mb-6 mx-auto">
                <MessageCircle size={48} className="text-white" />
              </div>
              <h3 className="text-2xl font-semibold text-white mb-2">Select a user to start chatting</h3>
              <p className="text-gray-400">Choose someone from your contacts.</p>
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