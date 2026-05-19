import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-facebook';

@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, 'facebook') {
    constructor() {
        super({
            clientID: process.env.FACEBOOK_APP_ID,
            clientSecret: process.env.FACEBOOK_APP_SECRET,
            callbackURL: process.env.FACEBOOK_CALLBACK_URL || 'http://localhost:3000/auth/facebook/callback',
            profileFields: ['id', 'emails', 'name', 'photos'],
        });
    }

    async validate(
        accessToken: string,
        refreshToken: string,
        profile: any,
        done: (err: any, user: any, info?: any) => void,
    ): Promise<any> {
        const { id, name, emails, photos } = profile;

        const user = {
            id,
            email: emails?.[0]?.value,
            firstName: name.givenName,
            lastName: name.familyName,
            picture: photos?.[0]?.value,
            accessToken,
        };

        done(null, user);
    }
}
