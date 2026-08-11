import { Injectable } from '@nestjs/common';
import type { ContestAccessEvent } from '@repo/shared';
import { Observable, Subject } from 'rxjs';

@Injectable()
export class ContestAccessEventsService {
  private readonly subjects = new Map<string, Subject<ContestAccessEvent>>();

  emit(contestId: string, event: ContestAccessEvent) {
    this.getOrCreate(contestId).next(event);
  }

  subscribe(contestId: string): Observable<ContestAccessEvent> {
    return this.getOrCreate(contestId).asObservable();
  }

  private getOrCreate(contestId: string): Subject<ContestAccessEvent> {
    let subject = this.subjects.get(contestId);
    if (!subject) {
      subject = new Subject<ContestAccessEvent>();
      this.subjects.set(contestId, subject);
    }
    return subject;
  }
}
