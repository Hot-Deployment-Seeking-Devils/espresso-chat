import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import '../styles/chat.css';

interface Message {
  username: string;
  text: string;
  time: string;
}

interface User {
  username: string;
}

const ChatRoom = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [showCopied, setShowCopied] = useState(false);
  const socketRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // auto scroll to bottom when new message comes in
  const scrollToBottom = () => {
      const el = messagesEndRef.current;
  if (el && typeof el.scrollIntoView === "function") {
    el.scrollIntoView({ behavior: "smooth" });
  }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    //   // connect to socket
    const socket = io('http://localhost:3002');
    // listen for messages
    socket.on('message', (message: Message) => {
      setMessages((prev) => [...prev, message]);
    });

    // listen for room users update
    socket.on('roomUsers', ({ users }: { room: string; users: User[] }) => {
      setUsers(users);
    });

    socketRef.current = socket;

    // join the room
    socket.emit('joinRoom', { room: roomId });

    // cleanup on unmount
    return () => {
      socket.disconnect();
    };
  }, [roomId]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();

    if (messageInput.trim() === '') return;

    // send message to server
    socketRef.current.emit('chatMessage', messageInput);

    // clear input
    setMessageInput('');
  };

  const handleLeaveRoom = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
    navigate('/');
  };

  const handleCopyLink = () => {
  const roomLink = `${window.location.origin}/room/${roomId}`;
  
  navigator.clipboard.writeText(roomLink)
    .then(() => {
      // Show notification
      setShowCopied(true);
      
      // Hide notification after 2.5 seconds
      setTimeout(() => {
        setShowCopied(false);
      }, 2500);
    })
    .catch((err) => {
      console.error('Failed to copy link:', err);
      alert('Failed to copy link to clipboard');
    });
  };

  return (
    <div className='chat-container'>
      <header className='chat-header'>
        <h1>☕ Espresso Chat</h1>
        <div className='header-buttons'>
          <button className='btn' onClick={handleCopyLink}>
            Share Room Link
          </button>
          <button className='btn' onClick={handleLeaveRoom}>
            Leave Room
          </button>
        </div>
      </header>

      {/* Notification Toast */}
      {showCopied && (
      <div className='notification'>
      ✓ Room link copied to clipboard!
      </div>
      )}

      <main className='chat-main'>
        <div className='chat-sidebar'>
          <h3>
            <i className='fas fa-comments'></i> Room:
          </h3>
          <h2>{roomId}</h2>
          <h3>
            <i className='fas fa-users'></i> Users
          </h3>
          <ul>
            {users.map((user, index) => (
              <li key={index}>{user.username}</li>
            ))}
          </ul>
        </div>
        <div className='chat-messages'>
          {messages.map((msg, index) => (
            <div key={index} className='message'>
              <p className='meta'>
                {msg.username} <span>{msg.time}</span>
              </p>
              <p className='text'>{msg.text}</p>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </main>
      <div className='chat-form-container'>
        <form onSubmit={handleSendMessage}>
          <input
            type='text'
            placeholder='Enter Message'
            value={messageInput}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setMessageInput(e.target.value)
            }
            autoComplete='off'
          />
          <button className='btn' type='submit'>
            <i className='fas fa-paper-plane'></i> Send
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatRoom;
