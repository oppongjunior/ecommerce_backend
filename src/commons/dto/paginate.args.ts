import { Field, InputType, Int } from '@nestjs/graphql';

@InputType()
export class PaginationArgs {
  @Field(() => Int, { defaultValue: 12 })
  first: number;
  @Field(() => String, { nullable: true, description: 'the id of the cursor' })
  after?: string;

  @Field(() => String, { nullable: true, description: 'field to order by' })
  orderBy?: string;

  @Field(() => Boolean, {
    nullable: true,
    description: 'boolean to determine order preference',
    defaultValue: true,
  })
  orderInAsc?: boolean;
}
