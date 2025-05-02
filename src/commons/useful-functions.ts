export function sanitizeVariables(
  variables: Record<string, any>,
  fieldsToMask = ['password', 'confirmPassword'],
): Record<string, any> {
  const result: Record<string, any> = {};

  for (const key in variables) {
    if (fieldsToMask.includes(key)) {
      result[key] = '****';
    } else if (typeof variables[key] === 'object' && variables[key] !== null) {
      result[key] = sanitizeVariables(variables[key], fieldsToMask);
    } else {
      result[key] = variables[key];
    }
  }
  return result;
}

export function sanitizeQuery(
  query: string,
  fieldsToMask = ['password', 'confirmPassword', 'newPassword'],
): string {
  const pattern = new RegExp(
    `(${fieldsToMask.join('|')})\\s*:\\s*"(.*?)"`,
    'gi',
  );
  return query.replace(pattern, (_, key) => `${key}: "****"`);
}

/**
 * returns today's date
 * eg: 2025-04-19
 */
export const getTodayDate = () => {
  return new Date().toISOString().split('T')[0];
};
