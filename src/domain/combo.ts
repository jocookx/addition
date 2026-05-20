export type ComboStep = {
  name: string;
  note: string;
};

export type ComboListItem = {
  id: string;
  title: string;
  software: string;
  difficulty: string;
  description: string;
  gif: string;
  commands: ComboStep[];
  tags: string[];
};
