import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class User {
  @Field({ description: 'Unique identifier for the user' })
  id: string;

  @Field(() => String, { description: 'User’s full name', nullable: true })
  name: string;

  @Field(() => String, { description: 'Email address' })
  email: string;

  @Field(() => String, { nullable: true, description: 'Phone number' })
  phoneNumber?: string;

  @Field(() => String, { nullable: true, description: 'Google ID for social login' })
  authProvider?: string;

  @Field(() => String, { nullable: true, description: 'Facebook ID for social login' })
  facebookId?: string;

  @Field(() => Boolean, { description: 'Account activation status' })
  isActive: boolean;

  @Field(() => String, { nullable: true, description: 'Profile picture URL' })
  profilePicture?: string;

  @Field(() => String, { description: 'Role of the user' })
  role: string;

  @Field(() => Date, { description: 'Date of account creation' })
  createdAt: Date;

  @Field(() => Date, { description: 'Date of last update' })
  updatedAt: Date;

  @Field(() => Date, { nullable: true, description: 'Date of last login' })
  lastLoginAt?: Date;
}
