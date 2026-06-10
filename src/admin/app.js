import { UploadIcon } from './extensions/UploadIcon';

export default {
  config: {
    head: {
      favicon: '/uploads/foton-favicon.ico',
    },
    locales: ['es'],
    auth: { logo: null },
    menu: { logo: null },
    theme: { light: {}, dark: {} },
    tutorials: false,
    notifications: { releases: false },
  },

  bootstrap(app) {
    app.addMenuLink({
      to: '/import-excel',
      icon: UploadIcon,
      intlLabel: {
        id: 'import-excel.menu.label',
        defaultMessage: 'Importar Excel',
      },
      permissions: [],
      Component: async () => import('./extensions/import-excel/index'),
    });
  },
};
