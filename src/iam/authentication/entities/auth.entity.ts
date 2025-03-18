import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class AuthEntity {
  @Field({ nullable: false, description: 'authentication access token' })
  accessToken: string;
  @Field({ nullable: false, description: 'authentication refresh token' })
  refreshToken: string;
}
