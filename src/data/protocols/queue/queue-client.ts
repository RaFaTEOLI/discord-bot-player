export interface QueueClient<R = any> {
  send: (queue: 'music' | 'queue', data: R) => Promise<void>;
}
