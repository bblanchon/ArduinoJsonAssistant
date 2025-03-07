export function useScriptUrl(): string | undefined {
  const script = document.currentScript as HTMLScriptElement | undefined;
  return script?.src;
}
