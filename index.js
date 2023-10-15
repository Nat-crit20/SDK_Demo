const express = require("express");
const fileUpload = require("express-fileupload");
const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
} = require("@aws-sdk/client-s3");
const fs = require("fs");

const app = express();
const port = 3000;
// default options
app.use(fileUpload());
// Set up AWS S3 client
const s3Client = new S3Client({
  region: "us-east-1", // Replace with your AWS region,
});

const s3BucketName = "myawsbucket-246890"; // Replace with your S3 bucket name

// Endpoint to list all images in a bucket
app.get("/list-images", (req, res) => {
  const listObjectsCommand = new ListObjectsV2Command({ Bucket: s3BucketName });

  s3Client
    .send(listObjectsCommand)
    .then((listObjectsResponse) => {
      res.send(listObjectsResponse);
    })
    .catch((err) => {
      res.status(500).json({ error: "Error listing images" });
    });
});

app.get("/upload-image", (req, res) => {
  res.send(`
      <form action="/upload" method="post" enctype="multipart/form-data">
        <input type="file" name="image" accept="image/*">
        <button type="submit">Upload Image</button>
      </form>
    `);
});

// Endpoint to upload an image to a bucket
app.post("/upload-image", (req, res) => {
  const objectKey = `images/${Date.now()}.jpeg`; // Specify the object key in the S3 bucket
  const fileStream = fs.createReadStream(req.files.image.tempFilePath); // Replace with your local image path

  const uploadCommand = new PutObjectCommand({
    Bucket: s3BucketName,
    Key: objectKey,
    Body: fileStream,
  });

  s3Client
    .send(uploadCommand)
    .then(() => {
      res.status(200).json({ message: "Image uploaded to S3 successfully" });
    })
    .catch((err) => {
      res.status(500).json({ error: "Error uploading image" });
    });
});

app.post("/upload", function (req, res) {
  console.log(req.files.image.tempFilePath); // the uploaded file object
  res.send(req.files);
});

// Endpoint to retrieve an image from a bucket
app.get("/get-image/:imageKey", (req, res) => {
  const imageKey = req.params.imageKey; // Specify the image key in the S3 bucket
  const getObjectCommand = new GetObjectCommand({
    Bucket: s3BucketName,
    Key: imageKey,
  });

  s3Client
    .send(getObjectCommand)
    .then((data) => {
      const outputStream = fs.createWriteStream("local-image.jpeg");
      data.Body.pipe(outputStream);
      res
        .status(200)
        .json({ message: "Image retrieved from S3 and saved locally" });
    })
    .catch((err) => {
      res.status(500).json({ error: "Error retrieving image" });
    });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
