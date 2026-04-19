export function timeGreetingAr(): string {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return "صباح الخير";
  if (h >= 12 && h < 17) return "مساء الخير";
  return "مساء الخير";
}

export function greetUserLine(name: string): string {
  const n = name?.trim() || "زميلي";
  return `${timeGreetingAr()}، ${n}`;
}
