import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsString } from 'class-validator';

@InputType()
export class CreateAddressInput {
  @Field({ description: 'Street address' })
  @IsNotEmpty({ message: 'Street must not be empty' })
  @IsString({ message: 'Street must be a string' })
  street: string;

  @Field({ description: 'City' })
  @IsNotEmpty({ message: 'City must not be empty' })
  @IsString({ message: 'City must be a string' })
  city: string;

  @Field({ description: 'State or province' })
  @IsNotEmpty({ message: 'State must not be empty' })
  @IsString({ message: 'State must be a string' })
  state: string;

  @Field({ description: 'ZIP or postal code' })
  @IsNotEmpty({ message: 'Zip code must not be empty' })
  @IsString({ message: 'Zip code must be a string' })
  zipCode: string;

  @Field({ description: 'Country' })
  @IsNotEmpty({ message: 'Country must not be empty' })
  @IsString({ message: 'Country must be a string' })
  country: string;
}
