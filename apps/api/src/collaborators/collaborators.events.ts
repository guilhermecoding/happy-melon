import { Injectable } from '@nestjs/common';
import type { CollaboratorJoinedEvent } from '@repo/shared';
import type { Observable } from 'rxjs';
import { collaboratorsEventsBus } from './collaborators.events-bus.js';

@Injectable()
export class CollaboratorsEventsService {
  emit(contestId: string, event: CollaboratorJoinedEvent) {
    collaboratorsEventsBus.emit(contestId, event);
  }

  subscribe(contestId: string): Observable<CollaboratorJoinedEvent> {
    return collaboratorsEventsBus.subscribe(contestId);
  }
}
