import netlifyIdentity from 'netlify-identity-widget';

const IS_LOCAL = window.location.hostname === 'localhost';

export const auth = {
  init() {
    if (!IS_LOCAL) netlifyIdentity.init();
  },
  getUser() {
    if (IS_LOCAL) return { user_metadata: { full_name: 'Tein (dev)' }, email: 'dev@artazest.nl', role: 'admin' };
    const user = netlifyIdentity.currentUser();
    if (!user) return null;
    return { ...user, role: user.app_metadata?.roles?.includes('admin') ? 'admin' : 'team' };
  },
  login() {
    if (IS_LOCAL) { window.location.reload(); return; }
    netlifyIdentity.open('login');
  },
  logout() {
    if (IS_LOCAL) return;
    netlifyIdentity.logout();
  },
  onLogin(cb) {
    if (IS_LOCAL) return;
    netlifyIdentity.on('login', (user) => { netlifyIdentity.close(); cb(user); });
  },
  onLogout(cb) {
    if (IS_LOCAL) return;
    netlifyIdentity.on('logout', cb);
  }
};
