import type { S3ClientConfig } from "@aws-sdk/client-s3";
import { S3 } from "@aws-sdk/client-s3";

export const s3adapter = (config: S3ClientConfig) => new S3(config);
