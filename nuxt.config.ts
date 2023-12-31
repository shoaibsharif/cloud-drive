// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  runtimeConfig: {
    s3Region: "",
    s3Key: "",
    s3Secret: "",
    s3Bucket: "",
    s3Endpoint: "",
  },
});
