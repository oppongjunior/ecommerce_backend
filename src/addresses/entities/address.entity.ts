import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class Address {
  @Field(() => ID)
  id: string;

  @Field()
  street: string;

  @Field()
  city: string;

  @Field()
  state: string;

  @Field()
  zipCode: string;

  @Field()
  country: string;

  @Field(() => ID)
  userId: string;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
