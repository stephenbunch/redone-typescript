import { _OrderedSet } from './_OrderedSet';

export type EventListener<T> = (eventArgs: T) => void;

export interface Event<T = undefined> {
  addListener(listener: EventListener<T>): void;
  removeListener(listener: EventListener<T>): void;
}

export class EventController<T = undefined> implements Event<T> {
  private listeners = new _OrderedSet<EventListener<T>>();

  addListener(listener: EventListener<T>) {
    this.listeners.add(listener);
  }

  removeListener(listener: EventListener<T>) {
    this.listeners.delete(listener);
  }

  trigger(eventArgs: T) {
    const listeners = this.listeners.clone();
    for (const listener of listeners) {
      listener(eventArgs);
    }
  }
}
