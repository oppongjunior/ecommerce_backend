import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class PageInfo {
  @Field(() => Boolean, { nullable: false })
  hasNext: boolean;

  @Field(() => Boolean, { nullable: false })
  hasPrevious: boolean;

  @Field(() => Int, { nullable: false })
  pageSize: number;
}
