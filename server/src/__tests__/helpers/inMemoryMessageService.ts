import { MessageService, StoredMessage } from '../../chatServer';

interface PersistedMessage extends StoredMessage {
  roomId: string;
}

export class InMemoryMessageService implements MessageService {
  private messages: PersistedMessage[] = [];

  async getRecentMessages(roomId: string): Promise<StoredMessage[]> {
    return this.messages
      .filter((msg) => msg.roomId === roomId)
      .map(({ roomId: _roomId, ...rest }) => rest);
  }

  async saveMessage({
    roomId,
    username,
    text,
  }: {
    roomId: string;
    username: string;
    text: string;
  }): Promise<void> {
    this.messages.push({
      roomId,
      username,
      text,
      timestamp: new Date(),
    });
  }

  getMessages(roomId: string): PersistedMessage[] {
    return this.messages.filter((msg) => msg.roomId === roomId);
  }

  reset(): void {
    this.messages = [];
  }
}
