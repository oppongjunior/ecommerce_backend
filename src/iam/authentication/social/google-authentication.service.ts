import { Injectable, OnModuleInit, UnauthorizedException } from '@nestjs/common';
import { OAuth2Client } from 'google-auth-library';
import { ConfigService } from '@nestjs/config';
import { AuthenticationService } from '../authentication.service';
import { UsersService } from '../../../users/users.service';

@Injectable()
export class GoogleAuthenticationService implements OnModuleInit {
  private oauthClient: OAuth2Client;

  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthenticationService,
    private readonly userService: UsersService,
  ) {}

  onModuleInit() {
    const clientId = this.configService.get('GOOGLE_CLIENT_ID');
    const clientSecret = this.configService.get('GOOGLE_CLIENT_SECRET');
    this.oauthClient = new OAuth2Client(clientId, clientSecret);
  }

  async authenticate(token: string) {
    const { email, googleId } = await this.getUserDetailsFromToken(token);
    const user = await this.userService.findUserByGoogleId(googleId);
    if (user) {
      return this.authService.generateTokens(user);
    } else {
      const newUser = await this.userService.createUserByGoogle(googleId, email);
      return this.authService.generateTokens(newUser);
    }
  }

  private async getUserDetailsFromToken(token: string) {
    const loginTicket = await this.oauthClient.verifyIdToken({ idToken: token });
    const { email, sub } = loginTicket.getPayload();
    if (!email || !sub) throw new UnauthorizedException();
    return { email, googleId: sub };
  }
}
