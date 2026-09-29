/**
 * App.tsx — legacy re-export kept so any direct import of App still resolves.
 *
 * The router in main.tsx now mounts MapPage at /map and AdminPage at /admin.
 * App is no longer rendered directly; it is kept here as a transitional shim.
 */
export { default } from './components/MapPage'
