import type { AddressInfo } from 'net';
import { io as Client, Socket } from 'socket.io-client';
import { createChatServer } from '../chatServer';
import { InMemoryMessageService } from './helpers/inMemoryMessageService';
import { waitForEvent } from './helpers/socketTestUtils';
import { resetUsers } from '../utils/users';

describe('Socket.IO chat server', () => {
  const room = 'lobby';
  let port: number;
  let clients: Socket[] = [];
  let messageService: InMemoryMessageService;
  let closeServer: () => Promise<void>;

  const createServer = async () => {
    messageService = new InMemoryMessageService();
    const { httpServer } = createChatServer({
      messageService,
      corsOrigin: '*',
      portLabel: 'test',
    });

    await new Promise<void>((resolve, reject) => {
      const onError = (error: Error) => reject(error);
      httpServer.once('error', onError);
      httpServer.listen(0, '127.0.0.1', () => {
        httpServer.off('error', onError);
        port = (httpServer.address() as AddressInfo).port;
        resolve();
      });
    });

    closeServer = () =>
      new Promise<void>((resolve, reject) => {
        httpServer.close((error) => {
          if (error) {
            reject(error);
          } else {
            resolve();
          }
        });
      });
  };

  const createClient = async () => {
    const socket = Client(`http://127.0.0.1:${port}`, {
      transports: ['websocket'],
      forceNew: true,
      reconnection: false,
    });

    clients.push(socket);

    await new Promise<void>((resolve, reject) => {
      socket.once('connect', () => resolve());
      socket.once('connect_error', (error) => reject(error));
    });

    return socket;
  };

  const cleanupClients = async () => {
    await Promise.all(
      clients.map(
        (socket) =>
          new Promise<void>((resolve) => {
            if (socket.connected) {
              socket.once('disconnect', () => resolve());
              socket.disconnect();
            } else {
              resolve();
            }
          })
      )
    );
    clients = [];
  };

  const joinRoomAndWait = async (socket: Socket) => {
    const welcomePromise = waitForEvent<{
      username: string;
      text: string;
    }>(socket, 'message');
    const rosterPromise = waitForEvent<{
      room: string;
      users: Array<{ room: string }>;
    }>(socket, 'roomUsers');

    socket.emit('joinRoom', { room });

    const [welcome, roster] = await Promise.all([welcomePromise, rosterPromise]);

    return { welcome, roster };
  };

  beforeEach(async () => {
    await createServer();
  });

  afterEach(async () => {
    await cleanupClients();
    if (closeServer) {
      await closeServer();
    }
    resetUsers();
    messageService?.reset();
  });

  test('welcomes users and shares room roster on join', async () => {
    const client = await createClient();
    const { welcome, roster } = await joinRoomAndWait(client);

    expect(welcome.username).toBe('Espresso Bot');
    expect(welcome.text).toBe('Welcome to Espresso Chat!');

    expect(roster.room).toBe(room);
    expect(roster.users).toHaveLength(1);
    expect(roster.users[0].room).toBe(room);
  });

  test('notifies existing members when someone joins the room', async () => {
    const firstClient = await createClient();
    await joinRoomAndWait(firstClient);

    const secondClient = await createClient();
    const joinBroadcastPromise = waitForEvent<{ text: string }>(
      firstClient,
      'message'
    );
    const rosterPromise = waitForEvent<{
      users: Array<{ room: string }>;
    }>(firstClient, 'roomUsers');

    await joinRoomAndWait(secondClient);

    const joinBroadcast = await joinBroadcastPromise;
    expect(joinBroadcast.text).toContain('has joined the chat.');

    const updatedRoster = await rosterPromise;
    expect(updatedRoster.users).toHaveLength(2);
    updatedRoster.users.forEach((user) => expect(user.room).toBe(room));
  });

  test('broadcasts chat messages and persists via message service', async () => {
    const sender = await createClient();
    await joinRoomAndWait(sender);

    const receiver = await createClient();
    const senderJoinNotice = waitForEvent(sender, 'message');
    const senderRosterUpdate = waitForEvent(sender, 'roomUsers');
    await joinRoomAndWait(receiver);
    await senderJoinNotice;
    await senderRosterUpdate;

    const text = 'Testing 1 2 3';
    const received = waitForEvent<{ username: string; text: string }>(
      receiver,
      'message'
    );

    sender.emit('chatMessage', text);

    const payload = await received;
    expect(payload.text).toBe(text);
    expect(payload.username).not.toBe('Espresso Bot');

    const stored = messageService.getMessages(room);
    expect(stored.map((msg) => msg.text)).toContain(text);
  });

  test('announces when a user disconnects', async () => {
    const firstClient = await createClient();
    await joinRoomAndWait(firstClient);

    const secondClient = await createClient();
    const joinNotice = waitForEvent(firstClient, 'message');
    const joinRoster = waitForEvent(firstClient, 'roomUsers');
    await joinRoomAndWait(secondClient);
    await joinNotice;
    await joinRoster;

    const leaveMessage = waitForEvent<{ text: string }>(
      firstClient,
      'message'
    );
    const rosterUpdate = waitForEvent<{ users: Array<unknown> }>(
      firstClient,
      'roomUsers'
    );

    secondClient.disconnect();

    const leave = await leaveMessage;
    expect(leave.text).toContain('has left the chat.');

    const roster = await rosterUpdate;
    expect(roster.users).toHaveLength(1);
  });
});
