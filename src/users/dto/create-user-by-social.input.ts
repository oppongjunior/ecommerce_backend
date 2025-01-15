import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsString } from 'class-validator';

@InputType()
export class CreateUserBySocialInput {
  @Field(() => String, {
    nullable: false,
    description: 'Social id (required for manual signup)',
  })
  @IsNotEmpty()
  @IsString()
  socialId: string;
}
