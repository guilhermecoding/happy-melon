import {
  BadRequestException,
  type PipeTransform,
} from '@nestjs/common';
import type { ZodType } from 'zod';

export class ZodValidationPipe<T = unknown> implements PipeTransform {
  constructor(private readonly schema: ZodType<T>) {}

  transform(value: unknown): T {
    const result = this.schema.safeParse(value);

    if (!result.success) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: result.error.flatten(),
      });
    }

    return result.data;
  }
}
