import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { LoggerService } from '../logger.service';
import { GqlExecutionContext } from '@nestjs/graphql';
import { sanitizeQuery, sanitizeVariables } from '../useful-functions';

@Injectable()
export class GraphqlLoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: LoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const start = Date.now();
    const gqlContext = GqlExecutionContext.create(context);
    const { req } = gqlContext.getContext();
    const info = gqlContext.getInfo();

    const operationType = info.operation.operation;
    const operationName = info.operation.name?.value || 'Unnamed';
    const rawQuery = req.body.query?.replace(/\s+/g, ' ').trim() || '';
    const query = sanitizeQuery(rawQuery).substring(0, 100);
    const rawVariables = req.body.variables || {};
    const sanitizedVariables = sanitizeVariables(rawVariables);
    const variables = JSON.stringify(sanitizedVariables);

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - start;
          this.logger.log(
            `${operationType} ${operationName} | Query: ${query} | Variables: ${variables} | Status: 200 | ${duration}ms`,
            'GraphQL',
          );
        },
        error: (error) => {
          const duration = Date.now() - start;
          this.logger.error(
            `${operationType} ${operationName} failed | Query: ${query} | Variables: ${variables} | Error: ${error.message} | ${duration}ms`,
            error.stack,
            'GraphQL',
          );
        },
      }),
    );
  }
}
