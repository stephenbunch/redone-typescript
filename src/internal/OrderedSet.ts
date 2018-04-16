export class OrderedSet<T> implements Iterable<T> {
  private set: Set<T>;
  private items: Array<T>;

  constructor(values?: Iterable<T>) {
    if (values) {
      this.set = new Set(values);
      this.items = Array.from(this.set);
    } else {
      this.set = new Set();
      this.items = [];
    }
  }

  [Symbol.iterator](): IterableIterator<T> {
    return this.items[Symbol.iterator]();
  }

  get size(): number {
    return this.set.size;
  }

  get(index: number): T | undefined {
    return this.items[index];
  }

  has(item: T): boolean {
    return this.set.has(item);
  }

  delete(item: T) {
    if (this.set.has(item)) {
      this.set.delete(item);
      this.items.splice(this.items.indexOf(item), 1);
    }
  }

  add(item: T) {
    if (!this.set.has(item)) {
      this.set.add(item);
      this.items.push(item);
    }
  }

  clone(): OrderedSet<T> {
    const set = new OrderedSet<T>();
    set.set = new Set(this.set);
    set.items = this.items.slice();
    return set;
  }
}