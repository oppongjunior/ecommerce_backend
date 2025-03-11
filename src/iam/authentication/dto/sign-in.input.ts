import { Field, InputType } from '@nestjs/graphql';
import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator';
import { Transform } from 'class-transformer';

@InputType()
export class SignInInput {
  @Field(() => String, { description: 'Email address' })
  @IsEmail({}, { message: 'Please enter a valid email address.' })
  @Transform(({ value }) => value?.trim().toLowerCase())
  email: string;

  @Field(() => String, { description: 'Password (required for manual signup)' })
  @IsNotEmpty()
  @IsString()
  @Length(8, 16, { message: 'Password must be between 8 and 16 characters.' })
  password: string;
}
