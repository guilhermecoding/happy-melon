import { Injectable } from '@nestjs/common';
import type { TaskSummaryUpdatedEvent } from '@repo/shared';
import { Observable, Subject } from 'rxjs';

@Injectable()
export class TaskSummaryEventsService {
  private readonly subjects = new Map<
    string,
    Subject<TaskSummaryUpdatedEvent>
  >();

  emit(contestId: string, event: TaskSummaryUpdatedEvent) {
    this.getOrCreate(contestId).next(event);
  }

  subscribe(contestId: string): Observable<TaskSummaryUpdatedEvent> {
    return this.getOrCreate(contestId).asObservable();
  }

  private getOrCreate(contestId: string): Subject<TaskSummaryUpdatedEvent> {
    let subject = this.subjects.get(contestId);
    if (!subject) {
      subject = new Subject<TaskSummaryUpdatedEvent>();
      this.subjects.set(contestId, subject);
    }
    return subject;
  }
}
