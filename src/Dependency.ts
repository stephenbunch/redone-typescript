import { _Bound } from './decorators/_Bound';
import { ComputationContextClass } from './ComputationContext';
import { enqueue } from './transaction';
import { Event, EventController } from './Event';
import { getCurrentComputation, ReentrancyError } from './Computation';
import { Logger } from './Logger';
import { _OrderedSet } from './_OrderedSet';
import { Uri } from './Uri';

export class CircularDependencyError extends Error { }

export class Dependency {
  readonly uri: Uri;

  private contexts = new _OrderedSet<ComputationContextClass>();
  private readonly onHotEvent = new EventController();
  private readonly onColdEvent = new EventController();
  private isHot = false;

  constructor(uri: Uri) {
    this.uri = uri;
  }

  @_Bound()
  private onContextDestroy(context: ComputationContextClass) {
    context.onDestroy.removeListener(this.onContextDestroy);
    this.contexts.delete(context);
    this.checkIsCold();
  }

  get onHot(): Event {
    return this.onHotEvent;
  }

  get onCold(): Event {
    return this.onColdEvent;
  }

  depend(): void {
    if (this.uri.activate) {
      this.uri.activate();
    }
    const computation = getCurrentComputation();
    if (computation && computation.isAlive) {
      const context = computation.context!;
      if (!this.contexts.has(context)) {
        this.contexts.add(context);
        Logger.current.trace(
          () => [`${computation.name} depends on ${this.uri}.`]);
        context.track(this);
        context.onDestroy.addListener(this.onContextDestroy);
        if (!this.isHot) {
          this.isHot = true;
          this.onHotEvent.trigger(undefined);
        }
      }
    }
  }

  changed(): void {
    if (this.isHot) {
      Logger.current.trace(() => [`${this.uri} changed.`]);
      const contexts = this.contexts;
      this.contexts = new _OrderedSet<ComputationContextClass>();
      const current = getCurrentComputation();
      for (const context of contexts) {
        if (context.isAlive) {
          if (context.parents!.has(current!)) {
            throw new CircularDependencyError(
              `${this.uri} was changed in autorun ` +
              `${current!.name} after being depended on.`
            );
          }
          try {
            context.computation!.rerun();
          } catch (err) {
            // If we get a reentrancy error, it's because another autorun which
            // depended on this value (directly or indirectly) triggered a change
            // in this autorun.
            if (err instanceof ReentrancyError) {
              throw new CircularDependencyError(
                `Changing ${this.uri} caused another autorun to rerun ` +
                `which caused another change to this value.`
              );
            } else {
              throw err;
            }
          }
        }
      }
      this.checkIsCold();
    }
  }

  private checkIsCold() {
    enqueue(() => {
      if (!this.isHot && this.contexts.size === 0) {
        this.isHot = false;
        this.onColdEvent.trigger(undefined);
      }
    }, this);
  }
}
