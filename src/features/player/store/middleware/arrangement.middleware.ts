// src/features/player/store/middleware/arrangement.middleware.ts
import { Middleware } from '@reduxjs/toolkit';

export const arrangementMiddleware: Middleware = () => next => action => {
    return next(action);
};