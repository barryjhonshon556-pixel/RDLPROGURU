/**
 * Admin fetch wrapper that handles 401 Unauthorized responses.
 *
 * When any admin API call returns 401, this dispatches a global
 * `admin-unauthorized` CustomEvent so that AdminPanel can
 * automatically log out and show the login form.
 *
 * Always includes credentials: 'same-origin' to ensure cookies
 * (like the JWT session cookie) are sent with every request.
 */
export async function adminFetch(url: string, options?: RequestInit): Promise<Response> {
  const res = await fetch(url, {
    ...options,
    credentials: 'same-origin',
  });
  if (res.status === 401) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('admin-unauthorized'));
    }
  }
  return res;
}
