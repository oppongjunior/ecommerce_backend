import { Field, InputType } from '@nestjs/graphql';
import { IsBoolean, IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, IsUrl, Length } from 'class-validator';
import { Role } from '../enums/role.enum';

@InputType()
export class CreateUserInput {
  @Field(() => String, { description: 'User’s name' })
  @IsString()
  @Length(2, 50, { message: 'Name must be between 2 and 50 characters.' })
  name: string;

  @Field(() => String, { description: 'Email address', nullable: false })
  @IsEmail({}, { message: 'Please enter a valid email address.' })
  email: string;

  @Field(() => String, {
    nullable: false,
    description: 'Password (required for manual signup)',
  })
  @IsNotEmpty()
  @IsString()
  @Length(8, 16, { message: 'Password must be between 8 and 16 characters.' })
  password: string;

  @Field(() => String, { nullable: true, description: 'Phone number' })
  @IsOptional()
  phoneNumber?: string;

  @Field(() => Boolean, {
    defaultValue: true,
    description: 'Whether the account is active',
  })
  @IsBoolean()
  isActive: boolean;

  @Field(() => String, { nullable: true, description: 'Profile picture URL' })
  @IsOptional()
  @IsString()
  @IsUrl()
  profilePicture?: string;

  @Field(() => Role, { description: 'Role name', defaultValue: 'USER' })
  @IsEnum(Role)
  @IsString()
  role: Role;
}
