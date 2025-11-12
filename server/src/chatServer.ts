import path from 'path';
import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import moment from 'moment';
import formatMessage from './utils/messages';
import {
  userJoin,
  getCurrentUser,
  userLeave,
  getRoomUsers,
} from './utils/users';
import Message from './models/Message';
import {
  uniqueNamesGenerator,
  adjectives,
  colors,
  animals,
} from 'unique-names-generator';

const botName = 'Espresso Bot';

export interface StoredMessage {
  username: string;
  text: string;
  timestamp: Date;
}

export interface MessageService {
  getRecentMessages(roomId: string): Promise<StoredMessage[]>;
  saveMessage(message: {
    roomId: string;
    username: string;
    text: string;
  }): Promise<void>;
}

export interface ChatServerOptions {
  corsOrigin?: string;
  messageService?: MessageService;
  portLabel?: number | string;
}

export const createChatServer = (options: ChatServerOptions = {}) => {
  const messageService =
    options.messageService ?? createDefaultMessageService();
  const corsOrigin = options.corsOrigin ?? 'http://localhost:5177';
  const portLabel = options.portLabel ?? 3002;

  const app = express();
  const httpServer = createServer(app);
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: corsOrigin,
      methods: ['GET', 'POST'],
    },
  });

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.use(express.static(path.resolve(__dirname, '../../client')));

  // Basic route
  app.get('/api', (req, res) => {
    res.json({ message: 'Chat API is running on ' + portLabel });
  });

  //socket.io user connections
  io.on('connection', (socket) => {
    console.log('connection: User connected:', socket.id);

    //socket.io room events connections
    socket.on('joinRoom', async ({ room }) => {
      if (!room) {
        socket.emit('error', { message: 'Room are required' });
        return;
      }

      // random username unique generation for anonymous users
      const username = uniqueNamesGenerator({
        dictionaries: [adjectives, colors, animals],
      });

      // save users to local memory in place of redux
      const user = userJoin(socket.id, username, room);
      console.log('joinRoom: User joined room:', JSON.stringify(user));

      // Socket.io Room: added user to socket.io room
      socket.join(user.room);

      socket.emit(
        'message',
        formatMessage(botName, 'Welcome to Espresso Chat!')
      );

      // Mongoose Database: Load last 50 messages from room
      try {
        const messages = await messageService.getRecentMessages(user.room);
        messages
          .slice()
          .reverse()
          .forEach((msg) => {
            socket.emit('message', {
              username: msg.username,
              text: msg.text,
              time: moment(msg.timestamp).format('h:mm a'),
            });
          });
      } catch (error) {
        console.log('Error loading messages:', error);
      }

      // broadcast message to socket.io room that user joined
      socket.broadcast
        .to(user.room)
        .emit(
          'message',
          formatMessage(botName, `${user.username} has joined the chat.`)
        );

      // Socket.io Room: Update room users list
      io.to(user.room).emit('roomUsers', {
        room: user.room,
        users: getRoomUsers(user.room),
      });
    });

    // socket.io Chat Message Events
    socket.on('chatMessage', async (msg) => {
      const user = getCurrentUser(socket.id);

      if (!user) {
        console.log('chatMessage error: User not found');
        return;
      }

      console.log(
        'chatMessage:',
        `${formatMessage(user.username, msg).time} ${JSON.stringify(
          user
        )}: ${msg}`
      );

      // Emit message to all users in the room
      io.to(user.room).emit('message', formatMessage(user.username, msg));

      // Save message to database
      try {
        await messageService.saveMessage({
          roomId: user.room,
          username: user.username,
          text: msg,
        });
      } catch (error) {
        console.log('Error saving message:', error);
      }
    });

    // socket.io user Disconnect Events
    socket.on('disconnect', () => {
      const user = userLeave(socket.id);

      if (user) {
        console.log('User disconnected:', JSON.stringify(user));

        io.to(user.room).emit(
          'message',
          formatMessage(botName, `${user.username} has left the chat.`)
        );

        io.to(user.room).emit('roomUsers', {
          room: user.room,
          users: getRoomUsers(user.room),
        });
      }
    });
  });

  return { app, httpServer, io };
};

// Database Integration: Default implementation of MessageService using Mongoose
const createDefaultMessageService = (): MessageService => ({
  async getRecentMessages(roomId: string) {
    return Message.find({ roomId }).sort({ timestamp: -1 }).limit(50).exec();
  },
  async saveMessage({ roomId, username, text }) {
    const newMessage = new Message({
      roomId,
      username,
      text,
    });
    await newMessage.save();
  },
});

export type ChatServer = ReturnType<typeof createChatServer>;
