import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { prisma, type BalloonColorPreset } from '@repo/database';
import {
  generateShortId,
  ID_MAX_ATTEMPTS,
  isIdUniqueViolation,
  isUniqueViolationOn,
} from '../common/short-id.js';
import type { BalloonColorInput } from './dto/balloon-color.dto.js';
import {
  BUILTIN_BALLOON_HEXES,
  BUILTIN_BALLOON_NAME_KEYS,
  balloonColorNameKey,
  normalizeBalloonHex,
} from './balloon-color.js';

@Injectable()
export class BalloonColorsService {
  async list() {
    const colors = await prisma.balloonColorPreset.findMany({
      orderBy: { name: 'asc' },
    });

    return colors.map((color) => this.toResponse(color));
  }

  async create(input: BalloonColorInput) {
    const data = await this.parseInput(input);

    for (let attempt = 0; attempt < ID_MAX_ATTEMPTS; attempt++) {
      try {
        const color = await prisma.balloonColorPreset.create({
          data: {
            id: generateShortId(),
            name: data.name,
            nameKey: data.nameKey,
            hex: data.hex,
          },
        });

        return this.toResponse(color);
      } catch (error) {
        this.rethrowUniqueConflict(error);

        if (attempt < ID_MAX_ATTEMPTS - 1 && isIdUniqueViolation(error)) {
          continue;
        }

        throw error;
      }
    }

    throw new InternalServerErrorException(
      `Não foi possível gerar um ID único após ${ID_MAX_ATTEMPTS} tentativas.`,
    );
  }

  async update(id: string, input: BalloonColorInput) {
    const existing = await prisma.balloonColorPreset.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Cor não encontrada.');
    }

    const data = await this.parseInput(input, id);

    try {
      const color = await prisma.$transaction(async (tx) => {
        const updated = await tx.balloonColorPreset.update({
          where: { id },
          data: {
            name: data.name,
            nameKey: data.nameKey,
            hex: data.hex,
          },
        });

        if (existing.hex !== data.hex) {
          await tx.question.updateMany({
            where: {
              balloonColor: { equals: existing.hex, mode: 'insensitive' },
            },
            data: { balloonColor: data.hex },
          });
        }

        return updated;
      });

      return this.toResponse(color);
    } catch (error) {
      this.rethrowUniqueConflict(error);
      throw error;
    }
  }

  async remove(id: string) {
    const existing = await prisma.balloonColorPreset.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Cor não encontrada.');
    }

    const usedByQuestion = await prisma.question.count({
      where: {
        balloonColor: { equals: existing.hex, mode: 'insensitive' },
      },
    });

    if (usedByQuestion > 0) {
      throw new BadRequestException(
        'Não é possível excluir uma cor usada por uma questão.',
      );
    }

    await prisma.balloonColorPreset.delete({ where: { id } });

    return { success: true as const };
  }

  async assertUsable(value: string): Promise<string> {
    const hex = normalizeBalloonHex(value);
    if (!hex) {
      throw new BadRequestException('Informe uma cor de balão válida.');
    }

    if (BUILTIN_BALLOON_HEXES.has(hex)) {
      return hex;
    }

    const custom = await prisma.balloonColorPreset.findUnique({
      where: { hex },
      select: { id: true },
    });

    if (!custom) {
      throw new BadRequestException('Informe uma cor de balão válida.');
    }

    return hex;
  }

  private async parseInput(input: BalloonColorInput, excludeId?: string) {
    const name = input.name.trim();
    if (!name) {
      throw new BadRequestException('Informe o nome da cor.');
    }

    const hex = normalizeBalloonHex(input.hex);
    if (!hex) {
      throw new BadRequestException('Informe um código de cor válido.');
    }

    const nameKey = balloonColorNameKey(name);
    const exclude = excludeId ? { NOT: { id: excludeId } } : {};

    if (BUILTIN_BALLOON_NAME_KEYS.has(nameKey)) {
      throw new BadRequestException('Já existe uma cor com este nome.');
    }

    if (BUILTIN_BALLOON_HEXES.has(hex)) {
      throw new BadRequestException('Já existe uma cor com este código.');
    }

    const [nameTaken, hexTaken] = await Promise.all([
      prisma.balloonColorPreset.findFirst({
        where: { nameKey, ...exclude },
        select: { id: true },
      }),
      prisma.balloonColorPreset.findFirst({
        where: { hex, ...exclude },
        select: { id: true },
      }),
    ]);

    if (nameTaken) {
      throw new BadRequestException('Já existe uma cor com este nome.');
    }

    if (hexTaken) {
      throw new BadRequestException('Já existe uma cor com este código.');
    }

    return { name, nameKey, hex };
  }

  private rethrowUniqueConflict(error: unknown): void {
    if (isUniqueViolationOn(error, 'nameKey')) {
      throw new BadRequestException('Já existe uma cor com este nome.');
    }

    if (isUniqueViolationOn(error, 'hex')) {
      throw new BadRequestException('Já existe uma cor com este código.');
    }
  }

  private toResponse(color: BalloonColorPreset) {
    return {
      id: color.id,
      name: color.name,
      hex: color.hex,
    };
  }
}
