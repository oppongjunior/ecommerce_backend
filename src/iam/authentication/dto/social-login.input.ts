import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty } from 'class-validator';

@InputType()
export class SocialLoginInput {
  @IsNotEmpty({ message: 'token is required' })
  @Field({ description: 'token' })
  token: string;
}
