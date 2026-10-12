export const errorText = (error: unknown) =>
  error instanceof Error
    ? error.message
    : "Что-то пошло не так. Попробуйте ещё раз.";
export class ShopConflictError extends Error {}
