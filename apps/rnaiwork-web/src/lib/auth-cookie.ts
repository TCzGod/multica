/**
 * The backend reads a `multica_logged_in` cookie (in addition to the
 * session cookie) to decide whether a browser session is potentially
 * authenticated. We set/clear it client-side to mirror sign-in state.
 */

const COOKIE_NAME = "multica_logged_in";
const ONE_YEAR = 60 * 60 * 24 * 365;

export function setLoggedInCookie() {
  document.cookie = `${COOKIE_NAME}=1; path=/; max-age=${ONE_YEAR}; SameSite=Lax`;
}

export function clearLoggedInCookie() {
  document.cookie = `${COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax`;
}
