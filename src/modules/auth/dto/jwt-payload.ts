export interface IJwtPayload {
  email: string;
  id: string;
}

export interface IJwtUser extends IJwtPayload {
  iat: number;
  exp: number;
}
