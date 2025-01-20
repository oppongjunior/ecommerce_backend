import { Field, InputType, Int } from '@nestjs/graphql';

@InputType()
export class PaginateArgs {
  @Field(() => Int)
  first: number;
  @Field(() => Int, { nullable: true })
  last?: number;
  @Field(() => String, { nullable: true, description: 'the id of the cursor' })
  after?: string;
}
