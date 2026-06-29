export interface User {
  id: number;
  email: string;
  passwordHash: string;
  name: string;
}

export const users: User[] = [];

let nextId = 1;
export const nextUserId = (): number => nextId++;
