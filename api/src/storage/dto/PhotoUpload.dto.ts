import { IsNotEmpty, IsString } from 'class-validator';

export class PhotoUploadDTO {
  @IsNotEmpty()
  @IsString()
  product: string;

  @IsNotEmpty()
  @IsString()
  key: string;
}
