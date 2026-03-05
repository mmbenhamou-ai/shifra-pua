export function toHebrewRpcErrorMessage(err: unknown): string {
  let msg = '';

  if (typeof err === 'string') {
    msg = err;
  } else if (err && typeof err === 'object') {
    const anyErr = err as { message?: string; error?: string };
    msg = anyErr.message || anyErr.error || '';
  }

  const lower = msg.toLowerCase();

  if (
    lower.includes('already taken') ||
    lower.includes('already picked') ||
    lower.includes('not open') ||
    lower.includes('not ready') ||
    lower.includes('conflict')
  ) {
    return 'המשימה כבר נתפסה על ידי מישהי אחרת';
  }

  if (lower.includes('not approved') || lower.includes('approved')) {
    return 'החשבון ממתין לאישור מנהלת';
  }

  if (
    lower.includes('forbidden') ||
    lower.includes('not allowed') ||
    lower.includes('only the') ||
    lower.includes('only an ') ||
    lower.includes('only approved')
  ) {
    return 'אין לך הרשאה לבצע פעולה זו';
  }

  return 'אירעה שגיאה. נסי שוב.';
}

