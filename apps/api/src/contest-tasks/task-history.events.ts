import { Injectable } from '@nestjs/common';
import type { TaskHistoryCreatedEvent } from '@repo/shared';
import { Observable, Subject } from 'rxjs';

@Injectable()
export class TaskHistoryEventsService {
  private readonly subjects = new Map<
    string,
    Subject<TaskHistoryCreatedEvent>
  >();

  emit(contestId: string, event: TaskHistoryCreatedEvent) {
    this.getOrCreate(contestId).next(event);
  }

  subscribe(contestId: string): Observable<TaskHistoryCreatedEvent> {
    return this.getOrCreate(contestId).asObservable();
  }

  private getOrCreate(contestId: string): Subject<TaskHistoryCreatedEvent> {
    let subject = this.subjects.get(contestId);
    if (!subject) {
      subject = new Subject<TaskHistoryCreatedEvent>();
      this.subjects.set(contestId, subject);
    }
    return subject;
  }
}
