import { Field, ObjectType } from '@nestjs/graphql';
import { PageInfo } from '../../commons/entities/pageInfo.entity';
import { ProductEdge } from './product-edge.entity';

@ObjectType()
export class ProductConnection {
  @Field(() => [ProductEdge], { nullable: false })
  edges: ProductEdge[];

  @Field(() => PageInfo, { description: 'information about the page', nullable: false })
  pageInfo: PageInfo;
}
