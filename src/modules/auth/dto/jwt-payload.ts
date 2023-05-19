export interface IJwtPayload {
  email: string;
}

export interface IJwtUser extends IJwtPayload {
  iat: number;
  exp: number;
}
