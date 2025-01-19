import { Field, ObjectType } from '@nestjs/graphql';
import { User } from './user.entity';

@ObjectType()
export class UserEdge {
  @Field(() => String, { description: 'cursor', nullable: false })
  cursor: string;

  @Field(() => User, { description: 'cursor', nullable: false })
  node: User;
}
