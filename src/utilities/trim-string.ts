export function trimString(str, maxLength = 10): string {
  return str.length > maxLength ? str.substring(0, maxLength - 3) + "..." : str.substring(0, maxLength)
}