export interface SubRegulation {
  value: number;
  label: string;
}

export interface Regulation {
  value: number;
  label: string;
  subNormas: SubRegulation[];
}
