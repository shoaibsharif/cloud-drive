import { IsAdmin } from '@/app/decorators/isAdmin.decorator';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiQuery, ApiTags } from '@nestjs/swagger';
import path from 'path';
import { CreateFoldeDto } from './dto/CreateFolder.dto';
import { FileUploadDTO } from './dto/FileUpload.dto';
import { PhotoUploadDTO } from './dto/PhotoUpload.dto';
import { StorageService } from './storage.service';

@Controller('storage')
@ApiTags('Storage')
export class StorageController {
  constructor(private storageService: StorageService) {}

  @Post()
  @IsAdmin()
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  @ApiBody({
    description: 'Upload image',
    type: FileUploadDTO,
  })
  uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: Omit<FileUploadDTO, 'file'>,
  ) {
    return this.storageService.upload({
      Key:
        (body?.folder_name ? body.folder_name + '/' : '') +
        encodeURIComponent(body?.file_name ?? file.originalname),
      Body: file.buffer,
      ACL: 'public-read',
    });
  }

  @Post('/folder')
  @IsAdmin()
  @HttpCode(HttpStatus.CREATED)
  async createFolder(@Body() body: CreateFoldeDto) {
    return await this.storageService.createFolder(body.name);
  }

  @Delete('/:object')
  @IsAdmin()
  async deleteObject(@Param('object') object: string) {
    return await this.storageService.deleteObject(object);
  }

  @Get()
  @ApiQuery({
    name: 'folder',
    required: false,
    type: String,
  })
  @HttpCode(HttpStatus.OK)
  async getList(@Query('folder') folder: string) {
    const result = await this.storageService.listObjects(folder);
    return result;
  }

  @Post('/presigned')
  @IsAdmin()
  async createPhotoUpload(@Body() body: PhotoUploadDTO) {
    console.log('inside getUpload');
    const Bucket = process.env.LINODE_PRODUCT_BUCKET;
    console.log(body.key);
    console.log(body.product);
    const string =
      `products/${body.product}/productImage` + path.parse(body.key).ext;
    console.log(string);
    return await this.storageService.getUploadUrl(string, Bucket);
  }
}
