import {
  ListObjectsV2Command,
  ListObjectsV2CommandInput,
  S3,
} from "@aws-sdk/client-s3";
import { pick } from "radash";

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event);
  const s3Adapter = new S3({
    credentials: {
      accessKeyId: config.s3Key,
      secretAccessKey: config.s3Secret,
    },
    region: config.s3Region ? config.s3Region : undefined,
    endpoint: config.s3Endpoint ? config.s3Endpoint : undefined,
  });
  const options: ListObjectsV2CommandInput = {
    Bucket: config.s3Bucket,
    Delimiter: "/",
  };
  const query = getQuery(event);
  const prefix = query?.folder?.toString() ?? "";
  options.Prefix = prefix + "/";

  const data = await s3Adapter.send(new ListObjectsV2Command(options));
  return {
    currentFolder: prefix,
    folders:
      data.CommonPrefixes?.map((commonPrefix) => {
        const folders = commonPrefix?.Prefix?.split("/");
        folders?.splice(folders.length - 1, 1);
        if (folders && folders?.length > 1 && prefix) {
          const prefixArr = prefix.split("/");
          const index = folders.findIndex((folder) =>
            folder.includes(prefixArr[prefixArr.length - 1])
          );
          return folders.slice(index + 1).join("");
        }
        return commonPrefix.Prefix;
      }) ?? [],
    files:
      data.Contents?.filter((content) => !content?.Key?.endsWith("/")).map(
        (content) => ({
          ...content,
          file: content?.Key?.replace(prefix + "/", ""),
          // url: this.storageUrl + content.Key,
        })
      ) ?? [],
    ...pick(data, ["Prefix", "KeyCount", "MaxKeys"]),
  };
});
