import type { Socket } from 'socket.io-client';

export const waitForEvent = <T = unknown>(
  socket: Socket,
  event: string,
  timeout = 5000
): Promise<T> =>
  new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      socket.off(event, handler);
      reject(new Error(`Timed out waiting for "${event}" event`));
    }, timeout);

    const handler = (data: T) => {
      clearTimeout(timer);
      resolve(data);
    };

    socket.once(event, handler);
  });
