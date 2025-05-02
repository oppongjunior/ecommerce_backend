import { LoggerService } from '../logger.service';
import { GraphQLError } from 'graphql/error';

export const formatError = (logger: LoggerService) => (error: GraphQLError) => {
  const { message, locations, path, extensions } = error;
  logger.error(
    `GraphQL Error: ${message} | Path: ${path?.join(' > ')} | Locations: ${JSON.stringify(locations)} | Extensions: ${JSON.stringify(extensions)}`,
    error.stack,
    'GraphQL',
  );
  return error;
};
