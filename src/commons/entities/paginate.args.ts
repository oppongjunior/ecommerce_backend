import { Field, InputType, Int } from '@nestjs/graphql';

@InputType()
export class PaginateArgs {
  @Field(() => Int, { defaultValue: 12 })
  first: number;
  @Field(() => String, { nullable: true, description: 'the id of the cursor' })
  after?: string;
}
