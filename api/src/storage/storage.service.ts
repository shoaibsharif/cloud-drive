import { PartialBy } from '@/app/utils/helper';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  ListObjectsV2CommandInput,
  PutObjectCommand,
  PutObjectCommandInput,
  S3,
  S3Client,
  S3ClientConfig,
} from '@aws-sdk/client-s3';
import { createPresignedPost } from '@aws-sdk/s3-presigned-post';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { pick } from 'radash';
import { registerOptions } from './contracts/storageOptions';
import { MODULE_OPTIONS_TOKEN } from './storage.module-definition';

@Injectable()
export class StorageService {
  public bucket: string;
  private logger = new Logger(StorageService.name);

  public s3Adapter: S3;
  private config: ConfigService;
  public s3Client: S3Client;

  constructor(
    @Inject(MODULE_OPTIONS_TOKEN) options: registerOptions,
    config: ConfigService,
  ) {
    const s3Configuration: S3ClientConfig = {
      credentials: {
        accessKeyId: options.accessKeyId,
        secretAccessKey: options.secretAccessKey,
      },
      region: options.region,
      endpoint: options.endpoint,
    };
    this.s3Client = new S3Client(s3Configuration);
    this.s3Adapter = new S3({
      region: options.region,
      credentials: {
        accessKeyId: options.accessKeyId,
        secretAccessKey: options.secretAccessKey,
      },
      endpoint: options.endpoint,
    });

    this.bucket = options.bucket;
    this.config = config;
  }

  /**
   * It uploads a file to S3.
   * @param  - S3.PutObjectRequest
   * @param [options] - S3.ManagedUpload.ManagedUploadOptions
   * @returns A promise that resolves to the data returned by the upload function.
   */
  public async upload(params: PartialBy<PutObjectCommandInput, 'Bucket'>) {
    const data = await this.s3Adapter.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        ...params,
      }),
    );

    return {
      message: 'Created',
      url:
        'https://' +
        this.config.get('LINODE_BUCKET') +
        '.' +
        this.config.get('LINODE_ENDPOINT').replace('https://', '') +
        '/' +
        params.Key,
      key: params.Key,
    };
  }

  /**
   * It checks if a file exists in the S3 bucket
   * @param {string} path - The path to the file you want to check.
   * @returns A boolean value.
   */
  async fileExists(path: string) {
    return await new Promise<boolean>(async (resolve) => {
      try {
        const file = await this.s3Adapter.send(
          new HeadObjectCommand({ Key: path, Bucket: this.bucket }),
        );
        if (file) return true;
      } catch {
        return false;
      }
    });
  }

  /**
   * It lists all the objects in the bucket, and returns the folders and files in the current folder
   * @param {string} [prefix] - The prefix of the folder you want to list.
   */
  async listObjects(prefix?: string) {
    const options: ListObjectsV2CommandInput = {
      Bucket: this.bucket,
      Delimiter: '/',
    };

    if (prefix) {
      options.Prefix = (prefix ?? '') + '/';
    }

    const data = await this.s3Adapter.send(new ListObjectsV2Command(options));
    return {
      currentFolder: prefix,
      folders:
        data.CommonPrefixes?.map((commonPrefix) => {
          const folders = commonPrefix.Prefix.split('/');
          folders.splice(folders.length - 1, 1);
          if (folders.length > 1 && prefix) {
            const prefixArr = prefix.split('/');
            const index = folders.findIndex((folder) =>
              folder.includes(prefixArr[prefixArr.length - 1]),
            );
            return folders.slice(index + 1).join('');
          }
          return commonPrefix.Prefix;
        }) ?? [],
      files:
        data.Contents?.filter((content) => !content.Key.endsWith('/')).map(
          (content) => ({
            ...content,
            file: content.Key.replace(prefix + '/', ''),
            url:
              'https://' +
              this.config.get('LINODE_BUCKET') +
              '.' +
              this.config.get('LINODE_ENDPOINT').replace('https://', '') +
              '/' +
              content.Key,
          }),
        ) ?? [],
      ...pick(data, ['Prefix', 'KeyCount', 'MaxKeys']),
    };
  }

  /**
   * This function deletes an object from the S3 bucket
   * @param {string} content - The name of the file you want to delete.
   * @returns The response from the S3Adapter.send() method.
   */
  async deleteObject(content: string) {
    return await this.s3Adapter.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: content,
      }),
    );
  }

  /**
   * It creates a folder in the S3 bucket
   * @param {string} name - the name of the folder you want to create
   * @returns The response from the S3 API
   */
  async createFolder(name: string) {
    return await this.s3Adapter.send(
      new PutObjectCommand({
        Key: name + '/',
        Bucket: this.bucket,
        ContentLength: 0,
      }),
    );
  }

  async getUploadUrl(fileKey: string, Bucket: string): Promise<any> {
    try {
      console.log(fileKey);
      console.log('bucket', Bucket);
      const Key = fileKey;
      console.log('key', Key);

      const { fields } = await createPresignedPost(this.s3Adapter, {
        Bucket,
        Key,
        Expires: 600, //Seconds before the presigned post expires. 3600 by default.
      });

      console.log(fields);

      const url = 'https://hfr-ecom-dev.us-southeast-1.linodeobjects.com';

      return { url, fields };
    } catch (error) {}
  }

  async getSignedUrl(Key: string): Promise<any> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: Key,
    });
    const fields = await getSignedUrl(this.s3Client, command, {
      expiresIn: 3600,
    });

    return fields;
  }
}
