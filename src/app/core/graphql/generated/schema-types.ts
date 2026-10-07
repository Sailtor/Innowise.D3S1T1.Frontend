export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string };
  String: { input: string; output: string };
  Boolean: { input: boolean; output: boolean };
  Int: { input: number; output: number };
  Float: { input: number; output: number };
  /** The `DateTime` scalar type represents a date and time with time zone offset information. */
  DateTime: { input: string; output: string };
};

export enum AggregationField {
  Co2 = 'CO2',
  EnergyAmount = 'ENERGY_AMOUNT',
  Humidity = 'HUMIDITY',
  MotionDetected = 'MOTION_DETECTED',
  Pm25 = 'PM25',
}

/** Air quality recorded for a room. */
export type AirQualityReading = MetricReading & {
  __typename?: 'AirQualityReading';
  /** Carbon dioxide concentration. */
  co2: Scalars['Float']['output'];
  /** Relative humidity. */
  humidity: Scalars['Float']['output'];
  /** Opaque identifier of the reading. */
  id: Scalars['ID']['output'];
  /** When the ingestor pulled the batch from the upstream API. Pipeline time, not observation time - the upstream API exposes no sensor timestamp. */
  ingestedAt: Scalars['DateTime']['output'];
  /** Particulate matter under 2.5 micrometres. */
  pm25: Scalars['Float']['output'];
  /** When the processor persisted the reading. This is the field time aggregations bucket on. */
  receivedAt: Scalars['DateTime']['output'];
  /** Location the reading came from. */
  room: Scalars['String']['output'];
  /** Which kind of reading this is. */
  type: MetricReadingType;
};

/** Information about the offset pagination. */
export type CollectionSegmentInfo = {
  __typename?: 'CollectionSegmentInfo';
  /** Indicates whether more items exist following the set defined by the clients arguments. */
  hasNextPage: Scalars['Boolean']['output'];
  /** Indicates whether more items exist prior the set defined by the clients arguments. */
  hasPreviousPage: Scalars['Boolean']['output'];
};

export type DateTimeOperationFilterInput = {
  eq?: InputMaybe<Scalars['DateTime']['input']>;
  gt?: InputMaybe<Scalars['DateTime']['input']>;
  gte?: InputMaybe<Scalars['DateTime']['input']>;
  in?: InputMaybe<Array<InputMaybe<Scalars['DateTime']['input']>>>;
  lt?: InputMaybe<Scalars['DateTime']['input']>;
  lte?: InputMaybe<Scalars['DateTime']['input']>;
  neq?: InputMaybe<Scalars['DateTime']['input']>;
  ngt?: InputMaybe<Scalars['DateTime']['input']>;
  ngte?: InputMaybe<Scalars['DateTime']['input']>;
  nin?: InputMaybe<Array<InputMaybe<Scalars['DateTime']['input']>>>;
  nlt?: InputMaybe<Scalars['DateTime']['input']>;
  nlte?: InputMaybe<Scalars['DateTime']['input']>;
};

/** Energy consumption recorded for a room. */
export type EnergyReading = MetricReading & {
  __typename?: 'EnergyReading';
  /** Energy consumed, in the unit reported by the upstream API. */
  energyAmount: Scalars['Float']['output'];
  /** Opaque identifier of the reading. */
  id: Scalars['ID']['output'];
  /** When the ingestor pulled the batch from the upstream API. Pipeline time, not observation time - the upstream API exposes no sensor timestamp. */
  ingestedAt: Scalars['DateTime']['output'];
  /** When the processor persisted the reading. This is the field time aggregations bucket on. */
  receivedAt: Scalars['DateTime']['output'];
  /** Location the reading came from. */
  room: Scalars['String']['output'];
  /** Which kind of reading this is. */
  type: MetricReadingType;
};

export type MetricAggregationBucket = {
  __typename?: 'MetricAggregationBucket';
  bucketStart?: Maybe<Scalars['DateTime']['output']>;
  room?: Maybe<Scalars['String']['output']>;
  stats: NumericStats;
};

/** Which numeric to aggregate, over what slice, grouped how. */
export type MetricAggregationInput = {
  field: AggregationField;
  from?: InputMaybe<Scalars['DateTime']['input']>;
  groupByRoom?: Scalars['Boolean']['input'];
  interval?: InputMaybe<TimeInterval>;
  rooms?: InputMaybe<Array<Scalars['String']['input']>>;
  to?: InputMaybe<Scalars['DateTime']['input']>;
};

/** A single sensor reading recorded by the ingestion pipeline. */
export type MetricReading = {
  /** Opaque identifier of the reading. */
  id: Scalars['ID']['output'];
  /** When the ingestor pulled the batch from the upstream API. Pipeline time, not observation time - the upstream API exposes no sensor timestamp. */
  ingestedAt: Scalars['DateTime']['output'];
  /** When the processor persisted the reading. This is the field time aggregations bucket on. */
  receivedAt: Scalars['DateTime']['output'];
  /** Location the reading came from. */
  room: Scalars['String']['output'];
  /** Which kind of reading this is. */
  type: MetricReadingType;
};

export type MetricReadingFilterInput = {
  and?: InputMaybe<Array<MetricReadingFilterInput>>;
  ingestedAt?: InputMaybe<DateTimeOperationFilterInput>;
  or?: InputMaybe<Array<MetricReadingFilterInput>>;
  receivedAt?: InputMaybe<DateTimeOperationFilterInput>;
  room?: InputMaybe<StringOperationFilterInput>;
  type?: InputMaybe<MetricReadingTypeOperationFilterInput>;
};

export type MetricReadingSortInput = {
  ingestedAt?: InputMaybe<SortEnumType>;
  receivedAt?: InputMaybe<SortEnumType>;
  room?: InputMaybe<SortEnumType>;
  type?: InputMaybe<SortEnumType>;
};

export enum MetricReadingType {
  AirQuality = 'AIR_QUALITY',
  Energy = 'ENERGY',
  Motion = 'MOTION',
}

export type MetricReadingTypeOperationFilterInput = {
  eq?: InputMaybe<MetricReadingType>;
  in?: InputMaybe<Array<MetricReadingType>>;
  neq?: InputMaybe<MetricReadingType>;
  nin?: InputMaybe<Array<MetricReadingType>>;
};

/** A segment of a collection. */
export type MetricReadingsCollectionSegment = {
  __typename?: 'MetricReadingsCollectionSegment';
  /** A flattened list of the items. */
  items?: Maybe<Array<Maybe<MetricReading>>>;
  /** Information to aid in pagination. */
  pageInfo: CollectionSegmentInfo;
  totalCount: Scalars['Int']['output'];
};

/** Motion detection recorded for a room. */
export type MotionReading = MetricReading & {
  __typename?: 'MotionReading';
  /** Opaque identifier of the reading. */
  id: Scalars['ID']['output'];
  /** When the ingestor pulled the batch from the upstream API. Pipeline time, not observation time - the upstream API exposes no sensor timestamp. */
  ingestedAt: Scalars['DateTime']['output'];
  /** Whether motion was detected. */
  isMotionDetected: Scalars['Boolean']['output'];
  /** When the processor persisted the reading. This is the field time aggregations bucket on. */
  receivedAt: Scalars['DateTime']['output'];
  /** Location the reading came from. */
  room: Scalars['String']['output'];
  /** Which kind of reading this is. */
  type: MetricReadingType;
};

export type NumericStats = {
  __typename?: 'NumericStats';
  average?: Maybe<Scalars['Float']['output']>;
  count: Scalars['Int']['output'];
  max?: Maybe<Scalars['Float']['output']>;
  min?: Maybe<Scalars['Float']['output']>;
  sum?: Maybe<Scalars['Float']['output']>;
};

export type Query = {
  __typename?: 'Query';
  availableRooms: Array<Scalars['String']['output']>;
  latestReadings: Array<MetricReading>;
  metricAggregation: Array<MetricAggregationBucket>;
  metricReadings?: Maybe<MetricReadingsCollectionSegment>;
  rooms: Array<RoomSummary>;
};

export type QueryLatestReadingsArgs = {
  rooms?: InputMaybe<Array<Scalars['String']['input']>>;
  types?: InputMaybe<Array<MetricReadingType>>;
};

export type QueryMetricAggregationArgs = {
  input: MetricAggregationInput;
};

export type QueryMetricReadingsArgs = {
  order?: InputMaybe<Array<MetricReadingSortInput>>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  take?: InputMaybe<Scalars['Int']['input']>;
  where?: InputMaybe<MetricReadingFilterInput>;
};

export type RoomSummary = {
  __typename?: 'RoomSummary';
  latestByType: Array<MetricReading>;
  latestReading?: Maybe<MetricReading>;
  room: Scalars['String']['output'];
  totalReadings: Scalars['Int']['output'];
};

export enum SortEnumType {
  Asc = 'ASC',
  Desc = 'DESC',
}

export type StringOperationFilterInput = {
  and?: InputMaybe<Array<StringOperationFilterInput>>;
  contains?: InputMaybe<Scalars['String']['input']>;
  endsWith?: InputMaybe<Scalars['String']['input']>;
  eq?: InputMaybe<Scalars['String']['input']>;
  in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  ncontains?: InputMaybe<Scalars['String']['input']>;
  nendsWith?: InputMaybe<Scalars['String']['input']>;
  neq?: InputMaybe<Scalars['String']['input']>;
  nin?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  nstartsWith?: InputMaybe<Scalars['String']['input']>;
  or?: InputMaybe<Array<StringOperationFilterInput>>;
  startsWith?: InputMaybe<Scalars['String']['input']>;
};

export enum TimeInterval {
  Day = 'DAY',
  Hour = 'HOUR',
  Minute = 'MINUTE',
}
