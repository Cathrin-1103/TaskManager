export const parseJsonResponse = async <T = any>(response: Response): Promise<T> => {
  try {
    const text = await response.text();
    if (!text || !text.trim()) {
      return {} as T;
    }
    try {
      return JSON.parse(text) as T;
    } catch (_e) {
      return {
        message: response.ok
          ? 'Success'
          : `Server error (${response.status}): ${text.slice(0, 120)}`,
      } as T;
    }
  } catch (_e) {
    return { message: `Unable to read server response (${response.status})` } as T;
  }
};

export const sanitizeErrorMessage = (error: any): string => {
  const msg = typeof error === 'string' ? error : error?.message || '';
  if (!msg) return 'An unexpected error occurred';
  if (
    msg.includes('Unexpected end of JSON input') ||
    msg.includes('Failed to execute') ||
    msg.includes('JSON.parse') ||
    msg.includes('SyntaxError')
  ) {
    return 'Unable to connect to backend server. Please verify the backend API server is running.';
  }
  return msg;
};
