export function buildWhatsAppUrl(phone: string, message: string): string {
  const digits = phone.replace(/\D+/g, '');
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${digits}?text=${encoded}`;
}

