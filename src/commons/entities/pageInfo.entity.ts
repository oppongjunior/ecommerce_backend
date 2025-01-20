import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class PageInfo {
  @Field(() => Boolean, { nullable: false })
  hasNextPage: boolean;

  @Field(() => Boolean, { nullable: false })
  hasPreviousPage: boolean;

  @Field(() => Int, { nullable: false })
  pageSize: number;
}
