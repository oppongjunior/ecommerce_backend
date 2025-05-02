import { Field, InputType } from '@nestjs/graphql';
import { IsEmail, IsOptional, IsString, IsUrl, Length } from 'class-validator';
import { Transform } from 'class-transformer';

@InputType()
export class UpdateUserInput {
  @Field(() => String, { description: 'User’s name', nullable: true })
  @Transform(({ value }) => (value ? value.trim().toLowerCase() : value))
  @IsString()
  @IsOptional()
  @Length(2, 50, { message: 'Name must be between 2 and 50 characters.' })
  name?: string;

  @Field(() => String, { description: 'Email address', nullable: true })
  @IsEmail({}, { message: 'Please enter a valid email address.' })
  @Transform(({ value }) => (value ? value.trim().toLowerCase() : value))
  @IsOptional()
  email?: string;

  @Field(() => String, { nullable: true, description: 'Phone number' })
  @IsOptional()
  phoneNumber?: string;

  @Field(() => String, { nullable: true, description: 'Profile picture URL' })
  @IsOptional()
  @IsString()
  @IsUrl()
  profilePicture?: string;
}
