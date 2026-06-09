'use strict';

import { UploadIcon } from './extensions/UploadIcon';

export default {
  config: {
    // Branding Foton Chile
    head: {
      favicon: '/uploads/foton-favicon.ico',
    },
    locales: ['es', 'en', 'fr'],
    auth: {
      logo: null,
    },
    menu: {
      logo: null,
    },
    theme: {
      light: {},
      dark: {},
    },
    tutorials: false,
    notifications: { releases: false },
  },

  bootstrap(app) {
    // ── Menú personalizado: Importar Excel ────────────────────────────
    app.addMenuLink({
      to: '/plugins/import-excel',
      icon: UploadIcon,
      intlLabel: {
        id: 'import-excel.menu.label',
        defaultMessage: 'Importar Excel',
      },
      permissions: [
        {
          action: 'plugin::users-permissions.user.find',
          subject: null,
        },
      ],
      Component: async () => {
        const component = await import('./extensions/import-excel/index');
        return component.default;
      },
    });
  },
};
