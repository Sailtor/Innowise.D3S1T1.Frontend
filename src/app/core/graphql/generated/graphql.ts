/** Internal type. DO NOT USE DIRECTLY. */
type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
/** Internal type. DO NOT USE DIRECTLY. */
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
import type * as Types from './schema-types';

import { gql } from 'apollo-angular';
import { Injectable } from '@angular/core';
import * as Apollo from 'apollo-angular';
export type LatestValuesQueryVariables = Exact<{ [key: string]: never; }>;


export type LatestValuesQuery = { latestReadings: Array<
    | { __typename: 'AirQualityReading', co2: number, pm25: number, humidity: number, id: string, room: string, receivedAt: string }
    | { __typename: 'EnergyReading', energyAmount: number, id: string, room: string, receivedAt: string }
    | { __typename: 'MotionReading', isMotionDetected: boolean, id: string, room: string, receivedAt: string }
  >, rooms: Array<{ room: string, totalReadings: number }> };

export type ReadingsTableQueryVariables = Exact<{
  skip?: number | null | undefined;
  take?: number | null | undefined;
  where?: Types.MetricReadingFilterInput | null | undefined;
  order?: Array<Types.MetricReadingSortInput> | Types.MetricReadingSortInput | null | undefined;
}>;


export type ReadingsTableQuery = { metricReadings: { totalCount: number, pageInfo: { hasNextPage: boolean, hasPreviousPage: boolean }, items: Array<
      | { __typename: 'AirQualityReading', co2: number, pm25: number, humidity: number, id: string, room: string, type: Types.MetricReadingType, receivedAt: string }
      | { __typename: 'EnergyReading', energyAmount: number, id: string, room: string, type: Types.MetricReadingType, receivedAt: string }
      | { __typename: 'MotionReading', isMotionDetected: boolean, id: string, room: string, type: Types.MetricReadingType, receivedAt: string }
     | null> | null } | null };

export type ReadingsTableRoomsQueryVariables = Exact<{ [key: string]: never; }>;


export type ReadingsTableRoomsQuery = { availableRooms: Array<string> };

export const LatestValuesDocument = gql`
    query LatestValues {
  latestReadings {
    __typename
    id
    room
    receivedAt
    ... on EnergyReading {
      energyAmount
    }
    ... on AirQualityReading {
      co2
      pm25
      humidity
    }
    ... on MotionReading {
      isMotionDetected
    }
  }
  rooms {
    room
    totalReadings
  }
}
    `;

  @Injectable({
    providedIn: 'root'
  })
  export class LatestValuesGQL extends Apollo.Query<LatestValuesQuery, LatestValuesQueryVariables> {
    document = LatestValuesDocument;
    
    constructor(apollo: Apollo.Apollo) {
      super(apollo);
    }
  }
export const ReadingsTableDocument = gql`
    query ReadingsTable($skip: Int, $take: Int, $where: MetricReadingFilterInput, $order: [MetricReadingSortInput!]) {
  metricReadings(skip: $skip, take: $take, where: $where, order: $order) {
    pageInfo {
      hasNextPage
      hasPreviousPage
    }
    totalCount
    items {
      __typename
      id
      room
      type
      receivedAt
      ... on EnergyReading {
        energyAmount
      }
      ... on AirQualityReading {
        co2
        pm25
        humidity
      }
      ... on MotionReading {
        isMotionDetected
      }
    }
  }
}
    `;

  @Injectable({
    providedIn: 'root'
  })
  export class ReadingsTableGQL extends Apollo.Query<ReadingsTableQuery, ReadingsTableQueryVariables> {
    document = ReadingsTableDocument;
    
    constructor(apollo: Apollo.Apollo) {
      super(apollo);
    }
  }
export const ReadingsTableRoomsDocument = gql`
    query ReadingsTableRooms {
  availableRooms
}
    `;

  @Injectable({
    providedIn: 'root'
  })
  export class ReadingsTableRoomsGQL extends Apollo.Query<ReadingsTableRoomsQuery, ReadingsTableRoomsQueryVariables> {
    document = ReadingsTableRoomsDocument;
    
    constructor(apollo: Apollo.Apollo) {
      super(apollo);
    }
  }