import { PublicUserDto } from '../../users/dto/public-user.dto';

export class LoginResponseDto {
  /** Send it as `Authorization: Bearer <accessToken>`. */
  accessToken: string;

  user: PublicUserDto;
}
