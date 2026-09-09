export const tokenKey = "web3-uno-token"

export function readBrowserToken(): string | null {
  if (typeof document !== "undefined") {
    const prefix = `${tokenKey}=`
    const cookie = document.cookie.split("; ").find(value => value.startsWith(prefix))
    if (cookie !== undefined) return decodeURIComponent(cookie.slice(prefix.length))
  }
  if (typeof localStorage !== "undefined") return localStorage.getItem(tokenKey)
  return null
}

export function writeBrowserToken(token: string): void {
  if (typeof document !== "undefined") {
    document.cookie = `${tokenKey}=${encodeURIComponent(token)}; Path=/; SameSite=Lax`
  }
  if (typeof localStorage !== "undefined") localStorage.setItem(tokenKey, token)
}

export function clearBrowserToken(): void {
  if (typeof document !== "undefined") {
    document.cookie = `${tokenKey}=; Max-Age=0; Path=/; SameSite=Lax`
  }
  if (typeof localStorage !== "undefined") localStorage.removeItem(tokenKey)
}
