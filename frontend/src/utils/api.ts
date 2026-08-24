export const parseJsonResponse = async <T = any>(response: Response): Promise<T> => {
  const text = await response.text();
  if (!text || !text.trim()) {
    return {} as T;
  }
  try {
    return JSON.parse(text) as T;
  } catch (_e) {
    return { message: text || 'Unexpected server response format' } as T;
  }
};
