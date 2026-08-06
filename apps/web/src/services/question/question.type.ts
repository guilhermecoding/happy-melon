import type { BalloonColor } from './balloon-color';

export type Question = {
  id: string;
  contestId: string;
  label: string;
  title: string;
  balloonColor: BalloonColor;
  createdAt: string;
  updatedAt: string;
};

export type CreateQuestionInput = {
  label: string;
  title: string;
  balloonColor: BalloonColor;
};

export type UpdateQuestionInput = CreateQuestionInput;

export type DeleteQuestionInput = {
  password: string;
};
