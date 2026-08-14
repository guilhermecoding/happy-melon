import type { CollaboratorJoinedEvent } from '@repo/shared';
import { Observable, Subject } from 'rxjs';

/**
 * Process-wide bus so Nest controllers and the Better Auth staff plugin can
 * emit without sharing Nest DI.
 */
class CollaboratorsEventsBus {
  private readonly subjects = new Map<
    string,
    Subject<CollaboratorJoinedEvent>
  >();

  emit(contestId: string, event: CollaboratorJoinedEvent) {
    this.getOrCreate(contestId).next(event);
  }

  subscribe(contestId: string): Observable<CollaboratorJoinedEvent> {
    return this.getOrCreate(contestId).asObservable();
  }

  private getOrCreate(contestId: string): Subject<CollaboratorJoinedEvent> {
    let subject = this.subjects.get(contestId);
    if (!subject) {
      subject = new Subject<CollaboratorJoinedEvent>();
      this.subjects.set(contestId, subject);
    }
    return subject;
  }
}

export const collaboratorsEventsBus = new CollaboratorsEventsBus();
