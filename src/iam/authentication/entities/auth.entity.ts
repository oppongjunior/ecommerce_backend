import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class AuthEntity {
  @Field({ nullable: false, description: 'authentication access token' })
  private accessToken: string;
  @Field({ nullable: false, description: 'authentication refresh token' })
  private refreshToken: string;
}
