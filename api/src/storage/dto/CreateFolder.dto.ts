import { IsNotEmpty, IsString } from 'class-validator';

export class CreateFoldeDto {
  @IsNotEmpty()
  @IsString()
  name: string;
}
