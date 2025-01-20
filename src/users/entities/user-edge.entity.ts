import { Field, ObjectType } from '@nestjs/graphql';
import { User } from './user.entity';

@ObjectType()
export class UserEdge {
  @Field(() => String, { description: 'cursor to identity resource', nullable: false })
  cursor: string;

  @Field(() => User, { description: 'user record', nullable: false })
  node: User;
}
