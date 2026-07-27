import type { IncomingHttpHeaders } from 'node:http';
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { APIError } from 'better-auth/api';
import { fromNodeHeaders } from 'better-auth/node';
import { prisma, type Question } from '@repo/database';
import { auth } from '../auth/auth.js';
import {
  generateShortId,
  ID_MAX_ATTEMPTS,
  isIdUniqueViolation,
  isPrismaUniqueViolation,
  isUniqueViolationOn,
} from '../common/short-id.js';
import type {
  CreateQuestionDto,
  DeleteQuestionDto,
  UpdateQuestionDto,
} from './dto/question.dto.js';

@Injectable()
export class QuestionsService {
  async listByContest(contestId: string) {
    await this.ensureContestExists(contestId);

    const questions = await prisma.question.findMany({
      where: { contestId },
      orderBy: { createdAt: 'asc' },
    });

    return questions.map((question) => this.toResponse(question));
  }

  async create(contestId: string, dto: CreateQuestionDto) {
    await this.ensureContestExists(contestId);
    await this.ensureLabelAvailable(contestId, dto.label);

    for (let attempt = 0; attempt < ID_MAX_ATTEMPTS; attempt++) {
      try {
        const question = await prisma.question.create({
          data: {
            id: generateShortId(),
            contestId,
            label: dto.label,
            title: dto.title,
            balloonColor: dto.balloonColor,
          },
        });

        return this.toResponse(question);
      } catch (error) {
        if (this.isLabelUniqueViolation(error)) {
          throw new BadRequestException(
            'Já existe uma questão com este identificador nesta competição.',
          );
        }

        if (
          attempt < ID_MAX_ATTEMPTS - 1 &&
          isIdUniqueViolation(error)
        ) {
          continue;
        }

        throw error;
      }
    }

    throw new InternalServerErrorException(
      `Não foi possível gerar um ID único após ${ID_MAX_ATTEMPTS} tentativas.`,
    );
  }

  async update(id: string, dto: UpdateQuestionDto) {
    const existing = await prisma.question.findUnique({ where: { id } });

    if (!existing) {
      throw new NotFoundException('Questão não encontrada.');
    }

    await this.ensureLabelAvailable(existing.contestId, dto.label, id);

    try {
      const question = await prisma.question.update({
        where: { id },
        data: {
          label: dto.label,
          title: dto.title,
          balloonColor: dto.balloonColor,
        },
      });

      return this.toResponse(question);
    } catch (error) {
      if (this.isLabelUniqueViolation(error)) {
        throw new BadRequestException(
          'Já existe uma questão com este identificador nesta competição.',
        );
      }

      throw error;
    }
  }

  async remove(
    headers: IncomingHttpHeaders,
    id: string,
    dto: DeleteQuestionDto,
  ) {
    const existing = await prisma.question.findUnique({ where: { id } });

    if (!existing) {
      throw new NotFoundException('Questão não encontrada.');
    }

    await this.verifyAdminPassword(headers, dto.password);

    await prisma.question.delete({ where: { id } });

    return { success: true as const };
  }

  private async ensureLabelAvailable(
    contestId: string,
    label: string,
    excludeId?: string,
  ) {
    const existing = await prisma.question.findFirst({
      where: {
        contestId,
        label: { equals: label, mode: 'insensitive' },
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
      select: { id: true },
    });

    if (existing) {
      throw new BadRequestException(
        'Já existe uma questão com este identificador nesta competição.',
      );
    }
  }

  private isLabelUniqueViolation(error: unknown): boolean {
    if (isUniqueViolationOn(error, 'label')) {
      return true;
    }

    return (
      isPrismaUniqueViolation(error) && !isIdUniqueViolation(error)
    );
  }

  private async verifyAdminPassword(
    headers: IncomingHttpHeaders,
    password: string,
  ) {
    try {
      await auth.api.verifyPassword({
        headers: this.toAuthHeaders(headers),
        body: { password },
      });
    } catch (error) {
      if (error instanceof APIError) {
        throw new UnauthorizedException('Senha de administrador incorreta.');
      }

      throw error;
    }
  }

  private toAuthHeaders(headers: IncomingHttpHeaders): Headers {
    if (typeof fromNodeHeaders === 'function') {
      return fromNodeHeaders(headers);
    }

    const authHeaders = new Headers();

    for (const [name, value] of Object.entries(headers)) {
      if (Array.isArray(value)) {
        for (const item of value) {
          authHeaders.append(name, item);
        }
      } else if (value !== undefined) {
        authHeaders.set(name, value);
      }
    }

    return authHeaders;
  }

  private async ensureContestExists(contestId: string) {
    const contest = await prisma.contest.findUnique({
      where: { id: contestId },
      select: { id: true },
    });

    if (!contest) {
      throw new NotFoundException('Competição não encontrada.');
    }
  }

  private toResponse(question: Question) {
    return {
      id: question.id,
      contestId: question.contestId,
      label: question.label,
      title: question.title,
      balloonColor: question.balloonColor,
      createdAt: question.createdAt.toISOString(),
      updatedAt: question.updatedAt.toISOString(),
    };
  }
}
