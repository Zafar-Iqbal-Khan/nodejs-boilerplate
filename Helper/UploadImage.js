const { v4: uuidv4 } = require("uuid");
const AWS = require("aws-sdk");
const { SESV2 } = require("aws-sdk");
// s3
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});


exports.uploadImage = async (base64image, filepath) => {
  try {
    const base64Data = new Buffer.from(
      base64image.replace(/^data:image\/\w+;base64,/, ""),
      "base64"
    );
    const type = base64image.split(";")[0].split("/")[1];

    if (base64Data && type) {
      const params = {
        Bucket: process.env.AWS_S3_BUCKET,
        Key: `${filepath}/${uuidv4()}.${type}`,
        Body: base64Data,
        ACL: "public-read",
        ContentEncoding: "base64",
        ContentType: `image/${type}`,
      };

      const stored = await s3.upload(params).promise();
      return Promise.resolve(stored.Location);
    } else {
      return Promise.reject("Img data error");
    }
  } catch (error) {
    return Promise.reject(err);
  }
}