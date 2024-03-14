import { Request } from "express";
import { UserProps } from "../constants/types";

declare global {
  namespace Express {
    interface Request {
      user?: UserProps
    }
  }
}