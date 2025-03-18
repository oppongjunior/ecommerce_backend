import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, Length, Matches } from 'class-validator';

@InputType()
export class ChangeUserPasswordInput {
  @Field(() => String, { description: 'The new password to set' })
  @IsNotEmpty({ message: 'New password is required' })
  @Length(8, 16, { message: 'New password must be between 8 and 16 characters' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, {
    message: 'New password must contain at least one uppercase letter, one lowercase letter, and one number',
  })
  newPassword: string;

  @Field(() => String, { description: 'The current password for verification' })
  @IsNotEmpty({ message: 'Old password is required' })
  @Length(8, 16, { message: 'Old password must be between 8 and 16 characters' })
  oldPassword: string;
}
