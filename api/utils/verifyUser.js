import jwt from 'jsonwebtoken';
import { errorHandler } from './error.js';

export const veryfyTocken = (req, res, next) => {
  const token = req.cookies.access_token;
  
  if (!token) {
    return next(errorHandler(401, 'Access Denied'));
  }

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified;
    next();
  } catch (error) {
    return next(errorHandler(403, 'Invalid token'));
  }
};
