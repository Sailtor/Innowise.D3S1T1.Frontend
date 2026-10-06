import { ApplicationConfig, inject, makeStateKey, PLATFORM_ID, TransferState } from '@angular/core';
import { isPlatformServer } from '@angular/common';
import { ApolloClient, InMemoryCache, NormalizedCacheObject } from '@apollo/client';
import { provideApollo } from 'apollo-angular';
import { HttpLink } from 'apollo-angular/http';

// Keep this port in sync with proxy.conf.json's target (client-side calls go through
// that dev-server proxy, not this URL; this is only the server-side/SSR fallback).
const DEFAULT_SERVER_GRAPHQL_URL = 'http://localhost:5003/graphql';

// Carries the server's already-populated cache across hydration so the browser client
// reuses it instead of re-issuing the same queries (latestReadings/rooms, etc.) a
// second time right after first paint - see data/Frontend.md gotcha 13.
const APOLLO_CACHE_STATE_KEY = makeStateKey<NormalizedCacheObject>('apollo-cache');

export function provideGraphQL(): ApplicationConfig['providers'] {
  return [
    provideApollo((): ApolloClient.Options => {
      const httpLink = inject(HttpLink);
      const platformId = inject(PLATFORM_ID);
      const transferState = inject(TransferState);
      const isServer = isPlatformServer(platformId);
      const uri = isServer ? (process.env['GATEWAY_GRAPHQL_URL'] ?? DEFAULT_SERVER_GRAPHQL_URL) : '/graphql';

      const cache = new InMemoryCache();

      if (isServer) {
        // Registered now, read later: Angular calls this once rendering has finished
        // (and with it, every query this render triggered), right before serializing
        // TransferState into the response HTML.
        transferState.onSerialize(APOLLO_CACHE_STATE_KEY, () => cache.extract());
      } else if (transferState.hasKey(APOLLO_CACHE_STATE_KEY)) {
        cache.restore(transferState.get(APOLLO_CACHE_STATE_KEY, {}));
        transferState.remove(APOLLO_CACHE_STATE_KEY);
      }

      return {
        link: httpLink.create({ uri }),
        cache,
      };
    }),
  ];
}
