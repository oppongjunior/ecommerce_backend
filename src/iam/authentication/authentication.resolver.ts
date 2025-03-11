import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { AuthEntity } from './entities/auth.entity';
import { SignUpInput } from './dto/sign-up.input';
import { AuthenticationService } from './authentication.service';
import { SignInInput } from './dto/sign-in.input';
import { SocialLoginInput } from './dto/social-login.input';
import { GoogleAuthenticationService } from './social/google-authentication.service';

@Resolver(() => AuthEntity)
export class AuthenticationResolver {
  constructor(
    private readonly authService: AuthenticationService,
    private readonly googleService: GoogleAuthenticationService,
  ) {}

  @Mutation(() => AuthEntity)
  signUp(@Args('signUpInput') signUpInput: SignUpInput) {
    return this.authService.signUp(signUpInput);
  }

  @Mutation(() => AuthEntity)
  signIn(@Args('signInInput') signInInput: SignInInput) {
    return this.authService.signIn(signInInput);
  }

  @Mutation(() => AuthEntity)
  signInWithGoogle(@Args('socialSignInInput') signInInput: SocialLoginInput) {
    return this.googleService.authenticate(signInInput.token);
  }
}
