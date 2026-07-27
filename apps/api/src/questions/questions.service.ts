import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { prisma, type Question } from '@repo/database';
import {
  generateShortId,
  ID_MAX_ATTEMPTS,
  isIdUniqueViolation,
  isUniqueViolationOn,
} from '../common/short-id.js';
import type {
  CreateQuestionDto,
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

    for (let attempt = 0; attempt < ID_MAX_ATTEMPTS; attempt++) {
      try {
        const question = await prisma.question.create({
          data: {
            id: generateShortId(),
            contestId,
            label: dto.label.trim(),
            title: dto.title.trim(),
            balloonColor: dto.balloonColor.toUpperCase(),
          },
        });

        return this.toResponse(question);
      } catch (error) {
        if (isUniqueViolationOn(error, 'label')) {
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

    try {
      const question = await prisma.question.update({
        where: { id },
        data: {
          label: dto.label.trim(),
          title: dto.title.trim(),
          balloonColor: dto.balloonColor.toUpperCase(),
        },
      });

      return this.toResponse(question);
    } catch (error) {
      if (isUniqueViolationOn(error, 'label')) {
        throw new BadRequestException(
          'Já existe uma questão com este identificador nesta competição.',
        );
      }

      throw error;
    }
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
