// Upper-cases only the first letter, so "admin" becomes "Admin" while names such
// as "McDonald" or "van Dyke" keep the rest as typed.
export function capitalizeFirst(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
