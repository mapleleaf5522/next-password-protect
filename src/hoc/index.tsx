import { ReactNode } from 'react';
import NextApp from 'next/app';
import type { AppProps, AppContext } from 'next/app';

import { LoginComponent as DefaultLoginComponent } from './LoginComponent';
import { withAuth } from './withAuth';

interface PasswordProtectHOCOptions {
  /* @default /login */
  apiPath?: string;
  /* @default authorization */
  cookieName?: string;
  loginComponent?: ReactNode;
}

export const withPasswordProtect = (
  App: any,
  password: string,
  options?: PasswordProtectHOCOptions,
) => {
  if (process.env.PASSWORD_PROTECT) {
    const ProtectedApp = ({ Component, pageProps, ...props }: AppProps) => (
      <App
        Component={withAuth(
          Component,
          options?.loginComponent || DefaultLoginComponent,
          pageProps,
          options?.apiPath || '/login',
        )}
        pageProps={pageProps}
        {...props}
      />
    );

    (ProtectedApp as any).getInitialProps = async (appContext: AppContext) => {
      const appProps = await (App.getInitialProps
        ? App.getInitialProps(appContext)
        : NextApp.getInitialProps(appContext));

      const { req } = appContext.ctx;

      if (req) {
        // eslint-disable-next-line no-eval
        const compare = eval("require('tsscmp')");
        // eslint-disable-next-line no-eval
        const cookie = eval("require('cookie')");
        const cookies = cookie.parse(req.headers.cookie);
        const cookieName = options?.cookieName || 'authorization';

        if (
          cookies?.[cookieName] &&
          compare(
            cookies?.[cookieName],
            Buffer.from(password).toString('base64'),
          )
        ) {
          appProps.pageProps.__isAuthenticated = true;
        }
      }

      return { ...appProps };
    };

    return ProtectedApp;
  }

  return App;
};
