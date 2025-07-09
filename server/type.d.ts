export type DbResult<T> = {
    success: true;
    data: T;
} | {
    success: false;
    error: { message: string };
};