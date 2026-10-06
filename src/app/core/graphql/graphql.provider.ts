import { ApplicationConfig, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformServer } from '@angular/common';
import { ApolloClient, InMemoryCache } from '@apollo/client';
import { provideApollo } from 'apollo-angular';
import { HttpLink } from 'apollo-angular/http';

// Keep this port in sync with proxy.conf.json's target (client-side calls go through
// that dev-server proxy, not this URL; this is only the server-side/SSR fallback).
const DEFAULT_SERVER_GRAPHQL_URL = 'http://localhost:5003/graphql';

export function provideGraphQL(): ApplicationConfig['providers'] {
  return [
    provideApollo((): ApolloClient.Options => {
      const httpLink = inject(HttpLink);
      const platformId = inject(PLATFORM_ID);
      const uri = isPlatformServer(platformId)
        ? (process.env['GATEWAY_GRAPHQL_URL'] ?? DEFAULT_SERVER_GRAPHQL_URL)
        : '/graphql';

      return {
        link: httpLink.create({ uri }),
        cache: new InMemoryCache(),
      };
    }),
  ];
}
