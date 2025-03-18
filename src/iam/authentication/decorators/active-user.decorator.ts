import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { REQUEST_USER_KEY } from '../../iam.constants';

export const ActiveUser = createParamDecorator((field: string | undefined, context: ExecutionContext) => {
  const ctx = GqlExecutionContext.create(context);
  const request = ctx.getContext().req;
  const user = request[REQUEST_USER_KEY];
  return field ? user?.[field] : user;
});
