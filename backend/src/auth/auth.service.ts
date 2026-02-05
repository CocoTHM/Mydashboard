import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { User } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(profile: any): Promise<User> {
    const user = await this.usersService.findByGithubId(profile.id);
    
    if (user) {
      return await this.usersService.update(user.id, {
        name: profile.displayName || profile.username,
        avatar: profile._json.avatar_url,
      });
    }

    return await this.usersService.create({
      email: profile._json.email || `${profile.username}@github.com`,
      username: profile.username,
      name: profile.displayName || profile.username,
      avatar: profile._json.avatar_url,
      githubId: profile.id,
    });
  }

  async login(user: User) {
    const payload = { sub: user.id, email: user.email, role: user.role };
    
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        name: user.name,
        avatar: user.avatar,
        role: user.role,
      },
    };
  }

  async verify(token: string): Promise<any> {
    return this.jwtService.verify(token);
  }
}
