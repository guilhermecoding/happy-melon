export type Question = {
  id: string;
  contestId: string;
  label: string;
  title: string;
  balloonColor: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateQuestionInput = {
  label: string;
  title: string;
  balloonColor: string;
};

export type UpdateQuestionInput = CreateQuestionInput;

export type DeleteQuestionInput = {
  password: string;
};
