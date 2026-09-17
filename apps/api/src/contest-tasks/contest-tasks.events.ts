import { Injectable } from '@nestjs/common';
import type { StaffTaskEvent } from '@repo/shared';
import { Observable, Subject } from 'rxjs';

@Injectable()
export class ContestTasksEventsService {
  private readonly subjects = new Map<string, Subject<StaffTaskEvent>>();

  emit(scopeId: string, event: StaffTaskEvent) {
    this.getOrCreate(scopeId).next(event);
  }

  emitForRound(roundId: string, competitionId: string, event: StaffTaskEvent) {
    this.emit(roundId, event);
    if (competitionId !== roundId) {
      this.emit(competitionId, event);
    }
  }

  subscribe(contestId: string): Observable<StaffTaskEvent> {
    return this.getOrCreate(contestId).asObservable();
  }

  private getOrCreate(contestId: string): Subject<StaffTaskEvent> {
    let subject = this.subjects.get(contestId);
    if (!subject) {
      subject = new Subject<StaffTaskEvent>();
      this.subjects.set(contestId, subject);
    }
    return subject;
  }
}
