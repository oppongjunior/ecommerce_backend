import { Field, ObjectType } from '@nestjs/graphql';
import { User } from './user.entity';
import { PageInfo } from '../../commons/entities/pageInfo.entity';
import { UserEdge } from './user-edge.entity';

@ObjectType()
export class UserConnection {
  @Field(() => [UserEdge], { nullable: false })
  edges: UserEdge[];

  @Field(() => PageInfo, { description: 'information about the page', nullable: false })
  pageInfo: PageInfo;
}
