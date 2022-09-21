const { v4: uuidv4 } = require("uuid");
const AWS = require("aws-sdk");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");

exports.uploadAnyFile = async (files,filePath) => {
  try {
    if (files.length===0) {
      return '';
    }
    const s3client = new S3Client();
    let fileUrl = process.env.AWS_S3_BUCKET_URL;
    const params = files.map((file) => {

      let fileName = file.originalname.split(".");
      let key = `${filePath}/${uuidv4()}.${fileName[fileName.length-1]}`;
      fileUrl+=key;
      return {
        Bucket: process.env.AWS_S3_BUCKET,
        Key: key,
        ACL: "public-read",
        Body: file.buffer,
        ContentType: file.mimetype,
      };
    });

    await Promise.all(
      params.map((param) => s3client.send(new PutObjectCommand(param)))
    );

    return Promise.resolve(fileUrl);
  } catch (error) {
    console.log(error);
    return Promise.reject('error ',error);

  }

};