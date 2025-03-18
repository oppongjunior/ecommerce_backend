import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { AuthEntity } from './entities/auth.entity';
import { SignUpInput } from './dto/sign-up.input';
import { AuthenticationService } from './authentication.service';
import { SignInInput } from './dto/sign-in.input';
import { AuthType } from './enums/auth-type.enum';
import { Auth } from './decorators/auth.decorator';

@Auth(AuthType.None)
@Resolver(() => AuthEntity)
export class AuthenticationResolver {
  constructor(private readonly authService: AuthenticationService) {}

  @Mutation(() => AuthEntity, { description: 'Register a new user with email and password' })
  signUp(@Args('input', { type: () => SignUpInput }) input: SignUpInput) {
    return this.authService.signUp(input);
  }

  @Mutation(() => AuthEntity, { description: 'Sign in an existing user with email and password' })
  signIn(@Args('input', { type: () => SignInInput }) input: SignInInput) {
    return this.authService.signIn(input);
  }

  // Commented out for MVP; to be revisited for social login
  // @Mutation(() => AuthEntity, { description: 'Sign in with Google OAuth token' })
  // signInWithGoogle(@Args('input', { type: () => SocialLoginInput }) input: SocialLoginInput) {
  //   return this.googleService.authenticate(input.token);
  // }
}
