import { Injectable } from '@nestjs/common';
import type { TeamEvent } from '@repo/shared';
import { Observable, Subject } from 'rxjs';

@Injectable()
export class TeamsEventsService {
  private readonly subjects = new Map<string, Subject<TeamEvent>>();

  emit(competitionId: string, event: TeamEvent) {
    this.getOrCreate(competitionId).next(event);
  }

  subscribe(competitionId: string): Observable<TeamEvent> {
    return this.getOrCreate(competitionId).asObservable();
  }

  private getOrCreate(competitionId: string): Subject<TeamEvent> {
    let subject = this.subjects.get(competitionId);
    if (!subject) {
      subject = new Subject<TeamEvent>();
      this.subjects.set(competitionId, subject);
    }
    return subject;
  }
}
